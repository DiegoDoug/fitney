/**
 * Training calculations — SPEC §12. Pure. MUST match the server SQL
 * (supabase/migrations/20260902090003_recompute.sql + 20260902090006) byte-for-
 * byte on the shared golden vectors (WORK-020 / WORK-012, AR-RISK-2).
 *
 *   set_volume_kg      = load_kg * reps                (per completed working set)
 *   session_volume_kg  = round(sum(set_volume_kg), 4)  (working/backoff/drop/failure)
 *   e1RM_kg (Epley)    = round(load_kg * (1 + reps/30), 4)  for reps in [2,10]
 *
 * Warmups are excluded from headline working volume + PRs by default.
 */
import { roundTo } from './units';
import { WORKING_SET_TYPES, type SetType } from './entities';

export const E1RM_FORMULA_ID = 'epley' as const;
export const E1RM_FORMULA_VERSION = 1 as const;

/** Reps eligible for an Epley e1RM estimate (SPEC §12.2, DATA-06). */
export const E1RM_MIN_REPS = 2;
export const E1RM_MAX_REPS = 10;

export type CountableSet = {
  set_type: SetType;
  load_kg: number | null;
  reps: number | null;
  completed: boolean;
};

export function isWorkingType(t: SetType): boolean {
  return WORKING_SET_TYPES.includes(t);
}

/** Counts toward headline volume / PRs: completed + a working-family type. */
export function countsTowardVolume(s: CountableSet): boolean {
  return s.completed && isWorkingType(s.set_type);
}

/** Volume for one set (weight_reps). Missing load/reps -> 0 (matches SQL coalesce). */
export function setVolumeKg(load_kg: number | null, reps: number | null): number {
  return (load_kg ?? 0) * (reps ?? 0);
}

/** Sum of completed working-set volume, rounded to 4dp (matches `round(vol,4)`). */
export function sessionVolumeKg(sets: readonly CountableSet[]): number {
  let total = 0;
  for (const s of sets) {
    if (countsTowardVolume(s)) total += setVolumeKg(s.load_kg, s.reps);
  }
  return roundTo(total, 4);
}

/**
 * Epley estimated 1RM. Returns null when ineligible (reps outside [2,10], null
 * load, or negative load) — never computed for 0 reps or invalid loads (DATA-06).
 */
export function epleyE1rmKg(load_kg: number | null, reps: number | null): number | null {
  if (load_kg == null || reps == null) return null;
  if (load_kg < 0) return null;
  if (reps < E1RM_MIN_REPS || reps > E1RM_MAX_REPS) return null;
  return roundTo(load_kg * (1 + reps / 30), 4);
}
