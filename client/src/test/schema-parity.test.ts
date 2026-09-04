/**
 * Local/server schema-contract parity (SPEC §17.2, BD-RISK-7). Every
 * data/remote Zod schema's key set MUST equal the corresponding local SQLite
 * table's column set, minus the local-only sync-meta columns
 * (synced_version, dirty, local_updated_at) and minus generated columns.
 * A drift here breaks the "dumb row copy" sync contract.
 */
import { migrate } from '@/data/local/migrate';
import { createTestDb } from './better-sqlite3-driver';
import { REMOTE_SCHEMAS, type RemoteSchemaKey } from '@/data/remote/schemas';
import { ENTITY_TABLE } from '@/domain/entities';

const LOCAL_ONLY = new Set([
  'synced_version',
  'dirty',
  'local_updated_at',
  // m0002: local-only onboarding gate marker on `profiles`, never in a sync payload
  'onboarding_completed_at',
]);
// name_normalized is a stored generated column server-side; the client keeps it
// as a plain column it fills on write. It IS in both, so no exception needed.

describe('schema-contract parity (local SQLite <-> data/remote Zod)', () => {
  it('each remote schema key set equals its local table column set', async () => {
    const db = createTestDb();
    await migrate(db);

    for (const key of Object.keys(REMOTE_SCHEMAS) as RemoteSchemaKey[]) {
      const table = ENTITY_TABLE[key];
      const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
      const localCols = new Set(cols.map((c) => c.name).filter((c) => !LOCAL_ONLY.has(c)));

      const schema = REMOTE_SCHEMAS[key];
      const schemaKeys = new Set(Object.keys(schema.shape));

      const missingInSchema = [...localCols].filter((c) => !schemaKeys.has(c));
      const extraInSchema = [...schemaKeys].filter((c) => !localCols.has(c));

      expect({ table, missingInSchema, extraInSchema }).toEqual({
        table,
        missingInSchema: [],
        extraInSchema: [],
      });
    }

    await db.closeAsync();
  });
});
