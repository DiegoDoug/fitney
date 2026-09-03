/**
 * Forward-only migration runner (ADR-0006, system-architecture.md §7.6).
 * Fresh install runs the whole chain; an upgrade applies the missing tail.
 * Each migration runs in its own transaction; a failure rolls that migration
 * back and aborts (fix-forward, no down migrations).
 */
import { runInTransaction, type SqlDatabase } from './driver';
import { MIGRATIONS, type Migration } from './schema/migrations';

const CREATE_LEDGER = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);`;

export async function currentSchemaVersion(db: SqlDatabase): Promise<number> {
  await db.execAsync(CREATE_LEDGER);
  const row = await db.getFirstAsync<{ v: number | null }>(
    'SELECT MAX(id) AS v FROM schema_migrations',
  );
  return row?.v ?? 0;
}

export type MigrationResult = { from: number; to: number; applied: number[] };

export async function migrate(
  db: SqlDatabase,
  chain: readonly Migration[] = MIGRATIONS,
): Promise<MigrationResult> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(CREATE_LEDGER);

  const from = await currentSchemaVersion(db);
  const pending = [...chain].sort((a, b) => a.id - b.id).filter((m) => m.id > from);
  const applied: number[] = [];

  for (const m of pending) {
    await runInTransaction(db, async () => {
      await db.execAsync(m.up);
      await db.runAsync('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)', [
        m.id,
        m.name,
        Date.now(),
      ]);
    });
    applied.push(m.id);
  }

  const to = await currentSchemaVersion(db);
  return { from, to, applied };
}
