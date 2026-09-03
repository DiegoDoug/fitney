-- supabase/tests/03_recompute_test.sql
-- Golden vectors for server recompute — MUST match the client TS domain/{calc,pr}
-- byte-for-byte (WORK-012, AR-RISK-2). SPEC §12.
--
-- Vectors (kept in sync with the client test fixture):
--   Back Squat, completed session, working sets:
--     100kg x 5   -> e1RM = 100 * (1 + 5/30)  = 116.6667
--     102.5kg x 8 -> e1RM = 102.5 * (1 + 8/30) = 129.8333   <-- best e1RM
--     110kg x 1   -> not e1RM-eligible (reps < 2); max_load = 110
--   volume(working) = 100*5 + 102.5*8 + 110*1 = 500 + 820 + 110 = 1430
--   rep_pr: {5:100, 8:102.5, 1:110}

begin;
select plan(8);

insert into auth.users (id, email) values ('d0000000-0000-4000-8000-00000000000d','d@example.test');
select set_config('request.jwt.claims', json_build_object('sub','d0000000-0000-4000-8000-00000000000d','role','authenticated')::text, true);
select set_config('role','authenticated', true);
insert into profiles (id, user_id) values ('d0000000-0000-4000-8000-00000000000d','d0000000-0000-4000-8000-00000000000d');

-- session + one exercise + three completed sets
insert into workout_sessions (id, user_id, name_snapshot, timezone, status, started_at, ended_at)
values ('d1000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-00000000000d','Lower A','UTC','completed',
        '2026-08-31T10:00:00Z','2026-08-31T11:00:00Z');
insert into session_exercises (id, user_id, session_id, exercise_id, exercise_name_snapshot, tracking_mode_snapshot, position)
values ('d2000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-00000000000d','d1000000-0000-4000-8000-000000000001',
        '11111111-0000-4000-8000-000000000001','Back Squat','weight_reps',0);
insert into performed_sets (id, user_id, session_exercise_id, position, set_type, load_kg, reps, completed, completed_at) values
  ('d3000000-0000-4000-8000-000000000003','d0000000-0000-4000-8000-00000000000d','d2000000-0000-4000-8000-000000000002',0,'working',100  ,5,true,'2026-08-31T10:10:00Z'),
  ('d3000000-0000-4000-8000-000000000004','d0000000-0000-4000-8000-00000000000d','d2000000-0000-4000-8000-000000000002',1,'working',102.5,8,true,'2026-08-31T10:20:00Z'),
  ('d3000000-0000-4000-8000-000000000005','d0000000-0000-4000-8000-00000000000d','d2000000-0000-4000-8000-000000000002',2,'working',110  ,1,true,'2026-08-31T10:30:00Z');

-- triggers should have fired on insert; force an explicit recompute too (idempotent)
select recompute_exercise_prs('d0000000-0000-4000-8000-00000000000d','11111111-0000-4000-8000-000000000001');
select recompute_session_volume_pr('d0000000-0000-4000-8000-00000000000d');
select recompute_week_aggregates('d0000000-0000-4000-8000-00000000000d', date '2026-08-31');

-- F-12: personal_records.value / weekly_aggregates.total_volume_kg are numeric; pgTAP is()
-- needs both sides the same type, so expected integers are cast ::numeric.
select is( (select value from personal_records
            where category='max_load' and exercise_id='11111111-0000-4000-8000-000000000001'),
           110::numeric, 'max_load = 110' );

select is( round((select value from personal_records
            where category='est_1rm' and exercise_id='11111111-0000-4000-8000-000000000001'),4),
           129.8333, 'est_1rm (Epley) = 129.8333' );

select is( (select formula_id from personal_records where category='est_1rm'
            and exercise_id='11111111-0000-4000-8000-000000000001'), 'epley', 'e1RM formula stamped' );

select is( (select value from personal_records
            where category='rep_pr' and rep_count=8 and exercise_id='11111111-0000-4000-8000-000000000001'),
           102.5, 'rep_pr @ 8 = 102.5' );
select is( (select value from personal_records
            where category='rep_pr' and rep_count=1 and exercise_id='11111111-0000-4000-8000-000000000001'),
           110::numeric, 'rep_pr @ 1 = 110' );

select is( (select value from personal_records where category='session_volume'),
           1430::numeric, 'session_volume PR = 1430' );

select is( (select total_volume_kg from weekly_aggregates where week_start_date = date_trunc('week', date '2026-08-31')::date),
           1430::numeric, 'weekly working volume = 1430' );

-- idempotency: recompute again, values unchanged
select recompute_exercise_prs('d0000000-0000-4000-8000-00000000000d','11111111-0000-4000-8000-000000000001');
select is( (select value from personal_records where category='max_load'
            and exercise_id='11111111-0000-4000-8000-000000000001'),
           110::numeric, 'recompute is idempotent' );

select * from finish();
rollback;
