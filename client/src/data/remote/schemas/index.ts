/**
 * Boundary validation schemas (ADR-0008). Every row returned by the Supabase
 * Data API is parsed through one of these before it enters `data/sync` /
 * `data/local`. Hand-authored `domain/` types stay canonical; these schemas are
 * the runtime guard at the `data/remote` seam.
 *
 * The key set of each schema MUST equal the column set of the corresponding
 * local SQLite table (minus the local-only sync-meta columns) — asserted by
 * src/test/schema-parity.test.ts (the "local/server schema-contract parity" gate).
 */
import { z } from 'zod';

const uuid = z.string().uuid();
const ts = z.string().nullable(); // ISO-8601 or null (PostgREST returns strings)
const iso = z.string();
const num = z.number().nullable();
const int = z.number().int().nullable();
const bool = z.boolean();

/** columns present on every synced server row */
const serverMeta = {
  version: z.number().int(),
  created_at: ts,
  updated_at: ts,
  deleted_at: ts,
};

export const profileSchema = z.object({
  id: uuid,
  user_id: uuid,
  display_name: z.string().nullable(),
  unit_pref: z.enum(['kg', 'lb']),
  week_start: z.number().int().min(0).max(6),
  default_rest_seconds: z.number().int().min(0),
  haptics: bool,
  sound: bool,
  theme: z.enum(['system', 'light', 'dark']),
  plate_increment_kg: z.number().positive(),
  training_goal: z.string().nullable(),
  ...serverMeta,
});

export const exerciseSchema = z.object({
  id: uuid,
  owner_user_id: uuid.nullable(),
  name: iso,
  name_normalized: iso,
  aliases: z.array(z.string()),
  primary_muscles: z.array(z.string()),
  secondary_muscles: z.array(z.string()),
  equipment: z.string().nullable(),
  tracking_mode: z.enum(['weight_reps', 'reps', 'duration', 'distance']),
  is_unilateral: bool,
  instructions: z.string().nullable(),
  archived: bool,
  ...serverMeta,
});

export const workoutSessionSchema = z.object({
  id: uuid,
  user_id: uuid,
  planned_workout_id: uuid.nullable(),
  name_snapshot: iso,
  started_at: iso,
  ended_at: ts,
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  notes: z.string().nullable(),
  timezone: iso,
  rest_timer_anchor: ts,
  source: z.enum(['planned', 'template', 'repeat', 'empty', 'past']).nullable(),
  ...serverMeta,
});

export const sessionExerciseSchema = z.object({
  id: uuid,
  user_id: uuid,
  session_id: uuid,
  exercise_id: uuid.nullable(),
  exercise_name_snapshot: iso,
  tracking_mode_snapshot: z.enum(['weight_reps', 'reps', 'duration', 'distance']),
  position: z.number().int(),
  group_id: z.string().nullable(),
  substitution_of_exercise_id: uuid.nullable(),
  notes: z.string().nullable(),
  ...serverMeta,
});

export const performedSetSchema = z.object({
  id: uuid,
  user_id: uuid,
  session_exercise_id: uuid,
  position: z.number().int(),
  set_type: z.enum(['warmup', 'working', 'drop', 'failure', 'backoff']),
  load_kg: num,
  reps: int,
  duration_s: int,
  distance_m: num,
  rpe: num,
  rir: num,
  completed: bool,
  completed_at: ts,
  ...serverMeta,
});

export const planWeekSchema = z.object({
  id: uuid,
  user_id: uuid,
  week_start_date: iso,
  title: z.string().nullable(),
  notes: z.string().nullable(),
  source_week_template_id: uuid.nullable(),
  ...serverMeta,
});

export const plannedWorkoutSchema = z.object({
  id: uuid,
  user_id: uuid,
  plan_week_id: uuid,
  scheduled_date: iso,
  position: z.number().int(),
  name_snapshot: iso,
  status: z.enum(['unstarted', 'active', 'completed', 'skipped', 'missed']),
  source_workout_template_id: uuid.nullable(),
  source_session_id: uuid.nullable(),
  ...serverMeta,
});

export const plannedWorkoutItemSchema = z.object({
  id: uuid,
  user_id: uuid,
  planned_workout_id: uuid,
  exercise_id: uuid.nullable(),
  exercise_name_snapshot: iso,
  tracking_mode_snapshot: z.enum(['weight_reps', 'reps', 'duration', 'distance']),
  position: z.number().int(),
  group_id: z.string().nullable(),
  prescription: z.record(z.unknown()),
  ...serverMeta,
});

export const REMOTE_SCHEMAS = {
  profile: profileSchema,
  exercise: exerciseSchema,
  workout_session: workoutSessionSchema,
  session_exercise: sessionExerciseSchema,
  performed_set: performedSetSchema,
  plan_week: planWeekSchema,
  planned_workout: plannedWorkoutSchema,
  planned_workout_item: plannedWorkoutItemSchema,
} as const;

export type RemoteSchemaKey = keyof typeof REMOTE_SCHEMAS;
