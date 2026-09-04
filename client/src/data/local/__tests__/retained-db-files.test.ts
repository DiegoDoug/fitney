import { parseRetainedDbFilenames } from '@/data/local/retained-db-files';

const A = 'aaaa0000-0000-4000-8000-00000000000a';
const B = 'bbbb0000-0000-4000-8000-00000000000b';
const C = 'cccc0000-0000-4000-8000-00000000000c';

describe('parseRetainedDbFilenames (CE-R5 v2 discovery)', () => {
  it('extracts userIds from fitney-<id>.db entries, excluding the active user', () => {
    expect(parseRetainedDbFilenames([`fitney-${A}.db`, `fitney-${B}.db`], A)).toEqual([B]);
  });

  it('discovers MULTIPLE retained accounts at once (repeated switches leave several files)', () => {
    const ids = parseRetainedDbFilenames([`fitney-${A}.db`, `fitney-${B}.db`, `fitney-${C}.db`], null);
    expect(ids.sort()).toEqual([A, B, C].sort());
  });

  it('ignores WAL / SHM / journal sidecar files (not exactly *.db)', () => {
    const ids = parseRetainedDbFilenames(
      [`fitney-${A}.db`, `fitney-${A}.db-wal`, `fitney-${A}.db-shm`, `fitney-${A}.db-journal`],
      null,
    );
    expect(ids).toEqual([A]);
  });

  it('ignores unrelated files and a bare "fitney-.db" (empty id)', () => {
    expect(parseRetainedDbFilenames(['other.db', 'fitney-.db', '.DS_Store'], null)).toEqual([]);
  });

  it('de-duplicates a name seen twice', () => {
    expect(parseRetainedDbFilenames([`fitney-${A}.db`, `fitney-${A}.db`], null)).toEqual([A]);
  });

  it('returns everything when there is no active user (signed-out boot)', () => {
    expect(parseRetainedDbFilenames([`fitney-${A}.db`], null)).toEqual([A]);
  });
});
