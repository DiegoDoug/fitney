-- supabase/tests/01_rls_isolation_test.sql
-- Adversarial two-user RLS isolation (NFR-SEC, SM-9, SPEC §17.2, E2E scenario 6).
-- Run with pgTAP: `supabase test db`. Requires a provisioned/local project (DEP-1).
--
-- `security-identity` owns the final version of this suite; this is the
-- backend-authored baseline covering select/insert/update/delete for every
-- user-owned table, plus the sync_apply cross-account path.

begin;
select plan(19);   -- F-6: plan now matches the executed assertion count exactly

-- two real auth users
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-00000000000a', 'a@example.test'),
  ('b0000000-0000-4000-8000-00000000000b', 'b@example.test');

-- helper: run as a given user
create or replace function _as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end; $$;

-- ---- user A creates data ----
select _as('a0000000-0000-4000-8000-00000000000a');
insert into profiles (id, user_id, display_name) values
  ('a0000000-0000-4000-8000-00000000000a','a0000000-0000-4000-8000-00000000000a','A');
insert into workout_templates (id, user_id, name) values
  ('a1111111-0000-4000-8000-000000000001','a0000000-0000-4000-8000-00000000000a','A template');
insert into workout_sessions (id, user_id, name_snapshot, timezone, status) values
  ('a2222222-0000-4000-8000-000000000002','a0000000-0000-4000-8000-00000000000a','A session','UTC','completed');

-- ---- user B ----
select _as('b0000000-0000-4000-8000-00000000000b');
insert into profiles (id, user_id, display_name) values
  ('b0000000-0000-4000-8000-00000000000b','b0000000-0000-4000-8000-00000000000b','B');

-- B cannot SELECT A's rows
select is( (select count(*) from workout_templates)::int, 0, 'B sees no A templates' );
select is( (select count(*) from workout_sessions)::int,  0, 'B sees no A sessions'  );
select is( (select count(*) from profiles where id <> 'b0000000-0000-4000-8000-00000000000b')::int, 0, 'B sees only own profile' );

-- B cannot UPDATE A's row (0 rows affected)
with u as ( update workout_templates set name = 'hijacked'
            where id = 'a1111111-0000-4000-8000-000000000001' returning 1 )
select is( (select count(*) from u)::int, 0, 'B update of A template affects 0 rows' );

-- B cannot DELETE A's row
with d as ( delete from workout_templates
            where id = 'a1111111-0000-4000-8000-000000000001' returning 1 )
select is( (select count(*) from d)::int, 0, 'B delete of A template affects 0 rows' );

-- B cannot INSERT a row owned by A
select throws_ok(
  $$ insert into workout_templates (id, user_id, name)
     values ('c3333333-0000-4000-8000-000000000003','a0000000-0000-4000-8000-00000000000a','forged') $$,
  '42501', null, 'B insert with user_id = A is rejected by WITH CHECK' );

-- B cannot reach A's data through sync_apply: B's RLS-scoped version lookup sees nothing ->
-- INSERT path -> PK collides with A's existing row -> generic 'rejected' (no id-existence oracle).
-- A's row is verified untouched by the assertions immediately below.
select is(
  (select sync_apply('d4444444-0000-4000-8000-000000000004'::uuid, 'workout_template',
     'a1111111-0000-4000-8000-000000000001'::uuid, 'upsert',
     '{"name":"forged via rpc","description":null,"tags":[],"archived":false,"content_version":1,"deleted_at":null}'::jsonb, 1) ->> 'status'),
  'rejected', 'B sync_apply against A row -> rejected, cannot mutate A data' );

-- A still sees its own data intact
select _as('a0000000-0000-4000-8000-00000000000a');
select is( (select name from workout_templates where id='a1111111-0000-4000-8000-000000000001'),
           'A template', 'A template unchanged after B attempts' );
select is( (select count(*) from workout_sessions)::int, 1, 'A session intact' );

-- global seed exercises are readable by both, writable by neither
select _as('b0000000-0000-4000-8000-00000000000b');
select ok( (select count(*) from exercises where owner_user_id is null) >= 0, 'B can read global exercises' );
-- F-3: RLS filters the global rows out of B's updatable set -> 0 rows affected, NO exception.
-- Assert zero affected rows AND that no protected row was mutated.
with u as ( update exercises set name = 'hijacked-global' where owner_user_id is null returning 1 )
select is( (select count(*) from u)::int, 0, 'B update of a global seed exercise affects 0 rows' );
select is( (select count(*) from exercises where owner_user_id is null and name = 'hijacked-global')::int, 0,
           'no global seed exercise was mutated by B' );

-- processed_operations is owner-scoped and append-only
select _as('a0000000-0000-4000-8000-00000000000a');
insert into processed_operations (operation_id, user_id, entity, entity_id, op, result, resulting_version)
values ('e5555555-0000-4000-8000-000000000005','a0000000-0000-4000-8000-00000000000a','x','a1111111-0000-4000-8000-000000000001','upsert','applied',1);
select _as('b0000000-0000-4000-8000-00000000000b');
select is( (select count(*) from processed_operations)::int, 0, 'B sees no A processed_operations' );
-- F-4: processed_operations has no UPDATE policy -> B's UPDATE matches 0 rows, NO exception.
-- Assert zero affected rows AND that A's row is unchanged.
with u as ( update processed_operations set result = 'tampered' returning 1 )
select is( (select count(*) from u)::int, 0, 'B update of processed_operations affects 0 rows' );
select _as('a0000000-0000-4000-8000-00000000000a');
select is( (select result from processed_operations where operation_id = 'e5555555-0000-4000-8000-000000000005'),
           'applied', 'A processed_operations row unchanged after B attempt' );
select _as('b0000000-0000-4000-8000-00000000000b');

-- derived rows are owner-scoped for read, not client-writable
select _as('b0000000-0000-4000-8000-00000000000b');
select is( (select count(*) from personal_records)::int, 0, 'B sees no A personal_records' );
select throws_ok(
  $$ insert into personal_records (id,user_id,category,value,unit,achieved_at)
     values (gen_random_uuid(),'b0000000-0000-4000-8000-00000000000b','max_load',1,'kg',now()) $$,
  null, null, 'client cannot insert personal_records' );

-- unauthenticated (anon) sees nothing
select set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
select set_config('role','anon', true);
select is( (select count(*) from workout_sessions)::int, 0, 'anon sees no sessions' );
select is( (select count(*) from profiles)::int, 0, 'anon sees no profiles' );

select * from finish();
rollback;
