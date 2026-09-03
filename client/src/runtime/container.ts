/**
 * Composition root (system-architecture.md §6.4). Wires: expo-sqlite driver ->
 * migrations -> local repositories -> sync engine -> feature services -> the
 * services container. Screens receive this via React context; they never
 * construct data/* or touch Supabase directly (CON-5, ADR-0002).
 *
 * Not covered by the logic tsconfig (imports the native driver + gateway).
 * Typechecked in CI (client-verify).
 */
import { openDatabase } from '@/data/local/driver.native';
import { migrate } from '@/data/local/migrate';
import { createLocalRepositories } from '@/data/local/repositories';
import { createSupabaseGateway } from '@/data/remote/gateway';
import { getSupabase } from '@/data/remote/client';
import { SyncEngine } from '@/data/sync/engine';
import { SessionService } from '@/features/logging/session-service';
import { SetService } from '@/features/logging/set-service';
import { ExerciseSearch } from '@/features/library/exercise-search';
import { systemClock } from '@/services/clock';
import { createIdGenerator } from '@/services/ids';
import { consoleLogger } from '@/services/logger';
import { noopAnalytics } from '@/services/analytics';
import { noopHaptics } from '@/services/haptics';
import { configFromEnv } from '@/services/config';
import { fakeConnectivity } from '@/services/connectivity';
import type { Repositories } from '@/data/repositories/types';

export type AppContainer = {
  repos: Repositories;
  sync: SyncEngine;
  sessions: SessionService;
  sets: SetService;
  exerciseSearch: ExerciseSearch;
};

/**
 * `userId` scopes the DB file (ADR-0009 — per-user local DB, dropped on verified
 * sign-out). Call again with a new userId to switch users.
 */
export async function buildContainer(userId: string): Promise<AppContainer> {
  const db = await openDatabase(`fitney-${userId}.db`);
  await migrate(db);

  const clock = systemClock;
  const ids = createIdGenerator({ now: () => clock.now(), preferV7: true });
  const logger = consoleLogger;
  const config = configFromEnv(process.env as Record<string, string | undefined>);
  const connectivity = fakeConnectivity('online'); // TODO: expo-network adapter (WORK-008 batch)

  const repos = createLocalRepositories({ db, clock, ids });
  const gateway = createSupabaseGateway(getSupabase());
  const sync = new SyncEngine({ db, gateway, logger, config, clock, connectivity });

  const sessions = new SessionService(repos, { clock, ids, analytics: noopAnalytics, logger });
  const sets = new SetService(repos.performedSet, {
    clock,
    ids,
    analytics: noopAnalytics,
    haptics: noopHaptics,
  });
  const exerciseSearch = new ExerciseSearch(repos.exercise, { debounceMs: config.syncDebounceMs });

  return { repos, sync, sessions, sets, exerciseSearch };
}
