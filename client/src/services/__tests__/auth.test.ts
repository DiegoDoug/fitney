/**
 * AuthPort seam — MOCKED LOGIC TESTS (no provider, no RN). Covers the error
 * taxonomy, enumeration-safe copy, form validators, deep-link parsing, and the
 * observable lifecycle of the deterministic fake.
 */
import {
  AuthError,
  authErrorMessage,
  classifyAuthError,
  createFakeAuth,
  ENUMERATION_SENSITIVE,
  MIN_PASSWORD_LENGTH,
  parseAuthUrl,
  validateEmail,
  validatePassword,
  validateSignInForm,
  validateSignUpForm,
  type AuthChange,
} from '@/services/auth';

describe('classifyAuthError', () => {
  it('maps GoTrue codes and messages to the taxonomy', () => {
    expect(classifyAuthError({ code: 'invalid_credentials' })).toBe('invalid_credentials');
    expect(classifyAuthError({ message: 'Invalid login credentials' })).toBe('invalid_credentials');
    expect(classifyAuthError({ status: 429 })).toBe('over_request_rate_limit');
    expect(classifyAuthError({ code: 'email_not_confirmed' })).toBe('email_not_confirmed');
    expect(classifyAuthError({ message: 'User already registered' })).toBe('user_already_exists');
    expect(classifyAuthError({ message: 'Password should be at least 6 characters' })).toBe('weak_password');
    expect(classifyAuthError({ name: 'AuthRetryableFetchError', message: 'Network request failed' })).toBe('network');
    expect(classifyAuthError({ status: 401, message: 'JWT expired' })).toBe('session_expired');
    expect(classifyAuthError({ message: 'something odd' })).toBe('unknown');
  });

  it('AuthError.retriable is true only for transient codes', () => {
    expect(new AuthError('network', 'x').retriable).toBe(true);
    expect(new AuthError('over_request_rate_limit', 'x').retriable).toBe(true);
    expect(new AuthError('invalid_credentials', 'x').retriable).toBe(false);
  });
});

describe('enumeration-safe messaging (SEC-REQ-AUTH-03)', () => {
  it('an existing-email sign-up reads identically to a fresh one', () => {
    expect(ENUMERATION_SENSITIVE.has('user_already_exists')).toBe(true);
    // the copy for "already exists" must not say so
    expect(authErrorMessage('user_already_exists')).toBe('Check your email to finish setting up your account.');
    expect(authErrorMessage('user_already_exists')).not.toMatch(/exist|registered|taken|already/i);
  });
});

describe('form validators', () => {
  it('validateEmail', () => {
    expect(validateEmail('')).toMatch(/enter/i);
    expect(validateEmail('nope')).toMatch(/valid/i);
    expect(validateEmail('  A@B.co ')).toBeNull();
  });
  it('validatePassword mirrors the approved hosted policy (len>=8, lower, upper, digit)', () => {
    expect(validatePassword('short')).toMatch(new RegExp(`${MIN_PASSWORD_LENGTH}`));
    expect(validatePassword('alllowercase1')).toMatch(/uppercase/i);
    expect(validatePassword('ALLUPPERCASE1')).toMatch(/lowercase/i);
    expect(validatePassword('NoDigitsHere')).toMatch(/number/i);
    expect(validatePassword('Longenough1')).toBeNull();
  });
  it('validateSignUpForm flags a mismatch and a weak password', () => {
    expect(validateSignUpForm('a@b.co', 'Password1', 'Password2').confirm).toBeTruthy();
    expect(validateSignUpForm('a@b.co', 'weakpass', 'weakpass').password).toBeTruthy();
    expect(validateSignUpForm('a@b.co', 'Password1', 'Password1')).toEqual({});
  });
  it('validateSignInForm only needs a non-empty password', () => {
    expect(validateSignInForm('a@b.co', '').password).toBeTruthy();
    expect(validateSignInForm('a@b.co', 'x')).toEqual({});
  });
});

describe('parseAuthUrl', () => {
  it('parses an implicit-flow recovery token fragment', () => {
    const r = parseAuthUrl('fitney://auth/callback#access_token=AAA&refresh_token=BBB&type=recovery&expires_in=3600');
    expect(r).toEqual({ kind: 'tokens', accessToken: 'AAA', refreshToken: 'BBB', recovery: true });
  });
  it('parses a PKCE code query', () => {
    expect(parseAuthUrl('fitney://auth/callback?code=xyz')).toEqual({ kind: 'code', code: 'xyz' });
  });
  it('returns null when there is nothing to exchange', () => {
    expect(parseAuthUrl('fitney://auth/callback')).toBeNull();
  });
});

describe('createFakeAuth lifecycle', () => {
  const collect = (auth: ReturnType<typeof createFakeAuth>) => {
    const events: AuthChange[] = [];
    const unsub = auth.onAuthChange((c) => events.push(c));
    return { events, unsub };
  };

  it('emits INITIAL_SESSION on subscribe (null when signed out)', () => {
    const auth = createFakeAuth();
    const { events } = collect(auth);
    expect(events).toEqual([{ type: 'INITIAL_SESSION', session: null }]);
  });

  it('emits INITIAL_SESSION with the restored session', async () => {
    const auth = createFakeAuth({
      initialSession: { user: { id: 'u1', email: 'a@b.co' }, expiresAtMs: null },
    });
    const { events } = collect(auth);
    expect(events[0]).toMatchObject({ type: 'INITIAL_SESSION', session: { user: { id: 'u1' } } });
    expect(await auth.getSession()).toMatchObject({ user: { id: 'u1' } });
  });

  it('sign-up then sign-in emit SIGNED_IN and set the current user', async () => {
    const auth = createFakeAuth();
    const { events } = collect(auth);
    const res = await auth.signUp('New@User.co', 'password1');
    expect(res.needsEmailConfirmation).toBe(false);
    expect(auth.currentUserId()).toContain('new@user.co');
    await auth.signOut();
    await auth.signIn('new@user.co', 'password1');
    const kinds = events.map((e) => e.type);
    expect(kinds).toEqual(['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'SIGNED_IN']);
  });

  it('re-registering an existing email is uniform (no session, needsEmailConfirmation)', async () => {
    const auth = createFakeAuth();
    await auth.signUp('dupe@x.co', 'password1');
    await auth.signOut();
    const again = await auth.signUp('dupe@x.co', 'whatever8');
    expect(again).toEqual({ session: null, needsEmailConfirmation: true });
  });

  it('requireEmailConfirmation defers the session', async () => {
    const auth = createFakeAuth({ requireEmailConfirmation: true });
    const res = await auth.signUp('c@x.co', 'password1');
    expect(res).toEqual({ session: null, needsEmailConfirmation: true });
    expect(auth.currentUserId()).toBeNull();
  });

  it('a queued failure surfaces as an AuthError with the right code', async () => {
    const auth = createFakeAuth();
    auth.failNext('over_request_rate_limit');
    await expect(auth.signIn('a@b.co', 'x')).rejects.toMatchObject({
      name: 'AuthError',
      code: 'over_request_rate_limit',
    });
  });

  it('bad credentials reject with invalid_credentials', async () => {
    const auth = createFakeAuth();
    await auth.signUp('real@x.co', 'password1');
    await auth.signOut();
    await expect(auth.signIn('real@x.co', 'wrongpass')).rejects.toMatchObject({ code: 'invalid_credentials' });
  });

  it('emit() drives an external event (token refresh) without a teardown signal', () => {
    const auth = createFakeAuth({ initialSession: { user: { id: 'u9', email: null }, expiresAtMs: 1 } });
    const { events } = collect(auth);
    auth.emit({ type: 'TOKEN_REFRESHED', session: { user: { id: 'u9', email: null }, expiresAtMs: 2 } });
    expect(events.at(-1)).toMatchObject({ type: 'TOKEN_REFRESHED', session: { user: { id: 'u9' } } });
  });
});
