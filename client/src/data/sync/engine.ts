/**
 * Sync engine orchestrator + single-flight scheduler (system-architecture.md
 * §10.1). Triggers: after auth, on foreground, on connectivity restore, on
 * manual retry, on debounced local change. Overlapping runs are coalesced.
 *
 * A sync FAILURE never blocks logging (NFR-OFFLINE / NFR-RELIABILITY): errors are
 * caught, logged, and surfaced via the SyncIndicator state — the workout screen
 * keeps working from SQLite.
 */
import type { SyncEntity } from '@/domain/entities';
import { ENTITY_TIER } from '@/domain/entities';
import type { SqlDatabase } from '@/data/local/driver';
import type { Logger } from '@/services/logger';
import type { Config } from '@/services/config';
import type { Connectivity } from '@/services/connectivity';
import type { Clock } from '@/services/clock';
import { runPush, type PushOutcome } from './push';
import {
  reconciliationDue,
  runFullReconciliation,
  runIncrementalPull,
  type PullOutcome,
} from './pull';
import type { SyncGatewayPort } from './ports';

export type SyncIndicatorState = 'saved' | 'syncing' | 'offline' | 'needs_attention';

export type SyncRunResult = {
  push: PushOutcome;
  pull: PullOutcome;
  reconciled: boolean;
  indicator: SyncIndicatorState;
  error?: string;
};

const ALL_ENTITIES: readonly SyncEntity[] = (
  Object.keys(ENTITY_TIER) as SyncEntity[]
).sort((a, b) => ENTITY_TIER[a] - ENTITY_TIER[b]);

export type SyncTrigger = 'auth' | 'foreground' | 'connectivity' | 'manual' | 'local-change' | 'cold-start';

export class SyncEngine {
  private running: Promise<SyncRunResult> | null = null;
  private queuedTrigger: SyncTrigger | null = null;
  private indicator: SyncIndicatorState = 'saved';

  constructor(
    private readonly deps: {
      db: SqlDatabase;
      gateway: SyncGatewayPort;
      logger: Logger;
      config: Config;
      clock: Clock;
      connectivity: Connectivity;
      entities?: readonly SyncEntity[];
    },
  ) {}

  getIndicator(): SyncIndicatorState {
    return this.indicator;
  }

  /** Single-flight: a request while a run is active is coalesced into one re-run. */
  async requestSync(trigger: SyncTrigger): Promise<SyncRunResult> {
    if (this.running) {
      this.queuedTrigger = trigger;
      return this.running;
    }
    this.running = this.run(trigger).finally(() => {
      this.running = null;
      const q = this.queuedTrigger;
      this.queuedTrigger = null;
      if (q) void this.requestSync(q);
    });
    return this.running;
  }

  private async run(trigger: SyncTrigger): Promise<SyncRunResult> {
    const { db, gateway, logger, config, clock, connectivity } = this.deps;
    const entities = this.deps.entities ?? ALL_ENTITIES;
    const nowMs = clock.now();

    if (connectivity.current() === 'offline') {
      this.indicator = 'offline';
      return {
        push: emptyPush(),
        pull: emptyPull(),
        reconciled: false,
        indicator: 'offline',
      };
    }

    this.indicator = 'syncing';
    try {
      const push = await runPush({ db, gateway, logger, config, nowMs });

      const doReconcile =
        trigger === 'cold-start' ||
        trigger === 'manual' ||
        (await this.reconcileDue(entities[0] ?? 'profile', config, nowMs));

      const pull = doReconcile
        ? await runFullReconciliation({ db, gateway, logger, entities, nowMs })
        : await runIncrementalPull({ db, gateway, logger, entities, nowMs });

      // always keep the incremental cursor fresh even after a reconcile
      if (doReconcile) {
        await runIncrementalPull({ db, gateway, logger, entities, nowMs });
      }

      const hasConflicts = await this.openConflictCount();
      const stillQueued = await this.outstandingCount();
      this.indicator =
        hasConflicts > 0 ? 'needs_attention' : stillQueued > 0 ? 'syncing' : 'saved';

      return { push, pull, reconciled: doReconcile, indicator: this.indicator };
    } catch (err) {
      this.indicator = 'needs_attention';
      const msg = err instanceof Error ? err.message : String(err);
      logger.log('error', 'sync.run.failed', { trigger, error: msg.slice(0, 300) });
      return {
        push: emptyPush(),
        pull: emptyPull(),
        reconciled: false,
        indicator: 'needs_attention',
        error: msg,
      };
    }
  }

  private async reconcileDue(entity: SyncEntity, config: Config, nowMs: number): Promise<boolean> {
    const row = await this.deps.db.getFirstAsync<{ last_full_sync: number | null }>(
      `SELECT last_full_sync FROM sync_state WHERE entity = ?`,
      [entity],
    );
    return reconciliationDue(row?.last_full_sync ?? null, config.fullReconcileIntervalHours, nowMs);
  }

  private async openConflictCount(): Promise<number> {
    const r = await this.deps.db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM sync_conflicts WHERE resolved_at IS NULL`,
    );
    return r?.n ?? 0;
  }

  private async outstandingCount(): Promise<number> {
    const r = await this.deps.db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM sync_outbox`);
    return r?.n ?? 0;
  }
}

function emptyPush(): PushOutcome {
  return { attempted: 0, applied: 0, duplicate: 0, conflicts: 0, parked: 0, rejected: 0, transportFailures: 0 };
}
function emptyPull(): PullOutcome {
  return { applied: 0, tombstoned: 0, conflicts: 0, parked: 0 };
}
