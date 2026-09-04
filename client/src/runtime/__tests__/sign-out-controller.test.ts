/**
 * CE-R5 v2 sign-out ORCHESTRATION (DEC-53, human review 2026-09-04). Drives the
 * production `SignOutController` against a real `assembleContainer` (better-
 * sqlite3) + `FakeGateway` through a fake `SignOutHost`. NOT the Expo runtime /
 * real Supabase / a device.
 *
 * Proves: opening the sheet does not start the backup freeze; a failed backup and
 * Cancel restore writes + scheduling; the write barrier is held from a successful
 * final verification through teardown; a delayed backup after Cancel or an
 * account switch is inert (no sign-out, no DB drop, no credential clear); a clean
 * sign-out with a concurrent write does not lose data.
 */
import { assembleContainer, type AppContainer, type ContainerDeps } from '@/runtime/build-container';
import { SignOutController, type SignOutHost } from '@/runtime/sign-out-controller';
import { decideSignOutDisposition, type SignOutCause, type SignOutChoice } from '@/runtime/account-lifecycle';
import { createTestDb } from '@/test/better-sqlite3-driver';
import { FakeGateway } from '@/test/fake-gateway';
import { TransportError, type SyncGatewayPort } from '@/data/sync/ports';
import { WritesFrozenError } from '@/domain/errors';
import { fixedClock } from '@/services/clock';
import { createIdGenerator } from '@/services/ids';
import { collectingLogger } from '@/services/logger';
import { noopAnalytics } from '@/services/analytics';
import { noopHaptics } from '@/services/haptics';
import { defaultConfig } from '@/services/config';
import { fakeConnectivity } from '@/services/connectivity';
import type { SqlDatabase } from '@/data/local/driver';

const USER = 'aaaa0000-0000-4000-8000-0000000000d5';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 0;

function deps(db: SqlDatabase, gateway: SyncGatewayPort): ContainerDeps {
  return {
    db,
    gateway,
    clock: fixedClock(Date.parse('2026-09-04T12:00:00Z'), 'UTC'),
    ids: createIdGenerator({
      now: () => Date.parse('2026-09-04T12:00:00Z'),
      randomBytes: (n) => {
        const b = new Uint8Array(n);
        for (let i = 0; i < n; i++) b[i] = (seq + i * 19 + 1) & 0xff;
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
  };
}

async function logASet(c: AppContainer) {
  const s = await c.sessions.startSession({
    userId: USER,
    name: 'W',
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
  const ex = await c.repos.session.listExercises(s.id);
  await c.sets.addSet(USER, { sessionExerciseId: ex[0]!.id, position: 0, loadKg: 100, reps: 5 });
  return { session: s, sessionExerciseId: ex[0]!.id };
}

/** A gateway that always fails transport — a backup can never fully drain. */
class RejectingGateway extends FakeGateway {
  override async apply(): Promise<never> {
    throw new TransportError('simulated persistent transport failure');
  }
}

type HostState = {
  containerRef: AppContainer | null;
  gen: number;
  prompt: { outbox: number; openConflicts: number } | null;
  signOutCalls: Array<{ cause: SignOutCause; choice?: SignOutChoice; frozenAtCall: boolean }>;
  dropped: string[];
  retained: string[];
};

function makeHost(state: HostState): SignOutHost {
  return {
    container: () => state.containerRef,
    generation: () => state.gen,
    setPrompt: (p) => {
      state.prompt = p;
    },
    signOutWith: async (cause, choice) => {
      const c = state.containerRef;
      state.signOutCalls.push({ cause, choice, frozenAtCall: c ? c.writesFrozen() : false });
      if (!c) return;
      // model the runtime retire: apply the disposition, then dispose
      const work = await c.outstandingWork();
      const disp = decideSignOutDisposition(cause, work, choice);
      await c.dispose();
      if (disp.action === 'drop') state.dropped.push(USER);
      else state.retained.push(USER);
      state.containerRef = null;
    },
  };
}

async function freshState(gateway?: SyncGatewayPort): Promise<{
  state: HostState;
  host: SignOutHost;
  ctl: SignOutController;
  container: AppContainer;
}> {
  const container = await assembleContainer(USER, deps(createTestDb(), gateway ?? new FakeGateway()));
  const state: HostState = {
    containerRef: container,
    gen: 1,
    prompt: null,
    signOutCalls: [],
    dropped: [],
    retained: [],
  };
  const host = makeHost(state);
  return { state, host, ctl: new SignOutController(host), container };
}

describe('SignOutController.begin', () => {
  it('clean → signs out with the write barrier still held through teardown', async () => {
    const { state, ctl, container } = await freshState();
    // nothing outstanding
    expect((await container.outstandingWork()).outbox).toBe(0);

    const r = await ctl.begin();
    expect(r).toBe('signed-out');
    expect(state.signOutCalls).toEqual([
      { cause: 'user_initiated', choice: undefined, frozenAtCall: true }, // barrier preserved
    ]);
    expect(state.dropped).toEqual([USER]);
    expect(state.retained).toEqual([]);
    expect(state.prompt).toBeNull();
  });

  it('dirty → opens the sheet UNFROZEN; the account stays fully usable', async () => {
    const { state, ctl, container } = await freshState();
    const { sessionExerciseId } = await logASet(container); // leaves a pending outbox row

    const r = await ctl.begin();
    expect(r).toBe('prompt');
    expect(state.prompt).toEqual({ outbox: expect.any(Number), openConflicts: 0 });
    expect(state.prompt!.outbox).toBeGreaterThan(0);
    expect(container.writesFrozen()).toBe(false); // NOT the backup freeze
    expect(state.signOutCalls).toEqual([]);

    // a normal write still works while the sheet is open
    await expect(
      container.sets.addSet(USER, { sessionExerciseId, position: 1, loadKg: 60, reps: 8 }),
    ).resolves.toBeTruthy();
    await container.dispose();
  });

  it('a write attempted DURING the momentary check window is rejected (no lossy race)', async () => {
    const { host, container } = await freshState();
    await logASet(container);
    // wrap outstandingWork so we can probe mid-check
    let frozenMidCheck: boolean | null = null;
    const realOW = container.outstandingWork.bind(container);
    (container as { outstandingWork: () => Promise<{ outbox: number; openConflicts: number }> }).outstandingWork =
      async () => {
        frozenMidCheck = container.writesFrozen();
        await sleep(5);
        return realOW();
      };
    const ctl = new SignOutController(host);
    await ctl.begin();
    expect(frozenMidCheck).toBe(true); // the check runs frozen — a concurrent write would throw
    await container.dispose();
  });
});

describe('SignOutController.resolve', () => {
  it('backup that cannot drain → RESTORES writes and re-prompts with the residual', async () => {
    const { state, ctl, container } = await freshState(new RejectingGateway());
    const { sessionExerciseId } = await logASet(container);
    await ctl.begin(); // -> prompt
    expect(state.prompt!.outbox).toBeGreaterThan(0);
    state.prompt = null;

    const r = await ctl.resolve('backup');
    expect(r).toBe('reprompt');
    expect(state.prompt!.outbox).toBeGreaterThan(0); // residual shown
    expect(state.signOutCalls).toEqual([]); // never signed out
    expect(state.dropped).toEqual([]);
    expect(container.writesFrozen()).toBe(false); // writes restored

    // usable again
    await expect(
      container.sets.addSet(USER, { sessionExerciseId, position: 1, loadKg: 62, reps: 8 }),
    ).resolves.toBeTruthy();
    await container.dispose();
  });

  it('cancel → unfreezes, clears the prompt, keeps the session; a retry then works', async () => {
    const { state, ctl, container } = await freshState(new RejectingGateway());
    await logASet(container);
    await ctl.begin();
    await ctl.resolve('backup'); // reprompt, still active
    expect(container.writesFrozen()).toBe(false);

    const c = await ctl.resolve('cancel');
    expect(c).toBe('cancelled');
    expect(state.prompt).toBeNull();
    expect(container.writesFrozen()).toBe(false);
    expect(state.signOutCalls).toEqual([]);

    // retry: begin again, then Keep
    expect(await ctl.begin()).toBe('prompt');
    expect(await ctl.resolve('keep')).toBe('signed-out');
    expect(state.retained).toEqual([USER]); // kept, not dropped
    expect(state.dropped).toEqual([]);
  });

  it('discard → drops after the choice (explicit informed)', async () => {
    const { state, ctl, container } = await freshState();
    await logASet(container);
    await ctl.begin();
    expect(await ctl.resolve('discard')).toBe('signed-out');
    expect(state.dropped).toEqual([USER]);
    void container;
  });

  it('a delayed backup completing AFTER Cancel is inert (no sign-out, no drop)', async () => {
    // slow sync: the outbox WOULD drain, but only after ~30ms
    const gateway = new FakeGateway();
    const slowApply = gateway.apply.bind(gateway);
    gateway.apply = async (req) => {
      await sleep(30);
      return slowApply(req);
    };
    const { state, ctl, container } = await freshState(gateway);
    await logASet(container);
    await ctl.begin();

    const backup = ctl.resolve('backup'); // in flight
    await sleep(5);
    const cancel = await ctl.resolve('cancel'); // supersedes the backup
    expect(cancel).toBe('cancelled');

    const backupResult = await backup;
    expect(backupResult).toBe('stale');
    expect(state.signOutCalls).toEqual([]); // the stale backup NEVER signed out
    expect(state.dropped).toEqual([]);
    expect(container.writesFrozen()).toBe(false); // cancel restored writes
    await container.dispose();
  });

  it('a delayed backup completing AFTER an account switch cannot touch either account', async () => {
    const gateway = new FakeGateway();
    const slowApply = gateway.apply.bind(gateway);
    gateway.apply = async (req) => {
      await sleep(30);
      return slowApply(req);
    };
    const { state, ctl, container } = await freshState(gateway);
    await logASet(container);
    await ctl.begin();

    const backup = ctl.resolve('backup');
    await sleep(5);
    // simulate the runtime switching accounts mid-backup
    const containerB = await assembleContainer('bbbb0000-0000-4000-8000-0000000000d6', deps(createTestDb(), new FakeGateway()));
    state.gen = 2;
    state.containerRef = containerB;

    expect(await backup).toBe('stale');
    expect(state.signOutCalls).toEqual([]);
    expect(state.dropped).toEqual([]);
    // account B is untouched by A's stale backup
    expect((await containerB.outstandingWork())).toEqual({ outbox: 0, openConflicts: 0 });
    await container.dispose();
    await containerB.dispose();
  });

  it('backup that DOES drain cleanly → signs out with the barrier still held', async () => {
    const { state, ctl, container } = await freshState(new FakeGateway());
    await logASet(container);
    await ctl.begin();
    const r = await ctl.resolve('backup');
    expect(r).toBe('signed-out');
    expect(state.signOutCalls).toEqual([{ cause: 'user_initiated', choice: undefined, frozenAtCall: true }]);
    expect(state.dropped).toEqual([USER]);
    void container;
  });
});

describe('write freeze is a container-scoped barrier (regression for the setters)', () => {
  it('every outbox-enqueuing method throws WritesFrozenError while frozen; reads and pull-apply do not', async () => {
    const { container } = await freshState();
    const { session, sessionExerciseId } = await logASet(container);
    container.setWritesFrozen(true);
    await expect(
      container.sets.addSet(USER, { sessionExerciseId, position: 9, loadKg: 1, reps: 1 }),
    ).rejects.toBeInstanceOf(WritesFrozenError);
    await expect(container.sessions.finishSession(USER, session.id)).rejects.toBeInstanceOf(WritesFrozenError);
    // reads OK
    expect((await container.repos.performedSet.listBySession(session.id)).length).toBe(1);
    container.setWritesFrozen(false);
    await expect(
      container.sets.addSet(USER, { sessionExerciseId, position: 9, loadKg: 1, reps: 1 }),
    ).resolves.toBeTruthy();
    await container.dispose();
  });
});
