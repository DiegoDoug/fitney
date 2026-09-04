/**
 * Migration matrix (ADR-0006, SPEC §17.2): fresh create at HEAD, a re-run is a
 * no-op, and the ledger tracks applied ids. Upgrade-from-prior-version is
 * exercised by applying a truncated chain then the full chain.
 */
import { migrate, currentSchemaVersion } from '@/data/local/migrate';
import { MIGRATIONS } from '@/data/local/schema/migrations';
import { createTestDb } from '@/test/better-sqlite3-driver';

describe('local migration runner', () => {
  it('fresh install applies the whole chain', async () => {
    const db = createTestDb();
    const res = await migrate(db);
    expect(res.from).toBe(0);
    expect(res.to).toBe(MIGRATIONS[MIGRATIONS.length - 1]!.id);
    expect(res.applied).toEqual(MIGRATIONS.map((m) => m.id));

    const tables = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`,
    );
    const names = tables.map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(['workout_sessions', 'performed_sets', 'sync_outbox', 'sync_state', 'sync_conflicts', 'schema_migrations']));
    await db.closeAsync();
  });

  it('re-running migrate is a no-op (forward-only, idempotent runner)', async () => {
    const db = createTestDb();
    await migrate(db);
    const second = await migrate(db);
    expect(second.applied).toEqual([]);
    expect(await currentSchemaVersion(db)).toBe(MIGRATIONS[MIGRATIONS.length - 1]!.id);
    await db.closeAsync();
  });

  it('applies the missing tail on upgrade', async () => {
    const db = createTestDb();
    // simulate an older install: apply only migration 1
    await migrate(db, MIGRATIONS.slice(0, 1));
    const before = await currentSchemaVersion(db);
    expect(before).toBe(1);
    // now the full chain — only ids > 1 apply
    const res = await migrate(db, MIGRATIONS);
    expect(res.from).toBe(1);
    expect(res.applied.every((id) => id > 1)).toBe(true);
    await db.closeAsync();
  });

  it('the one-active-session partial-unique index exists', async () => {
    const db = createTestDb();
    await migrate(db);
    const idx = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='index' AND name='workout_sessions_one_active_uidx'`,
    );
    expect(idx).toHaveLength(1);
    await db.closeAsync();
  });

  it('m0002 adds the local-only onboarding marker to profiles (fresh + upgrade paths)', async () => {
    const hasCol = async (db: Awaited<ReturnType<typeof createTestDb>>) => {
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(profiles)`);
      return cols.some((c) => c.name === 'onboarding_completed_at');
    };

    // fresh install at HEAD
    const fresh = createTestDb();
    await migrate(fresh);
    expect(await hasCol(fresh)).toBe(true);
    await fresh.closeAsync();

    // upgrade from a v1-only install
    const upgraded = createTestDb();
    await migrate(upgraded, MIGRATIONS.slice(0, 1));
    expect(await hasCol(upgraded)).toBe(false);
    const res = await migrate(upgraded, MIGRATIONS);
    expect(res.from).toBe(1);
    expect(res.applied).toEqual([2]);
    expect(await hasCol(upgraded)).toBe(true);
    // existing rows survive the ALTER with a NULL marker
    await upgraded.runAsync(
      `INSERT INTO profiles (id, user_id, version, dirty, local_updated_at) VALUES ('u','u',1,0,0)`,
    );
    const row = await upgraded.getFirstAsync<{ onboarding_completed_at: number | null }>(
      `SELECT onboarding_completed_at FROM profiles WHERE id = 'u'`,
    );
    expect(row?.onboarding_completed_at ?? null).toBeNull();
    await upgraded.closeAsync();
  });
});
