/**
 * Test-only SqlDatabase adapter over better-sqlite3 (synchronous). Lets the
 * migration runner, local repositories, and the sync engine run in plain Node
 * with a real SQLite engine — the same interface the app binds to expo-sqlite.
 */
import Database from 'better-sqlite3';
import type { SqlDatabase, SqlValue } from '@/data/local/driver';

export function createTestDb(file = ':memory:'): SqlDatabase & { raw: Database.Database } {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const norm = (params?: SqlValue[]): SqlValue[] => params ?? [];

  return {
    raw: db,
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, params?: SqlValue[]) {
      const info = db.prepare(sql).run(...norm(params));
      return { changes: info.changes, lastInsertRowId: Number(info.lastInsertRowid) };
    },
    async getFirstAsync<T>(sql: string, params?: SqlValue[]) {
      return (db.prepare(sql).get(...norm(params)) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, params?: SqlValue[]) {
      return db.prepare(sql).all(...norm(params)) as T[];
    },
    async withTransactionAsync(fn: () => Promise<void>) {
      db.exec('BEGIN IMMEDIATE');
      try {
        await fn();
        db.exec('COMMIT');
      } catch (e) {
        try {
          db.exec('ROLLBACK');
        } catch {
          /* ignore */
        }
        throw e;
      }
    },
    async closeAsync() {
      db.close();
    },
  };
}
