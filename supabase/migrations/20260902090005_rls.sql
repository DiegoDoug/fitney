-- 20260902090005_rls.sql
-- Weight — Row Level Security. Forward-only (ADR-0006).
--
-- OWNERSHIP: this migration is the BASELINE authored by backend-data-engineering.
-- `security-identity` holds final authority over policy content and owns the
-- adversarial two-user test plan (NFR-SEC, ADR-0009, roadmap → security phase).
-- No table is exposed through the client API until those adversarial tests pass
-- against a provisioned project (DEP-1) — see backend-data-implementation.md §9.
--
-- Model: authorization is RLS-only; the client is untrusted. Every synced
-- user-owned table carries a denormalised `user_id`, so every policy is a
-- join-free `user_id = auth.uid()`. Independent policies per command
-- (select/insert/update/delete). Soft delete is an UPDATE (tombstone); a hard
-- DELETE policy exists only for uncommitted child cleanup.

-- Helper: standard 4 policies for a user_id-scoped table.
create or replace function _apply_owner_rls(p_table regclass)
returns void language plpgsql as $$
begin
  execute format('alter table %s enable row level security', p_table);
  execute format('alter table %s force row level security', p_table);
  execute format($p$create policy owner_select on %s for select using (user_id = auth.uid())$p$, p_table);
  execute format($p$create policy owner_insert on %s for insert with check (user_id = auth.uid())$p$, p_table);
  execute format($p$create policy owner_update on %s for update using (user_id = auth.uid()) with check (user_id = auth.uid())$p$, p_table);
  execute format($p$create policy owner_delete on %s for delete using (user_id = auth.uid())$p$, p_table);
end;
$$;

-- profiles (id is the user id)
alter table profiles enable row level security;
alter table profiles force  row level security;
create policy profile_select on profiles for select using (id = auth.uid());
create policy profile_insert on profiles for insert with check (id = auth.uid());
create policy profile_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- no delete policy: profile row is removed only by the auth.users cascade (delete-account)

-- exercises (global seed rows readable by all; writable only by their owner)
alter table exercises enable row level security;
alter table exercises force  row level security;
create policy exercise_select on exercises for select
  using (owner_user_id is null or owner_user_id = auth.uid());
create policy exercise_insert on exercises for insert
  with check (owner_user_id = auth.uid());
create policy exercise_update on exercises for update
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy exercise_delete on exercises for delete
  using (owner_user_id = auth.uid());

-- all other synced user-owned tables
select _apply_owner_rls('superset_templates');
select _apply_owner_rls('superset_template_items');
select _apply_owner_rls('workout_templates');
select _apply_owner_rls('workout_template_items');
select _apply_owner_rls('set_prescriptions');
select _apply_owner_rls('week_templates');
select _apply_owner_rls('week_template_days');
select _apply_owner_rls('plan_weeks');
select _apply_owner_rls('planned_workouts');
select _apply_owner_rls('planned_workout_items');
select _apply_owner_rls('workout_sessions');
select _apply_owner_rls('session_exercises');
select _apply_owner_rls('performed_sets');

-- derived tables: readable by owner; NOT client-writable (recompute writes them
-- as the definer via SECURITY DEFINER-less triggers running in the owning
-- transaction — the trigger functions run with table-owner rights for writes
-- while RLS still filters reads).
alter table personal_records       enable row level security;
alter table personal_records       force  row level security;
alter table weekly_aggregates      enable row level security;
alter table weekly_aggregates      force  row level security;
alter table exercise_weekly_rollups enable row level security;
alter table exercise_weekly_rollups force  row level security;
create policy pr_select  on personal_records        for select using (user_id = auth.uid());
create policy wa_select  on weekly_aggregates       for select using (user_id = auth.uid());
create policy ewr_select on exercise_weekly_rollups for select using (user_id = auth.uid());
-- NOTE (routed to security-identity): the recompute triggers must be owned by a
-- role permitted to write these tables; confirm the exact grant model on the
-- provisioned project. No client insert/update/delete policy is defined.

-- processed_operations: append-only, owner-scoped read/insert.
alter table processed_operations enable row level security;
alter table processed_operations force  row level security;
create policy po_select on processed_operations for select using (user_id = auth.uid());
create policy po_insert on processed_operations for insert with check (user_id = auth.uid());
-- no update / delete policy

drop function _apply_owner_rls(regclass);
