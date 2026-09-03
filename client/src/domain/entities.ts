/**
 * Canonical domain entity types (ADR-0008: hand-authored `domain/` types are the
 * source of truth; generated Supabase types are confined to `data/remote`).
 *
 * Shapes mirror the Postgres schema (supabase/migrations/20260902090002_schema.sql)
 * and the local SQLite mirror (ADR-0006). snake_case is kept end-to-end so sync is
 * a dumb row copy — no field-mapping layer.
 *
 * Canonical measures: kilograms, metres, seconds. Conversion happens ONLY in
 * presentation (domain/units + services/UnitFormatter).
 */
import type { Uuid, IsoDate, TimeZone } from './ids';

// ---- enums (match the Postgres enums) ---------------------------------------
export type TrackingMode = 'weight_reps' | 'reps' | 'duration' | 'distance';
export type SetType = 'warmup' | 'working' | 'drop' | 'failure' | 'backoff';
export type SessionStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type PlannedStatus = 'unstarted' | 'active' | 'completed' | 'skipped' | 'missed';
export type PrCategory = 'max_load' | 'est_1rm' | 'rep_pr' | 'session_volume';
export type UnitPref = 'kg' | 'lb';

/** Set types that count toward headline working volume + PRs (SPEC §12.1). */
export const WORKING_SET_TYPES: readonly SetType[] = ['working', 'backoff', 'drop', 'failure'];

// ---- sync metadata carried on every synced local row (ADR-0006) ------------
export type SyncMeta = {
  /** server-maintained optimistic-concurrency token; 1 on insert */
  version: number;
  /** server-generated ISO timestamp; drives the incremental pull cursor */
  updated_at: string | null;
  created_at: string | null;
  deleted_at: string | null;
  /** local-only: last server version we successfully applied */
  synced_version: number | null;
  /** local-only: has an unsynced local change */
  dirty: 0 | 1;
  /** local-only: display / queue ordering only — never a conflict input */
  local_updated_at: number;
};

// ---- synced entities ------------------------------------------------------
export type Profile = {
  id: Uuid;
  user_id: Uuid;
  display_name: string | null;
  unit_pref: UnitPref;
  week_start: number; // 0=Sun .. 6=Sat
  default_rest_seconds: number;
  haptics: boolean;
  sound: boolean;
  theme: 'system' | 'light' | 'dark';
  plate_increment_kg: number;
  training_goal: string | null;
} & SyncMeta;

export type Exercise = {
  id: Uuid;
  owner_user_id: Uuid | null; // NULL = global seed row
  name: string;
  name_normalized: string;
  aliases: string[];
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string | null;
  tracking_mode: TrackingMode;
  is_unilateral: boolean;
  instructions: string | null;
  archived: boolean;
} & SyncMeta;

export type WorkoutSession = {
  id: Uuid;
  user_id: Uuid;
  planned_workout_id: Uuid | null;
  name_snapshot: string;
  started_at: string;
  ended_at: string | null;
  status: SessionStatus;
  notes: string | null;
  timezone: TimeZone;
  rest_timer_anchor: string | null; // absolute anchor, never a countdown
  source: 'planned' | 'template' | 'repeat' | 'empty' | 'past' | null;
} & SyncMeta;

export type SessionExercise = {
  id: Uuid;
  user_id: Uuid;
  session_id: Uuid;
  exercise_id: Uuid | null;
  exercise_name_snapshot: string;
  tracking_mode_snapshot: TrackingMode;
  position: number;
  group_id: string | null;
  substitution_of_exercise_id: Uuid | null;
  notes: string | null;
} & SyncMeta;

export type PerformedSet = {
  id: Uuid;
  user_id: Uuid;
  session_exercise_id: Uuid;
  position: number;
  set_type: SetType;
  load_kg: number | null; // zero allowed (bodyweight); never negative
  reps: number | null;
  duration_s: number | null;
  distance_m: number | null;
  rpe: number | null;
  rir: number | null;
  completed: boolean;
  completed_at: string | null;
} & SyncMeta;

export type PlanWeek = {
  id: Uuid;
  user_id: Uuid;
  week_start_date: IsoDate;
  title: string | null;
  notes: string | null;
  source_week_template_id: Uuid | null;
} & SyncMeta;

export type PlannedWorkout = {
  id: Uuid;
  user_id: Uuid;
  plan_week_id: Uuid;
  scheduled_date: IsoDate;
  position: number;
  name_snapshot: string;
  status: PlannedStatus;
  source_workout_template_id: Uuid | null;
  source_session_id: Uuid | null;
} & SyncMeta;

export type PlannedWorkoutItem = {
  id: Uuid;
  user_id: Uuid;
  planned_workout_id: Uuid;
  exercise_id: Uuid | null;
  exercise_name_snapshot: string;
  tracking_mode_snapshot: TrackingMode;
  position: number;
  group_id: string | null;
  prescription: Prescription;
} & SyncMeta;

export type Prescription = {
  target_sets?: number;
  reps_min?: number;
  reps_max?: number;
  load_target_kg?: number;
  rpe_target?: number;
  rir_target?: number;
  rest_seconds?: number;
  tempo?: string;
  notes?: string;
};

export type PersonalRecord = {
  id: Uuid;
  user_id: Uuid;
  exercise_id: Uuid | null; // NULL for session_volume
  category: PrCategory;
  rep_count: number | null; // set for rep_pr
  value: number; // canonical (kg)
  unit: 'kg';
  source_performed_set_id: Uuid | null;
  source_session_id: Uuid | null;
  achieved_at: string;
  formula_id: string | null;
  formula_version: number | null;
} & SyncMeta;

export type WeeklyAggregate = {
  id: Uuid;
  user_id: Uuid;
  week_start_date: IsoDate;
  completed_workouts: number;
  working_sets: number;
  total_volume_kg: number;
} & SyncMeta;

export type ExerciseWeeklyRollup = {
  id: Uuid;
  user_id: Uuid;
  exercise_id: Uuid;
  week_start_date: IsoDate;
  best_e1rm_kg: number | null;
  working_sets: number;
  total_volume_kg: number;
} & SyncMeta;

/** The 15 push-eligible entity names accepted by sync_apply (migration 0006). */
export type SyncEntity =
  | 'profile'
  | 'exercise'
  | 'superset_template'
  | 'superset_template_item'
  | 'workout_template'
  | 'workout_template_item'
  | 'set_prescription'
  | 'week_template'
  | 'week_template_day'
  | 'plan_week'
  | 'planned_workout'
  | 'planned_workout_item'
  | 'workout_session'
  | 'session_exercise'
  | 'performed_set';

/** Maps a SyncEntity to its local table name. */
export const ENTITY_TABLE: Record<SyncEntity, string> = {
  profile: 'profiles',
  exercise: 'exercises',
  superset_template: 'superset_templates',
  superset_template_item: 'superset_template_items',
  workout_template: 'workout_templates',
  workout_template_item: 'workout_template_items',
  set_prescription: 'set_prescriptions',
  week_template: 'week_templates',
  week_template_day: 'week_template_days',
  plan_week: 'plan_weeks',
  planned_workout: 'planned_workouts',
  planned_workout_item: 'planned_workout_items',
  workout_session: 'workout_sessions',
  session_exercise: 'session_exercises',
  performed_set: 'performed_sets',
};

/**
 * Dependency tiers for push ordering (system-architecture.md §10.2 step 1):
 * parents precede children so FKs never reject a child mid-drain.
 */
export const ENTITY_TIER: Record<SyncEntity, number> = {
  profile: 0,
  exercise: 0,
  superset_template: 1,
  workout_template: 1,
  week_template: 1,
  superset_template_item: 2,
  workout_template_item: 2,
  week_template_day: 2,
  set_prescription: 3,
  plan_week: 4,
  planned_workout: 5,
  planned_workout_item: 6,
  workout_session: 7,
  session_exercise: 8,
  performed_set: 9,
};
