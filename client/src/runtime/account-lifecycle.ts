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

export type SignOutDisposition = {
  /** drop the per-user SQLite file (ADR-0009 clean case) vs retain it */
  dropLocalDb: boolean;
  /** true when there is unsynced local work that must NOT be silently discarded */
  hasUnsyncedWork: boolean;
  reason: string;
};

/**
 * INTERIM POLICY (routed to `security-identity` + `evidence-based-ui-ux` for
 * ratification — docs/engineering/client-implementation.md §10, CE-R5).
 *
 * ADR-0009 says "drop the per-user local DB on verified sign-out". That is
 * unambiguous only when everything is already synced. When the outbox still has
 * `pending`/`dispatched` entries (or there are unresolved conflicts), dropping
 * the file would *silently discard* dispatched operations — which this increment
 * is explicitly forbidden from doing.
 *
 * Interim resolution that satisfies both: on a clean sign-out drop the DB; when
 * unsynced work exists, RETAIN the per-user DB file (nothing is discarded), clear
 * the session/secure-store, and let the caller surface a non-blocking notice.
 * The retained DB is reused when that same user signs in again and the outbox
 * drains. A blocking "back up first / discard" confirmation UX is the owner
 * decision being routed.
 */
export function decideSignOutDisposition(work: OutstandingWork): SignOutDisposition {
  const hasUnsyncedWork = work.outbox > 0 || work.openConflicts > 0;
  return hasUnsyncedWork
    ? {
        dropLocalDb: false,
        hasUnsyncedWork: true,
        reason: `retain_db_unsynced(outbox=${work.outbox},conflicts=${work.openConflicts})`,
      }
    : { dropLocalDb: true, hasUnsyncedWork: false, reason: 'clean_signout_drop_db' };
}
