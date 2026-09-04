/**
 * Sync push conformance (system-architecture.md §10.2, ADR-0003 §3;
 * WORK-013 subset that needs no real Supabase):
 *   - outbox coalescing
 *   - dispatched retry with the SAME operation_id after a lost response
 *   - a dispatched predecessor with a pending successor -> successor re-based
 *   - transport failure AFTER server success -> stays dispatched, retry -> duplicate
 *   - conflict parking for completed-session changes (no auto re-issue)
 */
import { runInTransaction } from '@/data/local/driver';
import { enqueueMutation } from '@/data/local/outbox-writer';
import { runPush } from '@/data/sync/push';
import { makeHarness, insertProfile, TEST_USER } from '@/test/harness';
import { FakeGateway } from '@/test/fake-gateway';

const baseSessionRow = (over: Record<string, unknown>) => ({
  id: 's1',
  user_id: TEST_USER,
  name_snapshot: 'Lower A',
  started_at: '2026-09-03T12:00:00Z',
  status: 'active',
  timezone: 'UTC',
  version: 1,
  synced_version: null,
  ...over,
});

async function enqueue(db: import('@/data/local/driver').SqlDatabase, row: Record<string, unknown>, opId: string, op: 'upsert' | 'delete' = 'upsert') {
  await runInTransaction(db, () =>
    enqueueMutation({ db, entity: 'workout_session', entityId: String(row.id), op, row, nowMs: 1, newOperationId: opId }),
  );
}

describe('sync push', () => {
  it('applies a pending entry and clears dirty + advances synced_version', async () => {
    const h = await makeHarness();
    await insertProfile(h.db);
    const gw = new FakeGateway();
    await enqueue(h.db, baseSessionRow({}), 'op-1');

    const out = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 1000 });
    expect(out.applied).toBe(1);
    const row = await h.db.getFirstAsync<{ dirty: number; synced_version: number }>(
      `SELECT dirty, synced_version FROM workout_sessions WHERE id = 's1'`,
    );
    expect(row).toMatchObject({ dirty: 0, synced_version: 1 });
    expect(await h.db.getAllAsync(`SELECT * FROM sync_outbox`)).toHaveLength(0);
  });

  it('transport failure BEFORE apply keeps the entry dispatched with the same operation_id; retry succeeds', async () => {
    const h = await makeHarness();
    const gw = new FakeGateway();
    await enqueue(h.db, baseSessionRow({}), 'op-2');
    gw.failNext.set('op-2', 'transport');

    const first = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 1000 });
    expect(first.transportFailures).toBe(1);
    let obx = await h.db.getFirstAsync<{ state: string; operation_id: string; attempts: number }>(
      `SELECT state, operation_id, attempts FROM sync_outbox WHERE entity_id = 's1'`,
    );
    expect(obx).toMatchObject({ state: 'dispatched', operation_id: 'op-2' });
    expect(obx!.attempts).toBe(1);

    // retry (past next_attempt_at)
    const second = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 10_000_000 });
    expect(second.applied).toBe(1);
    expect(gw.applyLog.filter((r) => r.operationId === 'op-2')).toHaveLength(2); // same id both times
  });

  it('transport failure AFTER server success: entry stays dispatched, retry returns duplicate (exactly-once)', async () => {
    const h = await makeHarness();
    const gw = new FakeGateway();
    await enqueue(h.db, baseSessionRow({}), 'op-3');
    gw.failNext.set('op-3', 'transport-after-apply');

    await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 1000 });
    // server has the row at v1, client still has the dispatched entry
    expect(gw.rows.get('workout_session')!.get('s1')!.version).toBe(1);
    const obx1 = await h.db.getFirstAsync<{ state: string }>(`SELECT state FROM sync_outbox WHERE entity_id='s1'`);
    expect(obx1!.state).toBe('dispatched');

    const retry = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 10_000_000 });
    expect(retry.duplicate).toBe(1);
    expect(await h.db.getAllAsync(`SELECT * FROM sync_outbox`)).toHaveLength(0); // terminated
  });

  it('a dispatched predecessor + a pending successor: successor is NOT sent this pass, then re-based to the returned version', async () => {
    const h = await makeHarness();
    const gw = new FakeGateway();
    await enqueue(h.db, baseSessionRow({ name_snapshot: 'v1' }), 'op-A');
    gw.failNext.set('op-A', 'transport-after-apply');
    await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 1000 }); // op-A now dispatched

    // concurrent edit while op-A is dispatched -> a pending successor op-B
    await enqueue(h.db, baseSessionRow({ name_snapshot: 'v2' }), 'op-B');
    let entries = await h.db.getAllAsync<{ operation_id: string; state: string; base_version: number }>(
      `SELECT operation_id, state, base_version FROM sync_outbox WHERE entity_id='s1' ORDER BY seq`,
    );
    expect(entries.map((e) => `${e.operation_id}:${e.state}`)).toEqual(['op-A:dispatched', 'op-B:pending']);

    // this pass: op-A terminates (duplicate); op-B must NOT have been attempted yet
    const pass = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 10_000_000 });
    expect(pass.duplicate).toBe(1);
    const bAttemptsThisPass = gw.applyLog.filter((r) => r.operationId === 'op-B').length;
    expect(bAttemptsThisPass).toBe(0);

    entries = await h.db.getAllAsync(`SELECT operation_id, state, base_version FROM sync_outbox WHERE entity_id='s1'`);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ operation_id: 'op-B', state: 'pending', base_version: 1 }); // re-based to v1

    // next pass sends op-B and it applies to v2
    const finalPass = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 20_000_000 });
    expect(finalPass.applied).toBe(1);
    expect(gw.rows.get('workout_session')!.get('s1')!.version).toBe(2);
  });

  it('conflict on a COMPLETED session is parked (sync_conflicts) and NOT auto-re-issued', async () => {
    const h = await makeHarness();
    const gw = new FakeGateway();
    // local completed session, dirty edit; server already moved ahead to v2
    await h.db.runAsync(
      `INSERT INTO workout_sessions (id, user_id, name_snapshot, started_at, status, timezone, version, synced_version, dirty, local_updated_at)
       VALUES ('s1', ?, 'Lower A', '2026-09-03T12:00:00Z', 'completed', 'UTC', 1, 1, 1, 1)`,
      [TEST_USER],
    );
    gw.seed('workout_session', {
      id: 's1',
      user_id: TEST_USER,
      name_snapshot: 'server wins',
      started_at: '2026-09-03T12:00:00Z',
      status: 'completed',
      timezone: 'UTC',
      version: 2,
    });
    await enqueue(h.db, baseSessionRow({ status: 'completed', name_snapshot: 'my local edit', synced_version: 1 }), 'op-c');

    const out = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 1000 });
    expect(out.conflicts).toBe(1);
    expect(out.parked).toBe(1);

    const conflicts = await h.db.getAllAsync<{ entity_id: string }>(`SELECT entity_id FROM sync_conflicts WHERE resolved_at IS NULL`);
    expect(conflicts).toEqual([{ entity_id: 's1' }]);
    // server row applied as the new base; NOT dirty; NO new pending mutation
    const row = await h.db.getFirstAsync<{ name_snapshot: string; dirty: number; synced_version: number }>(
      `SELECT name_snapshot, dirty, synced_version FROM workout_sessions WHERE id='s1'`,
    );
    expect(row).toMatchObject({ name_snapshot: 'server wins', dirty: 0, synced_version: 2 });
    expect(await h.db.getAllAsync(`SELECT * FROM sync_outbox`)).toHaveLength(0);
  });

  it('a non-completed conflict auto-reconciles into exactly one pending entry', async () => {
    const h = await makeHarness();
    const gw = new FakeGateway();
    await h.db.runAsync(
      `INSERT INTO workout_sessions (id, user_id, name_snapshot, started_at, status, timezone, version, synced_version, dirty, local_updated_at)
       VALUES ('s1', ?, 'draft', '2026-09-03T12:00:00Z', 'active', 'UTC', 1, 1, 1, 1)`,
      [TEST_USER],
    );
    gw.seed('workout_session', {
      id: 's1', user_id: TEST_USER, name_snapshot: 'server', started_at: '2026-09-03T12:00:00Z',
      status: 'active', timezone: 'UTC', version: 3,
    });
    await enqueue(h.db, baseSessionRow({ name_snapshot: 'mine', synced_version: 1 }), 'op-nc');

    const out = await runPush({ db: h.db, gateway: gw, logger: h.logger, config: h.config, nowMs: 1000 });
    expect(out.conflicts).toBe(1);
    expect(out.parked).toBe(0);
    const obx = await h.db.getAllAsync<{ state: string; base_version: number }>(`SELECT state, base_version FROM sync_outbox WHERE entity_id='s1'`);
    expect(obx).toHaveLength(1);
    expect(obx[0]).toMatchObject({ state: 'pending', base_version: 3 });
  });
});
