/**
 * Pure per-user-DB-filename logic (CE-R5 v2 discovery), split out of
 * `driver.native.ts` so it is unit-testable without `expo-file-system` / a
 * device. `driver.native.ts` supplies the real directory listing; this parses
 * it into candidate retained `userId`s.
 */
const DB_PREFIX = 'fitney-';
const DB_SUFFIX = '.db';

/**
 * From a flat list of directory-entry names (as `expo-file-system`'s
 * `Directory.list()` — or any listing — would report them), extract the
 * per-user DB userIds, excluding `activeUserId` and de-duplicating. WAL/SHM/
 * journal sidecar files (`*.db-wal` etc.) do not end in exactly `.db` and are
 * ignored; a bare `fitney-.db` (empty id) is ignored.
 */
export function parseRetainedDbFilenames(
  names: readonly string[],
  activeUserId: string | null,
): string[] {
  const ids = new Set<string>();
  for (const name of names) {
    if (!name.startsWith(DB_PREFIX) || !name.endsWith(DB_SUFFIX)) continue;
    const userId = name.slice(DB_PREFIX.length, -DB_SUFFIX.length);
    if (!userId || userId === activeUserId) continue;
    ids.add(userId);
  }
  return [...ids];
}
