# ADR-0007 — Client state management and data access

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture`
- Related: CON-5, SPEC §10.1, ADR-0002, AR-RISK-3, AR-OQ-4

## Context

SPEC §10.1: "Lightweight client state for ephemeral UI only; persisted domain data stays in repositories/SQLite." The layering rule (ADR-0002) forbids `features/*` from touching the network or `data/local` directly. We need a state approach that does not tempt developers to cache domain data in a store or to call Supabase from hooks.

## Decision

- **UI state:** React `useState`/`useReducer` + Context for local and cross-component UI.
- **Ephemeral session UI state** (active rest-timer display value, keypad focus target, transient sheet state): **one small store — Zustand**. It holds **no domain data**.
- **Domain data:** read exclusively from SQLite through repository interfaces, surfaced to components by a thin **`useDbQuery(queryOrRepoCall)`** hook that re-runs on SQLite change notifications (or explicit invalidation after a repository write). Writes go through repository methods (which do the transaction + outbox append).
- **TanStack Query is not used to talk to Supabase.** If a query-cache abstraction is wanted, it may only wrap **repository** calls, never the gateway.

## Consequences

- The store cannot become a shadow copy of the database; there is one source of truth on device (SQLite).
- `features/*` depend only on repository interfaces and `domain` — cheap to test with fakes.
- `useDbQuery` is a small piece of infrastructure we own and must get right (invalidation, perf on large lists). If it proves inadequate, a reactive SQLite library can back it later (AR-RISK-3 / AR-OQ-4) — accepting that most such libraries push us to a development build (CON-2).

## Alternatives rejected

- **Redux/RTK:** ceremony, and RTK Query/entity adapters actively encourage keeping server/domain data in the store.
- **MobX:** implicit reactivity is harder to reason about across the layer boundary.
- **TanStack Query against Supabase directly:** bypasses `data/sync` and the offline guarantee.
- **WatermelonDB/PowerSync as the primary store now:** Expo Go incompatibility → forces early dev-build.

## Reversibility

High. The store holds only ephemeral UI state; replacing it touches no domain/data code. `useDbQuery` has a deliberately small surface so it can be re-implemented over a library later.
