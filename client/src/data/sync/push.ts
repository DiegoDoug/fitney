/**
 * Sync push — system-architecture.md §10.2 / ADR-0003 §3. A dispatched operation
 * is IMMUTABLE until a terminal protocol result (`applied` | `duplicate` |
 * `conflict`). Transport error / 5xx / timeout is NON-terminal: the entry stays
 * `dispatched` and is retried with the SAME `operation_id`.
 *
 * Select order: `dispatched` (due) first, then `pending`; within that, by
 * dependency tier then `seq` (a dispatched predecessor always retries before its
 * pending successor).
 */
import { ENTITY_TABLE, ENTITY_TIER, type SyncEntity } from '@/domain/entities';
import type { SqlDatabase } from '@/data/local/driver';
import { runInTransaction } from '@/data/local/driver';
import { upsertRow } from '@/data/local/sql';
import type { Logger } from '@/services/logger';
import type { Config } from '@/services/config';
import { isCompletedSessionData } from './classify';
import { TransportError, type SyncApplyResult, type SyncGatewayPort } from './ports';

type OutboxEntry = {
  seq: number;
  operation_id: string;
  entity: SyncEntity;
  entity_id: string;
  op: 'upsert' | 'delete';
  payload_json: string;
  base_version: number;
  state: 'pending' | 'dispatched';
  attempts: number;
};

export type PushOutcome = {
  attempted: number;
  applied: number;
  duplicate: number;
  conflicts: number;
  parked: number;
  rejected: number;
  transportFailures: number;
};

function backoff(cfg: Config, attempts: number): number {
  const base = cfg.retryBackoffBaseMs * 2 ** Math.min(attempts, 10);
  const jitter = Math.floor(base * 0.2 * Math.random());
  return Math.min(base + jitter, cfg.retryBackoffMaxMs);
}

async function dueEntries(db: SqlDatabase, nowMs: number): Promise<OutboxEntry[]> {
  const rows = await db.getAllAsync<OutboxEntry>(
    `SELECT * FROM sync_outbox
      WHERE (state = 'dispatched' AND next_attempt_at <= ?)
         OR state = 'pending'
      ORDER BY (state = 'dispatched') DESC, seq ASC`,
    [nowMs],
  );
  // stable sort by (dispatched-first already applied) then dependency tier then seq
  return rows.sort((a, b) => {
    if ((a.state === 'dispatched') !== (b.state === 'dispatched')) {
      return a.state === 'dispatched' ? -1 : 1;
    }
    const ta = ENTITY_TIER[a.entity];
    const tb = ENTITY_TIER[b.entity];
    if (ta !== tb) return ta - tb;
    return a.seq - b.seq;
  });
}

function pendingSuccessor(all: OutboxEntry[], o1: OutboxEntry): OutboxEntry | undefined {
  return all.find(
    (e) => e.entity === o1.entity && e.entity_id === o1.entity_id && e.state === 'pending' && e.seq !== o1.seq,
  );
}

export async function runPush(args: {
  db: SqlDatabase;
  gateway: SyncGatewayPort;
  logger: Logger;
  config: Config;
  nowMs: number;
}): Promise<PushOutcome> {
  const { db, gateway, logger, config, nowMs } = args;
  const outcome: PushOutcome = {
    attempted: 0,
    applied: 0,
    duplicate: 0,
    conflicts: 0,
    parked: 0,
    rejected: 0,
    transportFailures: 0,
  };

  const all = await dueEntries(db, nowMs);
  // don't push a pending successor in the same pass as its live dispatched predecessor
  const blocked = new Set<string>();
  for (const e of all) {
    if (e.state === 'dispatched') blocked.add(`${e.entity}:${e.entity_id}`);
  }

  for (const o1 of all) {
    if (o1.state === 'pending' && blocked.has(`${o1.entity}:${o1.entity_id}`)) continue;
    outcome.attempted += 1;

    // mark dispatched (no-op if already) BEFORE the request, so a crash mid-send
    // leaves it recoverable with the same operation_id.
    if (o1.state === 'pending') {
      await db.runAsync(`UPDATE sync_outbox SET state = 'dispatched' WHERE seq = ?`, [o1.seq]);
      o1.state = 'dispatched';
    }

    let result: SyncApplyResult;
    try {
      result = await gateway.apply({
        operationId: o1.operation_id,
        entity: o1.entity,
        entityId: o1.entity_id,
        op: o1.op,
        payload: JSON.parse(o1.payload_json) as Record<string, unknown>,
        baseVersion: o1.base_version,
      });
    } catch (err) {
      if (err instanceof TransportError) {
        // NON-terminal: stays dispatched, same operation_id, bump attempts.
        outcome.transportFailures += 1;
        await db.runAsync(
          `UPDATE sync_outbox SET attempts = attempts + 1, next_attempt_at = ?, last_error = ? WHERE seq = ?`,
          [nowMs + backoff(config, o1.attempts + 1), String(err.message).slice(0, 500), o1.seq],
        );
        logger.log('warn', 'sync.push.transport_failure', { entity: o1.entity, attempts: o1.attempts + 1 });
        continue;
      }
      throw err;
    }

    await applyTerminalAck({ db, config, logger, o1, all, result, nowMs, gateway, outcome });
  }

  return outcome;
}

/** One local transaction, successor-aware (system-architecture.md §10.2 step 3). */
async function applyTerminalAck(a: {
  db: SqlDatabase;
  config: Config;
  logger: Logger;
  o1: OutboxEntry;
  all: OutboxEntry[];
  result: SyncApplyResult;
  nowMs: number;
  gateway: SyncGatewayPort;
  outcome: PushOutcome;
}): Promise<void> {
  const { db, logger, o1, all, result, nowMs, outcome } = a;
  const table = ENTITY_TABLE[o1.entity];
  const o2 = pendingSuccessor(all, o1);

  if (result.status === 'rejected') {
    // malformed payload — a bug, not a conflict. Keep the local edit, surface it,
    // stop retrying this exact entry (drop it; the dirty row stays for the user).
    outcome.rejected += 1;
    await db.runAsync(`DELETE FROM sync_outbox WHERE seq = ?`, [o1.seq]);
    logger.log('error', 'sync.push.rejected', { entity: o1.entity, entity_id: o1.entity_id });
    return;
  }

  if (result.status === 'applied' || result.status === 'duplicate') {
    const v = result.version;
    outcome[result.status === 'applied' ? 'applied' : 'duplicate'] += 1;
    await runInTransaction(db, async () => {
      await db.runAsync(`DELETE FROM sync_outbox WHERE seq = ?`, [o1.seq]);
      if (o2) {
        // re-base the successor; keep its operation_id + payload; row stays dirty.
        await db.runAsync(`UPDATE sync_outbox SET base_version = ? WHERE seq = ?`, [v ?? 0, o2.seq]);
      } else {
        await db.runAsync(
          `UPDATE ${table} SET synced_version = ?, dirty = 0 WHERE id = ?`,
          [v, o1.entity_id],
        );
      }
    });
    return;
  }

  // status === 'conflict'
  outcome.conflicts += 1;
  const serverRow = result.row;
  const serverVersion = result.version;
  const losingPayload = o2 ? JSON.parse(o2.payload_json) : JSON.parse(o1.payload_json);
  const parked = await isCompletedSessionData(db, o1.entity, o1.entity_id, serverRow);

  await runInTransaction(db, async () => {
    await db.runAsync(
      `INSERT INTO sync_conflicts
        (entity, entity_id, local_payload, server_payload, local_base_version, server_version, detected_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        o1.entity,
        o1.entity_id,
        JSON.stringify(losingPayload),
        JSON.stringify(serverRow),
        o1.base_version,
        serverVersion,
        nowMs,
      ],
    );
    await db.runAsync(`DELETE FROM sync_outbox WHERE seq = ?`, [o1.seq]);

    if (parked) {
      // drop O2, apply the server row as the new base, NOT dirty, no new mutation.
      if (o2) await db.runAsync(`DELETE FROM sync_outbox WHERE seq = ?`, [o2.seq]);
      await upsertRow(db, table, {
        ...serverRow,
        synced_version: serverVersion,
        dirty: 0,
        local_updated_at: nowMs,
      });
      outcome.parked += 1;
      logger.log('warn', 'sync.conflict.parked', { entity: o1.entity, entity_id: o1.entity_id });
      return;
    }

    // non-completed: auto-reconcile. Server row is the new base; the local change
    // is re-applied on top as exactly one pending entry (MVP: always "still
    // meaningful" — never silently drop a user edit; FR-SYNC-04).
    await upsertRow(db, table, {
      ...serverRow,
      synced_version: serverVersion,
      dirty: 1,
      local_updated_at: nowMs,
    });
    if (o2) {
      // re-base the existing successor to the new server version
      await db.runAsync(`UPDATE sync_outbox SET base_version = ? WHERE seq = ?`, [serverVersion, o2.seq]);
    } else {
      // create exactly one fresh pending entry carrying the reconciled change
      await db.runAsync(
        `INSERT INTO sync_outbox
           (operation_id, entity, entity_id, op, payload_json, base_version, state, attempts, next_attempt_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 0, ?)`,
        [
          `${o1.operation_id}-r`,
          o1.entity,
          o1.entity_id,
          o1.op,
          JSON.stringify(losingPayload),
          serverVersion,
          nowMs,
        ],
      );
    }
    logger.log('warn', 'sync.conflict.auto_reconciled', { entity: o1.entity, entity_id: o1.entity_id });
  });
}
