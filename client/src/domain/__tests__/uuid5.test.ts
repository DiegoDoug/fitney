import { uuidV5, prId, aggId } from '@/domain/uuid5';

describe('domain/uuid5 (RFC 9562 §5.5, SHA-1)', () => {
  it('matches the canonical RFC test vector (DNS namespace, "www.example.com")', () => {
    const DNS_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    expect(uuidV5('www.example.com', DNS_NS)).toBe('2ed6657d-e927-568b-95e1-2665a8aea6a2');
  });

  it('produces a well-formed v5 uuid (version nibble 5, RFC variant)', () => {
    const id = uuidV5('http://www.example.org/');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidV5('http://www.example.org/')).toBe(id); // deterministic
  });

  it('derived PR/agg ids are deterministic and stable', () => {
    const u = 'd0000000-0000-4000-8000-00000000000d';
    const e = '11111111-0000-4000-8000-000000000001';
    expect(prId(u, e, 'max_load', null)).toBe(prId(u, e, 'max_load', null));
    expect(prId(u, e, 'rep_pr', 8)).not.toBe(prId(u, e, 'rep_pr', 5));
    expect(aggId('wa', u, '2026-08-31')).toBe(aggId('wa', u, '2026-08-31'));
    expect(prId(u, null, 'session_volume', null)).toMatch(/^[0-9a-f-]{36}$/);
  });
});
