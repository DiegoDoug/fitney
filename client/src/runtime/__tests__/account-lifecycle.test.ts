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

describe('decideSignOutDisposition (CE-R5 v2 / DEC-53)', () => {
  const clean = { outbox: 0, openConflicts: 0 };
  const dirtyOutbox = { outbox: 3, openConflicts: 0 };
  const dirtyConflict = { outbox: 0, openConflicts: 1 };

  it('user-initiated + nothing outstanding -> drop', () => {
    expect(decideSignOutDisposition('user_initiated', clean)).toEqual({
      action: 'drop',
      reason: 'user_signout_clean',
    });
  });

  it('user-initiated + outstanding work + NO choice -> prompt (never auto-decides)', () => {
    expect(decideSignOutDisposition('user_initiated', dirtyOutbox)).toMatchObject({
      action: 'prompt',
      outstanding: dirtyOutbox,
    });
    expect(decideSignOutDisposition('user_initiated', dirtyConflict).action).toBe('prompt');
  });

  it('user-initiated + choice "keep" -> retain (no notice — chosen)', () => {
    expect(decideSignOutDisposition('user_initiated', dirtyOutbox, 'keep')).toEqual({
      action: 'retain',
      notify: false,
      reason: 'user_keep_on_device',
    });
  });

  it('user-initiated + choice "discard" -> drop (explicit informed discard)', () => {
    expect(decideSignOutDisposition('user_initiated', dirtyOutbox, 'discard')).toEqual({
      action: 'drop',
      reason: 'user_discard_confirmed',
    });
  });

  it('session_expired -> ALWAYS retain + notify, even with a clean outbox', () => {
    expect(decideSignOutDisposition('session_expired', clean)).toMatchObject({ action: 'retain', notify: true });
    expect(decideSignOutDisposition('session_expired', dirtyOutbox)).toMatchObject({ action: 'retain', notify: true });
  });

  it('account_switch -> ALWAYS retain + notify (involuntary for account A)', () => {
    expect(decideSignOutDisposition('account_switch', dirtyConflict)).toMatchObject({ action: 'retain', notify: true });
  });

  it('account_deleted (confirmed) -> drop unconditionally', () => {
    expect(decideSignOutDisposition('account_deleted', dirtyOutbox)).toEqual({
      action: 'drop',
      reason: 'account_deleted_confirmed',
    });
  });

  it('there is no time-based / automatic deletion path — deterministic in (cause, work, choice)', () => {
    // regression guard for the v1 "30-day" gap: outstanding work is retained until
    // reconciliation or an explicit choice, never by elapsed time. The signature
    // takes no clock, and repeated calls are byte-identical.
    const a = decideSignOutDisposition('user_initiated', dirtyOutbox);
    const b = decideSignOutDisposition('user_initiated', dirtyOutbox);
    expect(a).toEqual(b);
    expect(a.action).toBe('prompt'); // outstanding work is never auto-dropped
  });
});
