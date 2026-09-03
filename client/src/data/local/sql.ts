/**
 * Small parameterised-SQL helpers. Every user value is bound, never interpolated
 * (SPEC §14, NFR-SEC). Column/table identifiers are validated against
 * /^[a-z][a-z0-9_]*$/ and come only from our own schema constants.
 */
import type { SqlDatabase, SqlValue } from './driver';
import { assertIdentifier, toDbValue } from './row-codec';

/** INSERT ... ON CONFLICT(id) DO UPDATE — a full-row upsert by primary key. */
export async function upsertRow(
  db: SqlDatabase,
  table: string,
  row: Record<string, unknown>,
): Promise<void> {
  assertIdentifier(table);
  const cols = Object.keys(row).map(assertIdentifier);
  const values: SqlValue[] = cols.map((c) => toDbValue(c, row[c]));
  const placeholders = cols.map(() => '?').join(', ');
  const updates = cols
    .filter((c) => c !== 'id')
    .map((c) => `${c} = excluded.${c}`)
    .join(', ');
  const sql =
    `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders}) ` +
    `ON CONFLICT(id) DO UPDATE SET ${updates}`;
  await db.runAsync(sql, values);
}

export async function getRowById<T>(
  db: SqlDatabase,
  table: string,
  id: string,
): Promise<T | null> {
  assertIdentifier(table);
  return db.getFirstAsync<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}

/** Soft-delete: set deleted_at + bump dirty; caller enqueues the outbox 'delete'. */
export async function softDeleteRow(
  db: SqlDatabase,
  table: string,
  id: string,
  nowMs: number,
): Promise<void> {
  assertIdentifier(table);
  await db.runAsync(
    `UPDATE ${table} SET deleted_at = ?, dirty = 1, local_updated_at = ? WHERE id = ?`,
    [new Date(nowMs).toISOString(), nowMs, id],
  );
}
