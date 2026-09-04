/**
 * Typed, validated Supabase gateway — the ONLY module that talks to PostgREST /
 * the `sync_apply` RPC (CON-5, ADR-0002/0008). Implements the sync engine's
 * `SyncGatewayPort`. Every response row is parsed through a Zod schema
 * (data/remote/schemas) before it leaves this file.
 *
 * NOTE: excluded from the logic tsconfig (needs @supabase/supabase-js + expo).
 * It is typechecked in CI (client-verify) where the full toolchain is installed,
 * and exercised against real Supabase by the WORK-013 conformance suite.
 */
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ENTITY_TABLE, type SyncEntity } from '@/domain/entities';
import {
  TransportError,
  type PulledRow,
  type ReconcileTuple,
  type SyncApplyRequest,
  type SyncApplyResult,
  type SyncGatewayPort,
} from '@/data/sync/ports';
import { REMOTE_SCHEMAS, type RemoteSchemaKey } from './schemas';

const applyResultSchema = z.union([
  z.object({ status: z.literal('applied'), version: z.number().nullable() }),
  z.object({ status: z.literal('duplicate'), version: z.number().nullable() }),
  z.object({ status: z.literal('conflict'), version: z.number(), row: z.record(z.unknown()) }),
  z.object({ status: z.literal('rejected') }),
]);

function isTransport(status: number | undefined, message: string): boolean {
  if (status == null) return true; // network error / fetch threw
  return status >= 500 || status === 408 || status === 429;
}

function parseRows(entity: SyncEntity, rows: unknown[]): PulledRow[] {
  const schema = REMOTE_SCHEMAS[entity as RemoteSchemaKey];
  return rows.map((r) => {
    const parsed = schema ? schema.parse(r) : (r as Record<string, unknown>);
    return parsed as PulledRow;
  });
}

export function createSupabaseGateway(sb: SupabaseClient): SyncGatewayPort {
  return {
    async apply(req: SyncApplyRequest): Promise<SyncApplyResult> {
      const { data, error } = await sb.rpc('sync_apply', {
        p_operation_id: req.operationId,
        p_entity: req.entity,
        p_entity_id: req.entityId,
        p_op: req.op,
        p_payload: req.payload,
        p_base_version: req.baseVersion,
      });
      if (error) {
        const status = (error as { status?: number }).status;
        if (isTransport(status, error.message)) throw new TransportError(error.message);
        // a non-transport RPC error is a hard reject (bad entity, permissions)
        return { status: 'rejected' };
      }
      return applyResultSchema.parse(data);
    },

    async pullIncremental(entity, cursor, limit) {
      const table = ENTITY_TABLE[entity];
      let q = sb.from(table).select('*').order('updated_at', { ascending: true }).order('id', { ascending: true }).limit(limit);
      if (cursor.updatedAt != null && cursor.id != null) {
        q = q.or(
          `updated_at.gt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.gt.${cursor.id})`,
        );
      }
      const { data, error } = await q;
      if (error) throw new TransportError(error.message);
      return parseRows(entity, data ?? []);
    },

    async reconcileProjection(entity, afterId, limit): Promise<ReconcileTuple[]> {
      const table = ENTITY_TABLE[entity];
      let q = sb.from(table).select('id,version,deleted_at').order('id', { ascending: true }).limit(limit);
      if (afterId != null) q = q.gt('id', afterId);
      const { data, error } = await q;
      if (error) throw new TransportError(error.message);
      return (data ?? []) as ReconcileTuple[];
    },

    async fetchByIds(entity, ids) {
      if (ids.length === 0) return [];
      const table = ENTITY_TABLE[entity];
      const { data, error } = await sb.from(table).select('*').in('id', ids);
      if (error) throw new TransportError(error.message);
      return parseRows(entity, data ?? []);
    },
  };
}
