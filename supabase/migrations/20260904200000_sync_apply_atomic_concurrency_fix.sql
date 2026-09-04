-- 20260904200000_sync_apply_atomic_concurrency_fix.sql
-- ISS-29 (High, Notion) / DEC-55 (human-approved, 2026-09-04): sync_apply's
-- optimistic-concurrency check was a check-then-act (TOCTOU) race under true
-- concurrent writers. The UPDATE/tombstone branches read `v_current` via a
-- plain, non-locking SELECT, then update by `id` alone -- the UPDATE never
-- re-verified `version` in its own WHERE clause. Two genuinely concurrent
-- callers could both read the same pre-write version, both pass the
-- `v_current = p_base_version` guard, and both successfully UPDATE: Postgres
-- serializes the two writes at the row lock, but the SECOND one still matches
-- (WHERE id = $2 only) and silently overwrites the first with no conflict
-- ever raised. Observed hosted: 1 of 7 genuinely-concurrent-writer runs
-- produced `applied`+`applied` with the row's version jumping 1->3 instead of
-- 1->2. Root cause + hosted reproduction: docs/engineering/evidence/12-*,
-- Notion ISS-29.
--
-- Fix: make the version comparison and the write ATOMIC by moving the
-- version check into the UPDATE's own WHERE clause (a real compare-and-swap,
-- not a separate read then a blind write). When that atomic UPDATE affects
-- zero rows, this is EITHER a genuine stale base_version (another op won) OR
-- a concurrent replay of the SAME operation_id racing the dedupe check above
-- (which is itself a plain, non-locking SELECT with the same TOCTOU shape) --
-- so before reporting a conflict, re-check `processed_operations` for this
-- operation_id and report `duplicate` if it is there now, never a spurious
-- `conflict` for a legitimate retry. The same recheck is added to the INSERT
-- path's unique_violation handler (a concurrent replay of a fresh-insert
-- operation_id would otherwise be misreported as `rejected`).
--
-- This is a full `create or replace function` (forward-only, ADR-0006 -- no
-- previously applied migration is rewritten). Unchanged, preserved exactly
-- from the 20260902090006 (S-8) version: `security invoker` (RLS still
-- applies), the pinned `search_path`, the ownership-column resolution
-- (`v_owncol`, stripping any client-supplied `user_id`/`owner_user_id`/`id`),
-- the entity/op whitelist, the F-2 structured-reject exception handling for
-- malformed payloads, the `processed_operations` idempotency bookkeeping
-- shape, and the exact `{applied|duplicate|conflict|rejected}` response
-- contract (same field names, same meaning). `trg_row_metadata` (the
-- `version`/`created_at`/`updated_at` trigger) is untouched by this
-- migration.

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
        when unique_violation then
          -- ISS-29: this may be a genuine id collision (reject), OR a concurrent
          -- replay of the SAME operation_id racing the dedupe check above (that
          -- SELECT is itself non-locking). Re-check before reporting rejected so
          -- a legitimate retry gets 'duplicate', not a spurious hard reject.
          select * into v_dup from processed_operations where operation_id = p_operation_id;
          if found then
            return jsonb_build_object('status','duplicate','version', v_dup.resulting_version);
          end if;
          return jsonb_build_object('status','rejected');
        when foreign_key_violation or check_violation
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
        -- ISS-29: the version guard is now part of the UPDATE itself (an atomic
        -- compare-and-swap), not a separate earlier SELECT + a blind-by-id UPDATE.
        execute format('update %1$I t set %2$s from jsonb_populate_record(null::%1$I, $1) r where t.id = $2 and t.version = $3 returning t.version',
                       v_table, v_set) into v_new_ver using v_payload, p_entity_id, p_base_version;
      exception
        when foreign_key_violation or check_violation or unique_violation
          or insufficient_privilege or not_null_violation then
          -- F-2: same structured reject for a malformed partial-payload update.
          return jsonb_build_object('status','rejected');
      end;
      if v_new_ver is null then
        -- the atomic UPDATE affected zero rows: lost the race. Re-check the
        -- dedupe table FIRST -- a concurrent caller with the SAME operation_id
        -- may have just won and already recorded 'applied'; that is a
        -- legitimate replay ('duplicate'), never a conflict against ourselves.
        select * into v_dup from processed_operations where operation_id = p_operation_id;
        if found then
          return jsonb_build_object('status','duplicate','version', v_dup.resulting_version);
        end if;
        execute format('select to_jsonb(t.*) from %I t where t.id = $1', v_table) into v_row using p_entity_id;
        v_current := (v_row->>'version')::integer;
        return jsonb_build_object('status','conflict','version', v_current, 'row', v_row);
      end if;
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
      -- ISS-29: same atomic compare-and-swap for the tombstone path (update/
      -- tombstone contention was explicitly in scope for this fix).
      execute format('update %I set deleted_at = now() where id = $1 and version = $2 returning version', v_table)
        into v_new_ver using p_entity_id, p_base_version;
      if v_new_ver is null then
        select * into v_dup from processed_operations where operation_id = p_operation_id;
        if found then
          return jsonb_build_object('status','duplicate','version', v_dup.resulting_version);
        end if;
        execute format('select to_jsonb(t.*) from %I t where t.id = $1', v_table) into v_row using p_entity_id;
        v_current := (v_row->>'version')::integer;
        return jsonb_build_object('status','conflict','version', v_current, 'row', v_row);
      end if;
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
-- explicitly so only an authenticated session can call the push RPC. Unchanged from S-8.
revoke all on function sync_apply(uuid, text, uuid, text, jsonb, integer) from public, anon;
grant execute on function sync_apply(uuid, text, uuid, text, jsonb, integer) to authenticated;
