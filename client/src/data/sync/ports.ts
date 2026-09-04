/**
 * The port the sync engine depends on. Implemented by `data/remote` (the typed,
 * Zod-validated Supabase gateway). Keeping it an interface lets the engine be
 * tested against a fake gateway + real SQLite (system-architecture.md §12.2)
 * before any table is exposed (WORK-013).
 */
import type { SyncEntity } from '@/domain/entities';

/** Result of `sync_apply` (server contract, migration 0006). */
export type SyncApplyResult =
  | { status: 'applied'; version: number | null }
  | { status: 'duplicate'; version: number | null }
  | { status: 'conflict'; version: number; row: Record<string, unknown> }
  | { status: 'rejected' };

export type SyncApplyRequest = {
  operationId: string;
  entity: SyncEntity;
  entityId: string;
  op: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  baseVersion: number;
};

/** Thrown by the gateway for a transport/5xx/timeout failure (NON-terminal). */
export class TransportError extends Error {
  readonly retryable = true;
  constructor(message: string) {
    super(message);
    this.name = 'TransportError';
  }
}

export type PulledRow = Record<string, unknown> & {
  id: string;
  version: number;
  updated_at: string | null;
  deleted_at: string | null;
};

export type ReconcileTuple = { id: string; version: number; deleted_at: string | null };

export interface SyncGatewayPort {
  /** push one outbox entry; may throw TransportError (non-terminal). */
  apply(req: SyncApplyRequest): Promise<SyncApplyResult>;

  /** incremental pull page, composite (updated_at, id) cursor. */
  pullIncremental(
    entity: SyncEntity,
    cursor: { updatedAt: string | null; id: string | null },
    limit: number,
  ): Promise<PulledRow[]>;

  /** light (id, version, deleted_at) projection for full reconciliation. */
  reconcileProjection(entity: SyncEntity, afterId: string | null, limit: number): Promise<ReconcileTuple[]>;

  /** fetch full rows by id (used by reconciliation for discrepancies). */
  fetchByIds(entity: SyncEntity, ids: string[]): Promise<PulledRow[]>;
}
