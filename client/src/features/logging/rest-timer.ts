/**
 * Rest timer — persisted as an ABSOLUTE anchor timestamp, never a decrementing
 * counter (AR-DEC-04, SPEC §11.3). Recovery after force-close is just reading the
 * anchor back and recomputing remaining time from `now`.
 */
export type RestTimerView = {
  running: boolean;
  /** whole seconds remaining (>= 0); 0 when elapsed */
  remainingSeconds: number;
  /** seconds since the anchor (can exceed durationSeconds) */
  elapsedSeconds: number;
  durationSeconds: number;
};

export function restTimerView(args: {
  anchorMs: number | null;
  durationSeconds: number;
  nowMs: number;
}): RestTimerView {
  const { anchorMs, durationSeconds, nowMs } = args;
  if (anchorMs == null) {
    return { running: false, remainingSeconds: 0, elapsedSeconds: 0, durationSeconds };
  }
  const elapsed = Math.max(0, Math.floor((nowMs - anchorMs) / 1000));
  const remaining = Math.max(0, durationSeconds - elapsed);
  return {
    running: remaining > 0,
    remainingSeconds: remaining,
    elapsedSeconds: elapsed,
    durationSeconds,
  };
}

/** "+15s" — shift the anchor forward so `remaining` grows by 15 (SPEC LOG-09). */
export function addFifteen(anchorMs: number): number {
  return anchorMs + 15_000;
}

/** Start: the anchor is `now`; duration comes from the exercise or the user default. */
export function startAnchor(nowMs: number): number {
  return nowMs;
}
