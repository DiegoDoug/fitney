/**
 * Analytics — behind an interface, provider deferred (DEP-4, CON-9, SPEC §16).
 * The interface STRIPS sensitive fields before dispatch so no call site can leak
 * them: load, body weight, free-text notes, exercise notes, email, or full
 * workout payloads (SPEC §16.1).
 */
export type AnalyticsEvent =
  | { name: 'workout_started'; source: 'planned' | 'template' | 'repeat' | 'empty' | 'past' }
  | { name: 'workout_completed' }
  | { name: 'workout_abandoned' }
  | { name: 'set_completed' }
  | { name: 'signed_in' }
  | { name: 'signed_out' }
  | { name: 'account_switched' }
  | { name: 'onboarding_completed' }
  | { name: 'week_created'; source: 'blank' | 'copy' | 'template' }
  | { name: 'planned_workout_created' }
  | { name: 'template_used' }
  | { name: 'history_viewed' }
  | { name: 'exercise_progress_viewed' }
  | { name: 'pr_achieved' }
  | { name: 'sync_failed'; reason: string };

const BLOCKED_KEYS = new Set([
  'load',
  'load_kg',
  'loadKg',
  'body_weight',
  'bodyWeight',
  'weight',
  'notes',
  'note',
  'session_note',
  'exercise_note',
  'email',
  'display_name',
  'payload',
  'reps',
]);

export function sanitize<T extends Record<string, unknown>>(props: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (BLOCKED_KEYS.has(k)) continue;
    if (typeof v === 'object' && v !== null) continue; // no nested payloads
    out[k] = v;
  }
  return out;
}

export interface Analytics {
  track(event: AnalyticsEvent): void;
}

export const noopAnalytics: Analytics = { track: () => {} };

/** Wraps a raw sink so every dispatched event is sanitized. */
export function guardedAnalytics(sink: (name: string, props: Record<string, unknown>) => void): Analytics {
  return {
    track: (event) => {
      const { name, ...rest } = event;
      try {
        sink(name, sanitize(rest as Record<string, unknown>));
      } catch {
        // analytics failures never affect the app (NFR-RELIABILITY)
      }
    },
  };
}
