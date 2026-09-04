/**
 * Transaction rollback + row/outbox atomicity (SPEC §17.2, AR-RISK-4). A failure
 * mid-transaction must leave NEITHER the mirrored row NOR its outbox entry.
 */
import { runInTransaction } from '@/data/local/driver';
import { enqueueMutation } from '@/data/local/outbox-writer';
import { makeHarness, TEST_USER } from '@/test/harness';

describe('outbox atomicity', () => {
  it('a confirmed mutation writes the row + exactly one pending outbox entry', async () => {
    const { db } = await makeHarness();
    await runInTransaction(db, () =>
      enqueueMutation({
        db,
        entity: 'workout_session',
        entityId: 's1',
        op: 'upsert',
        row: {
          id: 's1',
          user_id: TEST_USER,
          name_snapshot: 'Lower A',
          started_at: '2026-09-03T12:00:00Z',
          status: 'active',
          timezone: 'UTC',
          version: 1,
          synced_version: null,
        },
        nowMs: 1,
        newOperationId: 'op-1',
      }),
    );

    const row = await db.getFirstAsync<{ id: string; dirty: number }>(
      `SELECT id, dirty FROM workout_sessions WHERE id = 's1'`,
    );
    expect(row).toMatchObject({ id: 's1', dirty: 1 });
    const obx = await db.getAllAsync(`SELECT * FROM sync_outbox WHERE entity_id = 's1'`);
    expect(obx).toHaveLength(1);
  });

  it('a throw inside the transaction rolls back BOTH the row and the outbox entry', async () => {
    const { db } = await makeHarness();
    await expect(
      runInTransaction(db, async () => {
        await enqueueMutation({
          db,
          entity: 'workout_session',
          entityId: 's2',
          op: 'upsert',
          row: {
            id: 's2',
            user_id: TEST_USER,
            name_snapshot: 'X',
            started_at: '2026-09-03T12:00:00Z',
            status: 'active',
            timezone: 'UTC',
            version: 1,
            synced_version: null,
          },
          nowMs: 1,
          newOperationId: 'op-2',
        });
        throw new Error('boom after enqueue');
      }),
    ).rejects.toThrow('boom');

    expect(await db.getFirstAsync(`SELECT id FROM workout_sessions WHERE id = 's2'`)).toBeNull();
    expect(await db.getAllAsync(`SELECT * FROM sync_outbox WHERE entity_id = 's2'`)).toHaveLength(0);
  });

  it('coalescing: a second edit to a row with a pending entry updates it in place (one operation_id)', async () => {
    const { db } = await makeHarness();
    const mk = (name: string, opId: string) =>
      runInTransaction(db, () =>
        enqueueMutation({
          db,
          entity: 'workout_session',
          entityId: 's3',
          op: 'upsert',
          row: {
            id: 's3',
            user_id: TEST_USER,
            name_snapshot: name,
            started_at: '2026-09-03T12:00:00Z',
            status: 'active',
            timezone: 'UTC',
            version: 1,
            synced_version: null,
          },
          nowMs: 1,
          newOperationId: opId,
        }),
      );
    await mk('first', 'op-a');
    await mk('second', 'op-b');

    const obx = await db.getAllAsync<{ operation_id: string; payload_json: string }>(
      `SELECT operation_id, payload_json FROM sync_outbox WHERE entity_id = 's3'`,
    );
    expect(obx).toHaveLength(1);
    expect(obx[0]!.operation_id).toBe('op-a'); // stable
    expect(JSON.parse(obx[0]!.payload_json).name_snapshot).toBe('second'); // coalesced latest
  });
});
