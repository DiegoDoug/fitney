/**
 * Sync pull — system-architecture.md §10.3 / ADR-0003 §4. Two mechanisms:
 *
 *  A. incremental composite `(updated_at, id)` cursor  — latency path
 *  B. periodic full `(id, version)` reconciliation      — completeness guarantee
 *     (a late transaction commit can land behind the incremental cursor forever;
 *      only reconciliation, which is `updated_at`-independent, catches it).
 *
 * Apply rules (both): non-dirty local -> overwrite + set synced_version.
 * dirty local with server version != local synced_version -> conflict: preserve
 * the local payload in sync_conflicts first, then (non-completed) overwrite, or
 * (completed-session) park. `deleted_at` -> local tombstone, never a hard delete.
 */
import { ENTITY_TABLE, type SyncEntity } from '@/domain/entities';
import { runInTransaction, type SqlDatabase } from '@/data/local/driver';
import { upsertRow } from '@/data/local/sql';
import type { Logger } from '@/services/logger';
import { isCompletedSessionData } from './classify';
import type { PulledRow, ReconcileTuple, SyncGatewayPort } from './ports';

const PAGE = 200;

export type PullOutcome = { applied: number; tombstoned: number; conflicts: number; parked: number };

async function readCursor(
  db: SqlDatabase,
  entity: SyncEntity,
): Promise<{ updatedAt: string | null; id: string | null; lastFullSync: number | null }> {
  const row = await db.getFirstAsync<{
    last_pulled_updated_at: string | null;
    last_pulled_id: string | null;
    last_full_sync: number | null;
  }>(`SELECT last_pulled_updated_at, last_pulled_id, last_full_sync FROM sync_state WHERE entity = ?`, [
    entity,
  ]);
  return {
    updatedAt: row?.last_pulled_updated_at ?? null,
    id: row?.last_pulled_id ?? null,
    lastFullSync: row?.last_full_sync ?? null,
  };
}

async function writeCursor(
  db: SqlDatabase,
  entity: SyncEntity,
  updatedAt: string | null,
  id: string | null,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO sync_state (entity, last_pulled_updated_at, last_pulled_id)
       VALUES (?, ?, ?)
     ON CONFLICT(entity) DO UPDATE SET last_pulled_updated_at = excluded.last_pulled_updated_at,
                                       last_pulled_id = excluded.last_pulled_id`,
    [entity, updatedAt, id],
  );
}

async function applyRow(args: {
  db: SqlDatabase;
  logger: Logger;
  entity: SyncEntity;
  row: PulledRow;
  nowMs: number;
  outcome: PullOutcome;
}): Promise<void> {
  const { db, logger, entity, row, nowMs, outcome } = args;
  const table = ENTITY_TABLE[entity];
  const local = await db.getFirstAsync<{ dirty: number; synced_version: number | null }>(
    `SELECT dirty, synced_version FROM ${table} WHERE id = ?`,
    [row.id],
  );

  const isTombstone = row.deleted_at != null;

  if (!local || local.dirty === 0) {
    await runInTransaction(db, async () => {
      await upsertRow(db, table, {
        ...row,
        synced_version: row.version,
        dirty: 0,
        local_updated_at: nowMs,
      });
    });
    if (isTombstone) outcome.tombstoned += 1;
    else outcome.applied += 1;
    return;
  }

  // local is dirty
  if (row.version === local.synced_version) return; // nothing new server-side

  outcome.conflicts += 1;
  const parked = await isCompletedSessionData(db, entity, row.id, row);
  await runInTransaction(db, async () => {
    const localRow = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM ${table} WHERE id = ?`,
      [row.id],
    );
    await db.runAsync(
      `INSERT INTO sync_conflicts
        (entity, entity_id, local_payload, server_payload, local_base_version, server_version, detected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entity,
        row.id,
        JSON.stringify(localRow ?? {}),
        JSON.stringify(row),
        local.synced_version,
        row.version,
        nowMs,
      ],
    );
    if (parked) {
      // completed-session: drop any pending outbox entry, apply server as new base.
      await db.runAsync(`DELETE FROM sync_outbox WHERE entity = ? AND entity_id = ? AND state = 'pending'`, [
        entity,
        row.id,
      ]);
      await upsertRow(db, table, { ...row, synced_version: row.version, dirty: 0, local_updated_at: nowMs });
      outcome.parked += 1;
      logger.log('warn', 'sync.pull.conflict_parked', { entity, id: row.id });
    } else {
      // non-completed: server is the new base; the pending outbox entry (if any)
      // is re-based on the next push pass.
      await upsertRow(db, table, { ...row, synced_version: row.version, dirty: 1, local_updated_at: nowMs });
      await db.runAsync(
        `UPDATE sync_outbox SET base_version = ? WHERE entity = ? AND entity_id = ? AND state = 'pending'`,
        [row.version, entity, row.id],
      );
      logger.log('warn', 'sync.pull.conflict_reconciled', { entity, id: row.id });
    }
  });
}

export async function runIncrementalPull(args: {
  db: SqlDatabase;
  gateway: SyncGatewayPort;
  logger: Logger;
  entities: readonly SyncEntity[];
  nowMs: number;
}): Promise<PullOutcome> {
  const { db, gateway, logger, entities, nowMs } = args;
  const outcome: PullOutcome = { applied: 0, tombstoned: 0, conflicts: 0, parked: 0 };

  for (const entity of entities) {
    let cursor = await readCursor(db, entity);
    for (;;) {
      const page = await gateway.pullIncremental(
        entity,
        { updatedAt: cursor.updatedAt, id: cursor.id },
        PAGE,
      );
      if (page.length === 0) break;
      for (const row of page) {
        await applyRow({ db, logger, entity, row, nowMs, outcome });
        // advance to the LAST ROW APPLIED, not max(updated_at)
        cursor = { ...cursor, updatedAt: row.updated_at, id: row.id };
        await writeCursor(db, entity, row.updated_at, row.id);
      }
      if (page.length < PAGE) break;
    }
  }
  return outcome;
}

export async function runFullReconciliation(args: {
  db: SqlDatabase;
  gateway: SyncGatewayPort;
  logger: Logger;
  entities: readonly SyncEntity[];
  nowMs: number;
}): Promise<PullOutcome> {
  const { db, gateway, logger, entities, nowMs } = args;
  const outcome: PullOutcome = { applied: 0, tombstoned: 0, conflicts: 0, parked: 0 };

  for (const entity of entities) {
    const table = ENTITY_TABLE[entity];
    let afterId: string | null = null;
    const discrepancies: string[] = [];

    for (;;) {
      const page: ReconcileTuple[] = await gateway.reconcileProjection(entity, afterId, PAGE);
      if (page.length === 0) break;
      for (const t of page) {
        const local = await db.getFirstAsync<{ synced_version: number | null; dirty: number }>(
          `SELECT synced_version, dirty FROM ${table} WHERE id = ?`,
          [t.id],
        );
        if (!local || (t.version > (local.synced_version ?? -1) && local.dirty === 0)) {
          discrepancies.push(t.id);
        } else if (t.version > (local.synced_version ?? -1) && local.dirty === 1) {
          discrepancies.push(t.id); // will be handled as a conflict by applyRow
        }
        afterId = t.id;
      }
      if (page.length < PAGE) break;
    }

    for (let i = 0; i < discrepancies.length; i += 100) {
      const ids = discrepancies.slice(i, i + 100);
      const rows = await gateway.fetchByIds(entity, ids);
      for (const row of rows) {
        await applyRow({ db, logger, entity, row, nowMs, outcome });
      }
    }

    await db.runAsync(
      `INSERT INTO sync_state (entity, last_full_sync) VALUES (?, ?)
       ON CONFLICT(entity) DO UPDATE SET last_full_sync = excluded.last_full_sync`,
      [entity, nowMs],
    );
  }
  return outcome;
}

export function reconciliationDue(lastFullSyncMs: number | null, intervalHours: number, nowMs: number): boolean {
  if (lastFullSyncMs == null) return true;
  return nowMs - lastFullSyncMs >= intervalHours * 3_600_000;
}
