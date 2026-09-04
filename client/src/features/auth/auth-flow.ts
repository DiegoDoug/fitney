/**
 * AuthFlow — feature-level wrapper the auth screens drive (through the runtime
 * context). It owns: form-shaped calls into the injected `AuthPort`, mapping
 * provider failures to a stable `{ ok:false, code, message }` result the UI can
 * render, enumeration-safe messaging (SEC-REQ-AUTH-03), and non-sensitive
 * logging/analytics. It NEVER logs the email, password, or a token.
 *
 * `features/*` may depend on `services/*` interfaces only — the concrete
 * GoTrue-backed `AuthPort` is injected by the composition root (boundary lint).
 */
import {
  AuthError,
  authErrorMessage,
  classifyAuthError,
  ENUMERATION_SENSITIVE,
  normalizeEmail,
  validateSignInForm,
  validateSignUpForm,
  hasErrors,
  type AuthErrorCode,
  type AuthPort,
  type FieldErrors,
} from '@/services/auth';
import type { Analytics } from '@/services/analytics';
import type { Logger } from '@/services/logger';

export type AuthActionResult =
  | { ok: true }
  | { ok: false; code: AuthErrorCode; message: string; enumerationSensitive: boolean };

export type SignUpOutcome =
  | { ok: true; needsEmailConfirmation: boolean; signedIn: boolean }
  | { ok: false; code: AuthErrorCode; message: string; enumerationSensitive: boolean };

function fail(code: AuthErrorCode): { ok: false; code: AuthErrorCode; message: string; enumerationSensitive: boolean } {
  return { ok: false, code, message: authErrorMessage(code), enumerationSensitive: ENUMERATION_SENSITIVE.has(code) };
}

function toCode(err: unknown): AuthErrorCode {
  if (err instanceof AuthError) return err.code;
  if (err && typeof err === 'object') {
    return classifyAuthError(err as { status?: number; code?: string; message?: string; name?: string });
  }
  return 'unknown';
}

export class AuthFlow {
  constructor(
    private readonly auth: AuthPort,
    private readonly svc: { logger: Logger; analytics: Analytics },
  ) {}

  validateSignIn(email: string, password: string): FieldErrors {
    return validateSignInForm(email, password);
  }
  validateSignUp(email: string, password: string, confirm: string): FieldErrors {
    return validateSignUpForm(email, password, confirm);
  }

  async signIn(email: string, password: string): Promise<AuthActionResult> {
    const errs = validateSignInForm(email, password);
    if (hasErrors(errs)) return fail('invalid_credentials');
    try {
      await this.auth.signIn(normalizeEmail(email), password);
      this.svc.analytics.track({ name: 'signed_in' });
      this.svc.logger.log('info', 'auth.sign_in.ok');
      return { ok: true };
    } catch (err) {
      const code = toCode(err);
      this.svc.logger.log('warn', 'auth.sign_in.fail', { code });
      return fail(code);
    }
  }

  async signUp(email: string, password: string, confirm: string): Promise<SignUpOutcome> {
    const errs = validateSignUpForm(email, password, confirm);
    if (hasErrors(errs)) {
      const first = (errs.email && 'invalid_credentials') || (errs.password && 'weak_password') || 'unknown';
      return fail(first as AuthErrorCode);
    }
    try {
      const res = await this.auth.signUp(normalizeEmail(email), password);
      this.svc.logger.log('info', 'auth.sign_up.ok', {
        needsEmailConfirmation: res.needsEmailConfirmation,
      });
      return {
        ok: true,
        needsEmailConfirmation: res.needsEmailConfirmation,
        signedIn: res.session != null,
      };
    } catch (err) {
      const code = toCode(err);
      this.svc.logger.log('warn', 'auth.sign_up.fail', { code });
      return fail(code);
    }
  }

  /** Always reports success to the UI — the neutral "if an account exists…" copy
   *  is shown regardless (no enumeration). Real transport failures still surface. */
  async sendPasswordReset(email: string): Promise<AuthActionResult> {
    try {
      await this.auth.sendPasswordReset(normalizeEmail(email));
      this.svc.logger.log('info', 'auth.reset.requested');
      return { ok: true };
    } catch (err) {
      const code = toCode(err);
      if (code === 'network' || code === 'over_request_rate_limit') return fail(code);
      // any other failure is swallowed to a uniform success (SEC-REQ-AUTH-03)
      this.svc.logger.log('warn', 'auth.reset.suppressed', { code });
      return { ok: true };
    }
  }

  async resetPassword(newPassword: string, confirm: string): Promise<AuthActionResult> {
    if (newPassword.length < 8) return fail('weak_password');
    if (newPassword !== confirm) return fail('weak_password');
    try {
      await this.auth.updatePassword(newPassword);
      this.svc.logger.log('info', 'auth.password_updated');
      return { ok: true };
    } catch (err) {
      const code = toCode(err);
      this.svc.logger.log('warn', 'auth.password_update.fail', { code });
      return fail(code);
    }
  }

  async signOut(): Promise<AuthActionResult> {
    try {
      await this.auth.signOut();
      this.svc.analytics.track({ name: 'signed_out' });
      this.svc.logger.log('info', 'auth.sign_out.ok');
      return { ok: true };
    } catch (err) {
      const code = toCode(err);
      this.svc.logger.log('warn', 'auth.sign_out.fail', { code });
      // a failed network sign-out still clears the local session on the provider
      // side eventually; the runtime treats the local teardown as authoritative.
      return fail(code);
    }
  }
}
