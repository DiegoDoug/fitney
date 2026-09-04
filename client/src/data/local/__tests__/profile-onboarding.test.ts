/**
 * ProfileRepository onboarding marker (m0002) — REAL LOCAL SQLite. The marker is
 * local-only: set-once, readable via getOnboardingState, and NEVER enqueued as a
 * sync operation.
 */
import { makeHarness, TEST_USER } from '@/test/harness';

describe('ProfileRepository onboarding state', () => {
  it('reports "not onboarded" for an absent profile', async () => {
    const h = await makeHarness();
    expect(await h.repos.profile.getOnboardingState(TEST_USER)).toEqual({
      profileExists: false,
      completed: false,
      serverSynced: false,
      draft: null,
    });
  });

  it('markOnboardingComplete is set-once and does not touch the outbox', async () => {
    const h = await makeHarness();
    await h.db.runAsync(
      `INSERT INTO profiles (id, user_id, display_name, unit_pref, week_start, default_rest_seconds,
                             version, dirty, local_updated_at)
       VALUES (?, ?, 'X', 'kg', 1, 120, 1, 0, 0)`,
      [TEST_USER, TEST_USER],
    );

    await h.repos.profile.markOnboardingComplete(TEST_USER, 1000);
    await h.repos.profile.markOnboardingComplete(TEST_USER, 2000); // second call ignored

    const row = await h.db.getFirstAsync<{ onboarding_completed_at: number }>(
      `SELECT onboarding_completed_at FROM profiles WHERE id = ?`,
      [TEST_USER],
    );
    expect(row!.onboarding_completed_at).toBe(1000);

    const outbox = await h.db.getAllAsync(`SELECT * FROM sync_outbox`);
    expect(outbox).toEqual([]);

    const state = await h.repos.profile.getOnboardingState(TEST_USER);
    expect(state).toMatchObject({ profileExists: true, completed: true, draft: null });
  });

  it('a dirty, unsynced partial row yields a prefill draft', async () => {
    const h = await makeHarness();
    await h.db.runAsync(
      `INSERT INTO profiles (id, user_id, display_name, unit_pref, week_start, default_rest_seconds,
                             training_goal, version, dirty, local_updated_at)
       VALUES (?, ?, 'Partial', 'lb', 6, 60, 'bench', 1, 1, 0)`,
      [TEST_USER, TEST_USER],
    );
    const state = await h.repos.profile.getOnboardingState(TEST_USER);
    expect(state).toEqual({
      profileExists: true,
      completed: false,
      serverSynced: false,
      draft: { displayName: 'Partial', unitPref: 'lb', weekStart: 6, defaultRestSeconds: 60, trainingGoal: 'bench' },
    });
  });
});
