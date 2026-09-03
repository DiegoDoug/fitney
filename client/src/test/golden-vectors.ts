/**
 * WORK-020 / WORK-012 shared golden vectors. Mirrors
 * supabase/tests/03_recompute_test.sql exactly. The cross-run
 * (recompute.golden.test.ts) asserts the client TS `domain/{calc,pr}` produces
 * these same numbers, formula id/version, rounding, week bucketing, and is
 * idempotent — the hard acceptance condition for Phase 5 (DEC-52).
 *
 *   Back Squat, one completed session (UTC), working sets:
 *     100kg x 5   -> e1RM 116.6667
 *     102.5kg x 8 -> e1RM 129.8333   (best e1RM)
 *     110kg x 1   -> not e1RM-eligible; max_load 110
 *   session working volume = 100*5 + 102.5*8 + 110*1 = 1430
 *   rep_pr: {1:110, 5:100, 8:102.5}
 */
import type { SetFact } from '@/domain/pr';

export const GV_USER = 'd0000000-0000-4000-8000-00000000000d';
export const GV_EXERCISE = '11111111-0000-4000-8000-000000000001';
export const GV_SESSION = 'd1000000-0000-4000-8000-000000000001';
export const GV_SE = 'd2000000-0000-4000-8000-000000000002';

const startedMs = Date.parse('2026-08-31T10:00:00Z');
const endedMs = Date.parse('2026-08-31T11:00:00Z');

export const GOLDEN_FACTS: SetFact[] = [
  {
    performed_set_id: 'd3000000-0000-4000-8000-000000000003',
    session_id: GV_SESSION,
    session_started_at_ms: startedMs,
    session_ended_at_ms: endedMs,
    session_timezone: 'UTC',
    session_exercise_id: GV_SE,
    exercise_id: GV_EXERCISE,
    tracking_mode: 'weight_reps',
    position: 0,
    set_type: 'working',
    load_kg: 100,
    reps: 5,
    completed_at_ms: Date.parse('2026-08-31T10:10:00Z'),
  },
  {
    performed_set_id: 'd3000000-0000-4000-8000-000000000004',
    session_id: GV_SESSION,
    session_started_at_ms: startedMs,
    session_ended_at_ms: endedMs,
    session_timezone: 'UTC',
    session_exercise_id: GV_SE,
    exercise_id: GV_EXERCISE,
    tracking_mode: 'weight_reps',
    position: 1,
    set_type: 'working',
    load_kg: 102.5,
    reps: 8,
    completed_at_ms: Date.parse('2026-08-31T10:20:00Z'),
  },
  {
    performed_set_id: 'd3000000-0000-4000-8000-000000000005',
    session_id: GV_SESSION,
    session_started_at_ms: startedMs,
    session_ended_at_ms: endedMs,
    session_timezone: 'UTC',
    session_exercise_id: GV_SE,
    exercise_id: GV_EXERCISE,
    tracking_mode: 'weight_reps',
    position: 2,
    set_type: 'working',
    load_kg: 110,
    reps: 1,
    completed_at_ms: Date.parse('2026-08-31T10:30:00Z'),
  },
];

export const GOLDEN_EXPECT = {
  maxLoad: 110,
  e1rm: 129.8333,
  e1rmSecond: 116.6667,
  e1rmFormulaId: 'epley',
  e1rmFormulaVersion: 1,
  repPr: { 1: 110, 5: 100, 8: 102.5 } as Record<number, number>,
  sessionVolume: 1430,
  weeklyWorkingVolume: 1430,
  /** week_start = 1 (Monday); 2026-08-31 is a Monday -> bucket is itself */
  weekBucket: '2026-08-31',
};
