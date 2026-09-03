-- 20260902090003_recompute.sql
-- Weight — deterministic, idempotent server-side recompute of PRs and aggregates
-- (ADR-0005, FR-DATA-04..10, SPEC §12). Mirrors the client TS `domain/{calc,pr}`.
-- Shared golden vectors keep the two implementations convergent (WORK-012).
-- Forward-only (ADR-0006).
--
-- Determinism: pure function of the ordered set of COMPLETED performed_sets in
-- COMPLETED, non-deleted sessions. Ordering key (session_exercise_id, position, id).
-- No wall-clock, no iteration-order dependence. Derived-row ids are uuid_generate_v5
-- of the natural key, so every run is a stable UPSERT.

-- e1RM: Epley, eligible for reps in [2,10]. formula_id='epley', formula_version=1.
create or replace function _epley_e1rm(p_load numeric, p_reps integer)
returns numeric language sql immutable as $$
  select case when p_reps between 2 and 10 and p_load is not null and p_load >= 0
              then round(p_load * (1 + p_reps / 30.0), 4)
              else null end;
$$;

-- F-9: uuid-ossp lives in the `extensions` schema on Supabase, not `public`.
-- The fixed search_path (pg_catalog, public) applied in 20260902090006 (SEC-REQ-AZ-07)
-- therefore cannot resolve uuid_generate_v5 / uuid_ns_url. Schema-qualify them explicitly
-- so resolution is search_path-independent (and injection-proof), keeping the pinned
-- search_path unchanged.
create or replace function _pr_id(p_user uuid, p_exercise uuid, p_cat text, p_rep integer)
returns uuid language sql immutable as $$
  select extensions.uuid_generate_v5(
    extensions.uuid_ns_url(),
    'weight:pr:' || p_user::text || ':' || coalesce(p_exercise::text,'-') || ':' || p_cat || ':' || coalesce(p_rep::text,'-')
  );
$$;

create or replace function _agg_id(p_kind text, p_user uuid, p_key text)
returns uuid language sql immutable as $$
  select extensions.uuid_generate_v5(extensions.uuid_ns_url(), 'weight:' || p_kind || ':' || p_user::text || ':' || p_key);
$$;

-- ---------------------------------------------------------------------------
-- recompute_exercise_prs: max_load, est_1rm, and rep_pr (per rep 1..12) for one
-- (user, exercise). weight_reps only. Upserts qualifying PR rows; tombstones
-- previously-materialised rows in these categories that no longer qualify.
-- ---------------------------------------------------------------------------
create or replace function recompute_exercise_prs(p_user_id uuid, p_exercise_id uuid)
returns void
language plpgsql
as $$
declare
  v_keep uuid[] := array[]::uuid[];   -- F-7: explicit uuid[] initializer (no text -> uuid[] assignment-cast lint warning)
  r record;
begin
  -- max_load
  select ps.load_kg, ps.id, s.id as session_id, coalesce(ps.completed_at, s.ended_at, s.started_at) as achieved_at
    into r
  from performed_sets ps
  join session_exercises se on se.id = ps.session_exercise_id and se.deleted_at is null
  join workout_sessions  s  on s.id  = se.session_id and s.deleted_at is null and s.status = 'completed'
  where ps.deleted_at is null and ps.completed
    and s.user_id = p_user_id and se.exercise_id = p_exercise_id
    and se.tracking_mode_snapshot = 'weight_reps'
    and ps.set_type in ('working','backoff','drop','failure')
    and ps.load_kg is not null and coalesce(ps.reps,0) >= 1
  order by ps.load_kg desc, ps.reps desc nulls last, ps.id
  limit 1;
  if found then
    insert into personal_records as pr
      (id, user_id, exercise_id, category, rep_count, value, unit, source_performed_set_id, source_session_id, achieved_at, formula_id, formula_version)
    values
      (_pr_id(p_user_id, p_exercise_id, 'max_load', null), p_user_id, p_exercise_id, 'max_load', null,
       r.load_kg, 'kg', r.id, r.session_id, r.achieved_at, null, null)
    on conflict (id) do update
      set value = excluded.value, unit = excluded.unit, rep_count = excluded.rep_count,
          source_performed_set_id = excluded.source_performed_set_id, source_session_id = excluded.source_session_id,
          achieved_at = excluded.achieved_at, deleted_at = null;
    v_keep := v_keep || _pr_id(p_user_id, p_exercise_id, 'max_load', null);
  end if;

  -- est_1rm (Epley, reps 2..10)
  select ps.id, s.id as session_id, coalesce(ps.completed_at, s.ended_at, s.started_at) as achieved_at,
         _epley_e1rm(ps.load_kg, ps.reps) as e1rm
    into r
  from performed_sets ps
  join session_exercises se on se.id = ps.session_exercise_id and se.deleted_at is null
  join workout_sessions  s  on s.id  = se.session_id and s.deleted_at is null and s.status = 'completed'
  where ps.deleted_at is null and ps.completed
    and s.user_id = p_user_id and se.exercise_id = p_exercise_id
    and se.tracking_mode_snapshot = 'weight_reps'
    and ps.set_type in ('working','backoff','drop','failure')
    and _epley_e1rm(ps.load_kg, ps.reps) is not null
  order by _epley_e1rm(ps.load_kg, ps.reps) desc, ps.id
  limit 1;
  if found then
    insert into personal_records
      (id, user_id, exercise_id, category, rep_count, value, unit, source_performed_set_id, source_session_id, achieved_at, formula_id, formula_version)
    values
      (_pr_id(p_user_id, p_exercise_id, 'est_1rm', null), p_user_id, p_exercise_id, 'est_1rm', null,
       r.e1rm, 'kg', r.id, r.session_id, r.achieved_at, 'epley', 1)
    on conflict (id) do update
      set value = excluded.value, achieved_at = excluded.achieved_at,
          source_performed_set_id = excluded.source_performed_set_id, source_session_id = excluded.source_session_id,
          formula_id = excluded.formula_id, formula_version = excluded.formula_version, deleted_at = null;
    v_keep := v_keep || _pr_id(p_user_id, p_exercise_id, 'est_1rm', null);
  end if;

  -- rep_pr: best load at exactly N reps, N in 1..12
  for r in
    select ps.reps as rep_count, max(ps.load_kg) as best_load
    from performed_sets ps
    join session_exercises se on se.id = ps.session_exercise_id and se.deleted_at is null
    join workout_sessions  s  on s.id  = se.session_id and s.deleted_at is null and s.status = 'completed'
    where ps.deleted_at is null and ps.completed
      and s.user_id = p_user_id and se.exercise_id = p_exercise_id
      and se.tracking_mode_snapshot = 'weight_reps'
      and ps.set_type in ('working','backoff','drop','failure')
      and ps.load_kg is not null and ps.reps between 1 and 12
    group by ps.reps
  loop
    insert into personal_records
      (id, user_id, exercise_id, category, rep_count, value, unit, achieved_at)
    values
      (_pr_id(p_user_id, p_exercise_id, 'rep_pr', r.rep_count), p_user_id, p_exercise_id, 'rep_pr', r.rep_count,
       r.best_load, 'kg', now())
    on conflict (id) do update set value = excluded.value, deleted_at = null;
    v_keep := v_keep || _pr_id(p_user_id, p_exercise_id, 'rep_pr', r.rep_count);
  end loop;

  -- tombstone PR rows in these categories that no longer qualify
  update personal_records
     set deleted_at = now()
   where user_id = p_user_id and exercise_id = p_exercise_id
     and category in ('max_load','est_1rm','rep_pr')
     and deleted_at is null
     and id <> all (v_keep);
end;
$$;

-- ---------------------------------------------------------------------------
-- recompute_session_volume_pr: max single-session working volume for the user.
-- category = 'session_volume', exercise_id NULL.
-- ---------------------------------------------------------------------------
create or replace function recompute_session_volume_pr(p_user_id uuid)
returns void
language plpgsql
as $$
declare r record;
begin
  select s.id as session_id, coalesce(s.ended_at, s.started_at) as achieved_at,
         sum(coalesce(ps.load_kg,0) * coalesce(ps.reps,0)) as vol
    into r
  from workout_sessions s
  join session_exercises se on se.session_id = s.id and se.deleted_at is null
  join performed_sets    ps on ps.session_exercise_id = se.id and ps.deleted_at is null
  where s.user_id = p_user_id and s.deleted_at is null and s.status = 'completed'
    and ps.completed and ps.set_type in ('working','backoff','drop','failure')
  group by s.id, s.ended_at, s.started_at
  order by vol desc, s.id
  limit 1;

  if found and r.vol is not null and r.vol > 0 then
    insert into personal_records
      (id, user_id, exercise_id, category, rep_count, value, unit, source_session_id, achieved_at)
    values
      (_pr_id(p_user_id, null, 'session_volume', null), p_user_id, null, 'session_volume', null,
       round(r.vol,4), 'kg', r.session_id, r.achieved_at)
    on conflict (id) do update
      set value = excluded.value, source_session_id = excluded.source_session_id,
          achieved_at = excluded.achieved_at, deleted_at = null;
  else
    update personal_records set deleted_at = now()
     where id = _pr_id(p_user_id, null, 'session_volume', null) and deleted_at is null;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- recompute_week_aggregates: weekly_aggregates + exercise_weekly_rollups for one
-- (user, ISO-week-start date). Warmups excluded from headline working volume.
-- ---------------------------------------------------------------------------
create or replace function recompute_week_aggregates(p_user_id uuid, p_week_start date)
returns void
language plpgsql
as $$
begin
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
    and (s.started_at at time zone 'UTC')::date >= p_week_start
    and (s.started_at at time zone 'UTC')::date <  p_week_start + 7
  on conflict (id) do update
    set completed_workouts = excluded.completed_workouts,
        working_sets       = excluded.working_sets,
        total_volume_kg    = excluded.total_volume_kg,
        deleted_at = null;

  -- per-exercise weekly rollup
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
    and (s.started_at at time zone 'UTC')::date >= p_week_start
    and (s.started_at at time zone 'UTC')::date <  p_week_start + 7
  group by se.exercise_id
  on conflict (id) do update
    set best_e1rm_kg    = excluded.best_e1rm_kg,
        working_sets    = excluded.working_sets,
        total_volume_kg = excluded.total_volume_kg,
        deleted_at = null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers: recompute on any change to completed-session data.
-- AR-OQ-3 resolved toward trigger-driven (transactional; cannot drift as an
-- "after the fact" step). Cost is trivial at the assumed data volume (AR-A2).
-- ---------------------------------------------------------------------------
create or replace function trg_recompute_from_performed_set()
returns trigger
language plpgsql
as $$
declare
  v_row performed_sets := coalesce(new, old);
  v_user uuid; v_exercise uuid; v_week date;
begin
  select s.user_id,
         se.exercise_id,
         date_trunc('week', s.started_at at time zone 'UTC')::date
    into v_user, v_exercise, v_week
  from session_exercises se
  join workout_sessions s on s.id = se.session_id
  where se.id = v_row.session_exercise_id;

  if v_user is null then return coalesce(new, old); end if;

  if exists (select 1 from workout_sessions s
             join session_exercises se on se.session_id = s.id
             where se.id = v_row.session_exercise_id and s.status = 'completed') then
    if v_exercise is not null then perform recompute_exercise_prs(v_user, v_exercise); end if;
    perform recompute_session_volume_pr(v_user);
    perform recompute_week_aggregates(v_user, v_week);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger trg_ps_recompute
  after insert or update or delete on performed_sets
  for each row execute function trg_recompute_from_performed_set();

create or replace function trg_recompute_from_session()
returns trigger
language plpgsql
as $$
declare v_week date; r record;
begin
  v_week := date_trunc('week', coalesce(new.started_at, old.started_at) at time zone 'UTC')::date;
  -- recompute for every exercise in the session + the week + session-volume PR
  for r in select distinct se.exercise_id
           from session_exercises se
           where se.session_id = coalesce(new.id, old.id) and se.exercise_id is not null
  loop
    perform recompute_exercise_prs(coalesce(new.user_id, old.user_id), r.exercise_id);
  end loop;
  perform recompute_session_volume_pr(coalesce(new.user_id, old.user_id));
  perform recompute_week_aggregates(coalesce(new.user_id, old.user_id), v_week);
  return coalesce(new, old);
end;
$$;

create trigger trg_session_recompute
  after update of status, ended_at, started_at, deleted_at on workout_sessions
  for each row execute function trg_recompute_from_session();
