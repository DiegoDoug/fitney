/**
 * AuthPort — the `services/AuthProvider` interface of ADR-0009. Authentication is
 * Supabase Auth (email/password for MVP); this file is the PURE seam: types, a
 * provider-agnostic error taxonomy, a deterministic fake, and form validators.
 *
 * The concrete GoTrue-backed implementation lives in `data/remote/auth-gateway.ts`
 * (the only place the Supabase client is touched — CON-4/CON-5, boundary lint).
 * Screens never import this directly; they reach auth actions through the runtime
 * context (`useAuth`).
 *
 * No token, password, or email value is ever logged from here (CLAUDE.md, CON-9).
 */

export type AuthUser = {
  id: string;
  /** may be null before email confirmation completes on some providers */
  email: string | null;
};

export type AuthSession = {
  user: AuthUser;
  /** epoch ms the access token expires; null if the provider does not report it */
  expiresAtMs: number | null;
};

/**
 * Lifecycle events the runtime reacts to. The runtime distinguishes a real
 * SIGNED_OUT / account change (retire the per-user runtime, apply the DB
 * disposition policy) from a TOKEN_REFRESHED / USER_UPDATED (same user — no
 * teardown) and a transient loss of connectivity (no event at all).
 */
export type AuthChange =
  | { type: 'INITIAL_SESSION'; session: AuthSession | null }
  | { type: 'SIGNED_IN'; session: AuthSession }
  | { type: 'SIGNED_OUT' }
  | { type: 'TOKEN_REFRESHED'; session: AuthSession }
  | { type: 'USER_UPDATED'; session: AuthSession }
  | { type: 'PASSWORD_RECOVERY'; session: AuthSession | null };

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_exists'
  | 'weak_password'
  | 'same_password'
  | 'over_request_rate_limit'
  | 'session_expired'
  | 'network'
  | 'unknown';

/** Codes whose user-facing copy MUST stay uniform to avoid account enumeration
 *  (SEC-REQ-AUTH-03). The screens present the neutral message for these. */
export const ENUMERATION_SENSITIVE: ReadonlySet<AuthErrorCode> = new Set<AuthErrorCode>([
  'user_already_exists',
]);

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  /** true when the failure is transport/connectivity, not a credential problem */
  readonly retriable: boolean;
  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.retriable = code === 'network' || code === 'over_request_rate_limit';
  }
}

export type SignUpResult = {
  session: AuthSession | null;
  /** true when the provider requires the user to confirm their email before a
   *  session is issued (hosted prod: SEC-REQ-AUTH-02). Dev config ships
   *  `enable_confirmations = false`, so a session is returned immediately. */
  needsEmailConfirmation: boolean;
};

export interface AuthPort {
  /** current persisted session (restored from expo-secure-store), or null */
  getSession(): Promise<AuthSession | null>;
  signUp(email: string, password: string): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  /** always resolves (never reveals whether the address has an account) */
  sendPasswordReset(email: string): Promise<void>;
  /** set a new password for the user in the current (recovery) session */
  updatePassword(newPassword: string): Promise<void>;
  /** parse an inbound deep link (email confirm / recovery) and apply it */
  handleDeepLink(url: string): Promise<void>;
  /** subscribe to lifecycle events; returns an unsubscribe fn */
  onAuthChange(cb: (c: AuthChange) => void): () => void;
}

// --------------------------------------------------------------- error mapping
/**
 * Map a provider error (shape kept minimal so this stays pure + testable) to the
 * taxonomy above. GoTrue reports a machine `code` on newer versions and a
 * `status` always; older messages are matched as a fallback.
 */
export function classifyAuthError(err: {
  status?: number | undefined;
  code?: string | undefined;
  message?: string | undefined;
  name?: string | undefined;
}): AuthErrorCode {
  const code = (err.code ?? '').toLowerCase();
  const msg = (err.message ?? '').toLowerCase();
  const status = err.status;

  if (
    err.name === 'AuthRetryableFetchError' ||
    code === 'network' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    status === 0
  ) {
    return 'network';
  }
  if (status === 429 || code === 'over_request_rate_limit' || msg.includes('rate limit')) {
    return 'over_request_rate_limit';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'invalid_credentials';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'email_not_confirmed';
  }
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    msg.includes('already registered') ||
    msg.includes('already been registered')
  ) {
    return 'user_already_exists';
  }
  if (code === 'weak_password' || msg.includes('password should be') || msg.includes('weak password')) {
    return 'weak_password';
  }
  if (code === 'same_password' || msg.includes('should be different from the old password')) {
    return 'same_password';
  }
  if (
    status === 401 ||
    code === 'session_not_found' ||
    code === 'session_expired' ||
    msg.includes('jwt expired') ||
    msg.includes('session from session_id claim in jwt does not exist')
  ) {
    return 'session_expired';
  }
  return 'unknown';
}

/** Neutral, enumeration-safe copy for a code (SEC-REQ-AUTH-03, UX §10.1). */
export function authErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'invalid_credentials':
      return 'That email or password is not right.';
    case 'email_not_confirmed':
      return 'Confirm your email address first — check your inbox for the link.';
    case 'user_already_exists':
      // uniform with the sign-up success copy on purpose (no enumeration)
      return 'Check your email to finish setting up your account.';
    case 'weak_password':
      return 'Choose a longer password (at least 8 characters).';
    case 'same_password':
      return 'Choose a password you have not used before.';
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a minute and try again.';
    case 'session_expired':
      return 'Your session ended. Sign in again to continue.';
    case 'network':
      return 'Can’t reach the server. Check your connection and try again.';
    case 'unknown':
      return 'Something went wrong. Try again.';
  }
}

// ------------------------------------------------------------- form validation
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateEmail(raw: string): string | null {
  const email = normalizeEmail(raw);
  if (email.length === 0) return 'Enter your email address.';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(pw: string): string | null {
  if (pw.length === 0) return 'Enter a password.';
  if (pw.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return null;
}

export type FieldErrors = { email?: string; password?: string; confirm?: string };

export function validateSignInForm(email: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  const e = validateEmail(email);
  if (e) errs.email = e;
  if (password.length === 0) errs.password = 'Enter your password.';
  return errs;
}

export function validateSignUpForm(email: string, password: string, confirm: string): FieldErrors {
  const errs: FieldErrors = {};
  const e = validateEmail(email);
  if (e) errs.email = e;
  const p = validatePassword(password);
  if (p) errs.password = p;
  if (confirm !== password) errs.confirm = 'Passwords do not match.';
  return errs;
}

export function hasErrors(errs: FieldErrors): boolean {
  return Boolean(errs.email || errs.password || errs.confirm);
}

// ------------------------------------------------------- deep-link parsing
export type ParsedAuthUrl =
  | { kind: 'tokens'; accessToken: string; refreshToken: string; recovery: boolean }
  | { kind: 'code'; code: string };

/**
 * Parse a GoTrue email-confirm / password-recovery deep link. Pure (no provider
 * SDK) so it is unit-testable. Handles both the implicit-flow token fragment
 * (`#access_token=…&refresh_token=…&type=recovery`) and the PKCE `?code=…` form.
 */
export function parseAuthUrl(url: string): ParsedAuthUrl | null {
  const hashIdx = url.indexOf('#');
  const qIdx = url.indexOf('?');
  const frag = hashIdx >= 0 ? url.slice(hashIdx + 1) : '';
  const query = qIdx >= 0 ? url.slice(qIdx + 1, hashIdx >= 0 ? hashIdx : undefined) : '';
  const fp = new URLSearchParams(frag);
  const qp = new URLSearchParams(query);

  const access = fp.get('access_token') ?? qp.get('access_token');
  const refresh = fp.get('refresh_token') ?? qp.get('refresh_token');
  if (access && refresh) {
    const type = fp.get('type') ?? qp.get('type');
    return { kind: 'tokens', accessToken: access, refreshToken: refresh, recovery: type === 'recovery' };
  }
  const code = qp.get('code') ?? fp.get('code');
  if (code) return { kind: 'code', code };
  return null;
}

// ------------------------------------------------------------------- fake impl
type Listener = (c: AuthChange) => void;

export type FakeAuthOptions = {
  /** seed a signed-in user (simulates a restored session on launch) */
  initialSession?: AuthSession | null;
  /** provider requires email confirmation on sign-up */
  requireEmailConfirmation?: boolean;
  /** force the next call to fail with this code (one-shot) */
  failNextWith?: AuthErrorCode;
  now?: () => number;
};

/**
 * Deterministic in-memory AuthPort for logic tests. Mirrors the observable
 * behaviour of the GoTrue-backed gateway: emits INITIAL_SESSION on subscribe,
 * SIGNED_IN / SIGNED_OUT / USER_UPDATED, and keeps a single "current" session.
 */
export function createFakeAuth(opts: FakeAuthOptions = {}): AuthPort & {
  /** test helper: drive an external event (e.g. token refresh, other-tab sign-out) */
  emit(c: AuthChange): void;
  /** test helper: queue a one-shot failure */
  failNext(code: AuthErrorCode): void;
  currentUserId(): string | null;
} {
  const now = opts.now ?? (() => Date.now());
  const listeners = new Set<Listener>();
  let session: AuthSession | null = opts.initialSession ?? null;
  let failNext: AuthErrorCode | null = opts.failNextWith ?? null;
  let userSeq = 0;

  const knownUsers = new Map<string, { id: string; password: string }>();
  if (session) knownUsers.set(session.user.email ?? `seed-${session.user.id}`, { id: session.user.id, password: '' });

  const takeFailure = (): AuthErrorCode | null => {
    const f = failNext;
    failNext = null;
    return f;
  };
  const notify = (c: AuthChange) => {
    for (const l of [...listeners]) l(c);
  };
  const mkSession = (id: string, email: string | null): AuthSession => ({
    user: { id, email },
    expiresAtMs: now() + 60 * 60 * 1000,
  });

  return {
    async getSession() {
      return session;
    },
    async signUp(email, password) {
      const f = takeFailure();
      if (f) throw new AuthError(f, authErrorMessage(f));
      const key = normalizeEmail(email);
      if (knownUsers.has(key)) {
        // uniform behaviour: do not disclose existence (SEC-REQ-AUTH-03)
        return { session: null, needsEmailConfirmation: true };
      }
      const id = `user-${++userSeq}-${key}`;
      knownUsers.set(key, { id, password });
      if (opts.requireEmailConfirmation) {
        return { session: null, needsEmailConfirmation: true };
      }
      session = mkSession(id, key);
      notify({ type: 'SIGNED_IN', session });
      return { session, needsEmailConfirmation: false };
    },
    async signIn(email, password) {
      const f = takeFailure();
      if (f) throw new AuthError(f, authErrorMessage(f));
      const key = normalizeEmail(email);
      const rec = knownUsers.get(key);
      if (!rec || (rec.password !== '' && rec.password !== password)) {
        throw new AuthError('invalid_credentials', authErrorMessage('invalid_credentials'));
      }
      session = mkSession(rec.id, key);
      notify({ type: 'SIGNED_IN', session });
      return session;
    },
    async signOut() {
      const f = takeFailure();
      if (f) throw new AuthError(f, authErrorMessage(f));
      session = null;
      notify({ type: 'SIGNED_OUT' });
    },
    async sendPasswordReset() {
      // A transport-class failure still surfaces (the AuthFlow wrapper decides
      // what the UI shows); any other queued failure is swallowed so the
      // response stays uniform regardless of whether the address is registered.
      const f = takeFailure();
      if (f === 'network' || f === 'over_request_rate_limit') {
        throw new AuthError(f, authErrorMessage(f));
      }
    },
    async updatePassword(newPassword) {
      const f = takeFailure();
      if (f) throw new AuthError(f, authErrorMessage(f));
      if (!session) throw new AuthError('session_expired', authErrorMessage('session_expired'));
      const key = session.user.email ?? `seed-${session.user.id}`;
      knownUsers.set(key, { id: session.user.id, password: newPassword });
      notify({ type: 'USER_UPDATED', session });
    },
    async handleDeepLink() {
      // no-op for the fake; real recovery links are provider-driven
    },
    onAuthChange(cb) {
      listeners.add(cb);
      // GoTrue emits INITIAL_SESSION right after subscribe
      cb({ type: 'INITIAL_SESSION', session });
      return () => listeners.delete(cb);
    },
    emit(c) {
      if (c.type === 'SIGNED_IN' || c.type === 'TOKEN_REFRESHED' || c.type === 'USER_UPDATED') {
        session = c.session;
      } else if (c.type === 'SIGNED_OUT') {
        session = null;
      }
      notify(c);
    },
    failNext(code) {
      failNext = code;
    },
    currentUserId() {
      return session?.user.id ?? null;
    },
  };
}
