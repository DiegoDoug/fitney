/** Shared test harness: migrated in-memory DB + local repos + fake services. */
import { migrate } from '@/data/local/migrate';
import { createLocalRepositories } from '@/data/local/repositories';
import { createTestDb } from './better-sqlite3-driver';
import { fixedClock } from '@/services/clock';
import { createIdGenerator } from '@/services/ids';
import { noopAnalytics } from '@/services/analytics';
import { noopHaptics } from '@/services/haptics';
import { collectingLogger } from '@/services/logger';
import { defaultConfig } from '@/services/config';
import { fakeConnectivity } from '@/services/connectivity';
import type { SqlDatabase } from '@/data/local/driver';
import type { Repositories } from '@/data/repositories/types';

let idCounter = 0;
export function seqIdGen(startMs = Date.parse('2026-09-01T00:00:00Z')) {
  // deterministic v4-shaped ids for readable test assertions
  return createIdGenerator({
    now: () => startMs,
    randomBytes: (n) => {
      const b = new Uint8Array(n);
      for (let i = 0; i < n; i++) b[i] = (idCounter + i * 7 + 1) & 0xff;
      idCounter += 1;
      return b;
    },
    preferV7: false,
  });
}

export async function makeHarness(opts?: { nowMs?: number; online?: boolean }): Promise<{
  db: SqlDatabase;
  repos: Repositories;
  clock: ReturnType<typeof fixedClock>;
  ids: ReturnType<typeof seqIdGen>;
  logger: ReturnType<typeof collectingLogger>;
  connectivity: ReturnType<typeof fakeConnectivity>;
  config: typeof defaultConfig;
}> {
  idCounter = 0;
  const nowMs = opts?.nowMs ?? Date.parse('2026-09-03T12:00:00Z');
  const db = createTestDb();
  await migrate(db);
  const clock = fixedClock(nowMs, 'UTC');
  const ids = seqIdGen();
  const logger = collectingLogger();
  const connectivity = fakeConnectivity(opts?.online === false ? 'offline' : 'online');
  const repos = createLocalRepositories({ db, clock, ids });
  return { db, repos, clock, ids, logger, connectivity, config: defaultConfig };
}

export const TEST_USER = 'aaaa0000-0000-4000-8000-000000000001';

export async function insertProfile(db: SqlDatabase, userId = TEST_USER, weekStart = 1): Promise<void> {
  await db.runAsync(
    `INSERT INTO profiles (id, user_id, week_start, version, dirty, local_updated_at) VALUES (?, ?, ?, 1, 0, 0)`,
    [userId, userId, weekStart],
  );
}
