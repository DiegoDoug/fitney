/**
 * GoTrue-backed AuthPort (ADR-0009, SPEC AUTH-01/02). The ONLY implementation of
 * the `services/auth` seam that touches `@supabase/supabase-js`. Screens and
 * feature hooks never import this — they go through the runtime context, which
 * injects it (boundary lint: `only-remote-imports-supabase`).
 *
 * Session persistence, restoration, and token refresh are already configured on
 * the shared client (`data/remote/client.ts`): `storage: secureSessionStorage`
 * (expo-secure-store, chunked), `autoRefreshToken: true`, `persistSession: true`.
 * This file only surfaces the lifecycle + the imperative calls.
 *
 * NOTE: excluded from `tsconfig.logic.json` (needs the Supabase types + RN).
 * Typechecked in CI (client-verify full-app job); exercised against real GoTrue
 * by the hosted Auth smoke (deferred — needs DEP-1 client-link + redirect config).
 */
import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import {
  AuthError as PortAuthError,
  classifyAuthError,
  parseAuthUrl,
  type AuthChange,
  type AuthPort,
  type AuthSession,
} from '@/services/auth';

export type SupabaseAuthPortOptions = {
  /** deep link GoTrue sends confirmation / recovery links to (allow-listed in
   *  Supabase Auth settings — hosted config, routed to platform-release). */
  redirectTo?: string;
};

function toSession(s: Session | null): AuthSession | null {
  if (!s?.user) return null;
  return {
    user: { id: s.user.id, email: s.user.email ?? null },
    expiresAtMs: s.expires_at != null ? s.expires_at * 1000 : null,
  };
}

function mapEvent(event: AuthChangeEvent, session: Session | null): AuthChange | null {
  const s = toSession(session);
  switch (event) {
    case 'INITIAL_SESSION':
      return { type: 'INITIAL_SESSION', session: s };
    case 'SIGNED_IN':
      return s ? { type: 'SIGNED_IN', session: s } : null;
    case 'SIGNED_OUT':
      return { type: 'SIGNED_OUT' };
    case 'TOKEN_REFRESHED':
      return s ? { type: 'TOKEN_REFRESHED', session: s } : null;
    case 'USER_UPDATED':
      return s ? { type: 'USER_UPDATED', session: s } : null;
    case 'PASSWORD_RECOVERY':
      return { type: 'PASSWORD_RECOVERY', session: s };
    default:
      return null;
  }
}

function rethrow(err: { status?: number; code?: string; message?: string; name?: string } | null): never {
  const code = classifyAuthError(err ?? {});
  throw new PortAuthError(code, err?.message ?? code);
}

export function createSupabaseAuthPort(
  sb: SupabaseClient,
  opts: SupabaseAuthPortOptions = {},
): AuthPort {
  return {
    async getSession() {
      const { data, error } = await sb.auth.getSession();
      if (error) rethrow(error);
      return toSession(data.session);
    },

    async signUp(email, password) {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: opts.redirectTo ? { emailRedirectTo: opts.redirectTo } : undefined,
      });
      if (error) rethrow(error);
      const session = toSession(data.session);
      // GoTrue with enumeration protection returns a user object with an empty
      // `identities` array for an already-registered address, and no session.
      const obfuscatedExisting =
        !session && data.user != null && (data.user.identities?.length ?? 0) === 0;
      return {
        session,
        needsEmailConfirmation: session == null || obfuscatedExisting,
      };
    },

    async signIn(email, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) rethrow(error);
      const session = toSession(data.session);
      if (!session) rethrow({ code: 'unknown', message: 'no session returned' });
      return session;
    },

    async signOut() {
      const { error } = await sb.auth.signOut();
      if (error) rethrow(error);
    },

    async sendPasswordReset(email) {
      // errors are intentionally NOT surfaced here (enumeration safety); the
      // AuthFlow wrapper decides what the UI shows. Transport errors still throw.
      const { error } = await sb.auth.resetPasswordForEmail(
        email,
        opts.redirectTo ? { redirectTo: opts.redirectTo } : undefined,
      );
      if (error && classifyAuthError(error) === 'network') rethrow(error);
    },

    async updatePassword(newPassword) {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (error) rethrow(error);
    },

    async handleDeepLink(url) {
      const parsed = parseAuthUrl(url);
      if (!parsed) return;
      if (parsed.kind === 'tokens') {
        const { error } = await sb.auth.setSession({
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken,
        });
        if (error) rethrow(error);
      } else {
        const { error } = await sb.auth.exchangeCodeForSession(parsed.code);
        if (error) rethrow(error);
      }
    },

    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((event, session) => {
        const mapped = mapEvent(event, session);
        if (mapped) cb(mapped);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
