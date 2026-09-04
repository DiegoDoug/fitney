/**
 * WORK-013 same-timestamp page boundary AT THE REAL page size (production
 * `data/sync/pull.ts`'s `PAGE = 200`, not a substitute). `sync-hosted.hosted.test.ts`
 * proved the cursor-continuation clause itself via a pre-positioned cursor
 * (no rows to spare); this test completes the case with a bounded, cheap
 * synthetic fixture: 201 rows for one user, inserted in ONE statement so
 * Postgres's transaction-time `now()` gives them ALL the identical
 * `updated_at` — the worst case for the composite `(updated_at, id)` cursor,
 * spanning the actual page-1/page-2 boundary.
 *
 * Targets the LOCAL Supabase stack by default (no cost/volume concern there);
 * override EXPO_PUBLIC_SUPABASE_URL/ANON_KEY for a hosted re-run.
 */
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseGateway } from '@/data/remote/gateway';
import { runIncrementalPull } from '@/data/sync/pull';
import { migrate } from '@/data/local/migrate';
import { createTestDb } from '@/test/better-sqlite3-driver';
import { collectingLogger } from '@/services/logger';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? LOCAL_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? LOCAL_ANON_KEY;
const PASSWORD = 'PageBoundary1Regress';
const suffix = randomUUID().slice(0, 8);
const ROW_COUNT = 201; // PAGE(200) + 1 — forces a genuine second page fetch

describe('WORK-013 same-timestamp page boundary at the real PAGE=200 size', () => {
  it('201 rows sharing one transaction-time updated_at, spanning the real page-1/page-2 boundary: every row is applied exactly once, none skipped or duplicated', async () => {
    const sb = createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const email = `fitney-pageboundary-${suffix}@fitney-hosted-verify.com`;
    const signUp = await sb.auth.signUp({ email, password: PASSWORD });
    if (!signUp.data.session) {
      const signIn = await sb.auth.signInWithPassword({ email, password: PASSWORD });
      if (signIn.error) throw new Error(`could not obtain a local session: ${signUp.error?.message ?? signIn.error.message}`);
    }
    const { data } = await sb.auth.getUser();
    const userId = data.user!.id;
    await sb.from('profiles').upsert({ id: userId, user_id: userId, week_start: 1 });

    const ids = Array.from({ length: ROW_COUNT }, () => randomUUID()).sort(); // sorted so the id-tiebreak order is known
    try {
      const rows = ids.map((id, i) => ({
        id,
        user_id: userId,
        name_snapshot: `page-boundary ${i}`,
        started_at: '2026-08-31T10:00:00Z',
        status: 'completed' as const,
        ended_at: '2026-08-31T11:00:00Z',
        timezone: 'UTC',
        source: 'empty' as const,
      }));
      // one INSERT statement -> one transaction -> one shared transaction-time
      // `updated_at` for all 201 rows (the trigger's `now()` is fixed per
      // transaction), confirmed below.
      const { error: insErr } = await sb.from('workout_sessions').insert(rows);
      if (insErr) throw new Error(`bulk insert failed: ${insErr.message}`);

      const { data: check } = await sb.from('workout_sessions').select('updated_at').in('id', ids).limit(2);
      expect(check?.[0]?.updated_at).toBe(check?.[1]?.updated_at);

      const db = await createTestDb();
      await migrate(db);
      const outcome = await runIncrementalPull({
        db,
        gateway: createSupabaseGateway(sb),
        logger: collectingLogger(),
        entities: ['workout_session'],
        nowMs: Date.now(),
      });
      expect(outcome.applied).toBe(ROW_COUNT);

      const localRows = await db.getAllAsync<{ id: string }>(
        `SELECT id FROM workout_sessions WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids,
      );
      expect(localRows.map((r) => r.id).sort()).toEqual(ids); // every one present, none duplicated (PK), none skipped

      const cursor = await db.getFirstAsync<{ last_pulled_id: string }>(
        `SELECT last_pulled_id FROM sync_state WHERE entity = 'workout_session'`,
      );
      expect(cursor?.last_pulled_id).toBe(ids[ids.length - 1]); // advanced to the LAST id in tiebreak order
    } finally {
      await sb.from('workout_sessions').delete().in('id', ids);
    }
  }, 30_000);
});
