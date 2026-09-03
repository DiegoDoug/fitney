-- 20260902090002_schema.sql
-- Weight — core schema. Forward-only (ADR-0006). Mirrors the client SQLite schema
-- (names, keys, FKs). Canonical column list is docs/engineering/backend-data-implementation.md §4.
--
-- Conventions on every SYNCED user-owned table:
--   id            uuid primary key            (client-generated UUIDv7/v4; default is a server fallback only)
--   user_id       uuid not null               (denormalised onto every table incl. children, for join-free RLS; = auth.uid())
--   created_at    timestamptz not null        (server-set by trigger)
--   updated_at    timestamptz not null        (server-set by trigger; drives the incremental pull cursor)
--   version       integer not null            (server-maintained; optimistic-concurrency token — AR-DEC-03)
--   deleted_at    timestamptz null            (tombstone; soft delete)
-- Template "content" versioning (LIB-06) is a SEPARATE column `content_version`
-- to avoid colliding with the sync `version`.

-- ========================= enums =========================
create type tracking_mode  as enum ('weight_reps', 'reps', 'duration', 'distance');
create type set_type       as enum ('warmup', 'working', 'drop', 'failure', 'backoff');
create type session_status as enum ('draft', 'active', 'completed', 'cancelled');
create type planned_status as enum ('unstarted', 'active', 'completed', 'skipped', 'missed');
create type pr_category    as enum ('max_load', 'est_1rm', 'rep_pr', 'session_volume');

-- ========================= profiles =========================
create table profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  user_id            uuid not null,                         -- = id; present for uniform RLS
  display_name       text,
  unit_pref          text not null default 'kg' check (unit_pref in ('kg','lb')),
  week_start         smallint not null default 1 check (week_start between 0 and 6),
  default_rest_seconds integer not null default 120 check (default_rest_seconds >= 0),
  haptics            boolean not null default true,
  sound              boolean not null default true,
  theme              text not null default 'system' check (theme in ('system','light','dark')),
  plate_increment_kg numeric not null default 2.5 check (plate_increment_kg > 0),
  training_goal      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  version            integer not null default 1,
  deleted_at         timestamptz
);
alter table profiles add constraint profiles_user_id_is_id check (user_id = id);
select _attach_row_metadata('profiles');

-- ========================= exercises =========================
-- owner_user_id NULL  => global seed row (readable by everyone, writable by no one)
-- owner_user_id = uid => user-created private exercise
create table exercises (
  id                uuid primary key default gen_random_uuid(),
  owner_user_id     uuid references auth.users(id) on delete cascade,
  name              text not null,
  name_normalized   text generated always as (lower(name)) stored,
  aliases           text[] not null default '{}',
  primary_muscles   text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  equipment         text,
  tracking_mode     tracking_mode not null default 'weight_reps',
  is_unilateral     boolean not null default false,
  instructions      text,
  archived          boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  version           integer not null default 1,
  deleted_at        timestamptz
);
create index exercises_owner_idx      on exercises (owner_user_id);
create index exercises_name_norm_idx  on exercises (name_normalized);
create index exercises_updated_idx    on exercises (updated_at, id);
select _attach_row_metadata('exercises');

-- ========================= superset templates =========================
create table superset_templates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  archived        boolean not null default false,
  content_version integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  version         integer not null default 1,
  deleted_at      timestamptz
);
create index superset_templates_user_idx    on superset_templates (user_id);
create index superset_templates_updated_idx on superset_templates (updated_at, id);
select _attach_row_metadata('superset_templates');

create table superset_template_items (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  superset_id          uuid not null references superset_templates(id) on delete cascade,
  exercise_id          uuid references exercises(id),
  position             integer not null,
  default_prescription jsonb not null default '{}'::jsonb,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  version              integer not null default 1,
  deleted_at           timestamptz
);
create index sti_superset_idx on superset_template_items (superset_id, position);
create index sti_user_idx      on superset_template_items (user_id);
create index sti_updated_idx   on superset_template_items (updated_at, id);
select _attach_row_metadata('superset_template_items');

-- ========================= workout templates =========================
create table workout_templates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  tags            text[] not null default '{}',
  archived        boolean not null default false,
  content_version integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  version         integer not null default 1,
  deleted_at      timestamptz
);
create index workout_templates_user_idx    on workout_templates (user_id);
create index workout_templates_updated_idx on workout_templates (updated_at, id);
select _attach_row_metadata('workout_templates');

create table workout_template_items (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  template_id          uuid not null references workout_templates(id) on delete cascade,
  exercise_id          uuid references exercises(id),
  position             integer not null,
  group_id             text,
  notes                text,
  default_rest_seconds integer check (default_rest_seconds >= 0),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  version              integer not null default 1,
  deleted_at           timestamptz
);
create index wti_template_idx on workout_template_items (template_id, position);
create index wti_user_idx      on workout_template_items (user_id);
create index wti_updated_idx   on workout_template_items (updated_at, id);
select _attach_row_metadata('workout_template_items');

create table set_prescriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_item_id    uuid not null references workout_template_items(id) on delete cascade,
  position          integer not null,
  set_type          set_type not null default 'working',
  reps_min          integer check (reps_min >= 0),
  reps_max          integer check (reps_max >= 0),
  load_target_kg    numeric check (load_target_kg >= 0),
  rpe_target        numeric check (rpe_target >= 0 and rpe_target <= 10),
  rir_target        numeric check (rir_target >= 0),
  duration_target_s integer check (duration_target_s >= 0),
  distance_target_m numeric check (distance_target_m >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  version           integer not null default 1,
  deleted_at        timestamptz,
  constraint reps_min_le_max check (reps_min is null or reps_max is null or reps_min <= reps_max)
);
create index sp_parent_idx  on set_prescriptions (parent_item_id, position);
create index sp_user_idx     on set_prescriptions (user_id);
create index sp_updated_idx  on set_prescriptions (updated_at, id);
select _attach_row_metadata('set_prescriptions');

-- ========================= week templates =========================
create table week_templates (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name            text not null,
  description     text,
  archived        boolean not null default false,
  content_version integer not null default 1,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  version         integer not null default 1,
  deleted_at      timestamptz
);
create index week_templates_user_idx    on week_templates (user_id);
create index week_templates_updated_idx on week_templates (updated_at, id);
select _attach_row_metadata('week_templates');

create table week_template_days (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_template_id    uuid not null references week_templates(id) on delete cascade,
  day_offset          smallint not null check (day_offset between 0 and 6),
  workout_template_id uuid references workout_templates(id),
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  version             integer not null default 1,
  deleted_at          timestamptz
);
create index wtd_week_idx    on week_template_days (week_template_id, day_offset);
create index wtd_user_idx     on week_template_days (user_id);
create index wtd_updated_idx  on week_template_days (updated_at, id);
select _attach_row_metadata('week_template_days');

-- ========================= planning (snapshots) =========================
create table plan_weeks (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users(id) on delete cascade,
  week_start_date        date not null,
  title                  text,
  notes                  text,
  source_week_template_id uuid references week_templates(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  version                integer not null default 1,
  deleted_at             timestamptz
);
create unique index plan_weeks_user_weekstart_uidx
  on plan_weeks (user_id, week_start_date) where deleted_at is null;
create index plan_weeks_updated_idx on plan_weeks (updated_at, id);
select _attach_row_metadata('plan_weeks');

create table planned_workouts (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_week_id               uuid not null references plan_weeks(id) on delete cascade,
  scheduled_date             date not null,
  position                   integer not null default 0,
  name_snapshot              text not null,
  status                     planned_status not null default 'unstarted',
  source_workout_template_id uuid references workout_templates(id),
  source_session_id          uuid,   -- soft reference; no FK (session may be pruned)
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  version                    integer not null default 1,
  deleted_at                 timestamptz
);
create index planned_workouts_user_date_idx on planned_workouts (user_id, scheduled_date);
create index planned_workouts_week_idx        on planned_workouts (plan_week_id, position);
create index planned_workouts_updated_idx     on planned_workouts (updated_at, id);
select _attach_row_metadata('planned_workouts');

create table planned_workout_items (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null default auth.uid() references auth.users(id) on delete cascade,
  planned_workout_id     uuid not null references planned_workouts(id) on delete cascade,
  exercise_id            uuid references exercises(id),          -- reference kept for convenience
  exercise_name_snapshot text not null,                          -- snapshot survives rename/archive
  tracking_mode_snapshot tracking_mode not null,
  position               integer not null,
  group_id               text,
  prescription           jsonb not null default '{}'::jsonb,     -- sets/reps/load/rpe/rir/rest/tempo/notes
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  version                integer not null default 1,
  deleted_at             timestamptz
);
create index pwi_planned_idx on planned_workout_items (planned_workout_id, position);
create index pwi_user_idx      on planned_workout_items (user_id);
create index pwi_updated_idx   on planned_workout_items (updated_at, id);
select _attach_row_metadata('planned_workout_items');

-- ========================= performed record (source of truth) =========================
create table workout_sessions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  planned_workout_id uuid references planned_workouts(id),
  name_snapshot      text not null,
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  status             session_status not null default 'active',
  notes              text,
  timezone           text not null,                              -- IANA zone (AR-DEC-04)
  rest_timer_anchor  timestamptz,                                -- absolute anchor, never a countdown
  source             text check (source in ('planned','template','repeat','empty','past')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  version            integer not null default 1,
  deleted_at         timestamptz
);
-- one ACTIVE session per user (FR-LOG-12)
create unique index workout_sessions_one_active_uidx
  on workout_sessions (user_id) where status = 'active' and deleted_at is null;
create index workout_sessions_user_started_idx on workout_sessions (user_id, started_at desc);
create index workout_sessions_user_status_idx  on workout_sessions (user_id, status);
create index workout_sessions_updated_idx       on workout_sessions (updated_at, id);
select _attach_row_metadata('workout_sessions');

create table session_exercises (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id               uuid not null references workout_sessions(id) on delete cascade,
  exercise_id              uuid references exercises(id),
  exercise_name_snapshot   text not null,
  tracking_mode_snapshot   tracking_mode not null,
  position                 integer not null,
  group_id                 text,
  substitution_of_exercise_id uuid references exercises(id),
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  version                  integer not null default 1,
  deleted_at               timestamptz
);
create index se_session_idx  on session_exercises (session_id, position);
create index se_exercise_idx  on session_exercises (exercise_id);
create index se_user_idx      on session_exercises (user_id);
create index se_updated_idx   on session_exercises (updated_at, id);
select _attach_row_metadata('session_exercises');

create table performed_sets (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_exercise_id uuid not null references session_exercises(id) on delete cascade,
  position           integer not null,
  set_type           set_type not null default 'working',
  load_kg            numeric check (load_kg >= 0),      -- zero allowed (bodyweight)
  reps               integer check (reps >= 0),
  duration_s         integer check (duration_s >= 0),
  distance_m         numeric check (distance_m >= 0),
  rpe                numeric check (rpe >= 0 and rpe <= 10),
  rir                numeric check (rir >= 0),
  completed          boolean not null default false,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  version            integer not null default 1,
  deleted_at         timestamptz
);
create index ps_se_position_idx on performed_sets (session_exercise_id, position);
create index ps_user_idx         on performed_sets (user_id);
create index ps_updated_idx      on performed_sets (updated_at, id);
select _attach_row_metadata('performed_sets');

-- ========================= derived (server-authoritative; recomputed) =========================
-- Not client-writable; the client pulls and overwrites (architecture §10.3.3).
-- Ids are DETERMINISTIC (uuid_generate_v5) so recompute is a pure UPSERT with
-- stable ids and minimal sync churn (ADR-0005).
create table personal_records (
  id                    uuid primary key,
  user_id               uuid not null,
  exercise_id           uuid references exercises(id),   -- NULL for category = 'session_volume'
  category              pr_category not null,
  rep_count             integer,                          -- set for 'rep_pr'; NULL otherwise
  value                 numeric not null,
  unit                  text not null,
  source_performed_set_id uuid,
  source_session_id     uuid,
  achieved_at           timestamptz not null,
  formula_id            text,                             -- e.g. 'epley'
  formula_version       integer,                          -- e.g. 1
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  version               integer not null default 1,
  deleted_at            timestamptz
);
create unique index pr_natural_uidx on personal_records
  (user_id, coalesce(exercise_id,'00000000-0000-0000-0000-000000000000'::uuid), category, coalesce(rep_count, -1));
create index pr_user_exercise_idx on personal_records (user_id, exercise_id);
create index pr_updated_idx        on personal_records (updated_at, id);
select _attach_row_metadata('personal_records');

create table weekly_aggregates (
  id                 uuid primary key,
  user_id            uuid not null,
  week_start_date    date not null,
  completed_workouts integer not null default 0,
  working_sets       integer not null default 0,
  total_volume_kg    numeric not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  version            integer not null default 1,
  deleted_at         timestamptz
);
create unique index wa_natural_uidx on weekly_aggregates (user_id, week_start_date);
create index wa_updated_idx on weekly_aggregates (updated_at, id);
select _attach_row_metadata('weekly_aggregates');

create table exercise_weekly_rollups (
  id              uuid primary key,
  user_id         uuid not null,
  exercise_id     uuid not null references exercises(id),
  week_start_date date not null,
  best_e1rm_kg    numeric,
  working_sets    integer not null default 0,
  total_volume_kg numeric not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  version         integer not null default 1,
  deleted_at      timestamptz
);
create unique index ewr_natural_uidx on exercise_weekly_rollups (user_id, exercise_id, week_start_date);
create index ewr_updated_idx on exercise_weekly_rollups (updated_at, id);
select _attach_row_metadata('exercise_weekly_rollups');

-- ========================= sync dedupe ledger =========================
-- Append-only. Records only SUCCESSFUL applications (result in ('applied','duplicate')).
-- A 'conflict' is NOT recorded so a retry re-evaluates against the current version.
create table processed_operations (
  operation_id     uuid primary key,
  user_id          uuid not null default auth.uid(),
  entity           text not null,
  entity_id        uuid not null,
  op               text not null check (op in ('upsert','delete')),
  result           text not null check (result in ('applied','duplicate')),
  resulting_version integer,
  created_at       timestamptz not null default now()
);
create index processed_operations_user_idx on processed_operations (user_id, created_at);
