/**
 * WORK-020 — DIRECT client-computed <-> hosted-server-computed comparison.
 *
 * `recompute.golden.test.ts` proves the client TS `domain/{calc,pr}` matches
 * the STATIC `GOLDEN_EXPECT` constants. `docs/engineering/evidence/11-*`
 * separately proves the HOSTED server (via the real `sync_apply` RPC +
 * trigger-driven recompute) also matches those same static constants. Neither
 * of those, by itself, executes the client's production `recomputeAll()` and
 * compares its live output DIRECTLY against the hosted read-back in one
 * harness — this test closes that gap.
 *
 * This test needs no network: `hosted-verify.mjs` already captured the hosted
 * read-back into a checked-in evidence file; this test loads that file and
 * diffs it against a live call to the real client domain implementation on
 * the exact same input fixture (`GOLDEN_FACTS`). It runs in CI every time,
 * same as any other logic test.
 *
 * To regenerate the evidence file after a fresh hosted run: see
 * `client/scripts/hosted-verify.mjs`'s header comment.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { recomputeAll } from '@/domain/pr';
import { GOLDEN_FACTS, GV_USER } from '@/test/golden-vectors';

const WEEK_START_MON = 1;
const NOW = Date.parse('2026-09-03T00:00:00Z');

type HostedEvidence = {
  recompute: {
    preTombstone: {
      maxLoad: number;
      est1rm: number;
      est1rmFormulaId: string;
      est1rmFormulaVersion: number;
      sessionVolumePr: number;
      repPrs: { rep: number; value: number }[];
      weeklyWorkingVolume: number;
      weeklyWorkingSets: number;
      exerciseWeeklyBestE1rm: number;
    };
    matchesClientGoldenVectors: boolean;
  };
};

function loadHostedEvidence(): HostedEvidence {
  const path = join(__dirname, '../../../../docs/engineering/evidence/11-work013-work020-hosted-cross-run.json');
  return JSON.parse(readFileSync(path, 'utf8')) as HostedEvidence;
}

describe('WORK-020 — client recomputeAll() output vs hosted fitney-dev read-back (direct comparison)', () => {
  const hosted = loadHostedEvidence().recompute.preTombstone;
  const client = recomputeAll(GV_USER, GOLDEN_FACTS, WEEK_START_MON, NOW);

  const clientMaxLoad = client.personalRecords.find((p) => p.category === 'max_load');
  const clientE1rm = client.personalRecords.find((p) => p.category === 'est_1rm');
  const clientSessionVolume = client.personalRecords.find((p) => p.category === 'session_volume');
  const clientRepPrs = Object.fromEntries(
    client.personalRecords.filter((p) => p.category === 'rep_pr').map((p) => [p.rep_count, p.value]),
  );
  const hostedRepPrs = Object.fromEntries(hosted.repPrs.map((p) => [p.rep, p.value]));

  it('the evidence file itself already asserts client-golden-vector parity (sanity precondition)', () => {
    expect(loadHostedEvidence().recompute.matchesClientGoldenVectors).toBe(true);
  });

  it('max_load: client recomputeAll() output == hosted sync_apply/trigger-recompute read-back', () => {
    expect(clientMaxLoad?.value).toBe(hosted.maxLoad);
  });

  it('est_1rm value + formula id/version: client == hosted', () => {
    expect(clientE1rm?.value).toBe(hosted.est1rm);
    expect(clientE1rm?.formula_id).toBe(hosted.est1rmFormulaId);
    expect(clientE1rm?.formula_version).toBe(hosted.est1rmFormulaVersion);
  });

  it('session_volume PR: client == hosted', () => {
    expect(clientSessionVolume?.value).toBe(hosted.sessionVolumePr);
  });

  it('rep_pr map: client == hosted, key-for-key', () => {
    expect(clientRepPrs).toEqual(hostedRepPrs);
  });

  it('weekly aggregate (working volume + working sets): client == hosted', () => {
    expect(client.weeklyAggregates[0]?.total_volume_kg).toBe(hosted.weeklyWorkingVolume);
    expect(client.weeklyAggregates[0]?.working_sets).toBe(hosted.weeklyWorkingSets);
  });

  it('exercise-weekly rollup best_e1rm: client == hosted', () => {
    expect(client.exerciseWeeklyRollups[0]?.best_e1rm_kg).toBe(hosted.exerciseWeeklyBestE1rm);
  });
});
