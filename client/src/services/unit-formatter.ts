/**
 * UnitFormatter — presentation-only conversion + formatting. Canonical values
 * stay kg/m/s (SPEC §9.3, FR-SET-04); this is the only place a user-facing
 * unit string is produced from a canonical value. Wraps the pure domain/units
 * helpers with the user's `unit_pref`.
 */
import { formatLoad, formatDuration, formatDistance, kgToLb, lbToKg } from '@/domain/units';
import type { UnitPref } from '@/domain/entities';

export interface UnitFormatter {
  readonly unit: UnitPref;
  /** canonical kg -> display string in the user's unit (no suffix) */
  load(kg: number | null): string;
  /** canonical kg -> display string WITH unit suffix */
  loadWithUnit(kg: number | null): string;
  duration(seconds: number | null): string;
  distance(metres: number | null): string;
  /** parse a user-entered load (in their unit) back to canonical kg */
  parseLoadToKg(input: string): number | null;
}

export function createUnitFormatter(unit: UnitPref): UnitFormatter {
  return {
    unit,
    load: (kg) => formatLoad(kg, unit),
    loadWithUnit: (kg) => (kg == null ? '—' : `${formatLoad(kg, unit)} ${unit}`),
    duration: (s) => formatDuration(s),
    distance: (m) => formatDistance(m),
    parseLoadToKg: (input) => {
      const n = Number(String(input).trim().replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) return null;
      return unit === 'lb' ? lbToKg(n) : n;
    },
  };
}

export { kgToLb, lbToKg };
