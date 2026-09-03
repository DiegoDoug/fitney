# ADR-0008 — Schema validation at the API and repository boundaries

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture`
- Related: SPEC §10.1 ("Schema validation at API and repository boundaries"), §14, NFR-SEC, AR-OQ-2

## Context

PostgREST responses, sync payloads, and cross-layer inputs are untyped at runtime. Strict TypeScript checks compile-time shapes only. Bad or unexpected data must be caught at the edges, not deep in `domain`.

## Decision

- Use a runtime **schema library** — **Zod** (default) or **valibot** (if bundle size on RN proves material, AR-OQ-2) — to parse/validate at two seams:
  1. **`data/remote` gateway:** every row and response from Supabase is parsed against a schema before it enters the app; parse failures are surfaced as typed infra errors, logged (sanitized), and do not crash the UI.
  2. **`data/repositories` inputs:** repository method arguments are validated (IDs are UUIDs, enums in range, measures non-negative, date ranges sane, ownership fields present) before a write.
- **Domain types are hand-authored** in `domain/` and are the app's canonical shapes. **Generated Supabase types are confined to `data/remote`** and mapped into domain types by the gateway.
- Server-side validation of IDs, enums, measures, date ranges, and ownership is still required independently (RLS + checks) — client validation is defence in depth, not the authority (NFR-SEC).

## Consequences

- Malformed server data, schema drift, and programming errors are caught at the edge with a clear message.
- Two type representations (generated vs hand-authored) with an explicit mapping — a small, deliberate cost that keeps `domain` independent of the database's shape.
- Slight runtime + bundle cost; mitigated by validating only at the two seams, not everywhere.

## Alternatives rejected

- **Trust PostgREST responses (types-only):** schema drift or an RLS change produces silent corruption.
- **`io-ts` / `class-validator`:** heavier or decorator-based; Zod/valibot are the ergonomic RN-friendly choices.
- **Generated types as the domain types:** couples `domain` to the database schema and to the generator's output.

## Reversibility

High. Validation is additive at two well-defined seams; the library can be swapped, and schemas can be tightened or relaxed without structural change.
