/**
 * expo-sqlite binding of the SqlDatabase seam (ADR-0006). The app uses this;
 * logic tests use src/test/better-sqlite3-driver.ts. Both go through
 * `runInTransaction` for identical BEGIN IMMEDIATE / COMMIT / ROLLBACK semantics.
 *
 * WORK-010 / AR-C3: verify the locked Expo SDK's expo-sqlite transaction + WAL +
 * prepared-statement guarantees on-device before relying on this for the write
 * path; swap the manual transaction for `withExclusiveTransactionAsync` if the
 * SDK requires it.
 */
import * as SQLite from 'expo-sqlite';
import { runInTransaction, type SqlDatabase, type SqlValue } from './driver';

/**
 * Delete a per-user SQLite file (ADR-0009 clean sign-out / account deletion).
 * The handle must be closed first. A missing file is not an error.
 */
export async function deleteDatabase(name: string): Promise<void> {
  try {
    await SQLite.deleteDatabaseAsync(name);
  } catch {
    // already gone / never created — fine. A locked file is retried on the next
    // clean sign-out; never throw into the account transition.
  }
}

export async function openDatabase(name: string): Promise<SqlDatabase> {
  const db = await SQLite.openDatabaseAsync(name, { useNewConnection: true });
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const adapter: SqlDatabase = {
    async execAsync(sql) {
      await db.execAsync(sql);
    },
    async runAsync(sql, params: SqlValue[] = []) {
      const r = await db.runAsync(sql, params as SQLite.SQLiteBindValue[]);
      return { changes: r.changes, lastInsertRowId: r.lastInsertRowId };
    },
    async getFirstAsync<T>(sql: string, params: SqlValue[] = []) {
      return (await db.getFirstAsync<T>(sql, params as SQLite.SQLiteBindValue[])) ?? null;
    },
    async getAllAsync<T>(sql: string, params: SqlValue[] = []) {
      return db.getAllAsync<T>(sql, params as SQLite.SQLiteBindValue[]);
    },
    withTransactionAsync(fn) {
      return runInTransaction(adapter, fn);
    },
    async closeAsync() {
      await db.closeAsync();
    },
  };
  return adapter;
}
