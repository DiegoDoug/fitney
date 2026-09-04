/**
 * Conflict entity classification — system-architecture.md §10.4 / ADR-0003 §5.
 *
 * Completed-session data is NEVER auto-overwritten and NEVER auto-re-issued as a
 * pending mutation: a conflict on it is PARKED for an explicit user choice.
 * Everything else auto-reconciles.
 */
import type { SqlDatabase } from '@/data/local/driver';
import type { SyncEntity } from '@/domain/entities';

export async function isCompletedSessionData(
  db: SqlDatabase,
  entity: SyncEntity,
  entityId: string,
  serverRow: Record<string, unknown> | null,
): Promise<boolean> {
  if (entity === 'workout_session') {
    if (serverRow && serverRow.status === 'completed') return true;
    const local = await db.getFirstAsync<{ status: string }>(
      `SELECT status FROM workout_sessions WHERE id = ?`,
      [entityId],
    );
    return local?.status === 'completed';
  }

  if (entity === 'session_exercise') {
    const row = await db.getFirstAsync<{ status: string }>(
      `SELECT s.status FROM session_exercises se
         JOIN workout_sessions s ON s.id = se.session_id
        WHERE se.id = ?`,
      [entityId],
    );
    return row?.status === 'completed';
  }

  if (entity === 'performed_set') {
    const row = await db.getFirstAsync<{ status: string }>(
      `SELECT s.status FROM performed_sets ps
         JOIN session_exercises se ON se.id = ps.session_exercise_id
         JOIN workout_sessions s ON s.id = se.session_id
        WHERE ps.id = ?`,
      [entityId],
    );
    return row?.status === 'completed';
  }

  // personal_records are derived + server-authoritative — treat as parked class.
  return false;
}
