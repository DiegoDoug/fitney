/**
 * Local SQLite repository implementations (ADR-0006/0007). These are the normal
 * read/write source (offline-first); the sync engine drains the outbox they
 * populate. Every write that must sync goes through `enqueueMutation` inside a
 * transaction so the row + its outbox entry are atomic.
 */
import { runInTransaction, type SqlDatabase } from './driver';
import { enqueueMutation } from './outbox-writer';
import { fromDbRow } from './row-codec';
import { getRowById, upsertRow } from './sql';
import type { Clock } from '@/services/clock';
import type { IdGenerator } from '@/services/ids';
import type {
  Exercise,
  PerformedSet,
  Profile,
  SessionExercise,
  SyncMeta,
  WorkoutSession,
} from '@/domain/entities';
import type { DerivedRows, SetFact } from '@/domain/pr';
import { ActiveSessionExistsError, WritesFrozenError } from '@/domain/errors';
import type { Uuid } from '@/domain/ids';
import type {
  DerivedRepository,
  ExerciseRepository,
  OnboardingState,
  PerformedSetRepository,
  ProfileRepository,
  Repositories,
  SessionRepository,
} from '@/data/repositories/types';

type Deps = {
  db: SqlDatabase;
  clock: Clock;
  ids: IdGenerator;
  /**
   * CE-R5 v2 (DEC-53): when this returns true, the FEATURE write path (every
   * method that enqueues a `sync_outbox` entry) is paused so no new outbound
   * mutation can be created during the "Back up & sign out" final check. Reads,
   * the sync engine's own writes (it does not go through these repos), local-only
   * markers, and pull-apply (`bulkPut` / `derived.apply`) are unaffected.
   */
  isFrozen?: () => boolean;
};

const NEW_ROW_META = { version: 1, synced_version: null, dirty: 1 as const };

/** Guard the feature write path while local writes are frozen (CE-R5 v2). */
function assertWritable(isFrozen: (() => boolean) | undefined): void {
  if (isFrozen?.()) throw new WritesFrozenError();
}

// ---------------------------------------------------------------- profile
function profileRepo({ db, clock, ids, isFrozen }: Deps): ProfileRepository {
  return {
    async get(userId) {
      const r = await getRowById<Record<string, unknown>>(db, 'profiles', userId);
      return r ? fromDbRow<Profile>(r) : null;
    },
    async upsert(userId, profile) {
      assertWritable(isFrozen);
      const now = clock.now();
      await runInTransaction(db, () =>
        enqueueMutation({
          db,
          entity: 'profile',
          entityId: userId,
          op: 'upsert',
          row: stripLocalMeta({ ...profile, id: userId, user_id: userId }),
          nowMs: now,
          newOperationId: ids.newV4(),
        }),
      );
    },
    async getOnboardingState(userId): Promise<OnboardingState> {
      const r = await db.getFirstAsync<{
        display_name: string | null;
        unit_pref: string;
        week_start: number;
        default_rest_seconds: number;
        training_goal: string | null;
        synced_version: number | null;
        onboarding_completed_at: number | null;
      }>(
        `SELECT display_name, unit_pref, week_start, default_rest_seconds, training_goal,
                synced_version, onboarding_completed_at
           FROM profiles WHERE id = ?`,
        [userId],
      );
      if (!r) {
        return { profileExists: false, completed: false, serverSynced: false, draft: null };
      }
      const serverSynced = r.synced_version != null;
      const completed = r.onboarding_completed_at != null || serverSynced;
      return {
        profileExists: true,
        completed,
        serverSynced,
        draft: completed
          ? null
          : {
              displayName: r.display_name ?? '',
              unitPref: r.unit_pref === 'lb' ? 'lb' : 'kg',
              weekStart: r.week_start,
              defaultRestSeconds: r.default_rest_seconds,
              trainingGoal: r.training_goal,
            },
      };
    },
    async markOnboardingComplete(userId, nowMs) {
      // set-once; never enqueues an outbox op (local-only marker, m0002)
      await db.runAsync(
        `UPDATE profiles SET onboarding_completed_at = COALESCE(onboarding_completed_at, ?) WHERE id = ?`,
        [nowMs, userId],
      );
    },
  };
}

// --------------------------------------------------------------- exercise
function exerciseRepo({ db }: Deps): ExerciseRepository {
  return {
    async search(userId, query, limit = 25) {
      const q = query.trim().toLowerCase();
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM exercises
          WHERE deleted_at IS NULL AND archived = 0
            AND (owner_user_id IS NULL OR owner_user_id = ?)
            AND (? = '' OR name_normalized LIKE ? ESCAPE '\\')
          ORDER BY (name_normalized = ?) DESC,
                   (name_normalized LIKE ? ESCAPE '\\') DESC,
                   name_normalized ASC
          LIMIT ?`,
        [userId, q, `%${escapeLike(q)}%`, q, `${escapeLike(q)}%`, limit],
      );
      return rows.map((r) => fromDbRow<Exercise>(r));
    },
    async getById(id) {
      const r = await getRowById<Record<string, unknown>>(db, 'exercises', id);
      return r ? fromDbRow<Exercise>(r) : null;
    },
    async recentlyUsed(userId, limit = 10) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT e.* FROM exercises e
           JOIN session_exercises se ON se.exercise_id = e.id
           JOIN workout_sessions s ON s.id = se.session_id AND s.user_id = ?
          WHERE e.deleted_at IS NULL
          GROUP BY e.id
          ORDER BY MAX(s.started_at) DESC
          LIMIT ?`,
        [userId, limit],
      );
      return rows.map((r) => fromDbRow<Exercise>(r));
    },
    async bulkPut(rows) {
      await runInTransaction(db, async () => {
        for (const e of rows) {
          await upsertRow(db, 'exercises', {
            ...e,
            name_normalized: e.name.toLowerCase(),
            dirty: 0,
            local_updated_at: 0,
          });
        }
      });
    },
  };
}

// ---------------------------------------------------------------- session
function sessionRepo({ db, clock, ids, isFrozen }: Deps): SessionRepository {
  return {
    async getActive(userId) {
      const r = await db.getFirstAsync<Record<string, unknown>>(
        `SELECT * FROM workout_sessions
          WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL LIMIT 1`,
        [userId],
      );
      return r ? fromDbRow<WorkoutSession>(r) : null;
    },
    async getById(id) {
      const r = await getRowById<Record<string, unknown>>(db, 'workout_sessions', id);
      return r ? fromDbRow<WorkoutSession>(r) : null;
    },
    async listCompleted(userId, limit = 50) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM workout_sessions
          WHERE user_id = ? AND status = 'completed' AND deleted_at IS NULL
          ORDER BY started_at DESC LIMIT ?`,
        [userId, limit],
      );
      return rows.map((r) => fromDbRow<WorkoutSession>(r));
    },
    async listExercises(sessionId) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM session_exercises WHERE session_id = ? AND deleted_at IS NULL ORDER BY position`,
        [sessionId],
      );
      return rows.map((r) => fromDbRow<SessionExercise>(r));
    },
    async createActive(userId, session, exercises) {
      assertWritable(isFrozen);
      const now = clock.now();
      // one-active-session guard (FR-LOG-12) — DB partial-unique index backs this up
      const active = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM workout_sessions WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL`,
        [userId],
      );
      if (active) throw new ActiveSessionExistsError(active.id);

      await runInTransaction(db, async () => {
        await enqueueMutation({
          db,
          entity: 'workout_session',
          entityId: session.id,
          op: 'upsert',
          row: { ...session, ...NEW_ROW_META, user_id: userId },
          nowMs: now,
          newOperationId: ids.newV4(),
        });
        for (const ex of exercises) {
          await enqueueMutation({
            db,
            entity: 'session_exercise',
            entityId: ex.id,
            op: 'upsert',
            row: { ...ex, ...NEW_ROW_META, user_id: userId },
            nowMs: now,
            newOperationId: ids.newV4(),
          });
        }
      });
    },
    async setStatus(userId, sessionId, status, endedAtIso) {
      assertWritable(isFrozen);
      const now = clock.now();
      const cur = await getRowById<Record<string, unknown>>(db, 'workout_sessions', sessionId);
      if (!cur) return;
      if (cur.status === status) return; // idempotent
      await runInTransaction(db, () =>
        enqueueMutation({
          db,
          entity: 'workout_session',
          entityId: sessionId,
          op: 'upsert',
          row: { ...fromDbRow(cur), status, ended_at: endedAtIso, user_id: userId },
          nowMs: now,
          newOperationId: ids.newV4(),
        }),
      );
    },
    async setRestTimerAnchor(userId, sessionId, anchorIso) {
      assertWritable(isFrozen);
      const now = clock.now();
      const cur = await getRowById<Record<string, unknown>>(db, 'workout_sessions', sessionId);
      if (!cur) return;
      await runInTransaction(db, () =>
        enqueueMutation({
          db,
          entity: 'workout_session',
          entityId: sessionId,
          op: 'upsert',
          row: { ...fromDbRow(cur), rest_timer_anchor: anchorIso, user_id: userId },
          nowMs: now,
          newOperationId: ids.newV4(),
        }),
      );
    },
  };
}

// ------------------------------------------------------------ performed set
function performedSetRepo({ db, clock, ids, isFrozen }: Deps): PerformedSetRepository {
  return {
    async listBySession(sessionId) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT ps.* FROM performed_sets ps
           JOIN session_exercises se ON se.id = ps.session_exercise_id
          WHERE se.session_id = ? AND ps.deleted_at IS NULL
          ORDER BY se.position, ps.position`,
        [sessionId],
      );
      return rows.map((r) => fromDbRow<PerformedSet>(r));
    },
    async upsert(userId, set) {
      assertWritable(isFrozen);
      const now = clock.now();
      await runInTransaction(db, () =>
        enqueueMutation({
          db,
          entity: 'performed_set',
          entityId: set.id,
          op: 'upsert',
          row: stripLocalMeta({ ...set, user_id: userId }),
          nowMs: now,
          newOperationId: ids.newV4(),
        }),
      );
    },
    async remove(userId, setId) {
      assertWritable(isFrozen);
      const now = clock.now();
      const cur = await getRowById<Record<string, unknown>>(db, 'performed_sets', setId);
      if (!cur) return;
      await runInTransaction(db, () =>
        enqueueMutation({
          db,
          entity: 'performed_set',
          entityId: setId,
          op: 'delete',
          row: { ...fromDbRow(cur), deleted_at: new Date(now).toISOString(), user_id: userId },
          nowMs: now,
          newOperationId: ids.newV4(),
        }),
      );
    },
    async completedSetFacts(userId) {
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT
            ps.id                    AS performed_set_id,
            s.id                     AS session_id,
            s.started_at             AS session_started_at,
            s.ended_at               AS session_ended_at,
            s.timezone               AS session_timezone,
            se.id                    AS session_exercise_id,
            se.exercise_id           AS exercise_id,
            se.tracking_mode_snapshot AS tracking_mode,
            ps.position              AS position,
            ps.set_type              AS set_type,
            ps.load_kg               AS load_kg,
            ps.reps                  AS reps,
            ps.completed_at          AS completed_at
         FROM performed_sets ps
         JOIN session_exercises se ON se.id = ps.session_exercise_id AND se.deleted_at IS NULL
         JOIN workout_sessions  s  ON s.id = se.session_id AND s.deleted_at IS NULL AND s.status = 'completed'
        WHERE ps.deleted_at IS NULL AND ps.completed = 1 AND s.user_id = ?`,
        [userId],
      );
      return rows.map(
        (r): SetFact => ({
          performed_set_id: String(r.performed_set_id),
          session_id: String(r.session_id),
          session_started_at_ms: Date.parse(String(r.session_started_at)),
          session_ended_at_ms: r.session_ended_at ? Date.parse(String(r.session_ended_at)) : null,
          session_timezone: String(r.session_timezone),
          session_exercise_id: String(r.session_exercise_id),
          exercise_id: r.exercise_id == null ? null : String(r.exercise_id),
          tracking_mode: r.tracking_mode as SetFact['tracking_mode'],
          position: Number(r.position),
          set_type: r.set_type as SetFact['set_type'],
          load_kg: r.load_kg == null ? null : Number(r.load_kg),
          reps: r.reps == null ? null : Number(r.reps),
          completed_at_ms: r.completed_at ? Date.parse(String(r.completed_at)) : null,
        }),
      );
    },
  };
}

// ---------------------------------------------------------------- derived
function derivedRepo({ db }: Deps): DerivedRepository {
  return {
    async apply(userId, rows: DerivedRows) {
      await runInTransaction(db, async () => {
        // delete-and-reinsert by v5 id keeps this idempotent (ADR-0005)
        const keepPr = new Set(rows.personalRecords.map((r) => r.id));
        for (const pr of rows.personalRecords) {
          await upsertRow(db, 'personal_records', {
            id: pr.id,
            user_id: userId,
            exercise_id: pr.exercise_id,
            category: pr.category,
            rep_count: pr.rep_count,
            value: pr.value,
            unit: pr.unit,
            source_performed_set_id: pr.source_performed_set_id,
            source_session_id: pr.source_session_id,
            achieved_at: new Date(pr.achieved_at_ms).toISOString(),
            formula_id: pr.formula_id,
            formula_version: pr.formula_version,
            deleted_at: null,
            dirty: 0,
            local_updated_at: 0,
          });
        }
        // tombstone locally-materialised PRs no longer in the recomputed set
        const existingPr = await db.getAllAsync<{ id: string }>(
          `SELECT id FROM personal_records WHERE user_id = ? AND deleted_at IS NULL`,
          [userId],
        );
        for (const row of existingPr) {
          if (!keepPr.has(row.id)) {
            await db.runAsync(`UPDATE personal_records SET deleted_at = ? WHERE id = ?`, [
              new Date().toISOString(),
              row.id,
            ]);
          }
        }

        for (const wa of rows.weeklyAggregates) {
          await upsertRow(db, 'weekly_aggregates', {
            ...wa,
            deleted_at: null,
            dirty: 0,
            local_updated_at: 0,
          });
        }
        for (const ewr of rows.exerciseWeeklyRollups) {
          await upsertRow(db, 'exercise_weekly_rollups', {
            ...ewr,
            deleted_at: null,
            dirty: 0,
            local_updated_at: 0,
          });
        }
      });
    },
  };
}

// ---------------------------------------------------------------- helpers
function stripLocalMeta<T extends Partial<SyncMeta>>(row: T): Record<string, unknown> {
  const { synced_version, dirty, local_updated_at, onboarding_completed_at, ...rest } =
    row as Record<string, unknown>;
  void synced_version;
  void dirty;
  void local_updated_at;
  void onboarding_completed_at; // local-only marker (m0002) — never synced
  return rest;
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export function createLocalRepositories(deps: Deps): Repositories {
  return {
    profile: profileRepo(deps),
    exercise: exerciseRepo(deps),
    session: sessionRepo(deps),
    performedSet: performedSetRepo(deps),
    derived: derivedRepo(deps),
  };
}
