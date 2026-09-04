/**
 * Snapshot semantics — the ONLY place template/plan data is copied into a
 * downstream instance (AR-RISK-5, ADR-0004/0005, invariants). Completed sessions
 * never read mutable template content for display; names + tracking modes are
 * denormalised at copy time so rename/archive never rewrites history.
 *
 * template  --snapshot-->  planned_workout(+items)  --snapshot-->  session(+exercises)
 */
import type {
  PlannedWorkout,
  PlannedWorkoutItem,
  SessionExercise,
  WorkoutSession,
  Prescription,
  TrackingMode,
} from './entities';
import type { Uuid, IsoDate, TimeZone } from './ids';

export type NewId = () => Uuid;

/** Minimal fields needed from a workout template + its items to seed a plan. */
export type TemplateItemSeed = {
  exercise_id: Uuid | null;
  exercise_name: string;
  tracking_mode: TrackingMode;
  position: number;
  group_id: string | null;
  prescription: Prescription;
};

export type PlannedWorkoutSeed = {
  name: string;
  scheduled_date: IsoDate;
  position: number;
  source_workout_template_id: Uuid | null;
  source_session_id: Uuid | null;
  items: TemplateItemSeed[];
};

/** Build a planned_workout + its items as an immutable snapshot. */
export function snapshotPlannedWorkout(args: {
  userId: Uuid;
  planWeekId: Uuid;
  seed: PlannedWorkoutSeed;
  newId: NewId;
}): { planned: Omit<PlannedWorkout, keyof import('./entities').SyncMeta>; items: Array<Omit<PlannedWorkoutItem, keyof import('./entities').SyncMeta>> } {
  const { userId, planWeekId, seed, newId } = args;
  const plannedId = newId();
  return {
    planned: {
      id: plannedId,
      user_id: userId,
      plan_week_id: planWeekId,
      scheduled_date: seed.scheduled_date,
      position: seed.position,
      name_snapshot: seed.name,
      status: 'unstarted',
      source_workout_template_id: seed.source_workout_template_id,
      source_session_id: seed.source_session_id,
    },
    items: seed.items.map((it) => ({
      id: newId(),
      user_id: userId,
      planned_workout_id: plannedId,
      exercise_id: it.exercise_id,
      exercise_name_snapshot: it.exercise_name, // denormalised
      tracking_mode_snapshot: it.tracking_mode, // denormalised
      position: it.position,
      group_id: it.group_id,
      prescription: it.prescription,
    })),
  };
}

/** Seed for starting a session (from a planned workout, a template, a repeat, empty, or past). */
export type SessionSeedItem = {
  exercise_id: Uuid | null;
  exercise_name: string;
  tracking_mode: TrackingMode;
  position: number;
  group_id: string | null;
  substitution_of_exercise_id: Uuid | null;
  notes: string | null;
};

export type SessionSeed = {
  name: string;
  plannedWorkoutId: Uuid | null;
  source: WorkoutSession['source'];
  startedAtMs: number;
  timezone: TimeZone;
  items: SessionSeedItem[];
};

/** Build a workout_session + its session_exercises as an immutable snapshot. */
export function snapshotSession(args: {
  userId: Uuid;
  seed: SessionSeed;
  newId: NewId;
}): {
  session: Omit<WorkoutSession, keyof import('./entities').SyncMeta>;
  exercises: Array<Omit<SessionExercise, keyof import('./entities').SyncMeta>>;
} {
  const { userId, seed, newId } = args;
  const sessionId = newId();
  return {
    session: {
      id: sessionId,
      user_id: userId,
      planned_workout_id: seed.plannedWorkoutId,
      name_snapshot: seed.name,
      started_at: new Date(seed.startedAtMs).toISOString(),
      ended_at: null,
      status: 'active',
      notes: null,
      timezone: seed.timezone,
      rest_timer_anchor: null,
      source: seed.source,
    },
    exercises: seed.items.map((it) => ({
      id: newId(),
      user_id: userId,
      session_id: sessionId,
      exercise_id: it.exercise_id,
      exercise_name_snapshot: it.exercise_name, // denormalised — survives rename/archive
      tracking_mode_snapshot: it.tracking_mode,
      position: it.position,
      group_id: it.group_id,
      substitution_of_exercise_id: it.substitution_of_exercise_id,
      notes: it.notes,
    })),
  };
}
