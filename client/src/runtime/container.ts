/**
 * Composition root — NATIVE half (system-architecture.md §6.4, ADR-0009).
 * Supplies the real `expo-sqlite` handle, the Supabase sync gateway, and the
 * GoTrue-backed AuthPort, then delegates all wiring to `assembleContainer`
 * (logic-safe, so account isolation is unit-testable).
 *
 * Not covered by the logic tsconfig (imports the native driver + Supabase). It
 * is typechecked in CI (client-verify full-app job).
 */
import * as Linking from 'expo-linking';
import { openDatabase, deleteDatabase, listRetainedUserIds } from '@/data/local/driver.native';
import { createSupabaseGateway } from '@/data/remote/gateway';
import { createSupabaseAuthPort } from '@/data/remote/auth-gateway';
import { getSupabase } from '@/data/remote/client';
import { assembleContainer, readOutstanding, type AppContainer } from './build-container';
import { systemClock } from '@/services/clock';
import { createIdGenerator } from '@/services/ids';
import { consoleLogger } from '@/services/logger';
import { noopAnalytics } from '@/services/analytics';
import { noopHaptics } from '@/services/haptics';
import { configFromEnv } from '@/services/config';
import { fakeConnectivity } from '@/services/connectivity';
import type { AuthPort } from '@/services/auth';

export type { AppContainer } from './build-container';

/** Per-user local DB file name (ADR-0009 — the file IS the isolation boundary). */
export function userDbName(userId: string): string {
  return `fitney-${userId}.db`;
}

/**
 * Build the runtime for `userId`. The DB is selected/opened only AFTER the local
 * account context is known (the driver — the auth controller — calls this only
 * once it has resolved a session).
 */
export async function buildContainer(userId: string): Promise<AppContainer> {
  const db = await openDatabase(userDbName(userId));
  const gateway = createSupabaseGateway(getSupabase());
  const clock = systemClock;

  return assembleContainer(userId, {
    db,
    gateway,
    clock,
    ids: createIdGenerator({ now: () => clock.now(), preferV7: true }),
    logger: consoleLogger,
    analytics: noopAnalytics,
    haptics: noopHaptics,
    config: configFromEnv(process.env as Record<string, string | undefined>),
    // TODO(WORK-008 batch): real expo-network connectivity adapter. A wrong
    // "online" hint never blocks logging (offline-first) — it only makes the
    // sync scheduler attempt a push.
    connectivity: fakeConnectivity('online'),
  });
}

/**
 * The GoTrue-backed AuthPort — constructed once, spans account transitions.
 * `redirectTo` is the deep link GoTrue sends confirmation / recovery links to;
 * it must be allow-listed in the Supabase project's Auth settings (hosted
 * config — routed to platform-release, SEC-C2).
 */
export function createAuthPort(): AuthPort {
  const redirectTo = Linking.createURL('/auth/callback');
  return createSupabaseAuthPort(getSupabase(), { redirectTo });
}

/**
 * Drop a user's per-user SQLite file (clean sign-out / account deletion —
 * ADR-0009). Only called by the auth controller AFTER `dispose()` has closed the
 * handle and the sign-out disposition policy has allowed it (never when unsynced
 * work exists — see account-lifecycle.decideSignOutDisposition).
 */
export async function deleteUserDatabase(userId: string): Promise<void> {
  await deleteDatabase(userDbName(userId));
}

/**
 * Discover retained per-user DB files on disk, excluding the active account
 * (CE-R5 v2 discovery — cold-boot-safe: re-derives from the files themselves,
 * not from in-memory state carried over a restart).
 */
export async function discoverRetainedAccounts(activeUserId: string | null): Promise<string[]> {
  return listRetainedUserIds(activeUserId);
}

/**
 * Count outstanding local work for a RETAINED (not-open) per-user file — for the
 * "Remove account from this device" confirmation (CE-R5 v2). Opens read-only,
 * counts, closes. Returns null if the file cannot be read (treated by the UI as
 * "unknown — any unsynced changes will be lost"), and never leaves a stray file.
 */
export async function outstandingForUser(
  userId: string,
): Promise<{ outbox: number; openConflicts: number } | null> {
  const name = userDbName(userId);
  let db: Awaited<ReturnType<typeof openDatabase>> | null = null;
  try {
    db = await openDatabase(name);
    return await readOutstanding(db);
  } catch {
    return null;
  } finally {
    if (db) {
      try {
        await db.closeAsync();
      } catch {
        /* ignore */
      }
    }
  }
}
