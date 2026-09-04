/**
 * Performed-set logging — the hot path (system-architecture.md §7.2). Add,
 * edit, and complete sets without leaving the session and without the network.
 * Each confirmed mutation is one local transaction: performed_sets row + one
 * coalesced outbox entry (PerformedSetRepository.upsert).
 *
 * Suggested values come from the most recent completed performance and are
 * clearly labelled as suggestions by the UI (SPEC §5.2).
 */
import { validatePerformedSet } from '@/domain/policy';
import type { PerformedSet, SetType } from '@/domain/entities';
import type { Uuid } from '@/domain/ids';
import type { Clock } from '@/services/clock';
import type { IdGenerator } from '@/services/ids';
import type { Analytics } from '@/services/analytics';
import type { Haptics } from '@/services/haptics';
import type { PerformedSetRepository } from '@/data/repositories/types';

export type NewSetDraft = {
  sessionExerciseId: Uuid;
  position: number;
  setType?: SetType;
  loadKg?: number | null;
  reps?: number | null;
  durationS?: number | null;
  distanceM?: number | null;
  rpe?: number | null;
  rir?: number | null;
};

export class SetService {
  constructor(
    private readonly repo: PerformedSetRepository,
    private readonly svc: { clock: Clock; ids: IdGenerator; analytics: Analytics; haptics: Haptics },
  ) {}

  /** Create an uncompleted draft set row (persisted immediately). */
  async addSet(userId: Uuid, draft: NewSetDraft): Promise<PerformedSet> {
    const row = this.toRow(userId, this.svc.ids.newId(), draft, false);
    validatePerformedSet(row);
    await this.repo.upsert(userId, row);
    return row;
  }

  /** Edit an existing set (completed or not) — same path, no confirmation dialog. */
  async editSet(userId: Uuid, current: PerformedSet, patch: Partial<NewSetDraft>): Promise<PerformedSet> {
    const next: PerformedSet = {
      ...current,
      set_type: patch.setType ?? current.set_type,
      load_kg: patch.loadKg === undefined ? current.load_kg : patch.loadKg,
      reps: patch.reps === undefined ? current.reps : patch.reps,
      duration_s: patch.durationS === undefined ? current.duration_s : patch.durationS,
      distance_m: patch.distanceM === undefined ? current.distance_m : patch.distanceM,
      rpe: patch.rpe === undefined ? current.rpe : patch.rpe,
      rir: patch.rir === undefined ? current.rir : patch.rir,
    };
    validatePerformedSet(next);
    await this.repo.upsert(userId, next);
    return next;
  }

  /** Tap-to-complete (UX-DEC-07) — no per-set confirmation; inline undo via editSet. */
  async completeSet(userId: Uuid, current: PerformedSet): Promise<PerformedSet> {
    const nowIso = new Date(this.svc.clock.now()).toISOString();
    const next: PerformedSet = { ...current, completed: true, completed_at: nowIso };
    validatePerformedSet(next);
    await this.repo.upsert(userId, next);
    this.svc.haptics.fire('setComplete');
    this.svc.analytics.track({ name: 'set_completed' });
    return next;
  }

  async uncompleteSet(userId: Uuid, current: PerformedSet): Promise<PerformedSet> {
    const next: PerformedSet = { ...current, completed: false, completed_at: null };
    await this.repo.upsert(userId, next);
    return next;
  }

  async removeSet(userId: Uuid, setId: Uuid): Promise<void> {
    await this.repo.remove(userId, setId);
  }

  private toRow(userId: Uuid, id: Uuid, d: NewSetDraft, completed: boolean): PerformedSet {
    return {
      id,
      user_id: userId,
      session_exercise_id: d.sessionExerciseId,
      position: d.position,
      set_type: d.setType ?? 'working',
      load_kg: d.loadKg ?? null,
      reps: d.reps ?? null,
      duration_s: d.durationS ?? null,
      distance_m: d.distanceM ?? null,
      rpe: d.rpe ?? null,
      rir: d.rir ?? null,
      completed,
      completed_at: null,
      version: 1,
      updated_at: null,
      created_at: null,
      deleted_at: null,
      synced_version: null,
      dirty: 1,
      local_updated_at: this.svc.clock.now(),
    };
  }
}
