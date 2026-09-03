/**
 * IdGenerator — client-generated UUIDs so offline creation never waits for the
 * server (AR-DEC-04, ADR-0004). UUIDv7 preferred (time-ordered -> better B-tree
 * locality on SQLite + Postgres); v4 is the safe fallback (AR-OQ-1).
 *
 * Pure: entropy + time are injected. The default `randomBytes` uses the platform
 * CSPRNG (`globalThis.crypto`); in the RN app `react-native-get-random-values`
 * (or Hermes' built-in) provides it, in Node the built-in `crypto` does.
 */
export interface IdGenerator {
  /** RFC 9562 UUIDv7 (or v4 if v7 entropy path is unavailable). */
  newId(): string;
  /** explicit v4 (used where time-ordering is undesirable, e.g. operation_id). */
  newV4(): string;
}

export type RandomBytes = (n: number) => Uint8Array;

const defaultRandomBytes: RandomBytes = (n) => {
  const g = globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } };
  if (g.crypto?.getRandomValues) {
    return g.crypto.getRandomValues(new Uint8Array(n));
  }
  // Last-resort non-crypto fallback (kept for test environments without WebCrypto;
  // the RN app always has a CSPRNG). Flagged for review — never for production ids.
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
  return a;
};

function bytesToUuid(b: Uint8Array): string {
  const h: string[] = [];
  for (let i = 0; i < 16; i++) h.push((b[i] ?? 0).toString(16).padStart(2, '0'));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}

export function uuidV4(randomBytes: RandomBytes = defaultRandomBytes): string {
  const b = randomBytes(16);
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40; // version 4
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80; // variant 10
  return bytesToUuid(b);
}

export function uuidV7(nowMs: number, randomBytes: RandomBytes = defaultRandomBytes): string {
  const b = randomBytes(16);
  const ts = Math.max(0, Math.floor(nowMs));
  // 48-bit big-endian millisecond timestamp
  b[0] = (ts / 2 ** 40) & 0xff;
  b[1] = (ts / 2 ** 32) & 0xff;
  b[2] = (ts / 2 ** 24) & 0xff;
  b[3] = (ts / 2 ** 16) & 0xff;
  b[4] = (ts / 2 ** 8) & 0xff;
  b[5] = ts & 0xff;
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x70; // version 7
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80; // variant 10
  return bytesToUuid(b);
}

export function createIdGenerator(opts: {
  now: () => number;
  randomBytes?: RandomBytes;
  preferV7?: boolean;
}): IdGenerator {
  const rb = opts.randomBytes ?? defaultRandomBytes;
  const preferV7 = opts.preferV7 ?? true;
  return {
    newId: () => (preferV7 ? uuidV7(opts.now(), rb) : uuidV4(rb)),
    newV4: () => uuidV4(rb),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}
