/**
 * Pure "retained accounts" set logic (CE-R5 v2), split out of `context.tsx` so
 * the accumulate/remove/discover/guard semantics are unit-testable without
 * React. `context.tsx` holds `string[]` state and calls these as reducers.
 */

/** Add `userId` to the retained set (idempotent — already-present is a no-op
 *  return of an equal array, never a duplicate entry). Used when a sign-out /
 *  involuntary end RETAINS an account — accumulates across repeated switches,
 *  never overwrites a different account's entry. */
export function withRetained(current: readonly string[], userId: string): string[] {
  return current.includes(userId) ? current.slice() : [...current, userId];
}

/** Remove `userId` from the retained set (idempotent). Used on re-activation
 *  (re-auth reactivates a retained file — it stops being "retained"), a clean
 *  drop, or an explicit "Remove account from this device". */
export function withoutRetained(current: readonly string[], userId: string): string[] {
  return current.includes(userId) ? current.filter((id) => id !== userId) : current.slice();
}

/** Merge a freshly-discovered on-disk listing into the current set
 *  (union, de-duplicated). Used once at cold boot — the discovered set is a
 *  snapshot of what survived a restart; anything already tracked in-session
 *  is preserved even if the listing raced ahead of it. */
export function mergeDiscovered(current: readonly string[], discovered: readonly string[]): string[] {
  const merged = new Set(current);
  for (const id of discovered) merged.add(id);
  return [...merged];
}

/** What the UI should show: every retained account EXCEPT the active one (a
 *  reactivated account is no longer "retained" even if a stale discovery
 *  listing still names it — the active account always wins). */
export function visibleRetained(current: readonly string[], activeUserId: string | null): string[] {
  return activeUserId ? current.filter((id) => id !== activeUserId) : current.slice();
}

/** Guard for "Remove account from this device" — never permits removing the
 *  currently active account (it must be signed out first; removing it live
 *  would delete data still in use). Throws rather than silently no-op so the
 *  caller's UI surfaces the mistake instead of the button doing nothing. */
export function assertRemovable(userId: string, activeUserId: string | null): void {
  if (userId === activeUserId) {
    throw new Error('cannot remove the active account from this device — sign out first');
  }
}
