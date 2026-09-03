# ADR-0001 — Local-first: SQLite is the system of record, with a transactional outbox

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture`
- Related: CON-3, FR-SYNC-01, NFR-OFFLINE, invariants (network never blocks), SPEC §11

## Context

The central experience is a reliable offline workout session. Connectivity in a gym is intermittent to absent. "Saved" must mean "durably on this device," and the server must be a synchronization target, not a dependency of any logging, completion, or recovery action.

## Decision

`expo-sqlite` is the **system of record on the device**. All reads and writes for domain data go through repositories backed by SQLite. Every domain mutation is written in **one SQLite transaction** that also upserts the row's single pending `sync_outbox` entry (carrying a stable `operation_id` and the `base_version` — ADR-0003). There is a single logical writer (the repository layer); the UI never writes elsewhere and never awaits the network to complete a user action. Synchronization (ADR-0003) drains the outbox and reconciles with Supabase in the background.

## Consequences

- Screens render from local data on launch with no network wait; the layered import rule (ADR-0002) makes network-on-path structurally impossible.
- Write latency is a local transaction targeting ≤100 ms perceived persistence (SM-4) — no same-frame commit is promised; the set is "recorded" only after commit, and a commit failure keeps the input visible with "Not saved — retrying" and blocks Finish. Recovery after force-close is a query, not a procedure (SM-5).
- The device holds a full per-user copy of the data (AR-A2). Acceptable for the MVP data volume; revisit with a pull window if datasets grow past tens of MB.
- Requires disciplined transaction handling and a startup consistency check (orphan outbox rows vs domain rows) if `expo-sqlite` guarantees prove weaker than assumed (AR-RISK-4).

## Alternatives rejected

- **Server-authoritative with an optimistic client cache (e.g. TanStack Query + Supabase):** reintroduces the network on the write path conceptually and makes true-offline correctness a special case rather than the default.
- **In-memory store persisted to disk periodically (Redux-persist style):** weaker durability guarantees; a crash between snapshots loses confirmed sets.

## Reversibility

Medium–low. The "SQLite as record + outbox" contract is foundational; changing it would touch every repository. However, the *sync mechanism* behind the outbox (ADR-0003) is replaceable without disturbing this decision.
