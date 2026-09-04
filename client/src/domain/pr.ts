/**
 * Personal-record + aggregate recompute — SPEC §12.3, ADR-0005, FR-DATA-04..10.
 *
 * Pure, deterministic, idempotent. MUST converge with the server SQL
 * (supabase/migrations/20260902090003_recompute.sql + ...0006) on the shared
 * golden vectors (WORK-020 / WORK-012). Determinism: pure function of the
 * ORDERED set of completed sets; ordering key (session_exercise_id, position, id),
 * tie-break by id (lexicographic == Postgres uuid order for canonical lowercase).
 *
 * PR categories (DATA-05): max_load, est_1rm (Epley, reps 2..10), rep_pr
 * (best load at exactly N reps, N in 1..12), session_volume (max single session).
 * Warmups excluded (WORKING_SET_TYPES).
 */
import { roundTo } from './units';
import { epleyE1rmKg, isWorkingType, setVolumeKg, E1RM_FORMULA_ID, E1RM_FORMULA_VERSION } from './calc';
import { weekStartFor, localDateOf } from './week';
import { prId, aggId } from './uuid5';
import type { PrCategory, SetType, TrackingMode } from './entities';
import type { Uuid, IsoDate } from './ids';

/**
 * One completed set, denormalised with its session-exercise + session context.
 * The caller (a local repository query) supplies only sets that are completed,
 * non-deleted, and belong to a completed, non-deleted session.
 */
export type SetFact = {
  performed_set_id: Uuid;
  session_id: Uuid;
  session_started_at_ms: number;
  session_ended_at_ms: number | null;
  session_timezone: string;
  session_exercise_id: Uuid;
  exercise_id: Uuid | null;
  tracking_mode: TrackingMode;
  position: number;
  set_type: SetType;
  load_kg: number | null;
  reps: number | null;
  completed_at_ms: number | null;
};

export type DerivedPr = {
  id: Uuid;
  user_id: Uuid;
  exercise_id: Uuid | null;
  category: PrCategory;
  rep_count: number | null;
  value: number;
  unit: 'kg';
  source_performed_set_id: Uuid | null;
  source_session_id: Uuid | null;
  achieved_at_ms: number;
  formula_id: string | null;
  formula_version: number | null;
};

export type DerivedWeeklyAggregate = {
  id: Uuid;
  user_id: Uuid;
  week_start_date: IsoDate;
  completed_workouts: number;
  working_sets: number;
  total_volume_kg: number;
};

export type DerivedExerciseWeeklyRollup = {
  id: Uuid;
  user_id: Uuid;
  exercise_id: Uuid;
  week_start_date: IsoDate;
  best_e1rm_kg: number | null;
  working_sets: number;
  total_volume_kg: number;
};

export type DerivedRows = {
  personalRecords: DerivedPr[];
  weeklyAggregates: DerivedWeeklyAggregate[];
  exerciseWeeklyRollups: DerivedExerciseWeeklyRollup[];
};

// ---- ordering (matches the SQL `order by ... , ps.id`) ---------------------
function byIdAsc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
function canonicalOrder(a: SetFact, b: SetFact): number {
  if (a.session_exercise_id !== b.session_exercise_id)
    return byIdAsc(a.session_exercise_id, b.session_exercise_id);
  if (a.position !== b.position) return a.position - b.position;
  return byIdAsc(a.performed_set_id, b.performed_set_id);
}

function isWeightRepsWorking(f: SetFact): boolean {
  return f.tracking_mode === 'weight_reps' && isWorkingType(f.set_type);
}

function achievedAtOfSet(f: SetFact): number {
  return f.completed_at_ms ?? f.session_ended_at_ms ?? f.session_started_at_ms;
}

// ---- individual PR selectors --------------------------------------------
export function bestMaxLoad(facts: readonly SetFact[]): DerivedPr | null {
  const cands = facts
    .filter((f) => isWeightRepsWorking(f) && f.load_kg != null && (f.reps ?? 0) >= 1)
    .sort((a, b) => {
      const la = a.load_kg ?? 0;
      const lb = b.load_kg ?? 0;
      if (la !== lb) return lb - la; // load desc
      const ra = a.reps ?? -Infinity;
      const rb = b.reps ?? -Infinity;
      if (ra !== rb) return rb - ra; // reps desc nulls last
      return byIdAsc(a.performed_set_id, b.performed_set_id);
    });
  const top = cands[0];
  if (!top) return null;
  return {
    id: '', // filled by the orchestrator
    user_id: '',
    exercise_id: top.exercise_id,
    category: 'max_load',
    rep_count: null,
    value: top.load_kg as number,
    unit: 'kg',
    source_performed_set_id: top.performed_set_id,
    source_session_id: top.session_id,
    achieved_at_ms: achievedAtOfSet(top),
    formula_id: null,
    formula_version: null,
  };
}

export function bestE1rm(facts: readonly SetFact[]): DerivedPr | null {
  const cands = facts
    .map((f) => ({ f, e: epleyE1rmKg(f.load_kg, f.reps) }))
    .filter((x): x is { f: SetFact; e: number } => x.e != null && isWeightRepsWorking(x.f))
    .sort((a, b) => (b.e !== a.e ? b.e - a.e : byIdAsc(a.f.performed_set_id, b.f.performed_set_id)));
  const top = cands[0];
  if (!top) return null;
  return {
    id: '',
    user_id: '',
    exercise_id: top.f.exercise_id,
    category: 'est_1rm',
    rep_count: null,
    value: top.e,
    unit: 'kg',
    source_performed_set_id: top.f.performed_set_id,
    source_session_id: top.f.session_id,
    achieved_at_ms: achievedAtOfSet(top.f),
    formula_id: E1RM_FORMULA_ID,
    formula_version: E1RM_FORMULA_VERSION,
  };
}

export function repPrs(facts: readonly SetFact[], nowMs: number): DerivedPr[] {
  const bestByRep = new Map<number, number>();
  for (const f of facts) {
    if (!isWeightRepsWorking(f) || f.load_kg == null || f.reps == null) continue;
    if (f.reps < 1 || f.reps > 12) continue;
    const cur = bestByRep.get(f.reps);
    if (cur == null || f.load_kg > cur) bestByRep.set(f.reps, f.load_kg);
  }
  return [...bestByRep.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rep, load]) => ({
      id: '',
      user_id: '',
      exercise_id: facts.find((f) => f.reps === rep)?.exercise_id ?? null,
      category: 'rep_pr' as PrCategory,
      rep_count: rep,
      value: load,
      unit: 'kg' as const,
      source_performed_set_id: null,
      source_session_id: null,
      achieved_at_ms: nowMs, // server uses now() here too (non-load-bearing)
      formula_id: null,
      formula_version: null,
    }));
}

export function bestSessionVolume(allFacts: readonly SetFact[]): DerivedPr | null {
  const bySession = new Map<Uuid, { vol: number; endedOrStarted: number }>();
  for (const f of allFacts) {
    if (!isWorkingType(f.set_type)) continue;
    const e = bySession.get(f.session_id) ?? {
      vol: 0,
      endedOrStarted: f.session_ended_at_ms ?? f.session_started_at_ms,
    };
    e.vol += setVolumeKg(f.load_kg, f.reps);
    bySession.set(f.session_id, e);
  }
  const ranked = [...bySession.entries()]
    .map(([session_id, v]) => ({ session_id, ...v }))
    .filter((x) => x.vol > 0)
    .sort((a, b) => (b.vol !== a.vol ? b.vol - a.vol : byIdAsc(a.session_id, b.session_id)));
  const top = ranked[0];
  if (!top) return null;
  return {
    id: '',
    user_id: '',
    exercise_id: null,
    category: 'session_volume',
    rep_count: null,
    value: roundTo(top.vol, 4),
    unit: 'kg',
    source_performed_set_id: null,
    source_session_id: top.session_id,
    achieved_at_ms: top.endedOrStarted,
    formula_id: null,
    formula_version: null,
  };
}

// ---- weekly aggregates -------------------------------------------------
function bucketOf(f: SetFact, weekStart: number): IsoDate {
  return weekStartFor(localDateOf(f.session_started_at_ms, f.session_timezone), weekStart);
}

export function weeklyAggregate(factsInWeek: readonly SetFact[]): Omit<
  DerivedWeeklyAggregate,
  'id' | 'user_id' | 'week_start_date'
> {
  const sessions = new Set<Uuid>();
  let workingSets = 0;
  let volume = 0;
  for (const f of factsInWeek) {
    sessions.add(f.session_id);
    if (isWorkingType(f.set_type)) {
      workingSets += 1;
      volume += setVolumeKg(f.load_kg, f.reps);
    }
  }
  return {
    completed_workouts: sessions.size, // caller only passes completed-session facts
    working_sets: workingSets,
    total_volume_kg: roundTo(volume, 4),
  };
}

export function exerciseWeeklyRollups(
  factsInWeek: readonly SetFact[],
): Array<Omit<DerivedExerciseWeeklyRollup, 'id' | 'user_id' | 'week_start_date'>> {
  const byEx = new Map<
    Uuid,
    { bestE1rm: number | null; workingSets: number; volume: number }
  >();
  for (const f of factsInWeek) {
    if (f.exercise_id == null) continue;
    const e = byEx.get(f.exercise_id) ?? { bestE1rm: null, workingSets: 0, volume: 0 };
    const e1 = epleyE1rmKg(f.load_kg, f.reps);
    if (e1 != null && (e.bestE1rm == null || e1 > e.bestE1rm)) e.bestE1rm = e1;
    if (isWorkingType(f.set_type)) {
      e.workingSets += 1;
      e.volume += setVolumeKg(f.load_kg, f.reps);
    }
    byEx.set(f.exercise_id, e);
  }
  return [...byEx.entries()]
    .sort((a, b) => byIdAsc(a[0], b[0]))
    .map(([exercise_id, v]) => ({
      exercise_id,
      best_e1rm_kg: v.bestE1rm,
      working_sets: v.workingSets,
      total_volume_kg: roundTo(v.volume, 4),
    }));
}

// ---- orchestrator ----------------------------------------------------
export type RecomputeScope =
  | { kind: 'exercise'; userId: Uuid; exerciseId: Uuid; weekStart: number; nowMs: number }
  | { kind: 'session'; userId: Uuid; weekStart: number; nowMs: number }
  | { kind: 'all'; userId: Uuid; weekStart: number; nowMs: number };

/**
 * Full deterministic recompute for `userId` over `allFacts` (all their completed
 * sets). Returns the complete recomputed derived-row set; the repository applies
 * it idempotently (delete/tombstone-and-reinsert by the natural key / v5 id).
 */
export function recomputeAll(userId: Uuid, allFacts: readonly SetFact[], weekStart: number, nowMs: number): DerivedRows {
  const prs: DerivedPr[] = [];

  // per-exercise PRs
  const exerciseIds = [...new Set(allFacts.map((f) => f.exercise_id).filter((x): x is Uuid => x != null))].sort(
    byIdAsc,
  );
  for (const exId of exerciseIds) {
    const exFacts = allFacts.filter((f) => f.exercise_id === exId);
    const ml = bestMaxLoad(exFacts);
    if (ml) prs.push({ ...ml, id: prId(userId, exId, 'max_load', null), user_id: userId });
    const e1 = bestE1rm(exFacts);
    if (e1) prs.push({ ...e1, id: prId(userId, exId, 'est_1rm', null), user_id: userId });
    for (const rp of repPrs(exFacts, nowMs)) {
      prs.push({ ...rp, id: prId(userId, exId, 'rep_pr', rp.rep_count), user_id: userId });
    }
  }

  // session-volume PR
  const sv = bestSessionVolume(allFacts);
  if (sv) prs.push({ ...sv, id: prId(userId, null, 'session_volume', null), user_id: userId });

  // weekly aggregates + rollups
  const weeks = new Map<IsoDate, SetFact[]>();
  for (const f of allFacts) {
    const wk = bucketOf(f, weekStart);
    (weeks.get(wk) ?? weeks.set(wk, []).get(wk)!).push(f);
  }
  const weeklyAggregates: DerivedWeeklyAggregate[] = [];
  const rollups: DerivedExerciseWeeklyRollup[] = [];
  for (const [wk, wkFacts] of [...weeks.entries()].sort((a, b) => byIdAsc(a[0], b[0]))) {
    const wa = weeklyAggregate(wkFacts);
    weeklyAggregates.push({
      id: aggId('wa', userId, wk),
      user_id: userId,
      week_start_date: wk,
      ...wa,
    });
    for (const r of exerciseWeeklyRollups(wkFacts)) {
      rollups.push({
        id: aggId('ewr', userId, `${wk}:${r.exercise_id}`),
        user_id: userId,
        week_start_date: wk,
        ...r,
      });
    }
  }

  return { personalRecords: prs, weeklyAggregates, exerciseWeeklyRollups: rollups };
}
