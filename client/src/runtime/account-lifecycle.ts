/**
 * Account-transition logic (ADR-0009) — the pure core the React runtime driver
 * uses to keep exactly one per-user runtime alive at a time.
 *
 * Responsibilities kept here (so they are unit-testable without React or a
 * native DB):
 *   - decide what an inbound AuthChange means for the active account
 *     (activate / retire+activate / retire / ignore / recovery);
 *   - a monotonic generation guard so a late async result from account A can
 *     never be applied after the runtime has moved to account B;
 *   - the sign-out disposition policy for unsynced local work
 *     (INTERIM — routed for owner ratification, see docs artifact §10).
 */
import type { AuthChange } from '@/services/auth';

// ------------------------------------------------------------- generation guard
/**
 * Every per-user runtime build is stamped with a generation number. The driver
 * holds the current generation; any callback that resolves later must check it
 * before touching state or the database. `bump()` is called at the START of every
 * transition, immediately invalidating all outstanding work for the old account.
 */
export class GenerationGuard {
  private gen = 0;
  current(): number {
    return this.gen;
  }
  bump(): number {
    this.gen += 1;
    return this.gen;
  }
  isCurrent(g: number): boolean {
    return g === this.gen;
  }
}

// ---------------------------------------------------------- transition decision
export type AccountAction =
  | { kind: 'ignore'; reason: string }
  | { kind: 'activate'; userId: string; reason: string }
  | { kind: 'retire-then-activate'; retire: string; userId: string; reason: string }
  | { kind: 'retire'; retire: string; reason: string }
  | { kind: 'recovery'; userId: string | null; reason: string };

/**
 * Decide what to do with an AuthChange given the currently-active local account
 * (`activeUserId`, or null when signed out / bootstrapping).
 *
 * - INITIAL_SESSION / SIGNED_IN with a user, none active     -> activate
 * - ...with a DIFFERENT user than the active one             -> retire A, activate B (serialized)
 * - ...with the SAME user already active                     -> ignore
 * - SIGNED_OUT                                               -> retire (or ignore if already out)
 * - TOKEN_REFRESHED / USER_UPDATED (same user)               -> ignore (no teardown — not a sign-out)
 * - TOKEN_REFRESHED / USER_UPDATED for a different/again user -> retire A, activate B
 * - PASSWORD_RECOVERY                                        -> recovery (surface reset screen)
 */
export function decideAccountAction(
  activeUserId: string | null,
  change: AuthChange,
): AccountAction {
  switch (change.type) {
    case 'PASSWORD_RECOVERY':
      return { kind: 'recovery', userId: change.session?.user.id ?? null, reason: 'password_recovery' };

    case 'SIGNED_OUT':
      return activeUserId
        ? { kind: 'retire', retire: activeUserId, reason: 'signed_out' }
        : { kind: 'ignore', reason: 'already_signed_out' };

    case 'INITIAL_SESSION': {
      const uid = change.session?.user.id ?? null;
      if (!uid) {
        return activeUserId
          ? { kind: 'retire', retire: activeUserId, reason: 'initial_no_session' }
          : { kind: 'ignore', reason: 'bootstrap_no_session' };
      }
      if (!activeUserId) return { kind: 'activate', userId: uid, reason: 'bootstrap_session' };
      if (activeUserId === uid) return { kind: 'ignore', reason: 'already_active' };
      return { kind: 'retire-then-activate', retire: activeUserId, userId: uid, reason: 'bootstrap_account_change' };
    }

    case 'SIGNED_IN':
    case 'TOKEN_REFRESHED':
    case 'USER_UPDATED': {
      const uid = change.session.user.id;
      if (!activeUserId) return { kind: 'activate', userId: uid, reason: `${change.type.toLowerCase()}_new` };
      if (activeUserId === uid) return { kind: 'ignore', reason: `${change.type.toLowerCase()}_same_user` };
      return {
        kind: 'retire-then-activate',
        retire: activeUserId,
        userId: uid,
        reason: `${change.type.toLowerCase()}_account_change`,
      };
    }
  }
}

// --------------------------------------------------------- sign-out disposition
export type OutstandingWork = { outbox: number; openConflicts: number };

/** Why the per-user runtime is being retired (CE-R5 v2 / DEC-53). */
export type SignOutCause =
  | 'user_initiated' // the user tapped Sign out
  | 'session_expired' // refresh/token failure — involuntary
  | 'account_switch' // displaced by another account signing in — involuntary
  | 'account_deleted'; // the delete-account flow returned a CONFIRMED server deletion

/** A resolved choice from the dirty user-initiated sign-out sheet. */
export type SignOutChoice = 'keep' | 'discard';

export type SignOutDisposition =
  | { action: 'drop'; reason: string }
  /** retain the per-user file; `notify` = show a non-blocking notice naming the account */
  | { action: 'retain'; notify: boolean; reason: string }
  /** user-initiated sign-out with outstanding work — the caller MUST surface the
   *  choice sheet (Back up / Keep / Discard / Cancel) BEFORE calling the provider
   *  sign-out, so Cancel can leave the session intact. */
  | { action: 'prompt'; outstanding: OutstandingWork; reason: string };

function hasWork(w: OutstandingWork): boolean {
  return w.outbox > 0 || w.openConflicts > 0;
}

/**
 * CE-R5 v2 (DEC-53, human-approved 2026-09-04) — sign-out disposition.
 * See docs/engineering/client-implementation.md §14.10.
 *
 * "Outstanding work" ≡ any `pending`/`dispatched` `sync_outbox` row OR any
 * unresolved `sync_conflicts` row. Rules:
 *
 *  - `account_deleted` (CONFIRMED server deletion)      -> drop unconditionally.
 *  - `session_expired` / `account_switch` (involuntary) -> ALWAYS retain, notify.
 *      Never drop on an involuntary end, regardless of outstanding work — even a
 *      clean expiry retains so re-auth resumes instantly (v1 wrongly dropped it).
 *  - `user_initiated` + explicit `choice = 'keep'`      -> retain (no notify — chosen).
 *  - `user_initiated` + explicit `choice = 'discard'`   -> drop (after the caller's
 *      second confirm; the ONLY discard path besides "Remove account from device").
 *  - `user_initiated`, no choice, no outstanding work   -> drop (ADR-0009 clean case).
 *  - `user_initiated`, no choice, outstanding work      -> PROMPT.
 *
 * There is NO time-based / automatic deletion of unsynced or conflicted work
 * (FR-SYNC-04). Re-authentication reactivates a retained file as the active DB;
 * draining its outbox is normal sync and never deletes it.
 */
export function decideSignOutDisposition(
  cause: SignOutCause,
  work: OutstandingWork,
  choice?: SignOutChoice,
): SignOutDisposition {
  if (cause === 'account_deleted') {
    return { action: 'drop', reason: 'account_deleted_confirmed' };
  }
  if (cause === 'session_expired' || cause === 'account_switch') {
    return { action: 'retain', notify: true, reason: `${cause}_retain(outbox=${work.outbox},conflicts=${work.openConflicts})` };
  }
  // user_initiated
  if (choice === 'keep') return { action: 'retain', notify: false, reason: 'user_keep_on_device' };
  if (choice === 'discard') return { action: 'drop', reason: 'user_discard_confirmed' };
  if (!hasWork(work)) return { action: 'drop', reason: 'user_signout_clean' };
  return {
    action: 'prompt',
    outstanding: work,
    reason: `user_signout_outstanding(outbox=${work.outbox},conflicts=${work.openConflicts})`,
  };
}
