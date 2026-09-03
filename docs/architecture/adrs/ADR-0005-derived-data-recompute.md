# ADR-0005 — Derived data (PRs, aggregates): deterministic recompute, materialized, idempotent

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture`
- Related: FR-DATA-04…10, NFR-DATA-INTEGRITY, SPEC §12, AR-RISK-2, AR-OQ-3

## Context

Performed sets are the source of truth. PRs, estimated 1RM, weekly volume/sets, and exercise rollups are derived. They must be reproducible, must survive edits and deletes of completed sessions, must not silently rewrite historical claims when a formula changes, and must render fast for history/trends.

## Decision

- Derived values are produced by **pure deterministic functions** in `domain/{calc,pr}` over the ordered set of **completed `performed_sets`** (ordered by `session_exercise_id, position, id`). No wall-clock, no map/iteration-order dependence.
- Results are **materialized** into local tables (`personal_records`, aggregate tables) for read performance.
- Recompute is exposed as `recomputeExercise(exerciseId)` and `recomputeWeek(weekStart)`, each **idempotent**: within one transaction, delete the affected derived rows and reinsert from scratch. Run on session finalize, edit, and delete (§7.3).
- Every materialized `personal_records` row stores `formula_id` and `formula_version` (e.g. `epley@1`); a future formula change adds a new version and does not overwrite prior claims.
- The **server mirrors the same semantics** (SQL function or Edge Function — AR-OQ-3), sharing a set of golden test vectors with the TS implementation. On sync pull, the server's derived values win; the client's local recompute must converge to them.

## Consequences

- Fast reads; deterministic, edit-safe history (E2E scenario 5).
- Two implementations of the same logic (TS + SQL/Edge) — a drift risk (AR-RISK-2), mitigated by shared golden vectors + server-wins-on-pull.
- Recompute cost is trivial at MVP data volume (AR-A2); if it ever isn't, scope recompute to the touched exercise/week (already the design).

## Alternatives rejected

- **Compute on every read (no materialization):** too slow for History and Trends over years of data.
- **Event sourcing / projections:** adds a projection layer; `performed_sets` rows already are the log.
- **Store PRs only, derive aggregates live:** inconsistent latency; aggregates for Trends are the expensive ones.

## Reversibility

Medium. Materialization can be dropped in favour of computed SQL views if profiling shows it unnecessary, without changing the `domain` functions or their call sites.
