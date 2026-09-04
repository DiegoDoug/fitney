/**
 * Offline logging vertical slice (SPEC §18 Phase 1 exit gate, E2E scenario 2 —
 * the parts verifiable without a device): start a session offline, log + edit +
 * complete sets with no network, force-close/relaunch and restore the active
 * session with no confirmed-set loss, finish idempotently, and see the derived
 * summary + a history entry.
 */
import { SessionService } from '@/features/logging/session-service';
import { SetService } from '@/features/logging/set-service';
import { restTimerView, addFifteen, startAnchor } from '@/features/logging/rest-timer';
import { createLocalRepositories } from '@/data/local/repositories';
import { fixedClock } from '@/services/clock';
import { noopAnalytics } from '@/services/analytics';
import { noopHaptics } from '@/services/haptics';
import { collectingLogger } from '@/services/logger';
import { makeHarness, insertProfile, TEST_USER } from '@/test/harness';
import { GV_EXERCISE } from '@/test/golden-vectors';

async function seedExercise(db: import('@/data/local/driver').SqlDatabase) {
  await db.runAsync(
    `INSERT INTO exercises (id, owner_user_id, name, name_normalized, tracking_mode, version, dirty, local_updated_at)
     VALUES (?, NULL, 'Back Squat', 'back squat', 'weight_reps', 1, 0, 0)`,
    [GV_EXERCISE],
  );
}

describe('offline logging vertical slice', () => {
  it('starts a session, logs sets offline, restores after relaunch, finishes idempotently', async () => {
    const h = await makeHarness({ online: false });
    await insertProfile(h.db, TEST_USER, 1);
    await seedExercise(h.db);

    const sessions = new SessionService(h.repos, {
      clock: h.clock,
      ids: h.ids,
      analytics: noopAnalytics,
      logger: h.logger,
    });
    const sets = new SetService(h.repos.performedSet, {
      clock: h.clock,
      ids: h.ids,
      analytics: noopAnalytics,
      haptics: noopHaptics,
    });

    // 1-2. create a session from a repeat/empty seed (offline)
    const session = await sessions.startSession({
      userId: TEST_USER,
      name: 'Lower A',
      source: 'empty',
      plannedWorkoutId: null,
      items: [
        {
          exercise_id: GV_EXERCISE,
          exercise_name: 'Back Squat',
          tracking_mode: 'weight_reps',
          position: 0,
          group_id: null,
          substitution_of_exercise_id: null,
          notes: null,
        },
      ],
    });
    const [se] = await h.repos.session.listExercises(session.id);
    expect(se).toBeDefined();

    // 3-4. add, edit, complete three working sets — no network
    const a = await sets.addSet(TEST_USER, { sessionExerciseId: se!.id, position: 0, loadKg: 100, reps: 5 });
    const aDone = await sets.completeSet(TEST_USER, a);
    const b = await sets.addSet(TEST_USER, { sessionExerciseId: se!.id, position: 1, loadKg: 100, reps: 8 });
    const bEdited = await sets.editSet(TEST_USER, b, { loadKg: 102.5 });
    await sets.completeSet(TEST_USER, bEdited);
    const c = await sets.addSet(TEST_USER, { sessionExerciseId: se!.id, position: 2, loadKg: 110, reps: 1 });
    await sets.completeSet(TEST_USER, c);
    expect(aDone.completed).toBe(true);

    // 5-6. every confirmed mutation left one coalesced outbox entry
    const obxCount = await h.db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM sync_outbox`);
    // 1 session + 1 session_exercise + 3 performed_sets = 5 outstanding entries
    expect(obxCount!.n).toBe(5);

    // 7. rest timer recovers from an absolute anchor across a "relaunch"
    const anchor = startAnchor(h.clock.now());
    const later = fixedClock(h.clock.now() + 40_000, 'UTC');
    const v = restTimerView({ anchorMs: anchor, durationSeconds: 120, nowMs: later.now() });
    expect(v.remainingSeconds).toBe(80);
    expect(restTimerView({ anchorMs: addFifteen(anchor), durationSeconds: 120, nowMs: later.now() }).remainingSeconds).toBe(95);

    // 9. "relaunch": a fresh repositories instance over the SAME db restores the session
    const repos2 = createLocalRepositories({ db: h.db, clock: h.clock, ids: h.ids });
    const sessions2 = new SessionService(repos2, {
      clock: h.clock,
      ids: h.ids,
      analytics: noopAnalytics,
      logger: collectingLogger(),
    });
    const restored = await sessions2.restoreActive(TEST_USER);
    expect(restored?.id).toBe(session.id);
    const restoredSets = await repos2.performedSet.listBySession(session.id);
    expect(restoredSets.filter((s) => s.completed)).toHaveLength(3); // no confirmed set lost

    // 8. finish is idempotent
    await sessions2.finishSession(TEST_USER, session.id);
    await sessions2.finishSession(TEST_USER, session.id); // no-op
    const done = await repos2.session.getById(session.id);
    expect(done?.status).toBe('completed');

    // 12. derived summary + history entry
    const completed = await repos2.session.listCompleted(TEST_USER);
    expect(completed.map((s) => s.id)).toContain(session.id);
    const prs = await h.db.getAllAsync<{ category: string; value: number }>(
      `SELECT category, value FROM personal_records WHERE user_id = ? AND deleted_at IS NULL`,
      [TEST_USER],
    );
    const byCat = Object.fromEntries(prs.map((p) => [p.category, p.value]));
    expect(byCat.max_load).toBe(110);
    expect(byCat.est_1rm).toBeCloseTo(129.8333, 4);
    expect(byCat.session_volume).toBe(1430);
  });

  it('refuses to start a second active session (FR-LOG-12)', async () => {
    const h = await makeHarness();
    await insertProfile(h.db);
    const sessions = new SessionService(h.repos, {
      clock: h.clock,
      ids: h.ids,
      analytics: noopAnalytics,
      logger: h.logger,
    });
    await sessions.startSession({
      userId: TEST_USER,
      name: 'A',
      source: 'empty',
      plannedWorkoutId: null,
      items: [],
    });
    await expect(
      sessions.startSession({
        userId: TEST_USER,
        name: 'B',
        source: 'empty',
        plannedWorkoutId: null,
        items: [],
      }),
    ).rejects.toMatchObject({ name: 'ActiveSessionExistsError' });
  });
});
