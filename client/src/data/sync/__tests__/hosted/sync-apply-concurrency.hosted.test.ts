/**
 * ISS-29 (ADR-0009 gap) / DEC-55 — the controlled two-session concurrency
 * regression for the `sync_apply` atomic-version-check fix
 * (`supabase/migrations/20260904200000_sync_apply_atomic_concurrency_fix.sql`).
 *
 * CI-GATED (unlike `sync-hosted.hosted.test.ts`, which is real-`fitney-dev`
 * opt-in only): this file targets a REAL Postgres + PostgREST instance, but
 * defaults to the LOCAL Supabase stack's well-known, non-secret local-dev
 * values (`supabase start`'s printed demo anon key / http://127.0.0.1:54321 —
 * the same fixed demo JWT every default local Supabase project prints, safe
 * to commit) so `db-verify.yml` can run it with no secrets. Override
 * `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` to re-point it
 * at hosted `fitney-dev` for a one-off confirmation run.
 *
 * Reproduces the OLD defect (both writers see `applied`, version jumps by 2)
 * against the OLD migration and must FAIL there — see
 * docs/engineering/evidence/13-iss29-regression.md for that "red" run. Must
 * PASS deterministically, every run, against the fixed migration.
 */
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseGateway } from '@/data/remote/gateway';
import { runPush } from '@/data/sync/push';
import { enqueueMutation } from '@/data/local/outbox-writer';
import { runInTransaction, type SqlDatabase } from '@/data/local/driver';
import { migrate } from '@/data/local/migrate';
import { createTestDb } from '@/test/better-sqlite3-driver';
import { collectingLogger } from '@/services/logger';
import { defaultConfig } from '@/services/config';

// Supabase CLI's fixed local-dev demo values (printed by `supabase status`,
// identical on every default local project — not a secret).
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? LOCAL_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? LOCAL_ANON_KEY;
const PASSWORD = process.env.HOSTED_TEST_PASSWORD ?? 'Iss29Regress1';
const suffix = randomUUID().slice(0, 8);

function freshClient(): SupabaseClient {
  return createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function newConfirmedUser(tag: string): Promise<SupabaseClient> {
  const email =
    process.env[`HOSTED_TEST_EMAIL_${tag}`] ?? `fitney-iss29-${tag.toLowerCase()}-${suffix}@fitney-hosted-verify.com`;
  const sb = freshClient();
  const signUp = await sb.auth.signUp({ email, password: PASSWORD });
  if (signUp.data.session) return sb; // local: enable_confirmations=false, session immediate
  // hosted override path: caller must supply an already-confirmed account via
  // HOSTED_TEST_EMAIL_<tag> + HOSTED_TEST_PASSWORD (same convention as
  // sync-hosted.hosted.test.ts).
  const signIn = await sb.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw new Error(`could not obtain a session for ${email}: ${signUp.error?.message ?? signIn.error.message}`);
  return sb;
}

async function localDb(): Promise<SqlDatabase> {
  const db = createTestDb();
  await migrate(db);
  return db;
}

async function enqueue(
  db: SqlDatabase,
  entityId: string,
  op: 'upsert' | 'delete',
  row: Record<string, unknown>,
  opId: string,
): Promise<void> {
  await runInTransaction(db, () =>
    enqueueMutation({ db, entity: 'workout_session', entityId, op, row, nowMs: Date.now(), newOperationId: opId }),
  );
}

const sessionRow = (id: string, userId: string, name: string, status: 'completed' | 'active' = 'completed') => ({
  id,
  user_id: userId,
  name_snapshot: name,
  started_at: '2026-08-31T10:00:00Z',
  status,
  timezone: 'UTC',
  source: 'empty',
  notes: null,
  ended_at: status === 'completed' ? '2026-08-31T11:00:00Z' : null,
  rest_timer_anchor: null,
});

describe('ISS-29 regression: sync_apply atomic version check (two-session concurrency)', () => {
  let sbA: SupabaseClient;
  let userId: string;
  const createdIds: string[] = [];

  beforeAll(async () => {
    sbA = await newConfirmedUser('A');
    const { data } = await sbA.auth.getUser();
    userId = data.user!.id;
    await sbA.from('profiles').upsert({ id: userId, user_id: userId, week_start: 1 });
  }, 30_000);

  afterAll(async () => {
    if (createdIds.length > 0) await sbA.from('workout_sessions').delete().in('id', createdIds);
  });

  async function seedRow(name: string): Promise<string> {
    const id = randomUUID();
    createdIds.push(id);
    const seedDb = await localDb();
    await enqueue(seedDb, id, 'upsert', sessionRow(id, userId, name), randomUUID());
    const seed = await runPush({ db: seedDb, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() });
    if (seed.applied !== 1) throw new Error(`seed failed: ${JSON.stringify(seed)}`);
    return id;
  }

  it('two concurrent UPDATEs, same row, same base_version: exactly one applied, exactly one conflict, version increments exactly once', async () => {
    const id = await seedRow('base');
    const device1 = await localDb();
    const device2 = await localDb();
    await device1.runAsync(
      `INSERT INTO workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source,version,synced_version,dirty,local_updated_at) VALUES (?,?,?,?,?,?,?,1,1,0,?)`,
      [id, userId, 'base', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty', Date.now()],
    );
    await device2.runAsync(
      `INSERT INTO workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source,version,synced_version,dirty,local_updated_at) VALUES (?,?,?,?,?,?,?,1,1,0,?)`,
      [id, userId, 'base', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty', Date.now()],
    );
    await enqueue(device1, id, 'upsert', sessionRow(id, userId, 'writer 1'), randomUUID());
    await enqueue(device2, id, 'upsert', sessionRow(id, userId, 'writer 2'), randomUUID());

    const [r1, r2] = await Promise.all([
      runPush({ db: device1, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() }),
      runPush({ db: device2, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() }),
    ]);

    const applied = [r1.applied, r2.applied].filter((n) => n === 1).length;
    const conflicts = [r1.conflicts, r2.conflicts].filter((n) => n === 1).length;
    const { data: finalRow } = await sbA.from('workout_sessions').select('version').eq('id', id).single();

    expect(applied).toBe(1);
    expect(conflicts).toBe(1);
    expect(finalRow?.version).toBe(2); // exactly one increment — never 3
  });

  it('a losing COMPLETED-session edit remains recoverable through the production client (parked conflict, payload preserved)', async () => {
    const id = await seedRow('base');
    const winner = await localDb();
    const loser = await localDb();
    for (const db of [winner, loser]) {
      await db.runAsync(
        `INSERT INTO workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source,version,synced_version,dirty,local_updated_at) VALUES (?,?,?,?,?,?,?,1,1,0,?)`,
        [id, userId, 'base', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty', Date.now()],
      );
    }
    await enqueue(winner, id, 'upsert', sessionRow(id, userId, 'winner edit'), randomUUID());
    await enqueue(loser, id, 'upsert', sessionRow(id, userId, "loser edit — must not be lost"), randomUUID());

    // winner pushes and fully lands first (sequential here — the concurrent
    // race itself is covered by the prior test; this test proves what happens
    // to the LOSER's data afterward, through the real production push path)
    const winRes = await runPush({ db: winner, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() });
    expect(winRes.applied).toBe(1);

    const loseRes = await runPush({ db: loser, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() });
    expect(loseRes.conflicts).toBe(1);
    expect(loseRes.parked).toBe(1); // workout_session status='completed' -> parked, not silently overwritten

    // recoverable: the LOSING payload is preserved verbatim in sync_conflicts
    // for the user to review/reapply — this is the client-side "not lost"
    // guarantee FR-SYNC-04 requires, exercised through runPush for real.
    const conflictRow = await loser.getFirstAsync<{ local_payload: string; server_payload: string; local_base_version: number; server_version: number }>(
      `SELECT local_payload, server_payload, local_base_version, server_version FROM sync_conflicts WHERE entity_id = ? AND resolved_at IS NULL`,
      [id],
    );
    expect(conflictRow).not.toBeNull();
    const preserved = JSON.parse(conflictRow!.local_payload) as { name_snapshot: string };
    expect(preserved.name_snapshot).toBe('loser edit — must not be lost');
    expect(conflictRow!.server_version).toBe(2);

    // the local row itself reflects the server's winning state (not dirty, not
    // silently re-issued as a new pending mutation) — exactly the parked
    // contract `push.ts` already implements; this proves it end-to-end against
    // the REAL (fixed) server response, not FakeGateway.
    const localRow = await loser.getFirstAsync<{ dirty: number; name_snapshot: string }>(
      `SELECT dirty, name_snapshot FROM workout_sessions WHERE id = ?`,
      [id],
    );
    expect(localRow).toMatchObject({ dirty: 0, name_snapshot: 'winner edit' });
    expect(await loser.getAllAsync(`SELECT * FROM sync_outbox WHERE entity_id = ?`, [id])).toHaveLength(0);
  });

  it('update/tombstone contention: a concurrent UPDATE and DELETE on the same row/base_version — exactly one wins, never both', async () => {
    const id = await seedRow('base');
    const updater = await localDb();
    const deleter = await localDb();
    for (const db of [updater, deleter]) {
      await db.runAsync(
        `INSERT INTO workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source,version,synced_version,dirty,local_updated_at) VALUES (?,?,?,?,?,?,?,1,1,0,?)`,
        [id, userId, 'base', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty', Date.now()],
      );
    }
    await enqueue(updater, id, 'upsert', sessionRow(id, userId, 'still here'), randomUUID());
    // enqueueMutation always writes the mirrored row (dirty-tracking) even for
    // a delete op — pass the row's current known shape, matching how a real
    // client already has it loaded locally before deleting.
    await enqueue(deleter, id, 'delete', sessionRow(id, userId, 'base'), randomUUID());

    const [rUp, rDel] = await Promise.all([
      runPush({ db: updater, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() }),
      runPush({ db: deleter, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() }),
    ]);

    const winners = [rUp.applied, rDel.applied].filter((n) => n === 1).length;
    const losers = [rUp.conflicts, rDel.conflicts].filter((n) => n === 1).length;
    expect(winners).toBe(1);
    expect(losers).toBe(1);

    const { data: finalRow } = await sbA.from('workout_sessions').select('version,deleted_at').eq('id', id).single();
    expect(finalRow?.version).toBe(2);
    // exactly one of: still not deleted (update won) or deleted_at set (delete won) — never inconsistent
  });

  it('concurrent replay of the SAME operation_id on an UPDATE: exactly one applied, the other duplicate — never both applied, never a raw exception', async () => {
    const id = await seedRow('base');
    const replayOpId = randomUUID();
    const payload = { p_operation_id: replayOpId, p_entity: 'workout_session', p_entity_id: id, p_op: 'upsert', p_payload: sessionRow(id, userId, 'replayed'), p_base_version: 1 };

    const [a, b] = await Promise.all([sbA.rpc('sync_apply', payload), sbA.rpc('sync_apply', payload)]);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    const statuses = [a.data.status, b.data.status].sort();
    expect(statuses).toEqual(['applied', 'duplicate']);

    const { data: finalRow } = await sbA.from('workout_sessions').select('version').eq('id', id).single();
    expect(finalRow?.version).toBe(2); // applied exactly once, never twice
  });

  it('concurrent replay of the SAME operation_id on a FRESH INSERT: exactly one applied, the other duplicate — never "rejected"', async () => {
    const id = randomUUID();
    createdIds.push(id);
    const replayOpId = randomUUID();
    const payload = { p_operation_id: replayOpId, p_entity: 'workout_session', p_entity_id: id, p_op: 'upsert', p_payload: sessionRow(id, userId, 'fresh insert race'), p_base_version: 1 };

    const [a, b] = await Promise.all([sbA.rpc('sync_apply', payload), sbA.rpc('sync_apply', payload)]);
    expect(a.error).toBeNull();
    expect(b.error).toBeNull();
    const statuses = [a.data.status, b.data.status].sort();
    expect(statuses).toEqual(['applied', 'duplicate']); // was, pre-fix: could misreport 'rejected' on the id unique_violation
  });
});
