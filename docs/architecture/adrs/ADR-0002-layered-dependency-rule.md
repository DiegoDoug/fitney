# ADR-0002 — Enforced layered dependency rule

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture`
- Related: CON-5, NFR-OFFLINE, NFR-RELIABILITY, testability, SPEC §10.4

## Context

CON-5 mandates that UI components never call Supabase directly and that access flows through feature logic → domain services → repository interfaces → local repositories → sync → Supabase gateway. Without mechanical enforcement, this erodes (a hook imports `supabase-js`, an await sneaks onto the render path) and the offline guarantee silently breaks.

## Decision

Adopt the layer set and import matrix in `system-architecture.md` §6.1:

`app/` → `features/*` → (`domain/*` pure + `services/*` interfaces + `data/repositories` interfaces) → `data/local` + `data/sync` → `data/remote` (Supabase gateway).

- `domain/*` is **pure**: no I/O, no RN, no `Date.now`/`Math.random` (inject `Clock`, `IdGenerator`).
- `components/` and `design-system/` import only tokens and React/RN.
- `features/*` may not import `data/local`, `data/sync`, `data/remote`, or the Supabase client.
- The Supabase client is referenced in **exactly one directory** (`data/remote`).

Enforce with `dependency-cruiser` (or `eslint-plugin-boundaries`) wired to a **failing** CI check, plus a smoke test that runs a full logging flow with the network stubbed to throw (AR-RISK-6). This ships in Phase 0.

## Consequences

- Offline correctness and testability hold by construction; `domain/*` is testable with no device or network.
- An SDK or backend change has a single blast site.
- Small upfront cost: the boundary config and CI wiring, and occasional friction when a feature "just wants" a query (resolved by adding a repository method).

## Alternatives rejected

- **Convention only (no linter):** proven to erode; the offline guarantee is too important to leave to review.
- **A single "api" module without the domain/services split:** loses the pure, injectable domain core that makes calculations and snapshot logic cheaply testable.

## Reversibility

High for the tooling (swap linters), low for the layer shape itself once features are built on it — which is the point.
