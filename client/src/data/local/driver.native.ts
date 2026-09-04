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
import { Directory, Paths } from 'expo-file-system';
import { runInTransaction, type SqlDatabase, type SqlValue } from './driver';
import { parseRetainedDbFilenames } from './retained-db-files';

/**
 * The directory `expo-sqlite` stores bare-named databases in (matches
 * `SQLite.openDatabaseAsync(name, ...)`'s default resolution).
 */
function sqliteDir(): Directory {
  return new Directory(Paths.document, 'SQLite');
}

/**
 * Discover retained per-user DB files on disk (CE-R5 v2 "Remove account from
 * this device" discovery) — the files themselves ARE the persistence, so a
 * cold app restart re-derives the retained set by listing, not from any
 * in-memory/app-state record. Filename parsing (`parseRetainedDbFilenames`) is
 * unit-tested directly; only the directory read itself is native/device-only.
 */
export async function listRetainedUserIds(activeUserId: string | null): Promise<string[]> {
  const dir = sqliteDir();
  let entries: { name: string }[];
  try {
    if (!dir.exists) return [];
    entries = dir.list();
  } catch {
    // directory unreadable — treat as "nothing discoverable" rather than throw
    // into app boot; a real retained file simply won't surface until it can be
    // listed again.
    return [];
  }
  return parseRetainedDbFilenames(
    entries.map((e) => e.name),
    activeUserId,
  );
}

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
