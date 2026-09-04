/**
 * Completion-summary view-model (SPEC LOG-11). Keeps the domain calc out of the
 * route (ADR-0002): the screen renders these numbers, it does not compute them.
 */
import { sessionVolumeKg, type CountableSet } from '@/domain/calc';
import type { PerformedSet } from '@/domain/entities';

export type SessionSummary = {
  workingSets: number;
  totalVolumeKg: number;
  completedSets: number;
};

export function summariseSession(sets: readonly PerformedSet[]): SessionSummary {
  const countable: CountableSet[] = sets.map((s) => ({
    set_type: s.set_type,
    load_kg: s.load_kg,
    reps: s.reps,
    completed: s.completed,
  }));
  return {
    completedSets: sets.filter((s) => s.completed).length,
    workingSets: countable.filter((s) => s.completed && (s.set_type === 'working' || s.set_type === 'backoff' || s.set_type === 'drop' || s.set_type === 'failure')).length,
    totalVolumeKg: sessionVolumeKg(countable),
  };
}
