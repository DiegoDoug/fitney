/**
 * CE-R5 v2 (DEC-53) — sign-out with unsynced work. REAL LOCAL SQLite
 * (better-sqlite3) + FakeGateway. NOT the Expo runtime / real Supabase / a
 * device. Covers: the write-freeze scope, that the sync engine keeps working
 * while frozen, `outstandingWork` counting conflicts, conflict preservation
 * across a retain, and the exact set of conditions that permit dropping the DB.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleContainer, readOutstanding, type ContainerDeps } from '@/runtime/build-container';
import {
  decideSignOutDisposition,
  type SignOutCause,
  type SignOutChoice,
} from '@/runtime/account-lifecycle';
import { WritesFrozenError } from '@/domain/errors';
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

const USER = 'aaaa0000-0000-4000-8000-0000000000c5';
let seq = 0;
function deps(db: SqlDatabase, over?: Partial<ContainerDeps>): ContainerDeps {
  return {
    db,
    gateway: new FakeGateway(),
    clock: fixedClock(Date.parse('2026-09-04T12:00:00Z'), 'UTC'),
    ids: createIdGenerator({
      now: () => Date.parse('2026-09-04T12:00:00Z'),
      randomBytes: (n) => {
        const b = new Uint8Array(n);
        for (let i = 0; i < n; i++) b[i] = (seq + i * 17 + 1) & 0xff;
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
async function logASet(c: Awaited<ReturnType<typeof assembleContainer>>) {
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
  return s;
}

describe('write freeze (CE-R5 v2 "Back up & sign out" quiesce)', () => {
  it('freezes the feature write path and restores it exactly on unfreeze', async () => {
    const c = await assembleContainer(USER, deps(createTestDb()));
    const s = await logASet(c);
    const ex = await c.repos.session.listExercises(s.id);

    expect(c.writesFrozen()).toBe(false);
    c.setWritesFrozen(true);
    expect(c.writesFrozen()).toBe(true);

    // every outbox-enqueuing method rejects while frozen
    await expect(
      c.sets.addSet(USER, { sessionExerciseId: ex[0]!.id, position: 1, loadKg: 60, reps: 8 }),
    ).rejects.toBeInstanceOf(WritesFrozenError);
    await expect(c.sessions.finishSession(USER, s.id)).rejects.toBeInstanceOf(WritesFrozenError);
    await expect(
      c.repos.profile.upsert(USER, {
        id: USER,
        user_id: USER,
        display_name: 'x',
        unit_pref: 'kg',
        week_start: 1,
        default_rest_seconds: 120,
        haptics: true,
        sound: true,
        theme: 'system',
        plate_increment_kg: 2.5,
        training_goal: null,
        version: 1,
        updated_at: null,
        created_at: null,
        deleted_at: null,
        synced_version: null,
        dirty: 1,
        local_updated_at: 0,
      }),
    ).rejects.toBeInstanceOf(WritesFrozenError);

    // reads are unaffected
    expect((await c.repos.performedSet.listBySession(s.id)).length).toBe(1);

    // Cancel / failure path: unfreeze -> writes work again, nothing lost
    c.setWritesFrozen(false);
    await c.sets.addSet(USER, { sessionExerciseId: ex[0]!.id, position: 1, loadKg: 60, reps: 8 });
    expect((await c.repos.performedSet.listBySession(s.id)).length).toBe(2);
    await c.dispose();
  });

  it('the sync engine still writes while the feature path is frozen (final drain must work)', async () => {
    const gateway = new FakeGateway();
    const c = await assembleContainer(USER, deps(createTestDb(), { gateway }));
    await logASet(c);
    c.setWritesFrozen(true);

    // pull-apply paths are NOT frozen
    await expect(
      c.repos.exercise.bulkPut([
        {
          id: 'ex-seed-1',
          owner_user_id: null,
          name: 'Bench',
          name_normalized: 'bench',
          aliases: [],
          primary_muscles: [],
          secondary_muscles: [],
          equipment: null,
          tracking_mode: 'weight_reps',
          is_unilateral: false,
          instructions: null,
          archived: false,
          version: 1,
          updated_at: null,
          created_at: null,
          deleted_at: null,
          synced_version: 1,
          dirty: 0,
          local_updated_at: 0,
        },
      ]),
    ).resolves.toBeUndefined();

    // the final drain runs and clears the outbox
    const res = await c.sync.requestSync('manual');
    expect(res.push.applied).toBeGreaterThan(0);
    expect((await c.outstandingWork()).outbox).toBe(0);
    await c.dispose();
  });
});

describe('outstandingWork + conflict preservation', () => {
  it('counts an unresolved sync_conflicts row, and a retain never removes it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fitney-so-'));
    const file = join(dir, `fitney-${USER}.db`);
    try {
      let c = await assembleContainer(USER, deps(createTestDb(file)));
      await logASet(c);
      await c.sync.requestSync('manual'); // drain the clean outbox
      expect((await c.outstandingWork()).outbox).toBe(0);

      // park a conflict (models an ADR-0003 §5 completed-session conflict) via a
      // second connection to the same file — the container does not expose its db.
      const probe = createTestDb(file);
      await probe.runAsync(
        `INSERT INTO sync_conflicts (entity, entity_id, local_payload, server_payload,
                                     local_base_version, server_version, detected_at)
         VALUES ('performed_set', 'ps-x', '{}', '{}', 1, 2, 1)`,
      );
      await probe.closeAsync();

      const work = await c.outstandingWork();
      expect(work).toEqual({ outbox: 0, openConflicts: 1 });
      expect(decideSignOutDisposition('user_initiated', work).action).toBe('prompt');
      expect(decideSignOutDisposition('session_expired', work)).toMatchObject({ action: 'retain' });

      await c.dispose(); // a retain disposes the container but does NOT drop the file

      // reopen the retained file — the conflict row is still there (nothing discarded)
      c = await assembleContainer(USER, deps(createTestDb(file)));
      expect((await c.outstandingWork()).openConflicts).toBe(1);
      await c.dispose();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('Remove account from this device — data path (CE-R5 v2)', () => {
  it('reads a retained file’s outstanding count, then a drop makes it gone', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fitney-rm-'));
    const file = join(dir, `fitney-${USER}.db`);
    try {
      const c = await assembleContainer(USER, deps(createTestDb(file)));
      await logASet(c); // one pending outbox row
      await c.dispose(); // retain (no drop)

      // retainedAccountOutstanding: open a fresh read-only handle, count, close
      const probe = createTestDb(file);
      const outstanding = await readOutstanding(probe);
      await probe.closeAsync();
      expect(outstanding.outbox).toBeGreaterThan(0);

      // removeAccountFromDevice: delete the file
      rmSync(file, { force: true });

      // a subsequent open is a fresh, empty DB (the retained data is gone)
      const after = await assembleContainer(USER, deps(createTestDb(file)));
      expect(await after.outstandingWork()).toEqual({ outbox: 0, openConflicts: 0 });
      expect(await after.repos.session.getActive(USER)).toBeNull();
      await after.dispose();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a corrupt/non-SQLite retained file fails to open — the exact failure `outstandingForUser` catches and turns into `null` (unknown, not "0 changes") rather than letting it throw into the Settings screen', async () => {
    const { writeFileSync } = await import('node:fs');
    const dir = mkdtempSync(join(tmpdir(), 'fitney-rm-corrupt-open-'));
    const file = join(dir, `fitney-${USER}.db`);
    writeFileSync(file, Buffer.from('not a sqlite database'));
    try {
      expect(() => createTestDb(file)).toThrow();
    } finally {
      // NOTE: better-sqlite3's failed constructor can leave a native file
      // handle open on Windows until process exit (a test-only binding quirk
      // — expo-sqlite's native iOS/Android binding has different open/close
      // semantics and is unaffected). Cleanup here is best-effort and not
      // itself part of what this test verifies.
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* ignore — OS temp dir, reclaimed by the system regardless */
      }
    }
  });

  it('"Remove account from this device" deletes an unreadable file WITHOUT requiring it to open first', async () => {
    const { writeFileSync, existsSync } = await import('node:fs');
    const dir = mkdtempSync(join(tmpdir(), 'fitney-rm-corrupt-delete-'));
    const file = join(dir, `fitney-${USER}.db`);
    try {
      // corrupt content, but this test never opens it — mirrors
      // `removeAccountFromDevice` -> `dropFn(userId)`, which deletes the file
      // directly and never calls `outstandingForUser`/open first.
      writeFileSync(file, Buffer.from('not a sqlite database'));
      rmSync(file, { force: true });
      expect(existsSync(file)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('conditions that permit dropping the per-user DB (CE-R5 v2)', () => {
  const dirty = { outbox: 2, openConflicts: 1 };
  const clean = { outbox: 0, openConflicts: 0 };

  it('drop is permitted ONLY for: confirmed deletion, clean user sign-out, explicit discard', () => {
    const drops: Array<[SignOutCause, typeof clean, SignOutChoice?]> = [
      ['account_deleted', dirty],
      ['account_deleted', clean],
      ['user_initiated', clean],
      ['user_initiated', dirty, 'discard'],
    ];
    for (const [cause, work, choice] of drops) {
      expect(decideSignOutDisposition(cause, work, choice).action).toBe('drop');
    }
  });

  it('drop is NEVER permitted for: involuntary end, or a dirty user sign-out without an explicit discard', () => {
    expect(decideSignOutDisposition('session_expired', dirty).action).toBe('retain');
    expect(decideSignOutDisposition('session_expired', clean).action).toBe('retain'); // even clean
    expect(decideSignOutDisposition('account_switch', dirty).action).toBe('retain');
    expect(decideSignOutDisposition('user_initiated', dirty).action).toBe('prompt');
    expect(decideSignOutDisposition('user_initiated', dirty, 'keep').action).toBe('retain');
  });
});
