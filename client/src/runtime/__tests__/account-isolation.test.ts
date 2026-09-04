/**
 * Per-user runtime isolation (ADR-0009) — REAL LOCAL SQLite (better-sqlite3
 * driver) + a contract-modelling FakeGateway. NOT the Expo SQLite runtime and
 * NOT real Supabase (WORK-010 / WORK-013).
 *
 * Proves: a container is bound to exactly one user's DB; account A → B → A keeps
 * each account's rows separate; a retired container makes no further network
 * calls; a late result from account A cannot reach account B; offline relaunch
 * of a previously authenticated user still works from local data.
 *
 * Retain/relaunch cases use a FILE-backed DB and open a FRESH handle per
 * "relaunch" — mirroring the app, where `dispose()` closes the handle but the
 * per-user file survives and `openDatabase(userDbName)` re-opens it.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleContainer, type ContainerDeps } from '@/runtime/build-container';
import { GenerationGuard, decideSignOutDisposition } from '@/runtime/account-lifecycle';
import { createTestDb } from '@/test/better-sqlite3-driver';
import { FakeGateway } from '@/test/fake-gateway';
import { fixedClock } from '@/services/clock';
import { createIdGenerator } from '@/services/ids';
import { collectingLogger } from '@/services/logger';
import { noopAnalytics } from '@/services/analytics';
import { noopHaptics } from '@/services/haptics';
import { defaultConfig } from '@/services/config';
import { fakeConnectivity } from '@/services/connectivity';
import type { SqlDatabase } from '@/data/local/driver';

const USER_A = 'aaaa0000-0000-4000-8000-00000000000a';
const USER_B = 'bbbb0000-0000-4000-8000-00000000000b';

let seq = 0;
function deps(db: SqlDatabase, over?: Partial<ContainerDeps>): ContainerDeps {
  return {
    db,
    gateway: new FakeGateway(),
    clock: fixedClock(Date.parse('2026-09-03T12:00:00Z'), 'UTC'),
    ids: createIdGenerator({
      now: () => Date.parse('2026-09-03T12:00:00Z'),
      randomBytes: (n) => {
        const b = new Uint8Array(n);
        for (let i = 0; i < n; i++) b[i] = (seq + i * 13 + 1) & 0xff;
        seq += 1;
        return b;
      },
      preferV7: false,
    }),
    logger: collectingLogger(),
    analytics: noopAnalytics,
    haptics: noopHaptics,
    config: defaultConfig,
    connectivity: fakeConnectivity('online'),
    ...over,
  };
}

async function startAndLog(c: Awaited<ReturnType<typeof assembleContainer>>, userId: string, name: string) {
  const session = await c.sessions.startSession({
    userId,
    name,
    source: 'empty',
    plannedWorkoutId: null,
    items: [
      {
        exercise_id: null,
        exercise_name: 'Squat',
        tracking_mode: 'weight_reps',
        position: 0,
        group_id: null,
        substitution_of_exercise_id: null,
        notes: null,
      },
    ],
  });
  const ses = await c.repos.session.listExercises(session.id);
  await c.sets.addSet(userId, { sessionExerciseId: ses[0]!.id, position: 0, loadKg: 100, reps: 5 });
  return session;
}

describe('per-user container isolation', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'fitney-iso-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  const fileFor = (userId: string) => join(dir, `fitney-${userId}.db`);

  it('a container is bound to exactly one user; A and B never see each other', async () => {
    const cA = await assembleContainer(USER_A, deps(createTestDb()));
    await startAndLog(cA, USER_A, 'A workout');
    await cA.dispose();

    const cB = await assembleContainer(USER_B, deps(createTestDb()));
    expect(await cB.repos.session.getActive(USER_B)).toBeNull();
    expect(await cB.repos.session.listCompleted(USER_B)).toEqual([]);
    expect(await cB.outstandingWork()).toEqual({ outbox: 0, openConflicts: 0 });
    expect(await cB.repos.session.getActive(USER_A)).toBeNull();
    await cB.dispose();
  });

  it('A -> B -> A: A’s retained file still has its active session + logged set', async () => {
    let cA = await assembleContainer(USER_A, deps(createTestDb(fileFor(USER_A))));
    const started = await startAndLog(cA, USER_A, 'A workout');
    const workA = await cA.outstandingWork();
    expect(workA.outbox).toBeGreaterThan(0);
    // unsynced work -> a user-initiated sign-out PROMPTS (never auto-drops); an
    // involuntary end RETAINS. Neither drops A's file. (CE-R5 v2)
    expect(decideSignOutDisposition('user_initiated', workA).action).toBe('prompt');
    expect(decideSignOutDisposition('session_expired', workA).action).toBe('retain');
    await cA.dispose();

    const cB = await assembleContainer(USER_B, deps(createTestDb(fileFor(USER_B))));
    await startAndLog(cB, USER_B, 'B workout');
    await cB.dispose();

    // relaunch A: a FRESH handle to the same retained file
    cA = await assembleContainer(USER_A, deps(createTestDb(fileFor(USER_A))));
    const active = await cA.repos.session.getActive(USER_A);
    expect(active?.id).toBe(started.id);
    const sets = await cA.repos.performedSet.listBySession(started.id);
    expect(sets).toHaveLength(1);
    expect(sets[0]!.load_kg).toBe(100);
    await cA.dispose();
  });

  it('a retired container makes no further network calls (sync stopped, DB closed)', async () => {
    const gateway = new FakeGateway();
    const c = await assembleContainer(USER_A, deps(createTestDb(), { gateway }));
    await c.dispose();

    expect(c.sync.isStopped()).toBe(true);
    const res = await c.sync.requestSync('manual');
    expect(res).toMatchObject({ push: { attempted: 0 }, reconciled: false });
    expect(gateway.applyLog).toHaveLength(0);
  });

  it('a late result from account A cannot be applied after the runtime moved to B', async () => {
    const guard = new GenerationGuard();

    const genA = guard.bump();
    const buildA = (async () => {
      await new Promise((r) => setTimeout(r, 5));
      return assembleContainer(USER_A, deps(createTestDb()));
    })();

    const genB = guard.bump(); // B arrives first and is activated
    const cB = await assembleContainer(USER_B, deps(createTestDb()));
    await startAndLog(cB, USER_B, 'B workout');

    const cA = await buildA;
    expect(guard.isCurrent(genA)).toBe(false); // A's generation is stale
    expect(guard.isCurrent(genB)).toBe(true);
    await cA.dispose(); // what the driver does on a stale build

    const activeB = await cB.repos.session.getActive(USER_B);
    expect(activeB).not.toBeNull();
    expect((await cB.outstandingWork()).outbox).toBeGreaterThan(0); // only B's own writes
    await cB.dispose();
  });

  it('offline relaunch: a previously authenticated user still reads/writes locally', async () => {
    const gateway = new FakeGateway();
    let c = await assembleContainer(USER_A, deps(createTestDb(fileFor(USER_A)), { gateway }));
    const s = await startAndLog(c, USER_A, 'pre-offline');
    await c.dispose();

    // relaunch OFFLINE — fresh handle, no connectivity
    c = await assembleContainer(
      USER_A,
      deps(createTestDb(fileFor(USER_A)), { gateway, connectivity: fakeConnectivity('offline') }),
    );
    const sync = await c.sync.requestSync('cold-start');
    expect(sync.indicator).toBe('offline');
    expect(gateway.applyLog).toHaveLength(0);

    const active = await c.repos.session.getActive(USER_A);
    expect(active?.id).toBe(s.id);
    const ses = await c.repos.session.listExercises(s.id);
    await c.sets.addSet(USER_A, { sessionExerciseId: ses[0]!.id, position: 1, loadKg: 105, reps: 5 });
    expect(await c.repos.performedSet.listBySession(s.id)).toHaveLength(2);
    await c.dispose();
  });

  it('dispose is idempotent; repeated activation over the same file is safe', async () => {
    const c1 = await assembleContainer(USER_A, deps(createTestDb(fileFor(USER_A))));
    await startAndLog(c1, USER_A, 'w');
    await c1.dispose();
    await expect(c1.dispose()).resolves.toBeUndefined();

    const c2 = await assembleContainer(USER_A, deps(createTestDb(fileFor(USER_A)))); // migrate() re-runs as a no-op
    expect((await c2.repos.session.getActive(USER_A))?.name_snapshot).toBe('w');
    await c2.dispose();
  });
});
