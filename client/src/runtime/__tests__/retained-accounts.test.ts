import {
  withRetained,
  withoutRetained,
  mergeDiscovered,
  visibleRetained,
  assertRemovable,
} from '@/runtime/retained-accounts';

const A = 'aaaa0000-0000-4000-8000-00000000000a';
const B = 'bbbb0000-0000-4000-8000-00000000000b';
const C = 'cccc0000-0000-4000-8000-00000000000c';

describe('retained-accounts set logic (CE-R5 v2)', () => {
  it('multiple account switches: A retained, then B retained too — accumulates, never overwrites', () => {
    let set: string[] = [];
    set = withRetained(set, A); // sign out of A dirty -> retained
    set = withRetained(set, B); // sign out of B dirty (after signing into B) -> retained too
    expect(set.sort()).toEqual([A, B].sort());
  });

  it('adding an already-retained account is idempotent (no duplicate entry)', () => {
    const once = withRetained([], A);
    const twice = withRetained(once, A);
    expect(twice).toEqual([A]);
  });

  it('re-authenticating a retained account removes it from the retained set', () => {
    const set = withRetained(withRetained([], A), B);
    expect(withoutRetained(set, A)).toEqual([B]);
  });

  it('removing a not-present account is a no-op', () => {
    expect(withoutRetained([A], B)).toEqual([A]);
  });

  it('app restart: discovery re-derives the set from disk (mergeDiscovered), union with anything already tracked', () => {
    // cold boot — nothing tracked yet, discovery finds two files left from a
    // previous session (A retained, then B retained, app was killed)
    const afterDiscovery = mergeDiscovered([], [A, B]);
    expect(afterDiscovery.sort()).toEqual([A, B].sort());

    // a later discovery (e.g. re-mount) that finds the same files again does
    // not duplicate or drop anything already tracked in-session (e.g. C, just
    // retained live, not yet on a fresh listing)
    const withLiveC = withRetained(afterDiscovery, C);
    const rediscovered = mergeDiscovered(withLiveC, [A, B]);
    expect(rediscovered.sort()).toEqual([A, B, C].sort());
  });

  it('visibleRetained excludes the active account even if a stale listing still names it', () => {
    const set = withRetained(withRetained([], A), B);
    expect(visibleRetained(set, A).sort()).toEqual([B]);
    expect(visibleRetained(set, null).sort()).toEqual([A, B].sort());
  });

  it('assertRemovable refuses to remove the active account', () => {
    expect(() => assertRemovable(A, A)).toThrow(/active account/);
  });

  it('assertRemovable permits removing any non-active retained account', () => {
    expect(() => assertRemovable(B, A)).not.toThrow();
    expect(() => assertRemovable(B, null)).not.toThrow();
  });
});
