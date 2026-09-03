/**
 * Row <-> SQLite value coercion. The local schema mirrors Postgres names 1:1
 * (ADR-0006); only representation differs: booleans as 0/1, arrays/objects as
 * JSON text. Kept in one place so sync stays a dumb copy.
 */
import type { SqlValue } from './driver';

const JSON_ARRAY_FIELDS = new Set([
  'aliases',
  'primary_muscles',
  'secondary_muscles',
  'tags',
]);
const JSON_OBJECT_FIELDS = new Set(['prescription', 'default_prescription']);

export function toDbValue(key: string, value: unknown): SqlValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (JSON_ARRAY_FIELDS.has(key) || JSON_OBJECT_FIELDS.has(key) || typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

const BOOL_FIELDS = new Set([
  'haptics',
  'sound',
  'is_unilateral',
  'archived',
  'completed',
  'dirty',
]);

export function fromDbRow<T extends Record<string, unknown>>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (BOOL_FIELDS.has(k)) {
      out[k] = v === 1 || v === true || v === '1';
    } else if (JSON_ARRAY_FIELDS.has(k)) {
      out[k] = v == null ? [] : safeParse(v, []);
    } else if (JSON_OBJECT_FIELDS.has(k)) {
      out[k] = v == null ? {} : safeParse(v, {});
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function safeParse(v: unknown, fallback: unknown): unknown {
  if (typeof v !== 'string') return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

const IDENT_RE = /^[a-z][a-z0-9_]*$/;
export function assertIdentifier(name: string): string {
  if (!IDENT_RE.test(name)) throw new Error(`unsafe SQL identifier: ${name}`);
  return name;
}
