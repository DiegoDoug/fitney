/**
 * Repository interfaces (system-architecture.md §6.1). features/* depend ONLY on
 * these; the local SQLite implementations and the sync engine sit behind them.
 * All calls are userId-scoped (ADR-0009).
 */
import type {
  Exercise,
  PerformedSet,
  Profile,
  SessionExercise,
  SyncEntity,
  WorkoutSession,
} from '@/domain/entities';
import type { DerivedRows, SetFact } from '@/domain/pr';
import type { Uuid } from '@/domain/ids';

export type OutboxOp = 'upsert' | 'delete';

/** A full-row mutation to persist locally + enqueue for sync, atomically. */
export type Mutation = {
  entity: SyncEntity;
  entityId: Uuid;
  op: OutboxOp;
  /** coalesced latest FULL-row state (architecture §8.4 / §10.2) */
  row: Record<string, unknown>;
};

/** Local-only onboarding gate state for a user's device (m0002). */
export type OnboardingState = {
  /** a local profiles row exists */
  profileExists: boolean;
  /** the first-run flow finished on this device */
  completed: boolean;
  /** the row has been round-tripped with the server (onboarded on another device) */
  serverSynced: boolean;
  /** current values, for prefilling a resumed / partial onboarding form */
  draft: {
    displayName: string;
    unitPref: Profile['unit_pref'];
    weekStart: number;
    defaultRestSeconds: number;
    trainingGoal: string | null;
  } | null;
};

export interface ProfileRepository {
  get(userId: Uuid): Promise<Profile | null>;
  upsert(userId: Uuid, profile: Profile): Promise<void>;
  /** read the local-only onboarding marker + a prefill draft (no network) */
  getOnboardingState(userId: Uuid): Promise<OnboardingState>;
  /** set the local-only marker once (idempotent); never enqueues an outbox op */
  markOnboardingComplete(userId: Uuid, nowMs: number): Promise<void>;
}

export interface ExerciseRepository {
  /** local indexed search (SM-7: <300ms); returns non-archived, ranked by name. */
  search(userId: Uuid, query: string, limit?: number): Promise<Exercise[]>;
  getById(id: Uuid): Promise<Exercise | null>;
  recentlyUsed(userId: Uuid, limit?: number): Promise<Exercise[]>;
  /** used by tests / seed apply */
  bulkPut(rows: Exercise[]): Promise<void>;
}

export interface SessionRepository {
  getActive(userId: Uuid): Promise<WorkoutSession | null>;
  getById(id: Uuid): Promise<WorkoutSession | null>;
  listCompleted(userId: Uuid, limit?: number): Promise<WorkoutSession[]>;
  listExercises(sessionId: Uuid): Promise<SessionExercise[]>;
  /** create session + its exercises + outbox entries in ONE transaction */
  createActive(
    userId: Uuid,
    session: Omit<WorkoutSession, keyof import('@/domain/entities').SyncMeta>,
    exercises: Array<Omit<SessionExercise, keyof import('@/domain/entities').SyncMeta>>,
  ): Promise<void>;
  /** idempotent status transition + outbox entry in one transaction */
  setStatus(
    userId: Uuid,
    sessionId: Uuid,
    status: WorkoutSession['status'],
    endedAtIso: string | null,
  ): Promise<void>;
  setRestTimerAnchor(userId: Uuid, sessionId: Uuid, anchorIso: string | null): Promise<void>;
}

export interface PerformedSetRepository {
  listBySession(sessionId: Uuid): Promise<PerformedSet[]>;
  /** the hot path — row write + single coalesced outbox upsert in one tx */
  upsert(userId: Uuid, set: PerformedSet): Promise<void>;
  remove(userId: Uuid, setId: Uuid): Promise<void>;
  /** every completed set fact for a user, for domain/pr.recomputeAll */
  completedSetFacts(userId: Uuid): Promise<SetFact[]>;
}

export interface DerivedRepository {
  /** apply a full recomputed set idempotently (delete/tombstone-and-reinsert by v5 id) */
  apply(userId: Uuid, rows: DerivedRows): Promise<void>;
}

export type Repositories = {
  profile: ProfileRepository;
  exercise: ExerciseRepository;
  session: SessionRepository;
  performedSet: PerformedSetRepository;
  derived: DerivedRepository;
};
