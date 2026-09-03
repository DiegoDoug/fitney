/**
 * SQLite driver seam. The app binds this to `expo-sqlite` (driver.native.ts);
 * logic tests bind it to `better-sqlite3` (src/test/better-sqlite3-driver.ts).
 * All of data/local, the migration runner, and the sync engine work only
 * against this interface (ADR-0006, AR-RISK-4 — the transaction primitive is
 * the load-bearing part of outbox atomicity).
 */
export type SqlValue = string | number | null | Uint8Array;

export interface SqlDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: SqlValue[]): Promise<{ changes: number; lastInsertRowId: number }>;
  getFirstAsync<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  /**
   * Run `fn` inside a single exclusive write transaction. On any throw the
   * transaction is rolled back and the error re-thrown — nothing is persisted
   * (this is the outbox-atomicity guarantee: row write + outbox upsert commit
   * together or not at all).
   */
  withTransactionAsync(fn: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

/**
 * Shared transaction implementation via explicit BEGIN IMMEDIATE / COMMIT /
 * ROLLBACK, so both adapters behave identically. A single-flight sync scheduler
 * (system-architecture.md §10.1) serialises writers; `BEGIN IMMEDIATE` takes the
 * write lock up front so a concurrent reader cannot wedge it.
 *
 * Hardening path (WORK-010 / AR-C3): swap for expo-sqlite
 * `withExclusiveTransactionAsync` once the locked SDK's guarantees are verified
 * on-device.
 */
export async function runInTransaction(
  db: Pick<SqlDatabase, 'execAsync'>,
  fn: () => Promise<void>,
): Promise<void> {
  await db.execAsync('BEGIN IMMEDIATE');
  try {
    await fn();
    await db.execAsync('COMMIT');
  } catch (err) {
    try {
      await db.execAsync('ROLLBACK');
    } catch {
      // ignore rollback failure; surface the original error
    }
    throw err;
  }
}
