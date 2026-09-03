-- supabase/tests/04_security_adversarial_test.sql
-- Weight — security-identity adversarial suite (phase 7).
-- Covers the 8 gates: child->parent ownership, sync_apply, seed visibility,
-- derived-table writes, cross-account parent references, processed_operations,
-- anon, and role/claim tampering. Run with `supabase test db` (needs DEP-1).

begin;
select plan(24);   -- F-6 (suite 04): 23 assertions were mis-planned as 24; the F-4-pattern fix below restores the count to 24

insert into auth.users (id, email) values
  ('aa000000-0000-4000-8000-0000000000aa','att@example.test'),
  ('bb000000-0000-4000-8000-0000000000bb','vic@example.test');

create or replace function _as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role','authenticated')::text, true);
  perform set_config('role','authenticated', true);
end; $$;
create or replace function _as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  perform set_config('role','anon', true);
end; $$;
create or replace function _as_service() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role','service_role')::text, true);
  perform set_config('role','service_role', true);
end; $$;

-- ---- victim (B) builds a full object graph ----
select _as('bb000000-0000-4000-8000-0000000000bb');
insert into profiles (id, user_id, display_name) values ('bb000000-0000-4000-8000-0000000000bb','bb000000-0000-4000-8000-0000000000bb','B');
insert into workout_sessions (id, user_id, name_snapshot, timezone, status)
  values ('b1000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-0000000000bb','B session','UTC','active');
insert into session_exercises (id, user_id, session_id, exercise_name_snapshot, tracking_mode_snapshot, position)
  values ('b2000000-0000-4000-8000-000000000002','bb000000-0000-4000-8000-0000000000bb','b1000000-0000-4000-8000-000000000001','Squat','weight_reps',0);
insert into workout_templates (id, user_id, name) values ('b3000000-0000-4000-8000-000000000003','bb000000-0000-4000-8000-0000000000bb','B tpl');

-- ---- attacker (A) ----
select _as('aa000000-0000-4000-8000-0000000000aa');
insert into profiles (id, user_id, display_name) values ('aa000000-0000-4000-8000-0000000000aa','aa000000-0000-4000-8000-0000000000aa','A');

-- GATE 5 / IDOR: A cannot read any of B's rows
select is( (select count(*) from workout_sessions)::int, 0, 'A sees 0 B sessions' );
select is( (select count(*) from session_exercises)::int, 0, 'A sees 0 B session_exercises' );
select is( (select count(*) from workout_templates)::int, 0, 'A sees 0 B templates' );

-- GATE 2 (composite FK): A inserts a child pointing at B's parent, user_id = A  -> FK (b1..,aa..) absent
select throws_ok(
  $$ insert into session_exercises (id, user_id, session_id, exercise_name_snapshot, tracking_mode_snapshot, position)
     values ('a4000000-0000-4000-8000-000000000004','aa000000-0000-4000-8000-0000000000aa',
             'b1000000-0000-4000-8000-000000000001','x','weight_reps',0) $$,
  '23503', null, 'A child -> B parent (own user_id) rejected by composite FK' );

-- GATE 2: A inserts a child with user_id = B (forging ownership) -> RLS WITH CHECK
select throws_ok(
  $$ insert into session_exercises (id, user_id, session_id, exercise_name_snapshot, tracking_mode_snapshot, position)
     values ('a5000000-0000-4000-8000-000000000005','bb000000-0000-4000-8000-0000000000bb',
             'b1000000-0000-4000-8000-000000000001','x','weight_reps',0) $$,
  '42501', null, 'A child with forged user_id = B rejected by RLS' );

-- GATE 2 via sync_apply: cross-account parent reference is normalised to a generic reject (no oracle)
select is(
  (select sync_apply('a6000000-0000-4000-8000-000000000006'::uuid,'session_exercise',
     'a7000000-0000-4000-8000-000000000007'::uuid,'upsert',
     jsonb_build_object('session_id','b1000000-0000-4000-8000-000000000001','exercise_name_snapshot','x','tracking_mode_snapshot','weight_reps','position',0),
     0) ->> 'status'),
  'rejected', 'sync_apply cross-account parent ref -> generic rejected (no FK/existence leak)' );

-- sync_apply cannot be tricked into writing A's row as B (ownership col forced to caller).
-- F-2: full-row payload; the forged user_id is still present so the stripping is exercised.
select is(
  (select sync_apply('a8000000-0000-4000-8000-000000000008'::uuid,'workout_template',
     'a9000000-0000-4000-8000-000000000009'::uuid,'upsert',
     '{"name":"mine","user_id":"bb000000-0000-4000-8000-0000000000bb","description":null,"tags":[],"archived":false,"content_version":1,"deleted_at":null}'::jsonb, 0) ->> 'status'),
  'applied', 'sync_apply strips client user_id...' );
select is( (select user_id from workout_templates where id='a9000000-0000-4000-8000-000000000009'),
           'aa000000-0000-4000-8000-0000000000aa', '...row is owned by the caller, not the forged user_id' );

-- B's data still intact
select _as('bb000000-0000-4000-8000-0000000000bb');
select is( (select name_snapshot from workout_sessions where id='b1000000-0000-4000-8000-000000000001'),
           'B session', 'B session unchanged' );
select is( (select count(*) from session_exercises where session_id='b1000000-0000-4000-8000-000000000001')::int, 1,
           'B session_exercises unchanged' );

-- GATE 4: seed / global exercise model
select _as('aa000000-0000-4000-8000-0000000000aa');
select throws_ok( $$ insert into exercises (id, owner_user_id, name) values (gen_random_uuid(), null, 'forged global') $$,
  '42501', null, 'client cannot create a global (owner NULL) exercise' );
insert into exercises (id, owner_user_id, name) values ('aae00000-0000-4000-8000-0000000000e1','aa000000-0000-4000-8000-0000000000aa','A private');
select throws_ok( $$ update exercises set owner_user_id = null where id='aae00000-0000-4000-8000-0000000000e1' $$,
  '42501', null, 'client cannot re-parent a private exercise to global' );
select throws_ok( $$ update exercises set owner_user_id='bb000000-0000-4000-8000-0000000000bb' where id='aae00000-0000-4000-8000-0000000000e1' $$,
  '42501', null, 'client cannot hand a private exercise to another user' );
select _as_service();
insert into exercises (id, owner_user_id, name) values ('99e00000-0000-4000-8000-0000000000e9', null, 'legit seed');
select ok(true, 'service_role can seed a global exercise');
select _as('bb000000-0000-4000-8000-0000000000bb');
select ok( (select count(*) from exercises where id='99e00000-0000-4000-8000-0000000000e9') = 1, 'B can read the global seed' );

-- GATE 5: derived tables — read-only, owner-scoped
select _as('aa000000-0000-4000-8000-0000000000aa');
select throws_ok(
  $$ insert into personal_records (id,user_id,category,value,unit,achieved_at)
     values (gen_random_uuid(),'aa000000-0000-4000-8000-0000000000aa','max_load',999,'kg',now()) $$,
  '42501', null, 'client cannot write personal_records (grant revoked)' );

-- processed_operations: owner-scoped, append-only
select _as('bb000000-0000-4000-8000-0000000000bb');
insert into processed_operations (operation_id,user_id,entity,entity_id,op,result,resulting_version)
values ('b0e00000-0000-4000-8000-0000000000e0','bb000000-0000-4000-8000-0000000000bb','x','b3000000-0000-4000-8000-000000000003','upsert','applied',1);
select _as('aa000000-0000-4000-8000-0000000000aa');
-- A has its own processed_operations rows (from the successful sync_apply above); assert only
-- that B's row is invisible to A (RLS is owner-scoped).
select is( (select count(*) from processed_operations
            where operation_id='b0e00000-0000-4000-8000-0000000000e0')::int, 0,
           'A cannot see B''s processed_operations row' );
-- F-4 pattern: processed_operations has no UPDATE policy -> A's UPDATE matches 0 rows, NO exception.
with u as ( update processed_operations set result='tampered' returning 1 )
select is( (select count(*) from u)::int, 0, 'A update of processed_operations affects 0 rows' );
select _as('bb000000-0000-4000-8000-0000000000bb');
select is( (select result from processed_operations where operation_id='b0e00000-0000-4000-8000-0000000000e0'),
           'applied', 'B processed_operations row unchanged after A attempt' );
select _as('aa000000-0000-4000-8000-0000000000aa');

-- GATE: anon
select _as_anon();
select is( (select count(*) from workout_sessions)::int, 0, 'anon sees no sessions' );
-- ISS-27 (human decision 2026-09-03): the exercise catalogue is authenticated-only.
-- `exercise_select` is now `TO authenticated`, so an anon session sees NO exercises at all
-- (neither private nor the global seed catalogue).
select is( (select count(*) from exercises)::int, 0,
           'anon sees no exercises at all (catalogue is authenticated-only, ISS-27)' );
select throws_ok( $$ select sync_apply(gen_random_uuid(),'workout_template',gen_random_uuid(),'upsert','{}'::jsonb,0) $$,
  null, null, 'anon cannot call sync_apply' );

-- claim tampering: a JWT with no `sub`
select set_config('request.jwt.claims', json_build_object('role','authenticated')::text, true);
select set_config('role','authenticated', true);
select is( (select count(*) from workout_templates)::int, 0, 'authenticated with null sub sees nothing (auth.uid() is null)' );

-- deletion_receipts: not visible to any client role
select _as('aa000000-0000-4000-8000-0000000000aa');
select throws_ok( $$ select count(*) from deletion_receipts $$, '42501', null, 'deletion_receipts not readable by authenticated' );

select * from finish();
rollback;
