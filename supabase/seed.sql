-- supabase/seed.sql
-- Weight — seed data for local development only.
--
-- The MVP-real seeded exercise catalogue and its content licence are UNRESOLVED
-- (roadmap OQ-4 / DEP-3, owner: Human). The rows below are a tiny PLACEHOLDER set
-- of obviously-generic movements, owner_user_id = NULL (global). Do NOT ship this
-- list; replace it with the licensed catalogue before beta (LIB-03).
--
-- ids are fixed so local tests are deterministic.

insert into exercises (id, owner_user_id, name, primary_muscles, equipment, tracking_mode) values
  ('11111111-0000-4000-8000-000000000001', null, 'Back Squat',        array['quadriceps','glutes'], 'barbell', 'weight_reps'),
  ('11111111-0000-4000-8000-000000000002', null, 'Bench Press',       array['chest','triceps'],     'barbell', 'weight_reps'),
  ('11111111-0000-4000-8000-000000000003', null, 'Deadlift',          array['hamstrings','back'],   'barbell', 'weight_reps'),
  ('11111111-0000-4000-8000-000000000004', null, 'Overhead Press',    array['shoulders','triceps'], 'barbell', 'weight_reps'),
  ('11111111-0000-4000-8000-000000000005', null, 'Barbell Row',       array['back','biceps'],       'barbell', 'weight_reps'),
  ('11111111-0000-4000-8000-000000000006', null, 'Pull-Up',           array['back','biceps'],       'bodyweight', 'reps'),
  ('11111111-0000-4000-8000-000000000007', null, 'Plank',             array['core'],                'bodyweight', 'duration'),
  ('11111111-0000-4000-8000-000000000008', null, 'Farmer Carry',      array['grip','core'],         'dumbbell', 'distance')
on conflict (id) do nothing;
