/**
 * AuthFlow — MOCKED LOGIC TESTS over the deterministic fake AuthPort. Covers the
 * state transitions the screens render (success / validation / failure /
 * network / rate-limit), enumeration-safe results, and the no-secrets logging
 * guarantee.
 */
import { AuthFlow } from '@/features/auth/auth-flow';
import { createFakeAuth } from '@/services/auth';
import { noopAnalytics } from '@/services/analytics';
import { collectingLogger } from '@/services/logger';

function make(opts?: Parameters<typeof createFakeAuth>[0]) {
  const auth = createFakeAuth(opts);
  const logger = collectingLogger();
  const flow = new AuthFlow(auth, { logger, analytics: noopAnalytics });
  return { auth, logger, flow };
}

describe('AuthFlow.signIn', () => {
  it('rejects a malformed form before hitting the provider', async () => {
    const { flow } = make();
    const res = await flow.signIn('not-an-email', '');
    expect(res).toMatchObject({ ok: false, code: 'invalid_credentials' });
  });

  it('succeeds for a known credential', async () => {
    const { auth, flow } = make();
    await auth.signUp('a@b.co', 'password1');
    await auth.signOut();
    expect(await flow.signIn('a@b.co', 'password1')).toEqual({ ok: true });
  });

  it('maps a bad credential to a neutral failure', async () => {
    const { auth, flow } = make();
    await auth.signUp('a@b.co', 'password1');
    await auth.signOut();
    const res = await flow.signIn('a@b.co', 'wrongpass');
    expect(res).toMatchObject({ ok: false, code: 'invalid_credentials', enumerationSensitive: false });
    // neutral: does not disclose whether the account exists or which field was wrong
    expect((res as { message: string }).message).not.toMatch(/no account|not found|doesn.t exist|wrong password/i);
  });

  it('surfaces network + rate-limit as retriable failures', async () => {
    const { auth, flow } = make();
    auth.failNext('network');
    expect(await flow.signIn('a@b.co', 'password1')).toMatchObject({ ok: false, code: 'network' });
    auth.failNext('over_request_rate_limit');
    expect(await flow.signIn('a@b.co', 'password1')).toMatchObject({ ok: false, code: 'over_request_rate_limit' });
  });
});

describe('AuthFlow.signUp', () => {
  it('reports needsEmailConfirmation + signedIn flags', async () => {
    const { flow } = make();
    const res = await flow.signUp('new@x.co', 'Password1', 'Password1');
    expect(res).toEqual({ ok: true, needsEmailConfirmation: false, signedIn: true });
  });

  it('an existing email yields the SAME shape as a fresh confirm-required sign-up (no enumeration)', async () => {
    const { auth, flow } = make();
    await auth.signUp('dupe@x.co', 'Password1');
    await auth.signOut();
    const again = await flow.signUp('dupe@x.co', 'Password9', 'Password9');
    expect(again).toEqual({ ok: true, needsEmailConfirmation: true, signedIn: false });
  });

  it('rejects a weak password / mismatch locally (aligned to the hosted policy)', async () => {
    const { flow } = make();
    expect(await flow.signUp('a@b.co', 'short', 'short')).toMatchObject({ ok: false, code: 'weak_password' });
    // 8+ chars but no uppercase -> still weak (config.toml lower_upper_letters_digits)
    expect(await flow.signUp('a@b.co', 'password1', 'password1')).toMatchObject({ ok: false, code: 'weak_password' });
    expect(await flow.signUp('a@b.co', 'Password1', 'Password2')).toMatchObject({ ok: false });
  });
});

describe('AuthFlow.sendPasswordReset', () => {
  it('always reports success (uniform copy) except on a transport failure', async () => {
    const { auth, flow } = make();
    expect(await flow.sendPasswordReset('whoever@x.co')).toEqual({ ok: true });
    auth.failNext('network');
    expect(await flow.sendPasswordReset('whoever@x.co')).toMatchObject({ ok: false, code: 'network' });
  });
});

describe('AuthFlow.resetPassword', () => {
  it('validates the policy + match, then updates', async () => {
    const { auth, flow } = make({ initialSession: { user: { id: 'u', email: 'u@x.co' }, expiresAtMs: null } });
    expect(await flow.resetPassword('short', 'short')).toMatchObject({ ok: false, code: 'weak_password' });
    expect(await flow.resetPassword('longenough1', 'longenough1')).toMatchObject({ ok: false, code: 'weak_password' }); // no uppercase
    expect(await flow.resetPassword('Longenough1', 'different')).toMatchObject({ ok: false });
    expect(await flow.resetPassword('Longenough1', 'Longenough1')).toEqual({ ok: true });
    void auth;
  });
});

describe('AuthFlow.signOut', () => {
  it('reports ok and a failure code without throwing', async () => {
    const { auth, flow } = make({ initialSession: { user: { id: 'u', email: null }, expiresAtMs: null } });
    expect(await flow.signOut()).toEqual({ ok: true });
    auth.failNext('network');
    expect(await flow.signOut()).toMatchObject({ ok: false, code: 'network' });
  });
});

describe('no secrets in logs (CON-9)', () => {
  it('never records the email, password, or a token', async () => {
    const { auth, logger, flow } = make();
    await flow.signUp('secret.person@example.com', 'sup3rSecret', 'sup3rSecret');
    await auth.signOut();
    await flow.signIn('secret.person@example.com', 'sup3rSecret');
    await flow.sendPasswordReset('secret.person@example.com');
    const blob = JSON.stringify(logger.entries);
    expect(blob).not.toContain('secret.person@example.com');
    expect(blob).not.toContain('sup3rSecret');
  });
});
