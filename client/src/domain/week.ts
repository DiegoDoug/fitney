/**
 * Week + date boundaries — AR-DEC-04, BD-OQ-1 (human 2026-09-02: bucket by the
 * user's configured `week_start` AND the session-LOCAL calendar date, not UTC).
 *
 * MUST match the server `_week_start_for(local_date, week_start)` in
 * supabase/migrations/20260902090006_security_hardening.sql:
 *
 *   local_date - (((dow(local_date) - week_start) % 7 + 7) % 7)
 *
 * where dow is 0=Sunday .. 6=Saturday (Postgres `extract(dow ...)`).
 * This is part of the WORK-020 golden-vector cross-run.
 */
import type { IsoDate, TimeZone } from './ids';

const MS_PER_DAY = 86_400_000;

/** Parse 'YYYY-MM-DD' as a UTC-anchored civil date (no timezone shift). */
export function parseIsoDate(d: IsoDate): { y: number; m: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) throw new Error(`invalid IsoDate: ${d}`);
  return { y: Number(m[1]), m: Number(m[2]), day: Number(m[3]) };
}

export function isoDateFromParts(y: number, m: number, day: number): IsoDate {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(y, 4)}-${pad(m)}-${pad(day)}`;
}

/** Day of week for a civil date: 0=Sun .. 6=Sat (matches Postgres `extract(dow)`). */
export function dayOfWeek(d: IsoDate): number {
  const { y, m, day } = parseIsoDate(d);
  return new Date(Date.UTC(y, m - 1, day)).getUTCDay();
}

/** Add `n` whole days to a civil date. */
export function addDays(d: IsoDate, n: number): IsoDate {
  const { y, m, day } = parseIsoDate(d);
  const t = Date.UTC(y, m - 1, day) + n * MS_PER_DAY;
  const dt = new Date(t);
  return isoDateFromParts(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/**
 * The week-start civil date for `localDate` given `weekStart` (0=Sun..6=Sat).
 * Byte-identical to the server `_week_start_for`.
 */
export function weekStartFor(localDate: IsoDate, weekStart: number): IsoDate {
  const dow = dayOfWeek(localDate);
  const back = (((dow - weekStart) % 7) + 7) % 7;
  return addDays(localDate, -back);
}

/** The session-local calendar date of an instant, in the session's timezone. */
export function localDateOf(epochMs: number, tz: TimeZone): IsoDate {
  // Intl gives us the civil date parts in `tz` without pulling in a tz library.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA formats as YYYY-MM-DD
  return fmt.format(new Date(epochMs)) as IsoDate;
}

/** "Today" as a civil date in the given timezone. */
export function todayIn(nowMs: number, tz: TimeZone): IsoDate {
  return localDateOf(nowMs, tz);
}

/** All 7 civil dates of the week that contains `localDate`. */
export function weekDates(localDate: IsoDate, weekStart: number): IsoDate[] {
  const start = weekStartFor(localDate, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
