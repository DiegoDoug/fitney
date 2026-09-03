---
id: "ADR-4"
kind: "adr"
title: "ADR-0005 — Derived data (PRs, aggregates): deterministic recompute, materialized, idempotent"
notion_page_id: "3cfe6070-43bc-819b-b93f-feaf1d1cb335"
notion_url: "https://app.notion.com/p/ADR-0005-Derived-data-PRs-aggregates-deterministic-recompute-materialized-idempotent-3cfe607043bc819bb93ffeaf1d1cb335"
created: "2026-09-02T20:09:00.000Z"
last_edited: "2026-09-02T20:09:00.000Z"
status: "Accepted"
---

# ADR-0005 — Derived data (PRs, aggregates): deterministic recompute, materialized, idempotent

## Context

Performed sets are the source of truth. PRs, estimated 1RM, weekly volume/sets, and exercise rollups are derived. They must be reproducible, must survive edits and deletes of completed sessions, must not silently rewrite historical claims when a formula changes, and must render fast for history/trends.

## Decision

Derived values are produced by pure deterministic functions in domain/{calc,pr} over the ordered set of completed performed_sets (ordered by session_exercise_id, position, id). No wall-clock, no map/iteration-order dependence. Results are materialized into local tables (personal_records, aggregate tables). Recompute exposed as recomputeExercise(exerciseId) and recomputeWeek(weekStart), each idempotent: within one transaction, delete the affected derived rows and reinsert from scratch. Run on session finalize, edit, delete. Every materialized personal_records row stores formula_id and formula_version (e.g. epley@1); a future formula change adds a new version and does not overwrite prior claims. The server mirrors the same semantics (SQL function or Edge Function — AR-OQ-3), sharing golden test vectors with the TS implementation. On sync pull, the server's derived values win; the client's local recompute must converge.

## Consequences

Fast reads; deterministic, edit-safe history (E2E scenario 5). Two implementations of the same logic (TS + SQL/Edge) — a drift risk (AR-RISK-2), mitigated by shared golden vectors + server-wins-on-pull. Recompute cost is trivial at MVP data volume; scoped to the touched exercise/week. Rejected: compute on every read; event sourcing / projections; store PRs only and derive aggregates live. Reversibility: medium — materialization can be dropped for computed SQL views without changing the domain functions.

## Date

2026-09-02

## Implemented

false

## Supersedes

—
