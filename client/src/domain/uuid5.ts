/**
 * Deterministic UUIDv5 (RFC 9562 §5.5, SHA-1) — pure, no crypto module, so it
 * stays inside the pure `domain/` boundary.
 *
 * Used to derive `personal_records` / `weekly_aggregates` / `exercise_weekly_rollups`
 * ids the SAME way the server does (supabase/migrations/20260902090003_recompute.sql
 * `_pr_id` / `_agg_id` use `extensions.uuid_generate_v5(extensions.uuid_ns_url(), name)`).
 * Matching ids mean the client's local recompute rows reconcile 1:1 with the
 * server's on pull (system-architecture.md §10.3.3) instead of orphaning.
 *
 * URL namespace = 6ba7b811-9dad-11d1-80b4-00c04fd430c8.
 */

const URL_NAMESPACE = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

function hexToBytes(hex: string): number[] {
  const clean = hex.replace(/-/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

function utf8Bytes(s: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c >= 0xd800 && c <= 0xdbff) {
      const c2 = s.charCodeAt(++i);
      c = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return out;
}

function rotl(n: number, s: number): number {
  return ((n << s) | (n >>> (32 - s))) >>> 0;
}

/** SHA-1 of a byte array -> 20 bytes. */
function sha1(bytes: number[]): number[] {
  const ml = bytes.length * 8;
  const msg = bytes.slice();
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  // 64-bit big-endian length (ml < 2^32 in practice here)
  for (let i = 7; i >= 0; i--) msg.push((ml / 2 ** (8 * i)) & 0xff);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Array<number>(80);
  for (let i = 0; i < msg.length; i += 64) {
    for (let t = 0; t < 16; t++) {
      w[t] =
        ((msg[i + t * 4] ?? 0) << 24) |
        ((msg[i + t * 4 + 1] ?? 0) << 16) |
        ((msg[i + t * 4 + 2] ?? 0) << 8) |
        (msg[i + t * 4 + 3] ?? 0);
    }
    for (let t = 16; t < 80; t++) {
      w[t] = rotl((w[t - 3] ?? 0) ^ (w[t - 8] ?? 0) ^ (w[t - 14] ?? 0) ^ (w[t - 16] ?? 0), 1);
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let t = 0; t < 80; t++) {
      let f: number;
      let k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const tmp = (rotl(a, 5) + f + e + k + (w[t] ?? 0)) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = tmp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const out: number[] = [];
  for (const h of [h0, h1, h2, h3, h4]) {
    out.push((h >>> 24) & 0xff, (h >>> 16) & 0xff, (h >>> 8) & 0xff, h & 0xff);
  }
  return out;
}

export function uuidV5(name: string, namespace: string = URL_NAMESPACE): string {
  const hash = sha1([...hexToBytes(namespace), ...utf8Bytes(name)]);
  const b = hash.slice(0, 16);
  b[6] = (b[6]! & 0x0f) | 0x50; // version 5
  b[8] = (b[8]! & 0x3f) | 0x80; // variant 10
  const h = b.map((x) => x.toString(16).padStart(2, '0'));
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`;
}

// ---- server-matching derived-row id builders -------------------------------
export function prId(
  userId: string,
  exerciseId: string | null,
  category: string,
  repCount: number | null,
): string {
  return uuidV5(
    `weight:pr:${userId}:${exerciseId ?? '-'}:${category}:${repCount == null ? '-' : String(repCount)}`,
  );
}

export function aggId(kind: 'wa' | 'ewr', userId: string, key: string): string {
  return uuidV5(`weight:${kind}:${userId}:${key}`);
}
