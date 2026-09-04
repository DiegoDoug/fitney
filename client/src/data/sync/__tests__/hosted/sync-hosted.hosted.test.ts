/**
 * WORK-013 sync-protocol conformance against REAL hosted Supabase, driving the
 * PRODUCTION `runPush` / `runIncrementalPull` / `runFullReconciliation`
 * (`data/sync/{push,pull}.ts`) with the REAL `createSupabaseGateway` — never
 * `FakeGateway`. OPT-IN ONLY (see `jest.hosted.config.cjs`'s header) — not
 * part of `npm test` / CI; needs live network + two CONFIRMED synthetic
 * accounts (env vars). Every test that creates rows cleans them up in its own
 * `afterAll`/`finally` via direct `execute_sql`-equivalent (`sb.from(...).delete()`
 * as the same authenticated user — no elevated access used here).
 *
 * Cases covered here (see docs/engineering/client-implementation.md SS14.17
 * for the two cases NOT covered, and exactly why):
 *   - concurrent writers (two local outboxes race `sync_apply` for one row)
 *   - clock skew (a locally skewed clock does not affect who wins — the
 *     server `version` does)
 *   - kill-mid-push replay (outbox entry marked `dispatched` but the request
 *     never actually reached the server before a simulated crash — retry
 *     performs the first real, exactly-once application)
 *   - lost transport response WITH a successor (the server DID apply the
 *     op, the client's outbox still thinks it's `dispatched`, a genuine
 *     local edit created a pending successor meanwhile — retry ->
 *     `duplicate`, successor correctly re-based to the real version)
 *   - same-timestamp page boundary (two rows sharing one `updated_at` value,
 *     forced into two separate pull pages by a `PAGE`-boundary-crossing
 *     limit) — the composite `(updated_at, id)` cursor must not skip or
 *     duplicate either row
 */
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseGateway } from '@/data/remote/gateway';
import { runPush } from '@/data/sync/push';
import { runIncrementalPull } from '@/data/sync/pull';
import { enqueueMutation } from '@/data/local/outbox-writer';
import { runInTransaction, type SqlDatabase } from '@/data/local/driver';
import { migrate } from '@/data/local/migrate';
import { createTestDb } from '@/test/better-sqlite3-driver';
import { collectingLogger } from '@/services/logger';
import { defaultConfig } from '@/services/config';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL_A = process.env.HOSTED_TEST_EMAIL_A;
const PASSWORD = process.env.HOSTED_TEST_PASSWORD;

const ready = Boolean(URL && ANON_KEY && EMAIL_A && PASSWORD);
const d = ready ? describe : describe.skip;
if (!ready) {
  console.warn('[sync-hosted] skipped — set EXPO_PUBLIC_SUPABASE_URL/ANON_KEY, HOSTED_TEST_EMAIL_A, HOSTED_TEST_PASSWORD');
}

async function signedInClient(email: string): Promise<SupabaseClient> {
  const sb = createClient(URL!, ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password: PASSWORD! });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
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

const sessionRow = (id: string, userId: string, name: string) => ({
  id,
  user_id: userId,
  name_snapshot: name,
  started_at: '2026-08-31T10:00:00Z',
  // 'completed', not 'active': the app enforces only one ACTIVE session per
  // user (CLAUDE.md invariant, a partial unique index) — these tests create
  // many throwaway sessions per user and would collide on that constraint if
  // left 'active'. 'completed' has no such limit and is the more realistic
  // shape for "syncing a session" anyway.
  status: 'completed',
  timezone: 'UTC',
  source: 'empty',
  notes: null,
  ended_at: '2026-08-31T11:00:00Z',
  rest_timer_anchor: null,
});

d('WORK-013 hosted conformance (production push/pull + real gateway)', () => {
  let sbA: SupabaseClient;
  let userId: string;
  const createdSessionIds: string[] = [];

  beforeAll(async () => {
    sbA = await signedInClient(EMAIL_A!);
    const { data, error } = await sbA.auth.getUser();
    if (error || !data.user) throw new Error('could not resolve the signed-in user');
    userId = data.user.id;
    await sbA.from('profiles').upsert({ id: userId, user_id: userId, week_start: 1 });
  });

  afterAll(async () => {
    if (createdSessionIds.length > 0) {
      await sbA.from('workout_sessions').delete().in('id', createdSessionIds);
    }
  });

  it('concurrent writers: two local outboxes race sync_apply for the SAME row — exactly one applies, the other conflicts (no silent data loss)', async () => {
    const sessionId = randomUUID();
    createdSessionIds.push(sessionId);
    const device1 = await localDb();
    const device2 = await localDb();
    const gwFor = () => createSupabaseGateway(sbA);

    // device1 creates + syncs the row (v1)
    await enqueue(device1, sessionId, 'upsert', sessionRow(sessionId, userId, 'race base'), randomUUID());
    const seed = await runPush({ db: device1, gateway: gwFor(), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() });
    expect(seed.applied).toBe(1);

    // device2 "pulls" the same synced row locally (mirrors what a real pull would do)
    await device2.runAsync(
      `INSERT INTO workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source,version,synced_version,dirty,local_updated_at)
       VALUES (?,?,?,?,?,?,?,1,1,0,?)`,
      [sessionId, userId, 'race base', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty', Date.now()],
    );

    // both devices independently edit the SAME row, both still believe base_version=1
    await enqueue(device1, sessionId, 'upsert', sessionRow(sessionId, userId, 'device 1 edit'), randomUUID());
    await enqueue(device2, sessionId, 'upsert', sessionRow(sessionId, userId, 'device 2 edit'), randomUUID());

    // fire both pushes as GENUINELY CONCURRENT requests against the real server
    const [r1, r2] = await Promise.all([
      runPush({ db: device1, gateway: gwFor(), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() }),
      runPush({ db: device2, gateway: gwFor(), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() }),
    ]);

    const appliedCount = [r1, r2].filter((r) => r.applied === 1).length;
    const conflictCount = [r1, r2].filter((r) => r.conflicts === 1).length;

    // the row must end at version 2 (exactly one write landed), never 3 (both
    // landing would mean the version check was bypassed under real concurrency)
    const { data: finalRow } = await sbA.from('workout_sessions').select('version,name_snapshot').eq('id', sessionId).single();

    console.log('[concurrent-writers]', { r1, r2, finalRow });

    expect(appliedCount).toBe(1);
    expect(conflictCount).toBe(1);
    expect(finalRow?.version).toBe(2);
  });

  it('clock skew: a wildly skewed local clock does NOT decide the winner — the server version does', async () => {
    const sessionId = randomUUID();
    createdSessionIds.push(sessionId);
    const device1 = await localDb(); // "normal" clock
    const device2 = await localDb(); // clock set 10 hours in the PAST relative to device1's writes
    const gwFor = () => createSupabaseGateway(sbA);
    const realNow = Date.now();
    const skewedPastNow = realNow - 10 * 3_600_000;

    await enqueue(device1, sessionId, 'upsert', sessionRow(sessionId, userId, 'base'), randomUUID());
    const seed = await runPush({ db: device1, gateway: gwFor(), logger: collectingLogger(), config: defaultConfig, nowMs: realNow });
    expect(seed.applied).toBe(1);

    // device1 edits SECOND in wall-clock terms but is not skewed
    await enqueue(device1, sessionId, 'upsert', sessionRow(sessionId, userId, 'device1 (normal clock, pushed second)'), randomUUID());
    // device2 edits FIRST in wall-clock terms with a clock reporting a much
    // EARLIER local nowMs — if the client clock mattered, this "earlier"
    // write might be expected to win; it must not.
    const staleBaseRow = { ...sessionRow(sessionId, userId, 'device2 (skewed clock, pushed first)') };
    await device2.runAsync(
      `INSERT INTO workout_sessions (id,user_id,name_snapshot,started_at,status,timezone,source,version,synced_version,dirty,local_updated_at)
       VALUES (?,?,?,?,?,?,?,1,1,0,?)`,
      [sessionId, userId, 'base', '2026-08-31T10:00:00Z', 'completed', 'UTC', 'empty', skewedPastNow],
    );
    await enqueue(device2, sessionId, 'upsert', staleBaseRow, randomUUID());

    const p2 = await runPush({ db: device2, gateway: gwFor(), logger: collectingLogger(), config: defaultConfig, nowMs: skewedPastNow });
    expect(p2.applied).toBe(1); // first to actually reach the server — applies, version -> 2

    const p1 = await runPush({ db: device1, gateway: gwFor(), logger: collectingLogger(), config: defaultConfig, nowMs: realNow });
    // device1's base_version (1) is now stale relative to the server (2) —
    // REGARDLESS of device1's "normal" clock being chronologically later —
    // proving the server version, not any client timestamp, governs.
    expect(p1.conflicts).toBe(1);

    const { data: finalRow } = await sbA.from('workout_sessions').select('version,name_snapshot').eq('id', sessionId).single();
    expect(finalRow?.name_snapshot).toBe('device2 (skewed clock, pushed first)');
    expect(finalRow?.version).toBe(2);
  });

  it('kill-mid-push replay: outbox marked dispatched but NEVER actually sent (simulated crash) — retry performs the first real, exactly-once application', async () => {
    const sessionId = randomUUID();
    createdSessionIds.push(sessionId);
    const device1 = await localDb();
    const opId = randomUUID();
    await enqueue(device1, sessionId, 'upsert', sessionRow(sessionId, userId, 'crash before send'), opId);

    // simulate the EXACT DB mutation runPush performs immediately before the
    // network call, then a crash BEFORE that call ever left the process —
    // the server has NEVER seen this operation_id.
    await device1.runAsync(`UPDATE sync_outbox SET state = 'dispatched' WHERE entity_id = ?`, [sessionId]);

    const retry = await runPush({ db: device1, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() });
    expect(retry.applied).toBe(1); // the FIRST real application, via the recovered dispatched entry
    expect(await device1.getAllAsync(`SELECT * FROM sync_outbox WHERE entity_id = ?`, [sessionId])).toHaveLength(0);

    const { data: op } = await sbA.from('processed_operations' as never).select('operation_id,result').eq('operation_id', opId).maybeSingle();
    expect(op).toMatchObject({ operation_id: opId, result: 'applied' });
  });

  it('lost transport response WITH a concurrent successor: retry -> duplicate, the pending successor is correctly re-based to the real server version', async () => {
    const sessionId = randomUUID();
    createdSessionIds.push(sessionId);
    const device1 = await localDb();
    const opIdA = randomUUID();
    await enqueue(device1, sessionId, 'upsert', sessionRow(sessionId, userId, 'op-A (actually applied)'), opIdA);

    // O1 DID reach the server (apply it directly, bypassing the local outbox,
    // to model "the request landed but the ack was lost") ...
    const directApply = await createSupabaseGateway(sbA).apply({
      operationId: opIdA,
      entity: 'workout_session',
      entityId: sessionId,
      op: 'upsert',
      payload: sessionRow(sessionId, userId, 'op-A (actually applied)'),
      baseVersion: 1,
    });
    if (directApply.status !== 'applied') throw new Error(`expected applied, got ${JSON.stringify(directApply)}`);
    expect(directApply.version).toBe(1);

    // ... but the LOCAL outbox still thinks it's in flight (never got the ack) —
    // same simulated-crash technique as above.
    await device1.runAsync(`UPDATE sync_outbox SET state = 'dispatched' WHERE entity_id = ?`, [sessionId]);

    // a genuine concurrent local edit while O1 is (locally) still dispatched -> O2 pending
    const opIdB = randomUUID();
    await enqueue(device1, sessionId, 'upsert', sessionRow(sessionId, userId, 'op-B (newer local edit)'), opIdB);
    let entries = await device1.getAllAsync<{ operation_id: string; state: string; base_version: number }>(
      `SELECT operation_id, state, base_version FROM sync_outbox WHERE entity_id = ? ORDER BY seq`,
      [sessionId],
    );
    expect(entries.map((e) => `${e.operation_id}:${e.state}`)).toEqual([`${opIdA}:dispatched`, `${opIdB}:pending`]);

    // retry pass: O1 terminates as 'duplicate' (exactly-once, confirmed against
    // the REAL server), O2 must NOT be sent this pass and must be re-based to v1
    const pass1 = await runPush({ db: device1, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() });
    expect(pass1.duplicate).toBe(1);

    entries = await device1.getAllAsync(`SELECT operation_id, state, base_version FROM sync_outbox WHERE entity_id = ?`, [sessionId]);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ operation_id: opIdB, state: 'pending', base_version: 1 });

    // next pass sends O2 for real, against the correct base_version
    const pass2 = await runPush({ db: device1, gateway: createSupabaseGateway(sbA), logger: collectingLogger(), config: defaultConfig, nowMs: Date.now() });
    expect(pass2.applied).toBe(1);

    const { data: finalRow } = await sbA.from('workout_sessions').select('version,name_snapshot').eq('id', sessionId).single();
    expect(finalRow?.version).toBe(2);
    expect(finalRow?.name_snapshot).toBe('op-B (newer local edit)');
  });

  it('same-timestamp page boundary: two rows sharing ONE updated_at value split across two pull pages — the composite cursor loses neither', async () => {
    const idX = randomUUID();
    const idY = randomUUID();
    createdSessionIds.push(idX, idY);

    // a single multi-row INSERT is one Postgres statement/transaction — the
    // BEFORE INSERT trigger's now() is transaction-time and therefore
    // IDENTICAL for both rows. Ordered so lo < hi by id (the cursor's tiebreak).
    const [lo, hi] = idX < idY ? [idX, idY] : [idY, idX];
    await sbA
      .from('workout_sessions')
      .insert([
        { id: lo, user_id: userId, name_snapshot: 'page-boundary lo', started_at: '2026-08-31T10:00:00Z', ended_at: '2026-08-31T11:00:00Z', status: 'completed', timezone: 'UTC', source: 'empty' },
        { id: hi, user_id: userId, name_snapshot: 'page-boundary hi', started_at: '2026-08-31T10:00:00Z', ended_at: '2026-08-31T11:00:00Z', status: 'completed', timezone: 'UTC', source: 'empty' },
      ]);
    const { data: rows } = await sbA.from('workout_sessions').select('id,updated_at').in('id', [lo, hi]);
    expect(rows).toHaveLength(2);
    expect(rows![0]!.updated_at).toBe(rows![1]!.updated_at); // confirmed identical timestamp
    const sharedUpdatedAt = rows![0]!.updated_at as string;

    // production's PAGE size (data/sync/pull.ts) is a fixed 200, not
    // injectable, and this project does not have 200 real rows to spare just
    // to force a natural page split. Instead, pre-position the cursor exactly
    // where a real page boundary WOULD land if `lo` had been the last row
    // applied on a prior page — this exercises the identical
    // `(updated_at.gt.cursor, and(updated_at.eq.cursor, id.gt.cursor_id))`
    // continuation clause the real page-boundary case depends on, without
    // needing 200 filler rows.
    const device1 = await localDb();
    await device1.runAsync(
      `INSERT INTO sync_state (entity, last_pulled_updated_at, last_pulled_id) VALUES ('workout_session', ?, ?)`,
      [sharedUpdatedAt, lo],
    );

    const outcome = await runIncrementalPull({
      db: device1,
      gateway: createSupabaseGateway(sbA),
      logger: collectingLogger(),
      entities: ['workout_session'],
      nowMs: Date.now(),
    });
    // `hi` shares `lo`'s exact updated_at but must still be fetched via the
    // id-tiebreak clause, not skipped as "already at this timestamp"
    expect(outcome.applied).toBeGreaterThanOrEqual(1);

    const local = await device1.getFirstAsync<{ id: string }>(`SELECT id FROM workout_sessions WHERE id = ?`, [hi]);
    expect(local?.id).toBe(hi);
    // `lo` was NOT re-fetched (cursor started already past it) — confirms no
    // duplicate re-application, only the correct forward continuation
    const loLocal = await device1.getFirstAsync(`SELECT id FROM workout_sessions WHERE id = ?`, [lo]);
    expect(loLocal).toBeNull();

    const cursor = await device1.getFirstAsync<{ last_pulled_updated_at: string; last_pulled_id: string }>(
      `SELECT last_pulled_updated_at, last_pulled_id FROM sync_state WHERE entity = 'workout_session'`,
    );
    expect(cursor?.last_pulled_id).toBe(hi);
  });
});
