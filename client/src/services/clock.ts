/**
 * Clock — the ONLY source of "now" for domain + features. domain/* never calls
 * Date.now()/new Date() directly (enforced by the boundary lint); it receives a
 * Clock. This makes week/date boundaries, timer anchors, and "today" testable
 * and deterministic (AR-DEC-04, system-architecture.md §6.3, §8.2).
 */
export interface Clock {
  /** epoch milliseconds, UTC */
  now(): number;
  /** IANA timezone of the device right now, e.g. "Europe/London" */
  timeZone(): string;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  timeZone: () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  },
};

/** Deterministic clock for tests. */
export function fixedClock(epochMs: number, tz = 'UTC'): Clock {
  return { now: () => epochMs, timeZone: () => tz };
}
