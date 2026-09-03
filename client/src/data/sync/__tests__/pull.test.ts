/**
 * Sync pull conformance (system-architecture.md §10.3, ADR-0003 §4):
 *   - incremental apply of a clean server row (cursor advances to last-applied)
 *   - tombstone apply (soft delete, never a hard delete)
 *   - LATE TRANSACTION COMMIT: a row that lands behind the incremental cursor is
 *     recovered by the full (id, version) reconciliation
 *   - a dirty local row overtaken on pull -> conflict preserved, then reconciled
 */
import { migrate } from '@/data/local/migrate';
import { runIncrementalPull, runFullReconciliation, reconciliationDue } from '@/data/sync/pull';
import { createTestDb } from '@/test/better-sqlite3-driver';
import { collectingLogger } from '@/services/logger';
import { FakeGateway } from '@/test/fake-gateway';
import { TEST_USER } from '@/test/harness';

const logger = () => collectingLogger();
const NOW = 1_000_000;

async function freshDb() {
  const db = createTestDb();
  await migrate(db);
  return db;
}

describe('sync pull', () => {
  it('incremental pull applies clean server rows and advances the cursor to the last applied', async () => {
    const db = await freshDb();
    const gw = new FakeGateway();
    gw.seed('exercise', { id: 'e1', owner_user_id: null, name: 'Squat', name_normalized: 'squat', tracking_mode: 'weight_reps', archived: false, aliases: [], primary_muscles: [], secondary_muscles: [], is_unilateral: false });
    gw.seed('exercise', { id: 'e2', owner_user_id: null, name: 'Bench', name_normalized: 'bench', tracking_mode: 'weight_reps', archived: false, aliases: [], primary_muscles: [], secondary_muscles: [], is_unilateral: false });

    const out = await runIncrementalPull({ db, gateway: gw, logger: logger(), entities: ['exercise'], nowMs: NOW });
    expect(out.applied).toBe(2);
    const rows = await db.getAllAsync<{ id: string; synced_version: number; dirty: number }>(`SELECT id, synced_version, dirty FROM exercises ORDER BY id`);
    expect(rows).toEqual([
      { id: 'e1', synced_version: 1, dirty: 0 },
      { id: 'e2', synced_version: 1, dirty: 0 },
    ]);
    const cursor = await db.getFirstAsync<{ last_pulled_id: string }>(`SELECT last_pulled_id FROM sync_state WHERE entity='exercise'`);
    expect(cursor!.last_pulled_id).toBe('e2');
  });

  it('applies a tombstone as a soft delete', async () => {
    const db = await freshDb();
    const gw = new FakeGateway();
    gw.seed('exercise', { id: 'e1', owner_user_id: null, name: 'Squat', name_normalized: 'squat', tracking_mode: 'weight_reps', archived: false, aliases: [], primary_muscles: [], secondary_muscles: [], is_unilateral: false });
    await runIncrementalPull({ db, gateway: gw, logger: logger(), entities: ['exercise'], nowMs: NOW });
    // server tombstones it — with a NEWER updated_at so the incremental feed sees it
    const srv = gw.rows.get('exercise')!.get('e1')!;
    const tombstoneTs = gw.tick();
    srv.deleted_at = tombstoneTs;
    srv.version = 2;
    srv.updated_at = tombstoneTs;

    const out = await runIncrementalPull({ db, gateway: gw, logger: logger(), entities: ['exercise'], nowMs: NOW + 1 });
    expect(out.tombstoned).toBe(1);
    const row = await db.getFirstAsync<{ deleted_at: string | null }>(`SELECT deleted_at FROM exercises WHERE id='e1'`);
    expect(row!.deleted_at).toBe(tombstoneTs); // soft; row still present
  });

  it('full reconciliation recovers a row a late transaction commit left behind the incremental cursor', async () => {
    const db = await freshDb();
    const gw = new FakeGateway();
    // e_late "committed" with an EARLY updated_at, e_new with a LATER one.
    gw.seed('exercise', { id: 'e_new', owner_user_id: null, name: 'New', name_normalized: 'new', tracking_mode: 'weight_reps', archived: false, aliases: [], primary_muscles: [], secondary_muscles: [], is_unilateral: false });
    gw.rows.get('exercise')!.get('e_new')!.updated_at = '2026-09-03T12:00:02Z';

    // incremental pull sees only e_new and advances the cursor past 12:00:02
    await runIncrementalPull({ db, gateway: gw, logger: logger(), entities: ['exercise'], nowMs: NOW });
    expect(await db.getAllAsync(`SELECT id FROM exercises`)).toEqual([{ id: 'e_new' }]);

    // NOW the late transaction becomes visible with an EARLIER timestamp (behind the cursor)
    gw.seed('exercise', { id: 'e_late', owner_user_id: null, name: 'Late', name_normalized: 'late', tracking_mode: 'weight_reps', archived: false, aliases: [], primary_muscles: [], secondary_muscles: [], is_unilateral: false });
    gw.rows.get('exercise')!.get('e_late')!.updated_at = '2026-09-03T12:00:01Z';

    // incremental pull cannot see it (behind the cursor)
    await runIncrementalPull({ db, gateway: gw, logger: logger(), entities: ['exercise'], nowMs: NOW + 1 });
    expect((await db.getAllAsync<{ id: string }>(`SELECT id FROM exercises ORDER BY id`)).map((r) => r.id)).toEqual(['e_new']);

    // full reconciliation (id, version) IS updated_at-independent -> recovers it
    const out = await runFullReconciliation({ db, gateway: gw, logger: logger(), entities: ['exercise'], nowMs: NOW + 2 });
    expect(out.applied).toBe(1);
    expect((await db.getAllAsync<{ id: string }>(`SELECT id FROM exercises ORDER BY id`)).map((r) => r.id)).toEqual(['e_late', 'e_new']);
    const st = await db.getFirstAsync<{ last_full_sync: number }>(`SELECT last_full_sync FROM sync_state WHERE entity='exercise'`);
    expect(st!.last_full_sync).toBe(NOW + 2);
  });

  it('a dirty local row overtaken by a newer server version parks/reconciles instead of silently overwriting', async () => {
    const db = await freshDb();
    const gw = new FakeGateway();
    await db.runAsync(
      `INSERT INTO plan_weeks (id, user_id, week_start_date, title, version, synced_version, dirty, local_updated_at)
       VALUES ('pw1', ?, '2026-08-31', 'my title', 1, 1, 1, 1)`,
      [TEST_USER],
    );
    gw.seed('plan_week', { id: 'pw1', user_id: TEST_USER, week_start_date: '2026-08-31', title: 'server title', notes: null, source_week_template_id: null, version: 4 });

    const out = await runIncrementalPull({ db, gateway: gw, logger: logger(), entities: ['plan_week'], nowMs: NOW });
    expect(out.conflicts).toBe(1);
    const conflict = await db.getFirstAsync<{ server_version: number }>(`SELECT server_version FROM sync_conflicts WHERE entity_id='pw1'`);
    expect(conflict!.server_version).toBe(4);
    // non-completed -> server applied as new base, row kept dirty for re-push
    const row = await db.getFirstAsync<{ title: string; dirty: number; synced_version: number }>(`SELECT title, dirty, synced_version FROM plan_weeks WHERE id='pw1'`);
    expect(row).toMatchObject({ title: 'server title', dirty: 1, synced_version: 4 });
  });

  it('reconciliationDue: null last-full-sync is due; within the window is not', () => {
    expect(reconciliationDue(null, 24, NOW)).toBe(true);
    expect(reconciliationDue(NOW - 23 * 3_600_000, 24, NOW)).toBe(false);
    expect(reconciliationDue(NOW - 25 * 3_600_000, 24, NOW)).toBe(true);
  });
});
