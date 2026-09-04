/**
 * Session lifecycle — the offline logging vertical slice (SPEC §18 Phase 1,
 * DEC-003). Start (planned / repeat / empty / past), restore the single active
 * session on launch, finish idempotently, then recompute derived data.
 *
 * All persistence is local + transactional (row + outbox together). Networking
 * is NEVER on this path.
 */
import { snapshotSession, type SessionSeed, type SessionSeedItem } from '@/domain/snapshot';
import { isTerminalSessionStatus } from '@/domain/policy';
import { recomputeAll } from '@/domain/pr';
import { ActiveSessionExistsError } from '@/domain/errors';
import type { WorkoutSession } from '@/domain/entities';
import type { Uuid } from '@/domain/ids';
import type { Clock } from '@/services/clock';
import type { IdGenerator } from '@/services/ids';
import type { Analytics } from '@/services/analytics';
import type { Logger } from '@/services/logger';
import type { Repositories } from '@/data/repositories/types';

export type StartSessionInput = {
  userId: Uuid;
  name: string;
  source: WorkoutSession['source'];
  plannedWorkoutId: Uuid | null;
  items: SessionSeedItem[];
  /** for 'past': override the start instant */
  startedAtMs?: number;
};

export class SessionService {
  constructor(
    private readonly repos: Repositories,
    private readonly svc: { clock: Clock; ids: IdGenerator; analytics: Analytics; logger: Logger },
  ) {}

  /** Restore the last active session on launch — a query, not a recovery procedure. */
  async restoreActive(userId: Uuid): Promise<WorkoutSession | null> {
    return this.repos.session.getActive(userId);
  }

  async startSession(input: StartSessionInput): Promise<WorkoutSession> {
    const existing = await this.repos.session.getActive(input.userId);
    if (existing) throw new ActiveSessionExistsError(existing.id);

    const seed: SessionSeed = {
      name: input.name,
      plannedWorkoutId: input.plannedWorkoutId,
      source: input.source,
      startedAtMs: input.startedAtMs ?? this.svc.clock.now(),
      timezone: this.svc.clock.timeZone(),
      items: input.items,
    };
    const { session, exercises } = snapshotSession({
      userId: input.userId,
      seed,
      newId: () => this.svc.ids.newId(),
    });

    await this.repos.session.createActive(input.userId, session, exercises);
    this.svc.analytics.track({ name: 'workout_started', source: input.source ?? 'empty' });
    const stored = await this.repos.session.getById(session.id);
    if (!stored) throw new Error('session vanished after create');
    return stored;
  }

  /**
   * Finish is IDEMPOTENT (UX-DEC-08): a terminal session is a no-op. On the
   * first finish it also recomputes PRs/aggregates from the completed set facts
   * (system-architecture.md §7.3).
   */
  async finishSession(userId: Uuid, sessionId: Uuid): Promise<void> {
    const s = await this.repos.session.getById(sessionId);
    if (!s) return;
    if (isTerminalSessionStatus(s.status)) return; // idempotent

    const endedAt = new Date(this.svc.clock.now()).toISOString();
    await this.repos.session.setStatus(userId, sessionId, 'completed', endedAt);

    await this.recompute(userId);
    this.svc.analytics.track({ name: 'workout_completed' });
  }

  async cancelSession(userId: Uuid, sessionId: Uuid): Promise<void> {
    const s = await this.repos.session.getById(sessionId);
    if (!s || isTerminalSessionStatus(s.status)) return;
    await this.repos.session.setStatus(userId, sessionId, 'cancelled', null);
    this.svc.analytics.track({ name: 'workout_abandoned' });
  }

  /** Deterministic, idempotent recompute over the user's completed set facts. */
  async recompute(userId: Uuid, weekStart = 1): Promise<void> {
    const facts = await this.repos.performedSet.completedSetFacts(userId);
    const derived = recomputeAll(userId, facts, weekStart, this.svc.clock.now());
    await this.repos.derived.apply(userId, derived);
  }
}
