-- 20260902090004_sync_apply.sql
-- Weight — sync_apply(): the single server entry point for outbox push
-- (AR-DEC-03, architecture §8.4, §10.2). SECURITY INVOKER so RLS still applies:
-- a caller can only see / write their own rows, so the version check runs against
-- the caller's row and cross-account writes are impossible.
--
-- Contract:
--   sync_apply(operation_id uuid, entity text, entity_id uuid, op text,
--              payload jsonb, base_version int) -> jsonb
--     { "status": "applied"   , "version": <int> }
--     { "status": "duplicate" , "version": <int> }        -- operation_id already applied
--     { "status": "conflict"  , "version": <int>, "row": <jsonb> }  -- base_version stale
--
-- Notes:
--  * Only 'applied'/'duplicate' are written to processed_operations. A 'conflict'
--    is NOT recorded, so a retry re-evaluates against the current server version.
--  * Server-managed columns (id, user_id, version, created_at, updated_at) are
--    stripped from the payload and re-set here / by the set_row_metadata trigger.
--  * The client always sends the COALESCED LATEST full row state, so NOT NULL
--    columns are always present on an upsert.
--  * Per-type coercion relies on jsonb_populate_record(null::<table>, payload).

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
set search_path = public
as $$
declare
  v_table      text;
  v_current    integer;
  v_dup        processed_operations%rowtype;
  v_payload    jsonb;
  v_set        text;
  v_new_ver    integer;
  v_row        jsonb;
begin
  -- 1. entity whitelist -> table
  v_table := case p_entity
    when 'profile'                then 'profiles'
    when 'exercise'               then 'exercises'
    when 'superset_template'      then 'superset_templates'
    when 'superset_template_item' then 'superset_template_items'
    when 'workout_template'       then 'workout_templates'
    when 'workout_template_item'  then 'workout_template_items'
    when 'set_prescription'       then 'set_prescriptions'
    when 'week_template'          then 'week_templates'
    when 'week_template_day'      then 'week_template_days'
    when 'plan_week'              then 'plan_weeks'
    when 'planned_workout'        then 'planned_workouts'
    when 'planned_workout_item'   then 'planned_workout_items'
    when 'workout_session'        then 'workout_sessions'
    when 'session_exercise'       then 'session_exercises'
    when 'performed_set'          then 'performed_sets'
    else null
  end;
  if v_table is null then
    raise exception 'sync_apply: unknown entity %', p_entity using errcode = '22023';
  end if;
  if p_op not in ('upsert','delete') then
    raise exception 'sync_apply: unknown op %', p_op using errcode = '22023';
  end if;

  -- 2. dedupe (exactly-once across lost acks / process death)
  select * into v_dup from processed_operations where operation_id = p_operation_id;
  if found then
    return jsonb_build_object('status', v_dup.result, 'version', v_dup.resulting_version);
  end if;

  -- 3. current version of the caller's row (RLS-scoped)
  execute format('select version from %I where id = $1', v_table)
    into v_current using p_entity_id;

  -- 4a. UPSERT
  if p_op = 'upsert' then
    v_payload := (p_payload - 'version' - 'created_at' - 'updated_at')
                 || jsonb_build_object('id', p_entity_id, 'user_id', auth.uid());

    if v_current is null then
      -- INSERT
      execute format(
        'insert into %1$I select r.* from jsonb_populate_record(null::%1$I, $1) r returning version',
        v_table)
      into v_new_ver using v_payload;

    elsif v_current = p_base_version then
      -- UPDATE (trigger bumps version to v_current + 1)
      select string_agg(format('%1$I = r.%1$I', column_name), ', ')
        into v_set
        from information_schema.columns
       where table_schema = 'public' and table_name = v_table
         and column_name not in ('id','user_id','version','created_at','updated_at');
      execute format(
        'update %1$I t set %2$s from jsonb_populate_record(null::%1$I, $1) r where t.id = $2 returning t.version',
        v_table, v_set)
      into v_new_ver using v_payload, p_entity_id;

    else
      -- CONFLICT
      execute format('select to_jsonb(t.*) from %I t where t.id = $1', v_table)
        into v_row using p_entity_id;
      return jsonb_build_object('status','conflict','version', v_current, 'row', v_row);
    end if;

  -- 4b. DELETE (tombstone)
  else
    if v_current is null then
      -- already absent -> idempotent success
      insert into processed_operations(operation_id, user_id, entity, entity_id, op, result, resulting_version)
      values (p_operation_id, auth.uid(), p_entity, p_entity_id, p_op, 'applied', null);
      return jsonb_build_object('status','applied','version', null);
    elsif v_current = p_base_version then
      execute format('update %I set deleted_at = now() where id = $1', v_table) using p_entity_id;
      v_new_ver := v_current + 1;
    else
      execute format('select to_jsonb(t.*) from %I t where t.id = $1', v_table)
        into v_row using p_entity_id;
      return jsonb_build_object('status','conflict','version', v_current, 'row', v_row);
    end if;
  end if;

  -- 5. record success + return
  insert into processed_operations(operation_id, user_id, entity, entity_id, op, result, resulting_version)
  values (p_operation_id, auth.uid(), p_entity, p_entity_id, p_op, 'applied', v_new_ver);

  return jsonb_build_object('status','applied','version', v_new_ver);
end;
$$;

revoke all on function sync_apply(uuid, text, uuid, text, jsonb, integer) from public;
grant execute on function sync_apply(uuid, text, uuid, text, jsonb, integer) to authenticated;
