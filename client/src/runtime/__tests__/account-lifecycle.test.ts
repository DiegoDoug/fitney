/**
 * Account-transition core — MOCKED LOGIC TESTS. The decision table that keeps
 * exactly one per-user runtime alive, the generation guard, and the sign-out
 * disposition policy for unsynced work.
 */
import {
  decideAccountAction,
  decideSignOutDisposition,
  GenerationGuard,
} from '@/runtime/account-lifecycle';
import type { AuthChange, AuthSession } from '@/services/auth';

const session = (id: string): AuthSession => ({ user: { id, email: `${id}@x.co` }, expiresAtMs: null });

describe('decideAccountAction', () => {
  it('bootstraps: INITIAL_SESSION with a user and none active -> activate', () => {
    expect(decideAccountAction(null, { type: 'INITIAL_SESSION', session: session('A') })).toMatchObject({
      kind: 'activate',
      userId: 'A',
    });
  });

  it('bootstraps: INITIAL_SESSION with no session -> ignore', () => {
    expect(decideAccountAction(null, { type: 'INITIAL_SESSION', session: null })).toMatchObject({ kind: 'ignore' });
  });

  it('SIGNED_IN with a new user while signed out -> activate', () => {
    expect(decideAccountAction(null, { type: 'SIGNED_IN', session: session('A') })).toMatchObject({
      kind: 'activate',
      userId: 'A',
    });
  });

  it('SIGNED_IN with the SAME active user -> ignore (already active)', () => {
    expect(decideAccountAction('A', { type: 'SIGNED_IN', session: session('A') })).toMatchObject({ kind: 'ignore' });
  });

  it('SIGNED_IN with a DIFFERENT user -> retire A then activate B (serialized)', () => {
    expect(decideAccountAction('A', { type: 'SIGNED_IN', session: session('B') })).toEqual({
      kind: 'retire-then-activate',
      retire: 'A',
      userId: 'B',
      reason: 'signed_in_account_change',
    });
  });

  it('TOKEN_REFRESHED / USER_UPDATED for the same user is NOT a teardown', () => {
    for (const type of ['TOKEN_REFRESHED', 'USER_UPDATED'] as const) {
      expect(decideAccountAction('A', { type, session: session('A') } as AuthChange)).toMatchObject({
        kind: 'ignore',
      });
    }
  });

  it('SIGNED_OUT while active -> retire; while already out -> ignore', () => {
    expect(decideAccountAction('A', { type: 'SIGNED_OUT' })).toEqual({
      kind: 'retire',
      retire: 'A',
      reason: 'signed_out',
    });
    expect(decideAccountAction(null, { type: 'SIGNED_OUT' })).toMatchObject({ kind: 'ignore' });
  });

  it('PASSWORD_RECOVERY -> recovery (surface the reset screen), keep the account', () => {
    expect(decideAccountAction('A', { type: 'PASSWORD_RECOVERY', session: session('A') })).toMatchObject({
      kind: 'recovery',
      userId: 'A',
    });
  });
});

describe('GenerationGuard', () => {
  it('a stamp is only current until the next bump', () => {
    const g = new GenerationGuard();
    const gen = g.bump();
    expect(g.isCurrent(gen)).toBe(true);
    g.bump();
    expect(g.isCurrent(gen)).toBe(false); // a late result from the previous account is now inert
  });
});

describe('decideSignOutDisposition (interim policy)', () => {
  it('clean sign-out (nothing outstanding) -> drop the local DB', () => {
    expect(decideSignOutDisposition({ outbox: 0, openConflicts: 0 })).toMatchObject({
      dropLocalDb: true,
      hasUnsyncedWork: false,
    });
  });

  it('unsynced outbox entries -> RETAIN the DB, never silently discard', () => {
    expect(decideSignOutDisposition({ outbox: 3, openConflicts: 0 })).toMatchObject({
      dropLocalDb: false,
      hasUnsyncedWork: true,
    });
  });

  it('unresolved conflicts also force retention', () => {
    expect(decideSignOutDisposition({ outbox: 0, openConflicts: 1 }).dropLocalDb).toBe(false);
  });
});
