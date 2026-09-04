/**
 * Onboarding (SPEC AUTH-03) — MOCKED LOGIC + REAL LOCAL SQLite. Profile creation
 * through the existing outbox/`sync_apply` contract, idempotent completion,
 * resumable partial state, and hydrate-from-server detection.
 */
import { makeHarness, TEST_USER } from '@/test/harness';
import {
  OnboardingService,
  OnboardingValidationError,
  validateOnboardingInput,
  type OnboardingInput,
} from '@/features/onboarding/onboarding-service';
import { noopAnalytics } from '@/services/analytics';
import { collectingLogger } from '@/services/logger';

const INPUT: OnboardingInput = {
  displayName: '  Dana  ',
  unitPref: 'lb',
  weekStart: 0,
  defaultRestSeconds: 90,
  trainingGoal: '  squat 405  ',
};

async function svc() {
  const h = await makeHarness();
  const onboarding = new OnboardingService(h.repos, {
    clock: h.clock,
    analytics: noopAnalytics,
    logger: collectingLogger(),
  });
  return { h, onboarding };
}

describe('validateOnboardingInput', () => {
  it('requires a display name and a valid week start / rest', () => {
    expect(validateOnboardingInput({}).displayName).toBeTruthy();
    expect(validateOnboardingInput({ displayName: 'x', weekStart: 9 }).weekStart).toBeTruthy();
    expect(validateOnboardingInput({ displayName: 'x', defaultRestSeconds: -1 }).defaultRestSeconds).toBeTruthy();
    expect(
      validateOnboardingInput({ displayName: 'x', unitPref: 'kg', weekStart: 1, defaultRestSeconds: 120 }),
    ).toEqual({});
  });
});

describe('OnboardingService', () => {
  it('a fresh user needs onboarding with no draft', async () => {
    const { onboarding } = await svc();
    expect(await onboarding.getState(TEST_USER)).toEqual({ status: 'needed', draft: null });
  });

  it('submit writes the profile row + exactly one profile outbox entry + the local marker', async () => {
    const { h, onboarding } = await svc();
    await onboarding.submit(TEST_USER, INPUT);

    const row = await h.db.getFirstAsync<Record<string, unknown>>(
      `SELECT display_name, unit_pref, week_start, default_rest_seconds, training_goal,
              onboarding_completed_at, dirty FROM profiles WHERE id = ?`,
      [TEST_USER],
    );
    expect(row).toMatchObject({
      display_name: 'Dana', // trimmed
      unit_pref: 'lb',
      week_start: 0,
      default_rest_seconds: 90,
      training_goal: 'squat 405', // trimmed
      dirty: 1,
    });
    expect(row!.onboarding_completed_at).not.toBeNull();

    const outbox = await h.db.getAllAsync<{ entity: string; op: string; state: string; payload_json: string }>(
      `SELECT entity, op, state, payload_json FROM sync_outbox`,
    );
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ entity: 'profile', op: 'upsert', state: 'pending' });

    // the local-only marker is NEVER part of the sync payload
    expect(outbox[0]!.payload_json).not.toContain('onboarding_completed_at');

    expect(await onboarding.getState(TEST_USER)).toEqual({ status: 'complete' });
  });

  it('completion is idempotent — re-submitting coalesces the outbox and does not move the marker', async () => {
    const { h, onboarding } = await svc();
    await onboarding.submit(TEST_USER, INPUT);
    const first = await h.db.getFirstAsync<{ onboarding_completed_at: number }>(
      `SELECT onboarding_completed_at FROM profiles WHERE id = ?`,
      [TEST_USER],
    );

    await onboarding.submit(TEST_USER, { ...INPUT, displayName: 'Dana 2' });

    const outbox = await h.db.getAllAsync(`SELECT seq FROM sync_outbox WHERE entity = 'profile'`);
    expect(outbox).toHaveLength(1); // coalesced, not a second row
    const second = await h.db.getFirstAsync<{ onboarding_completed_at: number }>(
      `SELECT onboarding_completed_at FROM profiles WHERE id = ?`,
      [TEST_USER],
    );
    expect(second!.onboarding_completed_at).toBe(first!.onboarding_completed_at); // set-once
  });

  it('interrupted onboarding is resumable — a partial profile prefills the draft', async () => {
    const { h, onboarding } = await svc();
    // a row was created but the flow never finished (no marker, never synced)
    await h.db.runAsync(
      `INSERT INTO profiles (id, user_id, display_name, unit_pref, week_start, default_rest_seconds,
                             training_goal, version, dirty, local_updated_at)
       VALUES (?, ?, 'Half Done', 'lb', 3, 150, NULL, 1, 1, 0)`,
      [TEST_USER, TEST_USER],
    );
    const state = await onboarding.getState(TEST_USER);
    expect(state).toEqual({
      status: 'needed',
      draft: { displayName: 'Half Done', unitPref: 'lb', weekStart: 3, defaultRestSeconds: 150, trainingGoal: null },
    });
  });

  it('hydrate — a server-synced profile row means onboarding already happened elsewhere', async () => {
    const { h, onboarding } = await svc();
    await h.db.runAsync(
      `INSERT INTO profiles (id, user_id, display_name, unit_pref, week_start, default_rest_seconds,
                             version, synced_version, dirty, local_updated_at)
       VALUES (?, ?, 'Pulled', 'kg', 1, 120, 4, 4, 0, 0)`,
      [TEST_USER, TEST_USER],
    );
    expect(await onboarding.getState(TEST_USER)).toEqual({ status: 'complete' });
  });

  it('invalid input throws OnboardingValidationError with field detail', async () => {
    const { onboarding } = await svc();
    await expect(onboarding.submit(TEST_USER, { ...INPUT, displayName: '   ' })).rejects.toBeInstanceOf(
      OnboardingValidationError,
    );
    await onboarding
      .submit(TEST_USER, { ...INPUT, weekStart: 42 })
      .catch((e: OnboardingValidationError) => expect(e.fields.weekStart).toBeTruthy());
  });
});
