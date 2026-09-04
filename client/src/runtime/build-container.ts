/**
 * Per-user composition (system-architecture.md §6.4, ADR-0009). This is the
 * logic-safe half of the composition root: it takes an already-opened
 * `SqlDatabase` and a `SyncGatewayPort` (both injected) and wires the migration
 * runner, local repositories, sync engine, and feature services for ONE user.
 *
 * `container.ts` (native) supplies the real `expo-sqlite` handle + Supabase
 * gateway; logic tests supply a `better-sqlite3` DB + a fake gateway. Keeping the
 * wiring here (not in `container.ts`) is what makes account-isolation testable
 * without the RN toolchain.
 */
import { migrate } from '@/data/local/migrate';
import { createLocalRepositories } from '@/data/local/repositories';
import type { SqlDatabase } from '@/data/local/driver';
import { SyncEngine } from '@/data/sync/engine';
import type { SyncGatewayPort } from '@/data/sync/ports';
import { SessionService } from '@/features/logging/session-service';
import { SetService } from '@/features/logging/set-service';
import { ExerciseSearch } from '@/features/library/exercise-search';
import { OnboardingService } from '@/features/onboarding/onboarding-service';
import type { Repositories } from '@/data/repositories/types';
import type { Clock } from '@/services/clock';
import type { IdGenerator } from '@/services/ids';
import type { Logger } from '@/services/logger';
import type { Analytics } from '@/services/analytics';
import type { Haptics } from '@/services/haptics';
import type { Config } from '@/services/config';
import type { Connectivity } from '@/services/connectivity';

export type AppContainer = {
  /** the account this runtime belongs to — screens read it, never edit it */
  userId: string;
  repos: Repositories;
  sync: SyncEngine;
  sessions: SessionService;
  sets: SetService;
  exerciseSearch: ExerciseSearch;
  onboarding: OnboardingService;
  /** count of local work not yet acknowledged by the server (outbox + conflicts) */
  outstandingWork(): Promise<{ outbox: number; openConflicts: number }>;
  /** retire this runtime: stop sync, close the DB handle. Idempotent. */
  dispose(): Promise<void>;
};

export type ContainerDeps = {
  db: SqlDatabase;
  gateway: SyncGatewayPort;
  clock: Clock;
  ids: IdGenerator;
  logger: Logger;
  analytics: Analytics;
  haptics: Haptics;
  config: Config;
  connectivity: Connectivity;
};

export async function assembleContainer(userId: string, d: ContainerDeps): Promise<AppContainer> {
  await migrate(d.db);

  const repos = createLocalRepositories({ db: d.db, clock: d.clock, ids: d.ids });
  const sync = new SyncEngine({
    db: d.db,
    gateway: d.gateway,
    logger: d.logger,
    config: d.config,
    clock: d.clock,
    connectivity: d.connectivity,
  });

  const sessions = new SessionService(repos, {
    clock: d.clock,
    ids: d.ids,
    analytics: d.analytics,
    logger: d.logger,
  });
  const sets = new SetService(repos.performedSet, {
    clock: d.clock,
    ids: d.ids,
    analytics: d.analytics,
    haptics: d.haptics,
  });
  const exerciseSearch = new ExerciseSearch(repos.exercise, { debounceMs: d.config.syncDebounceMs });
  const onboarding = new OnboardingService(repos, {
    clock: d.clock,
    analytics: d.analytics,
    logger: d.logger,
  });

  let disposed = false;

  return {
    userId,
    repos,
    sync,
    sessions,
    sets,
    exerciseSearch,
    onboarding,
    async outstandingWork() {
      const obx = await d.db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM sync_outbox`);
      const cf = await d.db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM sync_conflicts WHERE resolved_at IS NULL`,
      );
      return { outbox: obx?.n ?? 0, openConflicts: cf?.n ?? 0 };
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      sync.stop();
      try {
        await d.db.closeAsync();
      } catch {
        // a close failure must not wedge the account transition
      }
    },
  };
}
