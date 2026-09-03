/**
 * WORK-020 — client TS <-> server SQL recompute golden-vector cross-run.
 * The client `domain/{calc,pr}` MUST produce the same numbers as
 * supabase/tests/03_recompute_test.sql: weekly volume, e1RM, max-load PR,
 * rep PR, week_start 0..6 boundaries, formula id/version, rounding, idempotency.
 * DEC-52: this must pass before Phase 5 approval.
 */
import { epleyE1rmKg, sessionVolumeKg, E1RM_FORMULA_ID, E1RM_FORMULA_VERSION } from '@/domain/calc';
import { recomputeAll, bestMaxLoad, bestE1rm } from '@/domain/pr';
import { weekStartFor } from '@/domain/week';
import { GOLDEN_FACTS, GOLDEN_EXPECT, GV_USER } from '@/test/golden-vectors';

const NOW = Date.parse('2026-09-03T00:00:00Z');
const WEEK_START_MON = 1;

describe('WORK-020 recompute golden vectors', () => {
  it('e1RM (Epley) matches the SQL vectors and rounding (4dp)', () => {
    expect(epleyE1rmKg(102.5, 8)).toBe(GOLDEN_EXPECT.e1rm); // 129.8333
    expect(epleyE1rmKg(100, 5)).toBe(GOLDEN_EXPECT.e1rmSecond); // 116.6667
    expect(epleyE1rmKg(110, 1)).toBeNull(); // reps < 2 -> ineligible
    expect(epleyE1rmKg(110, 11)).toBeNull(); // reps > 10 -> ineligible
  });

  it('session working volume = 1430 (matches SQL round(sum,4))', () => {
    const countable = GOLDEN_FACTS.map((f) => ({
      set_type: f.set_type,
      load_kg: f.load_kg,
      reps: f.reps,
      completed: true, // golden facts are already completed sets
    }));
    expect(sessionVolumeKg(countable)).toBe(GOLDEN_EXPECT.sessionVolume);
  });

  it('max_load PR = 110 with the right source set', () => {
    const pr = bestMaxLoad(GOLDEN_FACTS);
    expect(pr?.value).toBe(GOLDEN_EXPECT.maxLoad);
    expect(pr?.category).toBe('max_load');
    expect(pr?.source_performed_set_id).toBe('d3000000-0000-4000-8000-000000000005');
  });

  it('est_1rm PR = 129.8333 with formula id/version stamped', () => {
    const pr = bestE1rm(GOLDEN_FACTS);
    expect(pr?.value).toBe(GOLDEN_EXPECT.e1rm);
    expect(pr?.formula_id).toBe(E1RM_FORMULA_ID);
    expect(pr?.formula_version).toBe(E1RM_FORMULA_VERSION);
    expect(GOLDEN_EXPECT.e1rmFormulaId).toBe(E1RM_FORMULA_ID);
    expect(GOLDEN_EXPECT.e1rmFormulaVersion).toBe(E1RM_FORMULA_VERSION);
  });

  it('rep_pr = {1:110, 5:100, 8:102.5}', () => {
    const { personalRecords } = recomputeAll(GV_USER, GOLDEN_FACTS, WEEK_START_MON, NOW);
    const repPrs = personalRecords.filter((p) => p.category === 'rep_pr');
    const map = Object.fromEntries(repPrs.map((p) => [p.rep_count, p.value]));
    expect(map).toEqual(GOLDEN_EXPECT.repPr);
  });

  it('session_volume PR = 1430', () => {
    const { personalRecords } = recomputeAll(GV_USER, GOLDEN_FACTS, WEEK_START_MON, NOW);
    const sv = personalRecords.find((p) => p.category === 'session_volume');
    expect(sv?.value).toBe(GOLDEN_EXPECT.sessionVolume);
    expect(sv?.exercise_id).toBeNull();
  });

  it('weekly working volume = 1430 in the Monday bucket 2026-08-31', () => {
    const { weeklyAggregates } = recomputeAll(GV_USER, GOLDEN_FACTS, WEEK_START_MON, NOW);
    expect(weeklyAggregates).toHaveLength(1);
    expect(weeklyAggregates[0]!.week_start_date).toBe(GOLDEN_EXPECT.weekBucket);
    expect(weeklyAggregates[0]!.total_volume_kg).toBe(GOLDEN_EXPECT.weeklyWorkingVolume);
    expect(weeklyAggregates[0]!.working_sets).toBe(3);
    expect(weeklyAggregates[0]!.completed_workouts).toBe(1);
  });

  it('exercise weekly rollup best_e1rm = 129.8333', () => {
    const { exerciseWeeklyRollups } = recomputeAll(GV_USER, GOLDEN_FACTS, WEEK_START_MON, NOW);
    expect(exerciseWeeklyRollups).toHaveLength(1);
    expect(exerciseWeeklyRollups[0]!.best_e1rm_kg).toBe(GOLDEN_EXPECT.e1rm);
    expect(exerciseWeeklyRollups[0]!.total_volume_kg).toBe(1430);
  });

  it('is idempotent — a second recompute yields byte-identical rows', () => {
    const a = recomputeAll(GV_USER, GOLDEN_FACTS, WEEK_START_MON, NOW);
    const b = recomputeAll(GV_USER, GOLDEN_FACTS, WEEK_START_MON, NOW);
    expect(JSON.stringify(b)).toBe(JSON.stringify(a));
  });

  it('week_start 0..6 all bucket 2026-08-31 (Monday) correctly', () => {
    // Monday=1. dow(2026-08-31)=1.
    expect(weekStartFor('2026-08-31', 0)).toBe('2026-08-30'); // Sun start -> prev Sunday
    expect(weekStartFor('2026-08-31', 1)).toBe('2026-08-31'); // Mon start -> itself
    expect(weekStartFor('2026-08-31', 2)).toBe('2026-08-25'); // Tue start -> prev Tue
    expect(weekStartFor('2026-08-31', 3)).toBe('2026-08-26');
    expect(weekStartFor('2026-08-31', 4)).toBe('2026-08-27');
    expect(weekStartFor('2026-08-31', 5)).toBe('2026-08-28');
    expect(weekStartFor('2026-08-31', 6)).toBe('2026-08-29'); // Sat start -> prev Sat
  });
});
