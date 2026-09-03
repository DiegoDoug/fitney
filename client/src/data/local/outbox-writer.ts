/**
 * Atomic "mutate a mirrored row + enqueue/coalesce its outbox entry" — the core
 * of ADR-0003 §2/§7.2/§10.2. Callers run this INSIDE a transaction so the row
 * write and the outbox write commit together or not at all (outbox atomicity,
 * AR-RISK-4).
 *
 * Coalescing rules (system-architecture.md §7.2):
 *   - a `pending` entry already exists for (entity, entity_id)
 *       -> UPDATE its payload in place; keep operation_id + base_version.
 *   - only a `dispatched` entry exists (a request is in flight, no terminal result)
 *       -> INSERT a NEW `pending` successor: new operation_id,
 *          base_version = the dispatched entry's base_version.
 *          (A dispatched entry is immutable; the partial-unique index only
 *           covers `pending`, so predecessor + successor legally coexist.)
 *   - no entry exists
 *       -> INSERT a `pending` entry with base_version = the row's last-confirmed
 *          server version (synced_version), or 0 for a never-synced local row
 *          (the server treats an absent row as insert-if-absent -> version 1).
 */
import type { SqlDatabase } from './driver';
import { upsertRow } from './sql';
import { ENTITY_TABLE, type SyncEntity } from '@/domain/entities';

export type EnqueueArgs = {
  db: SqlDatabase;
  entity: SyncEntity;
  entityId: string;
  op: 'upsert' | 'delete';
  /** the coalesced latest FULL-row payload to sync (snake_case columns) */
  row: Record<string, unknown>;
  nowMs: number;
  newOperationId: string;
};

type OutboxRow = {
  seq: number;
  operation_id: string;
  state: 'pending' | 'dispatched';
  base_version: number;
};

/** Must be called inside an open transaction. */
export async function enqueueMutation(args: EnqueueArgs): Promise<void> {
  const { db, entity, entityId, op, row, nowMs, newOperationId } = args;
  const table = ENTITY_TABLE[entity];

  // 1. write the mirrored row (dirty; local ordering stamp)
  const localRow = { ...row, id: entityId, dirty: 1, local_updated_at: nowMs };
  await upsertRow(db, table, localRow);

  // 2. figure out the base_version + outbox coalescing target
  const existing = await db.getAllAsync<OutboxRow>(
    `SELECT seq, operation_id, state, base_version FROM sync_outbox
      WHERE entity = ? AND entity_id = ? ORDER BY seq`,
    [entity, entityId],
  );
  const pending = existing.find((e) => e.state === 'pending');
  const dispatched = existing.find((e) => e.state === 'dispatched');
  const payloadJson = JSON.stringify(row);

  if (pending) {
    // coalesce: latest state only; keep operation_id + base_version + op-escalation
    const nextOp = pending && op === 'delete' ? 'delete' : op;
    await db.runAsync(
      `UPDATE sync_outbox SET payload_json = ?, op = ? WHERE seq = ?`,
      [payloadJson, nextOp, pending.seq],
    );
    return;
  }

  let baseVersion: number;
  if (dispatched) {
    // successor of an in-flight op
    baseVersion = dispatched.base_version;
  } else {
    const meta = await db.getFirstAsync<{ synced_version: number | null }>(
      `SELECT synced_version FROM ${table} WHERE id = ?`,
      [entityId],
    );
    baseVersion = meta?.synced_version ?? 0;
  }

  await db.runAsync(
    `INSERT INTO sync_outbox
       (operation_id, entity, entity_id, op, payload_json, base_version, state, attempts, next_attempt_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 0, ?)`,
    [newOperationId, entity, entityId, op, payloadJson, baseVersion, nowMs],
  );
}
