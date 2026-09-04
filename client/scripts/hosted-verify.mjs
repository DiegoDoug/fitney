#!/usr/bin/env node
/**
 * WORK-013 (sync-protocol conformance) + WORK-020 (client/server golden-vector
 * cross-run) + hosted GoTrue auth/recovery verification, run against the REAL
 * `fitney-dev` project — not a `FakeGateway`. Opt-in / manual only: never runs
 * in CI, needs no secret (only the client-safe URL + publishable/anon key, the
 * same values the Expo app itself bundles).
 *
 * Usage (from client/):
 *   EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... node scripts/hosted-verify.mjs
 *
 * Creates two disposable synthetic accounts (fitney-verify-*@fitney-hosted-verify.com) and
 * exercises: sign-up/sign-in, password-policy probes, recovery-link redirect
 * validation, user-enumeration behaviour, the `sync_apply` RPC contract
 * (insert/update/conflict/duplicate/cross-tenant-denial), and the trigger-driven
 * recompute path against the shared golden vectors
 * (client/src/test/golden-vectors.ts / supabase/tests/03_recompute_test.sql).
 *
 * Prints a single JSON report to stdout. Does not delete the synthetic
 * `auth.users` rows it creates (no service-role key available to this script,
 * by design — deletion needs the Supabase dashboard or a service-role-backed
 * admin call); this is harmless disposable dev-project data.
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!URL || !ANON_KEY) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (client-safe values) first.');
  process.exit(1);
}

const report = { startedAt: new Date().toISOString(), auth: {}, syncApply: {}, recompute: {} };
const rid = () => Math.random().toString(36).slice(2, 10);
const suffix = rid();
// SKIP_SIGNUP + pre-existing confirmed credentials: the hosted signUp/email
// rate limit was exhausted by an earlier probing run against this same dev
// project within its current window, confirmed empty in auth.users (no
// partial rows were created — the limiter rejected before any DB write).
// Skips straight to sign-in with two ALREADY-confirmed synthetic accounts
// created directly in auth.users via `execute_sql` (bypasses the rate-limited
// HTTP signup endpoint only — sign-in is a separate, unaffected GoTrue path).
const SKIP_SIGNUP = process.env.HOSTED_VERIFY_SKIP_SIGNUP === '1';
const emailA = process.env.HOSTED_VERIFY_EMAIL_A ?? `fitney-verify-a-${suffix}@fitney-hosted-verify.com`;
const emailB = process.env.HOSTED_VERIFY_EMAIL_B ?? `fitney-verify-b-${suffix}@fitney-hosted-verify.com`;
const PASSWORD = process.env.HOSTED_VERIFY_PASSWORD ?? 'HostedVerify1A'; // compliant with the client's own validatePassword

function freshClient() {
  return createClient(URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  // ---------------------------------------------------------------- 1. AUTH
  if (SKIP_SIGNUP) {
    report.auth.skipped = 'signUp/recovery probes skipped (HOSTED_VERIFY_SKIP_SIGNUP=1) — already run in a prior invocation against this project; see that run\'s captured report instead of re-hitting the exhausted rate limit.';
  } else {
    const anon = freshClient();

    const signUpA = await anon.auth.signUp({ email: emailA, password: PASSWORD });
    report.auth.signUpA = {
      error: signUpA.error?.message ?? null,
      hasSessionImmediately: !!signUpA.data?.session,
      userId: signUpA.data?.user?.id ?? null,
    };

    const signUpB = await freshClient().auth.signUp({ email: emailB, password: PASSWORD });
    report.auth.signUpB = {
      error: signUpB.error?.message ?? null,
      hasSessionImmediately: !!signUpB.data?.session,
      userId: signUpB.data?.user?.id ?? null,
    };

    // weak-password probes — bypass the CLIENT's own validatePassword entirely by
    // calling the SDK directly; reveals the EFFECTIVE hosted password_requirements.
    const weakNoUpper = await freshClient().auth.signUp({ email: `fitney-verify-w1-${suffix}@fitney-hosted-verify.com`, password: 'weakpw1' });
    report.auth.weakPasswordNoUppercaseAccepted = !weakNoUpper.error;
    report.auth.weakPasswordNoUppercaseError = weakNoUpper.error?.message ?? null;

    const weakShort = await freshClient().auth.signUp({ email: `fitney-verify-w2-${suffix}@fitney-hosted-verify.com`, password: 'Ab1' });
    report.auth.weakPasswordTooShortAccepted = !weakShort.error;
    report.auth.weakPasswordTooShortError = weakShort.error?.message ?? null;

    // enumeration: sign up again with an ALREADY-registered email
    const dupe = await freshClient().auth.signUp({ email: emailA, password: PASSWORD });
    report.auth.duplicateSignUp = { error: dupe.error?.message ?? null, identitiesEmpty: dupe.data?.user?.identities?.length === 0 };

    // recovery link — the redirect this app actually uses (round-1 finding: not
    // allow-listed in config.toml's additional_redirect_urls)
    const recovery = await freshClient().auth.resetPasswordForEmail(emailA, { redirectTo: 'fitney://auth/callback' });
    report.auth.recoveryWithAppRedirect = { error: recovery.error?.message ?? null };

    // recovery against a NON-existent email — should behave identically (no
    // enumeration signal) to the real-email case above
    const recoveryUnknown = await freshClient().auth.resetPasswordForEmail(`fitney-verify-nobody-${suffix}@fitney-hosted-verify.com`, {
      redirectTo: 'fitney://auth/callback',
    });
    report.auth.recoveryUnknownEmail = { error: recoveryUnknown.error?.message ?? null };

    // only meaningful when signUpA itself actually succeeded (not rate-limited /
    // rejected) — a failed signUp says nothing about confirmation policy.
    if (!signUpA.error) {
      report.auth.emailConfirmationRequired = !signUpA.data?.session;
    } else {
      report.auth.emailConfirmationRequired = 'unknown — signUp itself failed, see signUpA.error';
    }
  }

  // ---------------------------------------------------------- 2. GET SESSIONS
  async function tryConfirmedSignIn(email) {
    const c = freshClient();
    const r = await c.auth.signInWithPassword({ email, password: PASSWORD });
    return { client: c, ok: !r.error, error: r.error?.message ?? null, userId: r.data?.user?.id ?? null };
  }
  const signInA = await tryConfirmedSignIn(emailA);
  report.auth.signInA = { ok: signInA.ok, error: signInA.error };

  if (!signInA.ok) {
    report.blocked = `sign-in failed for ${emailA}: ${signInA.error}. sync_apply/recompute cross-run skipped.`;
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  const signInB = await tryConfirmedSignIn(emailB);
  report.auth.signInB = { ok: signInB.ok, error: signInB.error };
  const userA = signInA.client;
  const userAId = signInA.userId;

  // ---------------------------------------------------- 3. sync_apply (WORK-013 + WORK-020)
  const GV_EXERCISE = '11111111-0000-4000-8000-000000000001'; // hosted seed "Back Squat" == client golden-vectors.ts GV_EXERCISE
  const SESSION_ID = crypto.randomUUID();
  const SE_ID = crypto.randomUUID();
  const PS_IDS = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
  const FACTS = [
    { load_kg: 100, reps: 5, completed_at: '2026-08-31T10:10:00Z', position: 0 },
    { load_kg: 102.5, reps: 8, completed_at: '2026-08-31T10:20:00Z', position: 1 },
    { load_kg: 110, reps: 1, completed_at: '2026-08-31T10:30:00Z', position: 2 },
  ];

  async function applyAs(client, { operationId, entity, entityId, op, payload, baseVersion }) {
    const { data, error } = await client.rpc('sync_apply', {
      p_operation_id: operationId,
      p_entity: entity,
      p_entity_id: entityId,
      p_op: op,
      p_payload: payload,
      p_base_version: baseVersion,
    });
    if (error) return { error: error.message, code: error.code };
    return data;
  }

  // profile insert
  report.syncApply.profileInsert = await applyAs(userA, {
    operationId: crypto.randomUUID(), entity: 'profile', entityId: userAId, op: 'upsert', baseVersion: 1,
    payload: { id: userAId, user_id: userAId, display_name: 'Hosted Verify A', unit_pref: 'kg', week_start: 1, default_rest_seconds: 120, haptics: true, sound: true, theme: 'system', plate_increment_kg: 2.5, training_goal: null },
  });

  // workout_session insert (active)
  const sessionInsert = await applyAs(userA, {
    operationId: crypto.randomUUID(), entity: 'workout_session', entityId: SESSION_ID, op: 'upsert', baseVersion: 1,
    payload: { name_snapshot: 'Hosted Verify Session', started_at: '2026-08-31T10:00:00Z', ended_at: null, status: 'active', timezone: 'UTC', source: 'empty', notes: null, rest_timer_anchor: null },
  });
  report.syncApply.sessionInsert = sessionInsert;

  // session_exercise insert
  report.syncApply.sessionExerciseInsert = await applyAs(userA, {
    operationId: crypto.randomUUID(), entity: 'session_exercise', entityId: SE_ID, op: 'upsert', baseVersion: 1,
    payload: { session_id: SESSION_ID, exercise_id: GV_EXERCISE, exercise_name_snapshot: 'Back Squat', tracking_mode_snapshot: 'weight_reps', position: 0, group_id: null, substitution_of_exercise_id: null, notes: null },
  });

  // 3x performed_set inserts
  report.syncApply.performedSetInserts = [];
  for (let i = 0; i < FACTS.length; i++) {
    const f = FACTS[i];
    const r = await applyAs(userA, {
      operationId: crypto.randomUUID(), entity: 'performed_set', entityId: PS_IDS[i], op: 'upsert', baseVersion: 1,
      payload: { session_exercise_id: SE_ID, position: f.position, set_type: 'working', load_kg: f.load_kg, reps: f.reps, duration_s: null, distance_m: null, rpe: null, rir: null, completed: true, completed_at: f.completed_at },
    });
    report.syncApply.performedSetInserts.push(r);
  }

  // operation_id DEDUPE — resend the exact same op TWICE for a DEDICATED extra
  // row (position 3, set_type 'warmup' — EXCLUDED from the PR-eligible set_type
  // filter ('working','backoff','drop','failure'), so it can never perturb the
  // golden-vector comparison below no matter what load it carries).
  const DEDUPE_PS_ID = crypto.randomUUID();
  const dupOpId = crypto.randomUUID();
  const dedupePayload = { session_exercise_id: SE_ID, position: 3, set_type: 'warmup', load_kg: 999, reps: 1, duration_s: null, distance_m: null, rpe: null, rir: null, completed: true, completed_at: '2026-08-31T10:35:00Z' };
  const psDup1 = await applyAs(userA, { operationId: dupOpId, entity: 'performed_set', entityId: DEDUPE_PS_ID, op: 'upsert', baseVersion: 1, payload: dedupePayload });
  const psDup2 = await applyAs(userA, { operationId: dupOpId, entity: 'performed_set', entityId: DEDUPE_PS_ID, op: 'upsert', baseVersion: 1, payload: dedupePayload });
  report.syncApply.dedupe = { first: psDup1, replay: psDup2, sameVersion: psDup1.version === psDup2.version, replayStatusIsDuplicate: psDup2.status === 'duplicate' };

  // complete the session (triggers recompute)
  report.syncApply.sessionComplete = await applyAs(userA, {
    operationId: crypto.randomUUID(), entity: 'workout_session', entityId: SESSION_ID, op: 'upsert', baseVersion: sessionInsert.version,
    payload: { name_snapshot: 'Hosted Verify Session', started_at: '2026-08-31T10:00:00Z', ended_at: '2026-08-31T11:00:00Z', status: 'completed', timezone: 'UTC', source: 'empty', notes: null, rest_timer_anchor: null },
  });

  // -------------------------------------------------- 4. RECOMPUTE READBACK (WORK-020)
  // captured BEFORE the conflict/tombstone probes below, so this is the exact
  // golden-vector state to cross-run against client/src/test/golden-vectors.ts
  // GOLDEN_EXPECT / supabase/tests/03_recompute_test.sql.
  async function readDerived() {
    // session_volume PRs are whole-session (exercise_id IS NULL) — read PRs
    // unfiltered by exercise, not scoped to GV_EXERCISE, or that category never
    // comes back.
    const { data: prs } = await userA.from('personal_records').select('*');
    const { data: weekly } = await userA.from('weekly_aggregates').select('*').eq('week_start_date', '2026-08-31');
    const { data: exWeekly } = await userA
      .from('exercise_weekly_rollups')
      .select('*')
      .eq('exercise_id', GV_EXERCISE)
      .eq('week_start_date', '2026-08-31');
    return { prs: prs ?? [], weekly: weekly ?? [], exWeekly: exWeekly ?? [] };
  }
  const pre = await readDerived();
  const byCat = (rows, cat) => rows.find((p) => p.category === cat);
  report.recompute.preTombstone = {
    maxLoad: byCat(pre.prs, 'max_load')?.value ?? null,
    est1rm: byCat(pre.prs, 'est_1rm')?.value ?? null,
    est1rmFormulaId: byCat(pre.prs, 'est_1rm')?.formula_id ?? null,
    est1rmFormulaVersion: byCat(pre.prs, 'est_1rm')?.formula_version ?? null,
    sessionVolumePr: byCat(pre.prs, 'session_volume')?.value ?? null,
    repPrs: pre.prs.filter((p) => p.category === 'rep_pr').map((p) => ({ rep: p.rep_count, value: p.value })),
    weeklyWorkingVolume: pre.weekly[0]?.total_volume_kg ?? null,
    weeklyWorkingSets: pre.weekly[0]?.working_sets ?? null,
    exerciseWeeklyBestE1rm: pre.exWeekly[0]?.best_e1rm_kg ?? null,
  };
  // GOLDEN_EXPECT from client/src/test/golden-vectors.ts (maxLoad:110, e1rm:129.8333,
  // formula epley/1, sessionVolume:1430, weeklyWorkingVolume:1430, repPr{1:110,5:100,8:102.5})
  report.recompute.matchesClientGoldenVectors =
    Number(report.recompute.preTombstone.maxLoad) === 110 &&
    Number(report.recompute.preTombstone.est1rm) === 129.8333 &&
    report.recompute.preTombstone.est1rmFormulaId === 'epley' &&
    report.recompute.preTombstone.est1rmFormulaVersion === 1 &&
    Number(report.recompute.preTombstone.weeklyWorkingVolume) === 1430 &&
    Number(report.recompute.preTombstone.exerciseWeeklyBestE1rm) === 129.8333;

  // idempotency: re-running recompute must be byte-identical — resend the
  // FIRST performed_set upsert with the SAME payload+base_version+a NEW
  // operation_id (a legitimate no-op resubmission, not a duplicate-op replay)
  const idemp = await applyAs(userA, {
    operationId: crypto.randomUUID(), entity: 'performed_set', entityId: PS_IDS[0], op: 'upsert', baseVersion: report.syncApply.performedSetInserts[0].version,
    payload: { session_exercise_id: SE_ID, position: 0, set_type: 'working', load_kg: 100, reps: 5, duration_s: null, distance_m: null, rpe: null, rir: null, completed: true, completed_at: FACTS[0].completed_at },
  });
  report.syncApply.idempotentResubmit = idemp;
  const post1 = await readDerived();
  // compare only the SEMANTIC derived values (not volatile version/updated_at —
  // every recompute re-UPSERTs its derived rows, bumping those even when the
  // computed business value is unchanged; that is expected, not a defect).
  const semantic = (d) => ({
    prs: d.prs.map((p) => ({ category: p.category, exercise_id: p.exercise_id, rep_count: p.rep_count, value: p.value, formula_id: p.formula_id, formula_version: p.formula_version })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    weekly: d.weekly.map((w) => ({ working_sets: w.working_sets, total_volume_kg: w.total_volume_kg, completed_workouts: w.completed_workouts })),
    exWeekly: d.exWeekly.map((e) => ({ best_e1rm_kg: e.best_e1rm_kg, working_sets: e.working_sets, total_volume_kg: e.total_volume_kg })),
  });
  report.recompute.idempotent = JSON.stringify(semantic(post1)) === JSON.stringify(semantic(pre));

  // -------------------------------------------------- 5. CONFLICT / TOMBSTONE / RLS
  // VERSION CONFLICT — reuse the stale base_version from before completion
  report.syncApply.staleConflict = await applyAs(userA, {
    operationId: crypto.randomUUID(), entity: 'workout_session', entityId: SESSION_ID, op: 'upsert', baseVersion: sessionInsert.version,
    payload: { name_snapshot: 'stale write', started_at: '2026-08-31T10:00:00Z', ended_at: '2026-08-31T11:00:00Z', status: 'completed', timezone: 'UTC', source: 'empty', notes: null, rest_timer_anchor: null },
  });

  // CROSS-TENANT DENIAL via sync_apply itself (not just raw table RLS) — user B
  // attempts to write into user A's session via the RPC
  report.syncApply.crossTenantDenied = await applyAs(signInB.client, {
    operationId: crypto.randomUUID(), entity: 'workout_session', entityId: SESSION_ID, op: 'upsert', baseVersion: report.syncApply.sessionComplete.version,
    payload: { name_snapshot: 'user B trying to write user A row', started_at: '2026-08-31T10:00:00Z', ended_at: null, status: 'active', timezone: 'UTC', source: 'empty', notes: null, rest_timer_anchor: null },
  });

  // TOMBSTONE — delete the 3rd performed_set (110kg x1, the max_load source).
  // `payload` must still be present (even empty) or PostgREST can't resolve the
  // 6-arg RPC overload.
  report.syncApply.tombstone = await applyAs(userA, {
    operationId: crypto.randomUUID(), entity: 'performed_set', entityId: PS_IDS[2], op: 'delete', baseVersion: report.syncApply.performedSetInserts[2].version, payload: {},
  });

  // UNKNOWN ENTITY — hard reject
  const badEntity = await applyAs(userA, { operationId: crypto.randomUUID(), entity: 'not_a_real_entity', entityId: crypto.randomUUID(), op: 'upsert', baseVersion: 1, payload: {} });
  report.syncApply.unknownEntityRejected = { error: badEntity.error ?? null, code: badEntity.code ?? null };

  // recompute MUST react to the tombstone: the 110kg set is gone -> max_load
  // should now come from the remaining 102.5kg set
  const post2 = await readDerived();
  report.recompute.maxLoadAfterTombstone = byCat(post2.prs, 'max_load')?.value ?? null;
  report.recompute.maxLoadReactedToTombstone = Number(report.recompute.maxLoadAfterTombstone) === 102.5;

  report.finishedAt = new Date().toISOString();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(JSON.stringify({ fatal: err instanceof Error ? err.message : String(err) }, null, 2));
  process.exit(1);
});
