/**
 * In-memory fake of SyncGatewayPort for sync-engine unit tests. Models the
 * server contract: operation_id dedupe, version optimistic concurrency,
 * insert-if-absent, conflict-not-overwrite (migration 0006 sync_apply), plus a
 * scriptable transport-failure hook.
 */
import { ENTITY_TABLE, type SyncEntity } from '@/domain/entities';
import {
  TransportError,
  type PulledRow,
  type ReconcileTuple,
  type SyncApplyRequest,
  type SyncApplyResult,
  type SyncGatewayPort,
} from '@/data/sync/ports';

type ServerRow = Record<string, unknown> & { id: string; version: number; updated_at: string; deleted_at: string | null };

export class FakeGateway implements SyncGatewayPort {
  readonly rows = new Map<string, Map<string, ServerRow>>(); // entity -> id -> row
  readonly processed = new Map<string, SyncApplyResult>(); // operation_id -> stored result
  /** queue of one-shot behaviours keyed by operation_id */
  failNext = new Map<string, 'transport' | 'transport-after-apply'>();
  applyLog: SyncApplyRequest[] = [];

  /** deterministic monotonic virtual clock -> ordered ISO timestamps */
  private tickCount = 0;
  tick(): string {
    this.tickCount += 1;
    return new Date(Date.parse('2026-01-01T00:00:00.000Z') + this.tickCount * 1000).toISOString();
  }
  private clock = () => this.tick();

  private table(entity: SyncEntity): Map<string, ServerRow> {
    let m = this.rows.get(entity);
    if (!m) {
      m = new Map();
      this.rows.set(entity, m);
    }
    return m;
  }

  seed(entity: SyncEntity, row: Partial<ServerRow> & { id: string }): void {
    this.table(entity).set(row.id, {
      version: 1,
      updated_at: this.clock(),
      deleted_at: null,
      ...row,
    } as ServerRow);
  }

  async apply(req: SyncApplyRequest): Promise<SyncApplyResult> {
    this.applyLog.push(req);
    const mode = this.failNext.get(req.operationId);

    if (mode === 'transport') {
      this.failNext.delete(req.operationId);
      throw new TransportError('simulated network failure (before apply)');
    }

    const priorResult = this.processed.get(req.operationId);
    if (priorResult) {
      // exactly-once: replay returns 'duplicate' with the original resulting version
      const v = 'version' in priorResult ? priorResult.version : null;
      return { status: 'duplicate', version: v ?? null };
    }

    const t = this.table(req.entity);
    const current = t.get(req.entityId);
    let result: SyncApplyResult;

    if (req.op === 'delete') {
      if (!current) result = { status: 'applied', version: null };
      else if (current.version === req.baseVersion) {
        current.deleted_at = this.clock();
        current.version += 1;
        current.updated_at = this.clock();
        result = { status: 'applied', version: current.version };
      } else {
        result = { status: 'conflict', version: current.version, row: { ...current } };
      }
    } else if (!current) {
      const row: ServerRow = {
        ...(req.payload as Record<string, unknown>),
        id: req.entityId,
        version: 1,
        updated_at: this.clock(),
        deleted_at: (req.payload.deleted_at as string | null) ?? null,
      };
      t.set(req.entityId, row);
      result = { status: 'applied', version: 1 };
    } else if (current.version === req.baseVersion) {
      Object.assign(current, req.payload, {
        id: req.entityId,
        version: current.version + 1,
        updated_at: this.clock(),
      });
      result = { status: 'applied', version: current.version };
    } else {
      result = { status: 'conflict', version: current.version, row: { ...current } };
    }

    if (result.status === 'applied') this.processed.set(req.operationId, result);

    if (mode === 'transport-after-apply') {
      this.failNext.delete(req.operationId);
      // server committed, client never hears back
      throw new TransportError('simulated response loss (after apply)');
    }
    return result;
  }

  async pullIncremental(
    entity: SyncEntity,
    cursor: { updatedAt: string | null; id: string | null },
    limit: number,
  ): Promise<PulledRow[]> {
    void ENTITY_TABLE;
    const all = [...this.table(entity).values()].sort((a, b) =>
      a.updated_at === b.updated_at ? cmp(a.id, b.id) : cmp(a.updated_at, b.updated_at),
    );
    const after = all.filter((r) => {
      if (cursor.updatedAt == null) return true;
      if (r.updated_at > cursor.updatedAt) return true;
      return r.updated_at === cursor.updatedAt && cursor.id != null && r.id > cursor.id;
    });
    return after.slice(0, limit).map((r) => ({ ...r })) as PulledRow[];
  }

  async reconcileProjection(entity: SyncEntity, afterId: string | null, limit: number): Promise<ReconcileTuple[]> {
    const all = [...this.table(entity).values()].sort((a, b) => cmp(a.id, b.id));
    return all
      .filter((r) => afterId == null || r.id > afterId)
      .slice(0, limit)
      .map((r) => ({ id: r.id, version: r.version, deleted_at: r.deleted_at }));
  }

  async fetchByIds(entity: SyncEntity, ids: string[]): Promise<PulledRow[]> {
    const t = this.table(entity);
    return ids.map((id) => t.get(id)).filter((r): r is ServerRow => !!r).map((r) => ({ ...r })) as PulledRow[];
  }
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
