-- 20260902090006_security_hardening.sql
-- Weight — security-identity phase (phase 7). Forward-only.
--
-- Owner: `security-identity`. This migration takes ownership of the security-
-- relevant schema surface and resolves the 8 gates set by the human on the
-- phase-6 approval (2026-09-02). See docs/security/security-identity.md.
--
-- Contents:
--   S-1  Child -> parent ownership integrity via COMPOSITE foreign keys
--        (a child's user_id can never reference another user's parent row).
--   S-2  Recompute triggers can write derived tables: SECURITY DEFINER functions
--        with a fixed search_path, client DML revoked, RLS not FORCEd on derived.
--   S-3  Derived + ledger rows are removed by the account-deletion cascade
--        (user_id FK to auth.users ON DELETE CASCADE).
--   S-4  Global-seed exercise ownership model made explicit + defended.
--   S-8  sync_apply hardening: fixed search_path, exercises special-case,
--        generic error normalisation (no FK/existence oracle).
--   OQ-10  Hard cascade deletion + a non-PII deletion_receipts table OUTSIDE
--          the deleted user's object graph.
--   BD-OQ-1  Corrected weekly-aggregate bucketing (user week_start + session-
--            local calendar date). Routed to backend to validate vs golden
--            vectors (WORK-012) before the Data & Progress increment.

-- =====================================================================
-- S-1 · Composite (id, user_id) targets + child composite FKs
-- =====================================================================
alter table superset_templates      add constraint superset_templates_id_user_uk      unique (id, user_id);
alter table workout_templates       add constraint workout_templates_id_user_uk       unique (id, user_id);
alter table workout_template_items  add constraint workout_template_items_id_user_uk  unique (id, user_id);
alter table week_templates          add constraint week_templates_id_user_uk          unique (id, user_id);
alter table plan_weeks              add constraint plan_weeks_id_user_uk              unique (id, user_id);
alter table planned_workouts        add constraint planned_workouts_id_user_uk        unique (id, user_id);
alter table workout_sessions        add constraint workout_sessions_id_user_uk        unique (id, user_id);
alter table session_exercises       add constraint session_exercises_id_user_uk       unique (id, user_id);

-- Replace the single-column structural FKs with composite (parent_id, user_id) FKs.
alter table superset_template_items  drop constraint if exists superset_template_items_superset_id_fkey;
alter table superset_template_items  add  constraint superset_template_items_parent_fk
  foreign key (superset_id, user_id) references superset_templates (id, user_id) on delete cascade;

alter table workout_template_items   drop constraint if exists workout_template_items_template_id_fkey;
alter table workout_template_items   add  constraint workout_template_items_parent_fk
  foreign key (template_id, user_id) references workout_templates (id, user_id) on delete cascade;

alter table set_prescriptions        drop constraint if exists set_prescriptions_parent_item_id_fkey;
alter table set_prescriptions        add  constraint set_prescriptions_parent_fk
  foreign key (parent_item_id, user_id) references workout_template_items (id, user_id) on delete cascade;

alter table week_template_days        drop constraint if exists week_template_days_week_template_id_fkey;
alter table week_template_days        add  constraint week_template_days_parent_fk
  foreign key (week_template_id, user_id) references week_templates (id, user_id) on delete cascade;

alter table planned_workouts          drop constraint if exists planned_workouts_plan_week_id_fkey;
alter table planned_workouts          add  constraint planned_workouts_parent_fk
  foreign key (plan_week_id, user_id) references plan_weeks (id, user_id) on delete cascade;

alter table planned_workout_items     drop constraint if exists planned_workout_items_planned_workout_id_fkey;
alter table planned_workout_items     add  constraint planned_workout_items_parent_fk
  foreign key (planned_workout_id, user_id) references planned_workouts (id, user_id) on delete cascade;

alter table session_exercises         drop constraint if exists session_exercises_session_id_fkey;
alter table session_exercises         add  constraint session_exercises_parent_fk
  foreign key (session_id, user_id) references workout_sessions (id, user_id) on delete cascade;

alter table performed_sets            drop constraint if exists performed_sets_session_exercise_id_fkey;
alter table performed_sets            add  constraint performed_sets_parent_fk
  foreign key (session_exercise_id, user_id) references session_exercises (id, user_id) on delete cascade;

-- Soft references to user-owned OR global objects: a trusted trigger enforces
-- "if the referenced row is user-owned it must belong to the same user".
create or replace function _check_ref_ownership()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  j        jsonb := to_jsonb(new);
  v_user   uuid  := (j->>'user_id')::uuid;
  v_owner  uuid;
  v_ref    uuid;
begin
  -- private-exercise references must belong to the same user
  foreach v_ref in array array[ (j->>'exercise_id')::uuid, (j->>'substitution_of_exercise_id')::uuid ]
  loop
    if v_ref is not null then
      select owner_user_id into v_owner from exercises where id = v_ref;
      if v_owner is not null and v_owner <> v_user then
        raise exception 'ownership_violation' using errcode = '42501';
      end if;
    end if;
  end loop;

  -- workout-template soft references must belong to the same user
  foreach v_ref in array array[ (j->>'workout_template_id')::uuid, (j->>'source_workout_template_id')::uuid ]
  loop
    if v_ref is not null then
      select user_id into v_owner from workout_templates where id = v_ref;
      if v_owner is not null and v_owner <> v_user then
        raise exception 'ownership_violation' using errcode = '42501';
      end if;
    end if;
  end loop;

  return new;
end;
$$;
revoke all on function _check_ref_ownership() from public;

create trigger trg_refown_pwi  before insert or update on planned_workout_items    for each row execute function _check_ref_ownership();
create trigger trg_refown_se   before insert or update on session_exercises        for each row execute function _check_ref_ownership();
create trigger trg_refown_sti  before insert or update on superset_template_items  for each row execute function _check_ref_ownership();
create trigger trg_refown_wtd  before insert or update on week_template_days        for each row execute function _check_ref_ownership();
create trigger trg_refown_pw   before insert or update on planned_workouts          for each row execute function _check_ref_ownership();

-- =====================================================================
-- S-3 · Derived + ledger rows follow the account-deletion cascade
-- =====================================================================
alter table personal_records        add constraint personal_records_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table weekly_aggregates       add constraint weekly_aggregates_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table exercise_weekly_rollups add constraint exercise_weekly_rollups_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;
alter table processed_operations    add constraint processed_operations_user_fk
  foreign key (user_id) references auth.users(id) on delete cascade;

-- =====================================================================
-- S-2 · Recompute functions may write the derived tables
-- =====================================================================
-- Derived tables: keep RLS ENABLE (SELECT filtered per user) but NOT FORCE, and
-- revoke client DML entirely. Writes happen only via the SECURITY DEFINER
-- recompute functions (owner = migration role, which bypasses non-forced RLS).
alter table personal_records        no force row level security;
alter table weekly_aggregates       no force row level security;
alter table exercise_weekly_rollups no force row level security;

revoke insert, update, delete on personal_records        from authenticated, anon;
revoke insert, update, delete on weekly_aggregates       from authenticated, anon;
revoke insert, update, delete on exercise_weekly_rollups from authenticated, anon;

alter function recompute_exercise_prs(uuid, uuid)        security definer set search_path = pg_catalog, public;
alter function recompute_session_volume_pr(uuid)         security definer set search_path = pg_catalog, public;
alter function recompute_week_aggregates(uuid, date)     security definer set search_path = pg_catalog, public;
alter function _epley_e1rm(numeric, integer)             set search_path = pg_catalog, public;
alter function _pr_id(uuid, uuid, text, integer)         set search_path = pg_catalog, public;
alter function _agg_id(text, uuid, text)                 set search_path = pg_catalog, public;

revoke all on function recompute_exercise_prs(uuid, uuid)    from public;
revoke all on function recompute_session_volume_pr(uuid)     from public;
revoke all on function recompute_week_aggregates(uuid, date) from public;
-- (no execute grant to authenticated: these are invoked only by the AFTER
--  triggers, which switch into the definer context.)

-- =====================================================================
-- S-4 · Global-seed exercise ownership model (explicit + defended)
-- =====================================================================
-- `exercises` is a DELIBERATE dual-tenancy table and does NOT follow the
-- standard `user_id NOT NULL` contract:
--   owner_user_id IS NULL   -> GLOBAL seed row. Seeded only by migrations /
--                              service_role. Immutable to every client role.
--   owner_user_id = uid     -> PRIVATE, user-created.
-- The RLS in 20260902090005 already: SELECT (null OR mine); INSERT/UPDATE/DELETE
-- WITH CHECK (owner_user_id = auth.uid()) -> a client can neither create a
-- global row (null fails the check) nor re-parent one (update check fails) nor
-- write another user's private row. Add a belt-and-suspenders trigger:

create or replace function _guard_exercise_owner()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  -- only trusted contexts may create / mutate a GLOBAL (owner NULL) row:
  --   * migrations / psql as a superuser  -> no JWT context, auth.role() IS NULL
  --   * the delete-account style Edge path -> auth.role() = 'service_role'
  -- Any authenticated/anon client is blocked.
  if (new.owner_user_id is null)
     and (auth.role() is not null)
     and (auth.role() <> 'service_role') then
    raise exception 'global_exercise_write_forbidden' using errcode = '42501';
  end if;
  -- a client may not flip ownership
  if tg_op = 'UPDATE' and new.owner_user_id is distinct from old.owner_user_id then
    raise exception 'exercise_reparent_forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function _guard_exercise_owner() from public;
create trigger trg_guard_exercise_owner
  before insert or update on exercises
  for each row execute function _guard_exercise_owner();

-- ISS-27 (human decision 2026-09-03): the exercise catalogue (global seed + private)
-- is readable by AUTHENTICATED sessions only. The Fitney client has no anon / browse-
-- before-login flow (ADR-0009, FR-AUTH-01), so the anon key must not expose the seed
-- catalogue. This refines the read-visibility half of SEC-DEC-05 ("global … readable by
-- everyone") to "readable by every authenticated user". Write model is unchanged.
drop policy exercise_select on exercises;
create policy exercise_select on exercises for select
  to authenticated
  using (owner_user_id is null or owner_user_id = auth.uid());

-- =====================================================================
-- S-8 · sync_apply hardening
-- =====================================================================
create or replace function sync_apply(
  p_operation_id  uuid,
  p_entity        text,
  p_entity_id     uuid,
  p_op            text,
  p_payload       jsonb,
  p_base_version  integer
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_table    text;
  v_owncol   text;      -- ownership column name for this table
  v_current  integer;
  v_dup      processed_operations%rowtype;
  v_payload  jsonb;
  v_set      text;
  v_new_ver  integer;
  v_row      jsonb;
begin
  select t, oc into v_table, v_owncol from (values
    ('profile','profiles','user_id'),
    ('exercise','exercises','owner_user_id'),
    ('superset_template','superset_templates','user_id'),
    ('superset_template_item','superset_template_items','user_id'),
    ('workout_template','workout_templates','user_id'),
    ('workout_template_item','workout_template_items','user_id'),
    ('set_prescription','set_prescriptions','user_id'),
    ('week_template','week_templates','user_id'),
    ('week_template_day','week_template_days','user_id'),
    ('plan_week','plan_weeks','user_id'),
    ('planned_workout','planned_workouts','user_id'),
    ('planned_workout_item','planned_workout_items','user_id'),
    ('workout_session','workout_sessions','user_id'),
    ('session_exercise','session_exercises','user_id'),
    ('performed_set','performed_sets','user_id')
  ) as w(e, t, oc) where w.e = p_entity;

  if v_table is null then
    raise exception 'sync_apply: unknown entity' using errcode = '22023';
  end if;
  if p_op not in ('upsert','delete') then
    raise exception 'sync_apply: unknown op' using errcode = '22023';
  end if;

  select * into v_dup from processed_operations where operation_id = p_operation_id;
  if found then
    -- F-8: a replayed operation_id returns status 'duplicate' per the documented RPC
    -- contract (was echoing the stored 'applied'). resulting_version is the outcome of
    -- the original apply. The client treats 'applied' and 'duplicate' identically (ADR-0003).
    return jsonb_build_object('status', 'duplicate', 'version', v_dup.resulting_version);
  end if;

  execute format('select version from %I where id = $1', v_table) into v_current using p_entity_id;

  if p_op = 'upsert' then
    -- force id + the correct ownership column to the caller; never trust client-supplied ownership
    v_payload := (p_payload - 'version' - 'created_at' - 'updated_at' - 'user_id' - 'owner_user_id' - 'id')
                 || jsonb_build_object('id', p_entity_id, v_owncol, auth.uid());

    if v_current is null then
      begin
        execute format('insert into %1$I select r.* from jsonb_populate_record(null::%1$I, $1) r returning version',
                       v_table) into v_new_ver using v_payload;
      exception
        when foreign_key_violation or check_violation or unique_violation
          or insufficient_privilege or not_null_violation then
          -- F-2: a malformed payload (missing a required NOT NULL field) is a structured
          -- reject, never a leaked raw exception. Defaults are NOT silently merged; a valid
          -- upsert must carry the coalesced latest full-row state (architecture §8.4/§10.2).
          -- generic: do NOT leak which constraint / whether a cross-tenant parent exists.
          return jsonb_build_object('status','rejected');
      end;
    elsif v_current = p_base_version then
      select string_agg(format('%1$I = r.%1$I', column_name), ', ') into v_set
        from information_schema.columns
       where table_schema = 'public' and table_name = v_table
         and column_name not in ('id','user_id','owner_user_id','version','created_at','updated_at');
      begin
        execute format('update %1$I t set %2$s from jsonb_populate_record(null::%1$I, $1) r where t.id = $2 returning t.version',
                       v_table, v_set) into v_new_ver using v_payload, p_entity_id;
      exception
        when foreign_key_violation or check_violation or unique_violation
          or insufficient_privilege or not_null_violation then
          -- F-2: same structured reject for a malformed partial-payload update.
          return jsonb_build_object('status','rejected');
      end;
    else
      execute format('select to_jsonb(t.*) from %I t where t.id = $1', v_table) into v_row using p_entity_id;
      return jsonb_build_object('status','conflict','version', v_current, 'row', v_row);
    end if;

  else -- delete
    if v_current is null then
      insert into processed_operations(operation_id, user_id, entity, entity_id, op, result, resulting_version)
      values (p_operation_id, auth.uid(), p_entity, p_entity_id, p_op, 'applied', null);
      return jsonb_build_object('status','applied','version', null);
    elsif v_current = p_base_version then
      execute format('update %I set deleted_at = now() where id = $1', v_table) using p_entity_id;
      v_new_ver := v_current + 1;
    else
      execute format('select to_jsonb(t.*) from %I t where t.id = $1', v_table) into v_row using p_entity_id;
      return jsonb_build_object('status','conflict','version', v_current, 'row', v_row);
    end if;
  end if;

  insert into processed_operations(operation_id, user_id, entity, entity_id, op, result, resulting_version)
  values (p_operation_id, auth.uid(), p_entity, p_entity_id, p_op, 'applied', v_new_ver);
  return jsonb_build_object('status','applied','version', v_new_ver);
end;
$$;
-- F-11: Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE to anon on every new function,
-- and `revoke ... from public` does not remove a role-specific grant. Revoke from anon
-- explicitly so only an authenticated session can call the push RPC.
revoke all on function sync_apply(uuid, text, uuid, text, jsonb, integer) from public, anon;
grant execute on function sync_apply(uuid, text, uuid, text, jsonb, integer) to authenticated;

-- =====================================================================
-- OQ-10 · non-PII deletion receipt, OUTSIDE the deleted user's graph
-- =====================================================================
-- No FK to auth.users, no email/name/workout data. `user_ref` is a keyed HMAC
-- of the user id (key = a server secret, not in this file) so the same account
-- is not re-identifiable from the receipt alone but a specific id can be
-- checked if legally required. Readable only by service_role.
create table deletion_receipts (
  receipt_id   uuid primary key default gen_random_uuid(),
  user_ref     text not null,               -- HMAC_SHA256(server_secret, user_id)
  app_version  text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);
alter table deletion_receipts enable row level security;
alter table deletion_receipts force  row level security;
-- no policies -> no access for anon/authenticated; service_role bypasses RLS.
revoke all on deletion_receipts from anon, authenticated;

-- =====================================================================
-- BD-OQ-1 · Corrected weekly bucketing (user week_start + session-local date)
-- Human direction 2026-09-02. `backend-data-engineering` to validate against
-- golden vectors (WORK-012) before the Data & Progress increment.
-- =====================================================================
-- local week-start date for a given local date and a user's week_start (0=Sun..6=Sat)
create or replace function _week_start_for(p_local_date date, p_week_start smallint)
returns date language sql immutable set search_path = pg_catalog, public as $$
  select p_local_date - (( (extract(dow from p_local_date)::int - p_week_start) % 7 + 7) % 7);
$$;

create or replace function recompute_week_aggregates(p_user_id uuid, p_week_start date)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_ws smallint;
begin
  select week_start into v_ws from profiles where id = p_user_id;
  v_ws := coalesce(v_ws, 1::smallint);   -- F-5: keep the arg unambiguously smallint (never widen _week_start_for to integer)

  insert into weekly_aggregates as wa (id, user_id, week_start_date, completed_workouts, working_sets, total_volume_kg)
  select
    _agg_id('wa', p_user_id, p_week_start::text), p_user_id, p_week_start,
    count(distinct s.id) filter (where s.status = 'completed'),
    count(ps.id) filter (where ps.completed and ps.set_type in ('working','backoff','drop','failure')),
    coalesce(sum((coalesce(ps.load_kg,0) * coalesce(ps.reps,0)))
             filter (where ps.completed and ps.set_type in ('working','backoff','drop','failure')), 0)
  from workout_sessions s
  left join session_exercises se on se.session_id = s.id and se.deleted_at is null
  left join performed_sets    ps on ps.session_exercise_id = se.id and ps.deleted_at is null
  where s.user_id = p_user_id and s.deleted_at is null
    and _week_start_for( (s.started_at at time zone s.timezone)::date, v_ws ) = p_week_start
  on conflict (id) do update
    set completed_workouts = excluded.completed_workouts,
        working_sets       = excluded.working_sets,
        total_volume_kg    = excluded.total_volume_kg,
        deleted_at = null;

  insert into exercise_weekly_rollups as ewr (id, user_id, exercise_id, week_start_date, best_e1rm_kg, working_sets, total_volume_kg)
  select
    _agg_id('ewr', p_user_id, p_week_start::text || ':' || se.exercise_id::text),
    p_user_id, se.exercise_id, p_week_start,
    max(_epley_e1rm(ps.load_kg, ps.reps)),
    count(ps.id) filter (where ps.completed and ps.set_type in ('working','backoff','drop','failure')),
    coalesce(sum((coalesce(ps.load_kg,0) * coalesce(ps.reps,0)))
             filter (where ps.completed and ps.set_type in ('working','backoff','drop','failure')), 0)
  from workout_sessions s
  join session_exercises se on se.session_id = s.id and se.deleted_at is null and se.exercise_id is not null
  join performed_sets    ps on ps.session_exercise_id = se.id and ps.deleted_at is null
  where s.user_id = p_user_id and s.deleted_at is null and s.status = 'completed'
    and _week_start_for( (s.started_at at time zone s.timezone)::date, v_ws ) = p_week_start
  group by se.exercise_id
  on conflict (id) do update
    set best_e1rm_kg    = excluded.best_e1rm_kg,
        working_sets    = excluded.working_sets,
        total_volume_kg = excluded.total_volume_kg,
        deleted_at = null;
end;
$$;

-- the trigger that passes a week to recompute must now pass the LOCAL week-start
create or replace function trg_recompute_from_performed_set()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_row performed_sets := coalesce(new, old);
  v_user uuid; v_exercise uuid; v_week date; v_ws smallint; v_completed boolean;
begin
  select s.user_id, se.exercise_id,
         (s.status = 'completed'),
         -- F-5: coalesce(smallint, integer) resolved to integer -> no _week_start_for(date,integer).
         -- 1::smallint keeps the 2nd arg smallint; the function signature is NOT widened.
         _week_start_for((s.started_at at time zone s.timezone)::date, coalesce(p.week_start, 1::smallint))
    into v_user, v_exercise, v_completed, v_week
  from session_exercises se
  join workout_sessions s on s.id = se.session_id
  left join profiles p on p.id = s.user_id
  where se.id = v_row.session_exercise_id;

  if v_user is null then return coalesce(new, old); end if;
  if v_completed then
    if v_exercise is not null then perform recompute_exercise_prs(v_user, v_exercise); end if;
    perform recompute_session_volume_pr(v_user);
    perform recompute_week_aggregates(v_user, v_week);
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function trg_recompute_from_session()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_week date; v_ws smallint; r record;
begin
  select coalesce(week_start, 1::smallint) into v_ws from profiles where id = coalesce(new.user_id, old.user_id);
  -- F-5: coalesce(v_ws, 1::smallint) keeps the 2nd arg smallint (not integer); signature unchanged.
  v_week := _week_start_for((coalesce(new.started_at, old.started_at) at time zone coalesce(new.timezone, old.timezone))::date, coalesce(v_ws, 1::smallint));
  for r in select distinct se.exercise_id from session_exercises se
           where se.session_id = coalesce(new.id, old.id) and se.exercise_id is not null
  loop
    perform recompute_exercise_prs(coalesce(new.user_id, old.user_id), r.exercise_id);
  end loop;
  perform recompute_session_volume_pr(coalesce(new.user_id, old.user_id));
  perform recompute_week_aggregates(coalesce(new.user_id, old.user_id), v_week);
  return coalesce(new, old);
end;
$$;

-- =====================================================================
-- F-13 · Internal / trigger / SECURITY DEFINER functions must NOT be
-- callable via the PostgREST RPC surface.
-- =====================================================================
-- Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE on every new function to
-- `anon` and `authenticated`; `REVOKE ... FROM public` (used above) does not
-- remove a role-specific grant. Without this block the Supabase security
-- advisor flags recompute_* and the trigger functions as
-- "Public/Signed-In Users Can Execute SECURITY DEFINER Function"
-- (`/rest/v1/rpc/<name>`) — a caller could invoke recompute_*(<any user_id>, …)
-- for an arbitrary user. These are invoked only by the AFTER triggers; no client
-- role needs EXECUTE. (sync_apply keeps its explicit grant to `authenticated`.)
do $$
declare fn text;
begin
  foreach fn in array array[
    'set_row_metadata()',
    '_attach_row_metadata(regclass)',
    '_epley_e1rm(numeric, integer)',
    '_pr_id(uuid, uuid, text, integer)',
    '_agg_id(text, uuid, text)',
    '_week_start_for(date, smallint)',
    'recompute_exercise_prs(uuid, uuid)',
    'recompute_session_volume_pr(uuid)',
    'recompute_week_aggregates(uuid, date)',
    'trg_recompute_from_performed_set()',
    'trg_recompute_from_session()',
    '_check_ref_ownership()',
    '_guard_exercise_owner()'
  ]
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
  end loop;
end $$;
