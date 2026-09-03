/**
 * Exercise search — SPEC LIB-02 / SM-7 (<300ms local). Debounced query over the
 * local SQLite name index (never a full-catalogue fetch per keystroke, SPEC §15).
 * Purely local; the seed catalogue is authenticated-only server-side (DEC-51) but
 * the client reads it from SQLite after sync.
 */
import type { Exercise } from '@/domain/entities';
import type { Uuid } from '@/domain/ids';
import type { ExerciseRepository } from '@/data/repositories/types';

export type SearchState =
  | { kind: 'empty'; recents: Exercise[] }
  | { kind: 'loading' }
  | { kind: 'results'; items: Exercise[]; query: string }
  | { kind: 'no-results'; query: string };

export class ExerciseSearch {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly repo: ExerciseRepository,
    private readonly opts: { debounceMs?: number } = {},
  ) {}

  async initial(userId: Uuid): Promise<SearchState> {
    const recents = await this.repo.recentlyUsed(userId, 10);
    return { kind: 'empty', recents };
  }

  /** Debounced query; resolves with the state to render. */
  query(userId: Uuid, text: string): Promise<SearchState> {
    const q = text.trim();
    if (this.timer) clearTimeout(this.timer);
    if (q === '') return this.initial(userId);

    return new Promise<SearchState>((resolve) => {
      this.timer = setTimeout(async () => {
        const items = await this.repo.search(userId, q, 25);
        resolve(items.length === 0 ? { kind: 'no-results', query: q } : { kind: 'results', items, query: q });
      }, this.opts.debounceMs ?? 200);
    });
  }
}
