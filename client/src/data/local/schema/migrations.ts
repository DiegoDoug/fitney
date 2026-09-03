/**
 * Forward-only, numbered local migrations (ADR-0006). The runner applies missing
 * migrations in order, each in its own transaction, tracking applied ids in
 * `schema_migrations`. NO down migrations — a bad migration is fixed forward.
 *
 * The local SQLite schema MIRRORS the Postgres schema
 * (supabase/migrations/20260902090002_schema.sql + ...0006): same snake_case
 * names, keys, FKs. Type mapping (SQLite has no enum/array/jsonb/timestamptz):
 *   enum        -> TEXT + CHECK
 *   text[]      -> TEXT (JSON array string)
 *   jsonb       -> TEXT (JSON string)
 *   timestamptz -> TEXT (ISO-8601 UTC) — server values copied verbatim (dumb sync)
 *   date        -> TEXT 'YYYY-MM-DD'
 *   numeric     -> REAL
 *   boolean     -> INTEGER 0/1
 *   uuid        -> TEXT
 * Plus per-mirrored-row sync metadata: version, synced_version, dirty, local_updated_at.
 * Plus 3 local-only tables: sync_outbox, sync_state, sync_conflicts.
 */
export type Migration = { id: number; name: string; up: string };

// --- shared column fragments ------------------------------------------------
const SYNC_COLS = `
  version          INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT,
  updated_at       TEXT,
  deleted_at       TEXT,
  synced_version   INTEGER,
  dirty            INTEGER NOT NULL DEFAULT 0 CHECK (dirty IN (0,1)),
  local_updated_at INTEGER NOT NULL DEFAULT 0
`;

const m0001: Migration = {
  id: 1,
  name: 'initial_schema_mirror',
  up: `
PRAGMA foreign_keys = ON;

-- ===== reusable definitions =====
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT,
  unit_pref TEXT NOT NULL DEFAULT 'kg' CHECK (unit_pref IN ('kg','lb')),
  week_start INTEGER NOT NULL DEFAULT 1 CHECK (week_start BETWEEN 0 AND 6),
  default_rest_seconds INTEGER NOT NULL DEFAULT 120 CHECK (default_rest_seconds >= 0),
  haptics INTEGER NOT NULL DEFAULT 1 CHECK (haptics IN (0,1)),
  sound INTEGER NOT NULL DEFAULT 1 CHECK (sound IN (0,1)),
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system','light','dark')),
  plate_increment_kg REAL NOT NULL DEFAULT 2.5 CHECK (plate_increment_kg > 0),
  training_goal TEXT,
  ${SYNC_COLS},
  CHECK (user_id = id)
);

CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL DEFAULT '',
  aliases TEXT NOT NULL DEFAULT '[]',
  primary_muscles TEXT NOT NULL DEFAULT '[]',
  secondary_muscles TEXT NOT NULL DEFAULT '[]',
  equipment TEXT,
  tracking_mode TEXT NOT NULL DEFAULT 'weight_reps'
    CHECK (tracking_mode IN ('weight_reps','reps','duration','distance')),
  is_unilateral INTEGER NOT NULL DEFAULT 0 CHECK (is_unilateral IN (0,1)),
  instructions TEXT,
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  ${SYNC_COLS}
);
CREATE INDEX exercises_name_norm_idx ON exercises (name_normalized);
CREATE INDEX exercises_owner_idx ON exercises (owner_user_id);
CREATE INDEX exercises_updated_idx ON exercises (updated_at, id);

CREATE TABLE superset_templates (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  name TEXT NOT NULL, description TEXT,
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  content_version INTEGER NOT NULL DEFAULT 1,
  ${SYNC_COLS}
);
CREATE TABLE superset_template_items (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  superset_id TEXT NOT NULL REFERENCES superset_templates(id) ON DELETE CASCADE,
  exercise_id TEXT,
  position INTEGER NOT NULL,
  default_prescription TEXT NOT NULL DEFAULT '{}',
  ${SYNC_COLS}
);
CREATE INDEX sti_superset_idx ON superset_template_items (superset_id, position);

CREATE TABLE workout_templates (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  name TEXT NOT NULL, description TEXT, tags TEXT NOT NULL DEFAULT '[]',
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  content_version INTEGER NOT NULL DEFAULT 1,
  ${SYNC_COLS}
);
CREATE TABLE workout_template_items (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  template_id TEXT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id TEXT,
  position INTEGER NOT NULL,
  group_id TEXT, notes TEXT,
  default_rest_seconds INTEGER CHECK (default_rest_seconds IS NULL OR default_rest_seconds >= 0),
  ${SYNC_COLS}
);
CREATE INDEX wti_template_idx ON workout_template_items (template_id, position);

CREATE TABLE set_prescriptions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  parent_item_id TEXT NOT NULL REFERENCES workout_template_items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  set_type TEXT NOT NULL DEFAULT 'working'
    CHECK (set_type IN ('warmup','working','drop','failure','backoff')),
  reps_min INTEGER CHECK (reps_min IS NULL OR reps_min >= 0),
  reps_max INTEGER CHECK (reps_max IS NULL OR reps_max >= 0),
  load_target_kg REAL CHECK (load_target_kg IS NULL OR load_target_kg >= 0),
  rpe_target REAL CHECK (rpe_target IS NULL OR (rpe_target >= 0 AND rpe_target <= 10)),
  rir_target REAL CHECK (rir_target IS NULL OR rir_target >= 0),
  duration_target_s INTEGER CHECK (duration_target_s IS NULL OR duration_target_s >= 0),
  distance_target_m REAL CHECK (distance_target_m IS NULL OR distance_target_m >= 0),
  ${SYNC_COLS},
  CHECK (reps_min IS NULL OR reps_max IS NULL OR reps_min <= reps_max)
);
CREATE INDEX sp_parent_idx ON set_prescriptions (parent_item_id, position);

CREATE TABLE week_templates (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  name TEXT NOT NULL, description TEXT,
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  content_version INTEGER NOT NULL DEFAULT 1,
  ${SYNC_COLS}
);
CREATE TABLE week_template_days (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  week_template_id TEXT NOT NULL REFERENCES week_templates(id) ON DELETE CASCADE,
  day_offset INTEGER NOT NULL CHECK (day_offset BETWEEN 0 AND 6),
  workout_template_id TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  ${SYNC_COLS}
);
CREATE INDEX wtd_week_idx ON week_template_days (week_template_id, day_offset);

-- ===== planning (snapshots) =====
CREATE TABLE plan_weeks (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  week_start_date TEXT NOT NULL,
  title TEXT, notes TEXT,
  source_week_template_id TEXT,
  ${SYNC_COLS}
);
CREATE UNIQUE INDEX plan_weeks_user_weekstart_uidx
  ON plan_weeks (user_id, week_start_date) WHERE deleted_at IS NULL;

CREATE TABLE planned_workouts (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  plan_week_id TEXT NOT NULL REFERENCES plan_weeks(id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  name_snapshot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unstarted'
    CHECK (status IN ('unstarted','active','completed','skipped','missed')),
  source_workout_template_id TEXT,
  source_session_id TEXT,
  ${SYNC_COLS}
);
CREATE INDEX planned_workouts_user_date_idx ON planned_workouts (user_id, scheduled_date);

CREATE TABLE planned_workout_items (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  planned_workout_id TEXT NOT NULL REFERENCES planned_workouts(id) ON DELETE CASCADE,
  exercise_id TEXT,
  exercise_name_snapshot TEXT NOT NULL,
  tracking_mode_snapshot TEXT NOT NULL
    CHECK (tracking_mode_snapshot IN ('weight_reps','reps','duration','distance')),
  position INTEGER NOT NULL,
  group_id TEXT,
  prescription TEXT NOT NULL DEFAULT '{}',
  ${SYNC_COLS}
);
CREATE INDEX pwi_planned_idx ON planned_workout_items (planned_workout_id, position);

-- ===== performed record (source of truth) =====
CREATE TABLE workout_sessions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  planned_workout_id TEXT,
  name_snapshot TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft','active','completed','cancelled')),
  notes TEXT,
  timezone TEXT NOT NULL,
  rest_timer_anchor TEXT,
  source TEXT CHECK (source IS NULL OR source IN ('planned','template','repeat','empty','past')),
  ${SYNC_COLS}
);
CREATE UNIQUE INDEX workout_sessions_one_active_uidx
  ON workout_sessions (user_id) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX workout_sessions_user_started_idx ON workout_sessions (user_id, started_at DESC);
CREATE INDEX workout_sessions_user_status_idx ON workout_sessions (user_id, status);
CREATE INDEX workout_sessions_updated_idx ON workout_sessions (updated_at, id);

CREATE TABLE session_exercises (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id TEXT,
  exercise_name_snapshot TEXT NOT NULL,
  tracking_mode_snapshot TEXT NOT NULL
    CHECK (tracking_mode_snapshot IN ('weight_reps','reps','duration','distance')),
  position INTEGER NOT NULL,
  group_id TEXT,
  substitution_of_exercise_id TEXT,
  notes TEXT,
  ${SYNC_COLS}
);
CREATE INDEX se_session_idx ON session_exercises (session_id, position);
CREATE INDEX se_exercise_idx ON session_exercises (exercise_id);

CREATE TABLE performed_sets (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  session_exercise_id TEXT NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  set_type TEXT NOT NULL DEFAULT 'working'
    CHECK (set_type IN ('warmup','working','drop','failure','backoff')),
  load_kg REAL CHECK (load_kg IS NULL OR load_kg >= 0),
  reps INTEGER CHECK (reps IS NULL OR reps >= 0),
  duration_s INTEGER CHECK (duration_s IS NULL OR duration_s >= 0),
  distance_m REAL CHECK (distance_m IS NULL OR distance_m >= 0),
  rpe REAL CHECK (rpe IS NULL OR (rpe >= 0 AND rpe <= 10)),
  rir REAL CHECK (rir IS NULL OR rir >= 0),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  completed_at TEXT,
  ${SYNC_COLS}
);
CREATE INDEX ps_se_position_idx ON performed_sets (session_exercise_id, position);

-- ===== derived (server-authoritative; pulled & overwritten) =====
CREATE TABLE personal_records (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  exercise_id TEXT,
  category TEXT NOT NULL CHECK (category IN ('max_load','est_1rm','rep_pr','session_volume')),
  rep_count INTEGER,
  value REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  source_performed_set_id TEXT,
  source_session_id TEXT,
  achieved_at TEXT NOT NULL,
  formula_id TEXT,
  formula_version INTEGER,
  ${SYNC_COLS}
);
CREATE UNIQUE INDEX pr_natural_uidx ON personal_records
  (user_id, IFNULL(exercise_id,'00000000-0000-0000-0000-000000000000'), category, IFNULL(rep_count,-1));

CREATE TABLE weekly_aggregates (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  week_start_date TEXT NOT NULL,
  completed_workouts INTEGER NOT NULL DEFAULT 0,
  working_sets INTEGER NOT NULL DEFAULT 0,
  total_volume_kg REAL NOT NULL DEFAULT 0,
  ${SYNC_COLS}
);
CREATE UNIQUE INDEX wa_natural_uidx ON weekly_aggregates (user_id, week_start_date);

CREATE TABLE exercise_weekly_rollups (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  week_start_date TEXT NOT NULL,
  best_e1rm_kg REAL,
  working_sets INTEGER NOT NULL DEFAULT 0,
  total_volume_kg REAL NOT NULL DEFAULT 0,
  ${SYNC_COLS}
);
CREATE UNIQUE INDEX ewr_natural_uidx ON exercise_weekly_rollups (user_id, exercise_id, week_start_date);

-- ===== local-only tables (ADR-0006, system-architecture.md §8.3) =====
CREATE TABLE sync_outbox (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL UNIQUE,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('upsert','delete')),
  payload_json TEXT NOT NULL,
  base_version INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','dispatched')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL DEFAULT 0
);
-- at most ONE pending entry per (entity, entity_id); a dispatched entry is NOT
-- covered, so a dispatched predecessor may coexist with a pending successor.
CREATE UNIQUE INDEX sync_outbox_one_pending_uidx
  ON sync_outbox (entity, entity_id) WHERE state = 'pending';
CREATE INDEX sync_outbox_due_idx ON sync_outbox (state, next_attempt_at);

CREATE TABLE sync_state (
  entity TEXT PRIMARY KEY,
  last_pulled_updated_at TEXT,
  last_pulled_id TEXT,
  last_full_sync INTEGER
);

CREATE TABLE sync_conflicts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_payload TEXT NOT NULL,
  server_payload TEXT,
  local_base_version INTEGER,
  server_version INTEGER,
  detected_at INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX sync_conflicts_open_idx ON sync_conflicts (resolved_at, entity);
`,
};

/** The ordered, forward-only migration chain. Append new migrations; never edit shipped ones. */
export const MIGRATIONS: readonly Migration[] = [m0001];
