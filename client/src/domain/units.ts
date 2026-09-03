/**
 * Units — canonical kg/m/s at rest; convert ONLY here / at the presentation
 * boundary (SPEC §9.3, §13, NFR-A11Y/INTL, FR-SET-04). Pure functions.
 */
export const KG_PER_LB = 0.45359237;
export const LB_PER_KG = 1 / KG_PER_LB;

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}
export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Round to `dp` decimals, half-up, avoiding binary-float surprises. */
export function roundTo(value: number, dp: number): number {
  if (!Number.isFinite(value)) return value;
  const f = 10 ** dp;
  // + epsilon nudges e.g. 129.83335 off the float boundary before rounding
  return Math.round((value + Number.EPSILON) * f) / f;
}

/**
 * Snap a load to the nearest achievable increment for display / entry help
 * (SPEC LOG-13). Never forces a calculator; entry still accepts any decimal.
 */
export function snapToIncrement(value: number, incrementKg: number): number {
  if (incrementKg <= 0) return value;
  return roundTo(Math.round(value / incrementKg) * incrementKg, 4);
}

/** Display precision by unit: kg to 2dp, lb to 1dp (typical gym granularity). */
export function formatLoad(kg: number | null, unit: 'kg' | 'lb'): string {
  if (kg == null) return '—';
  if (unit === 'lb') return `${roundTo(kgToLb(kg), 1)}`;
  return `${roundTo(kg, 2)}`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function formatDistance(metres: number | null): string {
  if (metres == null) return '—';
  if (metres >= 1000) return `${roundTo(metres / 1000, 2)} km`;
  return `${roundTo(metres, 1)} m`;
}
