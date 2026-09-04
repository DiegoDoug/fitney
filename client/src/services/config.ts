/**
 * Config / feature flags — system-architecture.md §14. Deferred/tunable
 * decisions are flags, not rewrites: guest mode (OQ-3), dark-mode-at-launch
 * (OQ-8), the full-reconcile interval (§10.3.2).
 */
export interface Config {
  readonly guestModeEnabled: boolean;
  readonly darkModeAtLaunch: boolean;
  /** §10.3.2 — how stale `last_full_sync` may get before a foreground reconcile */
  readonly fullReconcileIntervalHours: number;
  /** debounce for local-change-triggered sync */
  readonly syncDebounceMs: number;
  /** sync push retry backoff base + cap (ms) */
  readonly retryBackoffBaseMs: number;
  readonly retryBackoffMaxMs: number;
  /** default rest timer if the profile has none yet (SPEC AUTH-03) */
  readonly defaultRestSeconds: number;
  /** prefer UUIDv7 for entity ids (AR-OQ-1) */
  readonly preferUuidV7: boolean;
}

export const defaultConfig: Config = {
  guestModeEnabled: false,
  darkModeAtLaunch: true,
  fullReconcileIntervalHours: 24,
  syncDebounceMs: 800,
  retryBackoffBaseMs: 2_000,
  retryBackoffMaxMs: 5 * 60_000,
  defaultRestSeconds: 120,
  preferUuidV7: true,
};

export function configFromEnv(env: Record<string, string | undefined>): Config {
  const num = (v: string | undefined, d: number) => {
    const n = v == null ? NaN : Number(v);
    return Number.isFinite(n) ? n : d;
  };
  return {
    ...defaultConfig,
    fullReconcileIntervalHours: num(
      env.EXPO_PUBLIC_FULL_RECONCILE_INTERVAL_HOURS,
      defaultConfig.fullReconcileIntervalHours,
    ),
  };
}
