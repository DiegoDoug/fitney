/**
 * App runtime context (ADR-0009). Owns the account lifecycle:
 *
 *   AuthPort events  ->  decideAccountAction  ->  serialized transition
 *     activate(userId)        open per-user SQLite, wire the container, gate
 *                             onboarding, kick a first sync
 *     retire(userId)          stop sync, close the DB handle, apply the
 *                             sign-out disposition policy (drop vs retain), clear
 *                             account-scoped UI state
 *     retire-then-activate    account switch A -> B, fully serialized
 *
 * A monotonic GenerationGuard makes a late async result from account A inert
 * once the runtime has moved on — it can never write B's database or UI.
 *
 * `useRuntime()` keeps its original 3-state contract (loading | signed-out |
 * ready) so the existing tab/workout screens are untouched; the richer auth +
 * onboarding state is exposed through `useAuth()` / `useOnboarding()`.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { buildContainer as nativeBuildContainer, createAuthPort, deleteUserDatabase } from './container';
import type { AppContainer } from './build-container';
import {
  decideAccountAction,
  decideSignOutDisposition,
  GenerationGuard,
} from './account-lifecycle';
import { AuthFlow } from '@/features/auth/auth-flow';
import type { OnboardingInput, OnboardingDraft } from '@/features/onboarding/onboarding-service';
import { consoleLogger } from '@/services/logger';
import { noopAnalytics } from '@/services/analytics';
import { createFakeAuth, type AuthPort, type AuthUser } from '@/services/auth';

// ------------------------------------------------------------- public contract
export type RuntimeState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; userId: string; container: AppContainer };

const RuntimeContext = createContext<RuntimeState>({ status: 'loading' });

export function useRuntime(): RuntimeState {
  return useContext(RuntimeContext);
}

export function useContainer(): AppContainer {
  const s = useRuntime();
  if (s.status !== 'ready') throw new Error('container not ready');
  return s.container;
}

// ------------------------------------------------------------- auth contract
export type AuthPhase =
  | 'bootstrapping'
  | 'signed-out'
  | 'authenticating'
  | 'onboarding'
  | 'ready'
  | 'recovery'
  | 'error';

export type AuthContextValue = {
  phase: AuthPhase;
  user: AuthUser | null;
  /** transient container-init failure — the root shows a retry affordance */
  initError: string | null;
  /** a sign-out kept the local DB because unsynced work would have been lost */
  unsyncedNotice: boolean;
  dismissUnsyncedNotice(): void;
  retryInit(): void;

  signIn(email: string, password: string): ReturnType<AuthFlow['signIn']>;
  signUp(email: string, password: string, confirm: string): ReturnType<AuthFlow['signUp']>;
  sendPasswordReset(email: string): ReturnType<AuthFlow['sendPasswordReset']>;
  resetPassword(pw: string, confirm: string): ReturnType<AuthFlow['resetPassword']>;
  signOut(): Promise<void>;
  /** apply an inbound email-confirm / password-recovery deep link */
  handleAuthDeepLink(url: string): Promise<void>;

  /** onboarding: current prefill (partial/resumed) + submit */
  onboardingDraft: OnboardingDraft | null;
  completeOnboarding(input: OnboardingInput): Promise<void>;

  flow: AuthFlow;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth outside RuntimeProvider');
  return v;
}

export function useOnboarding(): { draft: OnboardingDraft | null; submit: (i: OnboardingInput) => Promise<void> } {
  const a = useAuth();
  return { draft: a.onboardingDraft, submit: a.completeOnboarding };
}

// ----------------------------------------------------------------- the driver
type InternalPhase =
  | { kind: 'bootstrapping' }
  | { kind: 'signed-out' }
  | { kind: 'authenticating' }
  | { kind: 'onboarding'; userId: string; container: AppContainer; draft: OnboardingDraft | null }
  | { kind: 'ready'; userId: string; container: AppContainer }
  | { kind: 'recovery' }
  | { kind: 'error'; message: string; retry: () => void };

export type RuntimeProviderProps = {
  children: ReactNode;
  /**
   * DEV-ONLY escape hatch. When set (and only in a non-production build), the
   * runtime skips real auth and boots straight into `devUserId`'s container with
   * a local-only fake session. This is an explicit developer opt-in via env var,
   * NOT an implicit guest fallback (AUTH-04) — there is no server session, so
   * sync stays local.
   */
  devUserId?: string | undefined;
  /** test seams */
  authPort?: AuthPort;
  buildContainer?: (userId: string) => Promise<AppContainer>;
  dropDatabase?: (userId: string) => Promise<void>;
};

export function RuntimeProvider({
  children,
  devUserId,
  authPort,
  buildContainer,
  dropDatabase,
}: RuntimeProviderProps) {
  const [phase, setPhase] = useState<InternalPhase>({ kind: 'bootstrapping' });
  const [unsyncedNotice, setUnsyncedNotice] = useState(false);

  // --- stable singletons ---------------------------------------------------
  const guardRef = useRef(new GenerationGuard());
  const activeRef = useRef<{ userId: string; container: AppContainer } | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const mountedRef = useRef(true);

  const buildFn = buildContainer ?? nativeBuildContainer;
  const dropFn = dropDatabase ?? deleteUserDatabase;

  const port = useMemo<AuthPort>(() => {
    if (authPort) return authPort;
    if (devUserId && process.env.NODE_ENV !== 'production') {
      consoleLogger.log('warn', 'runtime.dev_user_bypass', { note: 'EXPO_PUBLIC_DEV_USER_ID set — no server session' });
      return createFakeAuth({ initialSession: { user: { id: devUserId, email: null }, expiresAtMs: null } });
    }
    return createAuthPort();
  }, [authPort, devUserId]);

  const flow = useMemo(() => new AuthFlow(port, { logger: consoleLogger, analytics: noopAnalytics }), [port]);

  // --- transition primitives --------------------------------------------------
  const safeSetPhase = (p: InternalPhase) => {
    if (mountedRef.current) setPhase(p);
  };

  const retire = async (userId: string): Promise<void> => {
    const active = activeRef.current;
    activeRef.current = null;
    if (!active) return;
    let kept = false;
    try {
      const work = await active.container.outstandingWork();
      const disp = decideSignOutDisposition(work);
      await active.container.dispose();
      if (disp.dropLocalDb) {
        await dropFn(active.userId);
      } else {
        kept = true;
        consoleLogger.log('warn', 'runtime.signout.retain_db', { reason: disp.reason });
      }
    } catch (err) {
      consoleLogger.log('error', 'runtime.retire.failed', {
        error: err instanceof Error ? err.message.slice(0, 200) : 'unknown',
      });
    }
    void userId;
    if (mountedRef.current) setUnsyncedNotice(kept);
  };

  const activate = async (userId: string, gen: number): Promise<void> => {
    safeSetPhase({ kind: 'authenticating' });
    let container: AppContainer;
    try {
      container = await buildFn(userId);
    } catch (err) {
      if (!guardRef.current.isCurrent(gen)) return;
      const message = err instanceof Error ? err.message : 'container init failed';
      safeSetPhase({ kind: 'error', message, retry: () => void run({ type: 'SIGNED_IN', session: { user: { id: userId, email: null }, expiresAtMs: null } }) });
      return;
    }
    if (!guardRef.current.isCurrent(gen)) {
      // the runtime moved on while we were building — this container is stale.
      await container.dispose();
      return;
    }
    activeRef.current = { userId, container };

    let needsOnboarding = false;
    let draft: OnboardingDraft | null = null;
    try {
      const ob = await container.onboarding.getState(userId);
      needsOnboarding = ob.status === 'needed';
      draft = ob.status === 'needed' ? ob.draft : null;
    } catch (err) {
      consoleLogger.log('error', 'runtime.onboarding_gate.failed', {
        error: err instanceof Error ? err.message.slice(0, 200) : 'unknown',
      });
    }
    if (!guardRef.current.isCurrent(gen)) {
      await container.dispose();
      activeRef.current = null;
      return;
    }

    safeSetPhase(
      needsOnboarding
        ? { kind: 'onboarding', userId, container, draft }
        : { kind: 'ready', userId, container },
    );

    // first sync — never blocks the UI. On completion, if a hydrate pulled a
    // server-synced profile, promote onboarding -> ready for the same generation.
    void container.sync
      .requestSync('auth')
      .then(async () => {
        if (!guardRef.current.isCurrent(gen) || !needsOnboarding) return;
        try {
          const ob = await container.onboarding.getState(userId);
          if (ob.status === 'complete' && guardRef.current.isCurrent(gen)) {
            safeSetPhase({ kind: 'ready', userId, container });
          }
        } catch {
          /* keep the onboarding screen; the user can still fill it in */
        }
      })
      .catch(() => {});
  };

  // serialize every transition so A and B never interleave
  const run = (change: Parameters<typeof decideAccountAction>[1]): Promise<void> => {
    chainRef.current = chainRef.current.then(async () => {
      const action = decideAccountAction(activeRef.current?.userId ?? null, change);
      switch (action.kind) {
        case 'ignore':
          return;
        case 'recovery':
          safeSetPhase({ kind: 'recovery' });
          return;
        case 'activate': {
          const gen = guardRef.current.bump();
          await activate(action.userId, gen);
          return;
        }
        case 'retire': {
          guardRef.current.bump();
          await retire(action.retire);
          safeSetPhase({ kind: 'signed-out' });
          return;
        }
        case 'retire-then-activate': {
          const gen = guardRef.current.bump();
          await retire(action.retire);
          if (!guardRef.current.isCurrent(gen)) return;
          noopAnalytics.track({ name: 'account_switched' });
          await activate(action.userId, gen);
          return;
        }
      }
    });
    return chainRef.current;
  };

  // --- subscribe to auth lifecycle -----------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    const unsub = port.onAuthChange((c) => void run(c));
    return () => {
      mountedRef.current = false;
      unsub();
      // best-effort teardown on unmount (fast refresh / app exit)
      const a = activeRef.current;
      activeRef.current = null;
      if (a) void a.container.dispose();
    };
    // `run` / `activate` / `retire` are stable closures over refs — only `port`
    // is a real dependency. (react-hooks/exhaustive-deps is not configured.)
  }, [port]);

  // --- context value ------------------------------------------------------
  const publicState: RuntimeState = useMemo(() => {
    if (phase.kind === 'ready') return { status: 'ready', userId: phase.userId, container: phase.container };
    if (phase.kind === 'signed-out') return { status: 'signed-out' };
    return { status: 'loading' };
  }, [phase]);

  const authValue: AuthContextValue = useMemo(() => {
    const phaseName: AuthPhase =
      phase.kind === 'onboarding' ? 'onboarding' : phase.kind;
    return {
      phase: phaseName,
      user:
        phase.kind === 'ready' || phase.kind === 'onboarding'
          ? { id: phase.userId, email: null }
          : null,
      initError: phase.kind === 'error' ? phase.message : null,
      unsyncedNotice,
      dismissUnsyncedNotice: () => setUnsyncedNotice(false),
      retryInit: () => {
        if (phase.kind === 'error') phase.retry();
      },
      signIn: (e, p) => flow.signIn(e, p),
      signUp: (e, p, c) => flow.signUp(e, p, c),
      sendPasswordReset: (e) => flow.sendPasswordReset(e),
      resetPassword: (p, c) => flow.resetPassword(p, c),
      signOut: async () => {
        await flow.signOut();
        // the fake dev port may not emit; force a retire if still active
        if (activeRef.current) void run({ type: 'SIGNED_OUT' });
      },
      handleAuthDeepLink: async (url: string) => {
        try {
          await port.handleDeepLink(url);
        } catch (err) {
          consoleLogger.log('warn', 'auth.deeplink.failed', {
            error: err instanceof Error ? err.message.slice(0, 120) : 'unknown',
          });
        }
      },
      onboardingDraft: phase.kind === 'onboarding' ? phase.draft : null,
      completeOnboarding: async (input) => {
        if (phase.kind !== 'onboarding') return;
        const { userId, container } = phase;
        await container.onboarding.submit(userId, input);
        if (mountedRef.current && guardRef.current.isCurrent(guardRef.current.current())) {
          setPhase({ kind: 'ready', userId, container });
        }
        void container.sync.requestSync('auth').catch(() => {});
      },
      flow,
    };
  }, [phase, unsyncedNotice, flow]);

  return (
    <RuntimeContext.Provider value={publicState}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </RuntimeContext.Provider>
  );
}
