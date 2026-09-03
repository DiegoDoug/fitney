-- supabase/tests/02_sync_apply_test.sql
-- sync_apply() optimistic concurrency + operation_id dedupe + tombstones
-- (AR-DEC-03, architecture §8.4, §10.2). Part of the WORK-013 conformance suite.

begin;
select plan(17);   -- F-6 (suite 02): 15 assertions were mis-planned as 14; + 2 for the F-2 partial-payload negative test = 17

-- F-2: a valid upsert carries the COALESCED LATEST FULL-ROW state (architecture §8.4/§10.2).
-- Column defaults are NOT silently merged into a sync payload; the happy-path cases below
-- therefore send complete workout_templates rows. A partial payload is rejected (bottom of file).

insert into auth.users (id, email) values ('c0000000-0000-4000-8000-00000000000c','c@example.test');
select set_config('request.jwt.claims', json_build_object('sub','c0000000-0000-4000-8000-00000000000c','role','authenticated')::text, true);
select set_config('role','authenticated', true);
insert into profiles (id, user_id, display_name) values
  ('c0000000-0000-4000-8000-00000000000c','c0000000-0000-4000-8000-00000000000c','C');

-- INSERT via sync_apply -> version 1
select is(
  (select sync_apply('0a000000-0000-4000-8000-000000000001'::uuid,'workout_template',
     'f1000000-0000-4000-8000-000000000001'::uuid,'upsert',
     '{"name":"T1","description":null,"tags":[],"archived":false,"content_version":1,"deleted_at":null}'::jsonb, 0) ->> 'status'),
  'applied', 'full-row insert -> applied');
select is(
  (select version from workout_templates where id='f1000000-0000-4000-8000-000000000001'),
  1, 'inserted row is version 1');

-- Replay of the SAME operation_id -> duplicate, same version (exactly-once)
select is(
  (select sync_apply('0a000000-0000-4000-8000-000000000001'::uuid,'workout_template',
     'f1000000-0000-4000-8000-000000000001'::uuid,'upsert',
     '{"name":"T1","description":null,"tags":[],"archived":false,"content_version":1,"deleted_at":null}'::jsonb, 0) ->> 'status'),
  'duplicate', 'same operation_id -> duplicate');
select is(
  (select count(*) from workout_templates where id='f1000000-0000-4000-8000-000000000001')::int,
  1, 'no second row created on replay');

-- UPDATE with correct base_version -> applied, version bumps to 2
select is(
  (select sync_apply('0a000000-0000-4000-8000-000000000002'::uuid,'workout_template',
     'f1000000-0000-4000-8000-000000000001'::uuid,'upsert',
     '{"name":"T1 edited","description":null,"tags":[],"archived":false,"content_version":1,"deleted_at":null}'::jsonb, 1) ->> 'status'),
  'applied', 'full-row update with base_version=1 -> applied');
select is( (select version from workout_templates where id='f1000000-0000-4000-8000-000000000001'), 2, 'version bumped to 2');
select is( (select name    from workout_templates where id='f1000000-0000-4000-8000-000000000001'), 'T1 edited', 'name updated');

-- UPDATE with STALE base_version -> conflict, NOT applied, no version change
select is(
  (select sync_apply('0a000000-0000-4000-8000-000000000003'::uuid,'workout_template',
     'f1000000-0000-4000-8000-000000000001'::uuid,'upsert',
     '{"name":"stale write","description":null,"tags":[],"archived":false,"content_version":1,"deleted_at":null}'::jsonb, 1) ->> 'status'),
  'conflict', 'stale base_version -> conflict');
select is( (select version from workout_templates where id='f1000000-0000-4000-8000-000000000001'), 2, 'version unchanged after conflict');
select is( (select name    from workout_templates where id='f1000000-0000-4000-8000-000000000001'), 'T1 edited', 'row not overwritten by stale write');

-- conflict is NOT recorded -> a retry re-evaluates (still conflict here)
select is(
  (select sync_apply('0a000000-0000-4000-8000-000000000003'::uuid,'workout_template',
     'f1000000-0000-4000-8000-000000000001'::uuid,'upsert',
     '{"name":"stale write","description":null,"tags":[],"archived":false,"content_version":1,"deleted_at":null}'::jsonb, 1) ->> 'status'),
  'conflict', 'retry of a conflicted operation_id re-evaluates (not deduped)');

-- DELETE (tombstone) with correct base_version -> applied, deleted_at set, version bumps
select is(
  (select sync_apply('0a000000-0000-4000-8000-000000000004'::uuid,'workout_template',
     'f1000000-0000-4000-8000-000000000001'::uuid,'delete', '{}'::jsonb, 2) ->> 'status'),
  'applied', 'delete with base_version=2 -> applied');
select isnt( (select deleted_at from workout_templates where id='f1000000-0000-4000-8000-000000000001'), null, 'row tombstoned');
select is(   (select version    from workout_templates where id='f1000000-0000-4000-8000-000000000001'), 3, 'version bumped on tombstone');

-- unknown entity -> error
select throws_ok(
  $$ select sync_apply('0a000000-0000-4000-8000-000000000009'::uuid,'not_a_table',
       gen_random_uuid(),'upsert','{}'::jsonb,0) $$,
  '22023', null, 'unknown entity rejected');

-- F-2 (negative): a partial payload missing a required NOT NULL field is REJECTED with a
-- structured result, never a leaked raw exception, and creates no row.
select is(
  (select sync_apply('0a000000-0000-4000-8000-00000000000a'::uuid,'workout_template',
     'f2000000-0000-4000-8000-000000000002'::uuid,'upsert',
     '{"name":"missing required fields"}'::jsonb, 0) ->> 'status'),
  'rejected', 'partial payload (missing tags/content_version) -> rejected, no raw exception');
select is(
  (select count(*) from workout_templates where id='f2000000-0000-4000-8000-000000000002')::int,
  0, 'rejected partial-payload upsert created no row');

select * from finish();
rollback;
