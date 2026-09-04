/**
 * WORK-013 "late transaction commit reconciliation" — the ONE case the
 * `execute_sql` MCP tool could not reproduce against hosted `fitney-dev`
 * (no session/connection persists across calls, so a transaction cannot be
 * opened in one call and committed in a later one while other operations
 * interleave). DEC-55 item 5 asked for exactly this: "investigate a
 * session-capable local PostgreSQL harness." The local Supabase stack (`pg`
 * client, two real connections, one held open across an explicit
 * BEGIN/COMMIT) makes it directly reproducible.
 *
 * CI-GATED alongside the ISS-29 regression (`sync-apply-concurrency.hosted.test.ts`)
 * — targets the local Supabase stack's well-known non-secret local-dev
 * values by default; local Postgres direct access uses the CLI's fixed local
 * `postgres:postgres@127.0.0.1:54322` credential (documented, local-only,
 * never valid outside `127.0.0.1`).
 *
 * Scenario: Tx A begins and inserts row A (uncommitted). While A is still
 * open, Tx B inserts row B (autocommit) with a LATER real updated_at than A's
 * (A's is fixed at A's transaction start, which happened first). An
 * incremental pull runs and correctly advances its cursor past B. Tx A THEN
 * commits — row A's updated_at is chronologically BEHIND the cursor now, so
 * a plain incremental pull can never see it (this is the exact
 * `system-architecture.md` §10.3 gap periodic full reconciliation exists to
 * close). Asserts: incremental pull does NOT recover row A; full
 * reconciliation (`runFullReconciliation`, id/version-based, not
 * updated_at-based) DOES.
 */
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseGateway } from '@/data/remote/gateway';
import { runIncrementalPull, runFullReconciliation } from '@/data/sync/pull';
import { migrate } from '@/data/local/migrate';
import { createTestDb } from '@/test/better-sqlite3-driver';
import { collectingLogger } from '@/services/logger';
import type { SqlDatabase } from '@/data/local/driver';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const LOCAL_PG_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? LOCAL_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? LOCAL_ANON_KEY;
// Only the LOCAL stack supports the raw pg connection this test needs — a
// hosted re-run of this specific file is not applicable (see the class doc).
const PG_URL = process.env.ISS29_LOCAL_PG_URL ?? LOCAL_PG_URL;
const PASSWORD = 'LateCommit1Regress';
const suffix = randomUUID().slice(0, 8);

async function localDb(): Promise<SqlDatabase> {
  const db = createTestDb();
  await migrate(db);
  return db;
}

describe('WORK-013 late-transaction-commit reconciliation (session-capable local Postgres harness)', () => {
  let sb: SupabaseClient;
  let userId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sb = createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const email = `fitney-latecommit-${suffix}@fitney-hosted-verify.com`;
    const signUp = await sb.auth.signUp({ email, password: PASSWORD });
    if (!signUp.data.session) {
      const signIn = await sb.auth.signInWithPassword({ email, password: PASSWORD });
      if (signIn.error) throw new Error(`could not obtain a local session: ${signUp.error?.message ?? signIn.error.message}`);
    }
    const { data } = await sb.auth.getUser();
    userId = data.user!.id;
    await sb.from('profiles').upsert({ id: userId, user_id: userId, week_start: 1 });
  }, 30_000);

  afterAll(async () => {
    if (createdIds.length > 0) await sb.from('workout_sessions').delete().in('id', createdIds);
  });

  it('a transaction that commits AFTER a later one is invisible to incremental pull, but recovered by full reconciliation', async () => {
    const idA = randomUUID();
    const idB = randomUUID();
    createdIds.push(idA, idB);

    const txA = new Client({ connectionString: PG_URL });
    const txB = new Client({ connectionString: PG_URL });
    await txA.connect();
    await txB.connect();

    try {
      // --- Tx A begins, writes row A, stays OPEN (uncommitted) ---
      await txA.query('BEGIN');
      await txA.query(
        `insert into workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [idA, userId, 'late-commit A', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty'],
      );
      const { rows: aRows } = await txA.query('select updated_at from workout_sessions where id = $1', [idA]);
      const aUpdatedAt = aRows[0].updated_at as Date;

      // --- Tx B: a SEPARATE, autocommitting write, guaranteed to commit with
      // a LATER real updated_at than A's (A's is fixed at A's BEGIN, already
      // in the past relative to right now) ---
      await txB.query(
        `insert into workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [idB, userId, 'late-commit B', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty'],
      );
      const { rows: bRows } = await txB.query('select updated_at from workout_sessions where id = $1', [idB]);
      const bUpdatedAt = bRows[0].updated_at as Date;
      expect(bUpdatedAt.getTime()).toBeGreaterThan(aUpdatedAt.getTime()); // confirmed: B is chronologically later, while A is still uncommitted

      // --- incremental pull: only B is visible (A is uncommitted) ---
      const db1 = await localDb();
      const pull1 = await runIncrementalPull({ db: db1, gateway: createSupabaseGateway(sb), logger: collectingLogger(), entities: ['workout_session'], nowMs: Date.now() });
      expect(pull1.applied).toBeGreaterThanOrEqual(1);
      const seenB = await db1.getFirstAsync(`SELECT id FROM workout_sessions WHERE id = ?`, [idB]);
      const seenAEarly = await db1.getFirstAsync(`SELECT id FROM workout_sessions WHERE id = ?`, [idA]);
      expect(seenB).not.toBeNull();
      expect(seenAEarly).toBeNull(); // not visible yet — correctly uncommitted

      // --- NOW Tx A commits — late, with an updated_at BEHIND the cursor B already advanced past ---
      await txA.query('COMMIT');

      // --- a plain incremental pull can never see A again: its updated_at is
      // behind the cursor (this IS the documented gap, reproduced for real) ---
      const pull2 = await runIncrementalPull({ db: db1, gateway: createSupabaseGateway(sb), logger: collectingLogger(), entities: ['workout_session'], nowMs: Date.now() });
      const seenAAfterIncremental = await db1.getFirstAsync(`SELECT id FROM workout_sessions WHERE id = ?`, [idA]);
      expect(seenAAfterIncremental).toBeNull(); // still invisible — proves the gap is real, not just theoretical
      void pull2;

      // --- full (id,version) reconciliation is updated_at-independent — it DOES recover it ---
      const recon = await runFullReconciliation({ db: db1, gateway: createSupabaseGateway(sb), logger: collectingLogger(), entities: ['workout_session'], nowMs: Date.now() });
      expect(recon.applied).toBeGreaterThanOrEqual(1);
      const seenAAfterReconcile = await db1.getFirstAsync<{ id: string; dirty: number }>(`SELECT id, dirty FROM workout_sessions WHERE id = ?`, [idA]);
      expect(seenAAfterReconcile).toMatchObject({ id: idA, dirty: 0 });
    } finally {
      await txA.query('ROLLBACK').catch(() => {}); // no-op if already committed
      await txA.end();
      await txB.end();
    }
  }, 30_000);
});
