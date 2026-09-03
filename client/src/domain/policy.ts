/**
 * Domain policies — invariants that guard the write path. Pure predicates;
 * features/* enforce them before a mutation, the DB enforces them again
 * (partial-unique indexes, RLS).
 */
import { ValidationError } from './errors';
import { isWorkingType } from './calc';
import type { PerformedSet, SetType, TrackingMode, WorkoutSession } from './entities';

/** FR-LOG-12 — exactly one active session per user. */
export function assertCanStartSession(existingActive: Pick<WorkoutSession, 'id' | 'status'> | null): void {
  if (existingActive && existingActive.status === 'active') {
    // caller converts to ActiveSessionExistsError with the id
    throw new ValidationError('active_session_exists');
  }
}

/** SPEC §9.3 numeric validation — no negatives; zero load allowed (bodyweight). */
export function validatePerformedSet(
  s: Pick<PerformedSet, 'load_kg' | 'reps' | 'duration_s' | 'distance_m' | 'rpe' | 'rir'>,
): void {
  const nonNeg: Array<[string, number | null]> = [
    ['load_kg', s.load_kg],
    ['reps', s.reps],
    ['duration_s', s.duration_s],
    ['distance_m', s.distance_m],
    ['rir', s.rir],
  ];
  for (const [field, v] of nonNeg) {
    if (v != null && v < 0) throw new ValidationError(`${field} must not be negative`);
  }
  if (s.rpe != null && (s.rpe < 0 || s.rpe > 10)) throw new ValidationError('rpe must be within 0..10');
}

/**
 * Which fields the UI renders for a tracking mode (FR-LOG-14). Domain says which
 * are relevant; the component renders accordingly.
 */
export function relevantSetFields(mode: TrackingMode): Array<'load' | 'reps' | 'duration' | 'distance'> {
  switch (mode) {
    case 'weight_reps':
      return ['load', 'reps'];
    case 'reps':
      return ['reps'];
    case 'duration':
      return ['duration'];
    case 'distance':
      return ['distance', 'duration'];
  }
}

/** Warmups are excluded from headline working volume by default (SPEC §12.1). */
export function includedInHeadlineVolume(setType: SetType, completed: boolean): boolean {
  return completed && isWorkingType(setType);
}

/**
 * FR-LIB-08 — deletion that would break history is blocked; archive/soft-delete
 * instead. `referencedByHistory` is computed by the repository (any completed
 * session_exercise / performed_set / PR points at this row).
 */
export function assertDeletable(referencedByHistory: boolean): void {
  if (referencedByHistory) {
    throw new ValidationError('cannot delete: referenced by history — archive instead');
  }
}

/** `finishSession` is idempotent: a terminal session is a no-op (UX-DEC-08). */
export function isTerminalSessionStatus(status: WorkoutSession['status']): boolean {
  return status === 'completed' || status === 'cancelled';
}
