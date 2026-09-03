# ADR-0003 — Sync engine: transactional outbox + optimistic concurrency + hybrid pull (incremental cursor + full reconciliation)

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02 (v4 — revised after three REVISION REQUESTED rounds on sync correctness)
- Owner: `software-architecture`
- Related: CON-3, CON-4, FR-SYNC-01…05, NFR-DATA-INTEGRITY, SPEC §11, roadmap OQ-7

## Context

Data must synchronize across sessions/devices with visible failure recovery, never block logging, never silently drop or lose an unsynced mutation, and never auto-merge two active sessions. The product is single-user, low-volume (AR-A1/A2), and must stay Expo Go compatible (CON-2).

Review history:
- **v1 → v2:** a first draft used blind idempotent upserts, a single-column `updated_at` cursor, and device-timestamp conflict ordering — three defects (silent overwrite of a newer remote value; page-boundary row-skip on shared timestamps; wrong winner under clock skew). Fixed by server-`version` optimistic concurrency, a composite `(updated_at, id)` cursor, `operation_id` dedupe, and clock-independent resolution.
- **v2 → v3:** two residual races. (a) The push acknowledgement cleared `dirty` / deleted the entry unconditionally, which is wrong when a dispatched op has a `pending` successor — it would mark the row synced while the latest edit is still queued. (b) The composite cursor fixes equal-timestamp pagination but **not** a late transaction commit: a row written at `t1` but committed after a row at `t2 > t1` has already been pulled lands behind the cursor and is never seen by the incremental feed. Fixed by a successor-aware acknowledgement transaction and a periodic full `(id, version)` reconciliation.
- **v3 → v4:** the transport/5xx branch returned `O1` to `pending` while a concurrent-edit successor `O2` was already `pending` — two `pending` rows for one entity, violating `UNIQUE (entity, entity_id) WHERE state = 'pending'`. Fixed by making the dispatched state (`in_flight` → **`dispatched`**) durable and immutable: only a terminal protocol result (`applied`/`duplicate`/`conflict`) removes it; transport failure/5xx/timeout/process-death keep it `dispatched` and retryable with the same `operation_id`. Also: a completed-session conflict is **parked** for explicit user choice, not auto-re-issued as a `pending` mutation.

## Decision

Build a purpose-made engine in `data/sync` (pure TS + `expo-sqlite` + the `data/remote` gateway):

1. **Every synced row carries a server-maintained integer `version`** (starts at 1). Server `updated_at` is trigger-generated.

2. **Outbox** — `sync_outbox` holds outstanding mutations, each with **`state`** (`pending` | `dispatched`), a client-generated **`operation_id`** (UUID, unique, **stable for the life of the entry**), `op` (`upsert` | `delete`), `payload_json` (latest local state), **`base_version`**, `attempts`, `next_attempt_at`.
   - **`pending`** — not yet sent; mutable (coalescing updates the payload in place). **Partial-unique index `(entity, entity_id) WHERE state = 'pending'`** → at most one `pending` entry per row.
   - **`dispatched`** — a `sync_apply` request has been (or may have been) sent and **no terminal result yet**. Immutable and durable: it survives transport/5xx/timeout failures (bump `attempts`/`next_attempt_at` only) and process death, and is retried with the **same `operation_id`**. **Not** covered by the partial-unique index → a `dispatched` `O1` may coexist with a `pending` successor `O2`.
   - A concurrent edit while `O1` is `dispatched` creates `O2` (`pending`, new `operation_id`, `base_version` = the predecessor's). Intermediate states are not replayed (SPEC §11.2 rule 4).

   **Invariant:** a `dirty` row has **at least one** outstanding mutation (a `dispatched` op, a `pending` op, or one of each); it is marked clean only when it has none.

3. **Push** — select due entries: **`dispatched` with `next_attempt_at ≤ now` first, then `pending`**, each ordered by dependency tier then `seq` (a `dispatched` predecessor always retries before its `pending` successor). For each, set `dispatched` (no-op if already) and call **`sync_apply(operation_id, entity, entity_id, op, payload, base_version)`** (a narrow `rpc`, or conditional PATCH + `processed_operations` upsert — AR-OQ-6). The server:
   - dedupes on `operation_id` (`processed_operations`) → a replay returns the **stored result** (exactly-once across lost acks and process death);
   - **insert** only if the row is absent (→ `version = 1`);
   - **update / tombstone** only if `base_version = current version` → **atomically increment `version`**;
   - on `base_version` mismatch, return **`conflict`** with the current row + `version` — **never overwrite**.

   **Terminal acknowledgement is one local transaction, successor-aware.** Only `applied` / `duplicate` / `conflict` terminate `O1`. Let `V` = returned `version`, `O2` = the `pending` successor if one exists:
   - **`applied` / `duplicate`:** delete `O1`. **If `O2` exists** → set `O2.base_version = V`, keep its `operation_id` and payload, **keep the row `dirty`**, do **not** apply `O1`'s returned payload (stale vs `O2`). **Else** → `synced_version = V`, clear `dirty`.
   - **`conflict`** (server at `Vs`): delete `O1`. Write the rejected payload — `O2`'s if present, else `O1`'s — + `{local_base_version, server_version: Vs}` to `sync_conflicts` + telemetry. Then **by entity class (step 5):**
     - **Completed-session data** → **park** it: drop `O2` if present (its content is in `sync_conflicts`), apply the server row (`synced_version = Vs`), the row is **not** `dirty`, and **no** new `pending` mutation is created. Only an explicit user choice may later re-apply.
     - **Non-completed data** → auto-reconcile: if still meaningful, ensure **exactly one `pending` entry** carries the reconciled result (**re-base `O2`** to `Vs`, or create one if absent), keep the row `dirty`; else drop `O2`, apply the server row, clear `dirty`.
   - **Non-terminal (transport error / 5xx / timeout / process death):** `O1` **stays `dispatched`**, `operation_id`/`payload`/`base_version` unchanged; bump `attempts`; `next_attempt_at` = backoff + jitter; record `last_error`. `O2` stays `pending` behind it — **no second `pending` row, so the index is never violated.** Retained until terminal or explicit user discard (FR-SYNC-04).
   - **Return to `pending`** only if the client can prove the request was **never sent** (synchronous failure before the socket opened) **and** there is no `O2`. Otherwise `O1` stays `dispatched` and relies on `operation_id` dedupe.

4. **Pull — two mechanisms.**
   - **4a. Incremental (composite `(updated_at, id)` cursor)** — `WHERE updated_at > :u OR (updated_at = :u AND id > :i) ORDER BY updated_at, id LIMIT :N`, advancing the cursor to the **last row applied** (not `max(updated_at)`), until a short page. This is a total lexicographic position and **cannot skip a row that was already committed and visible when its position was passed** (fixes the equal-timestamp boundary). It is the **latency** path.
   - **4b. Full version reconciliation (the completeness guarantee)** — on authenticated cold start, at foreground when `last_full_sync` is older than `Config.fullReconcileIntervalHours` (default 24h), and on manual sync: per entity, page `select id, version, deleted_at order by id` (light projection — a few hundred KB per entity for the assumed dataset), and for each server tuple: fetch+apply if absent locally or server `version` > local `synced_version` and the row is not `dirty`; treat as a **conflict** (step 5) if the row is `dirty`; apply tombstones; flag (telemetry, no delete) a non-`dirty` local row with no outbox entry that is absent server-side. Then set `last_full_sync = now`; the incremental cursor is **not moved backward** (a recovered late-commit row may sit below it, which is fine — completeness now rests on reconciliation). This catches any row a **late transaction commit** left behind the incremental cursor — it does not depend on `updated_at` ordering.
   - **Apply rules** (both): non-`dirty` local → overwrite, set `synced_version`. `dirty` local with server `version` ≠ local `synced_version` → conflict (step 5), local payload preserved first. `deleted_at` → local tombstone, never a hard delete of a visible row. Derived rows: server values authoritative; local recompute must converge (ADR-0005).

5. **Conflict resolution is decided by `version`, never by clock.** "Last write wins" means *the last write accepted by the version protocol*, not the largest device timestamp. The rejected local change is always preserved in `sync_conflicts` + telemetry. Then: **non-completed data** auto-reconciles (server row = new base; re-apply the local change as one fresh `pending` mutation if still meaningful, else drop). **Completed-session data** (`workout_sessions.status = completed` and children, `personal_records`) is **never auto-overwritten and never automatically re-issued as a `pending` mutation** — it is parked in `sync_conflicts` (any successor `O2` dropped) and surfaced for an explicit user choice, which alone can create a new mutation. A remote tombstone follows the same rule. **Two `active` sessions** → a UI conflict choice; never auto-merged.

6. **Timestamp roles are separated:** server `version` = the only concurrency input; server `updated_at` = only pull ordering/cursor; client `local_updated_at` / outbox `seq` = only local display and queue order.

7. **Determinism / idempotency** — `finishSession`, `sync_apply`, pull-apply, and `recompute*` are all safe to re-run after a mid-operation crash. A `dispatched` entry after process death is just a due entry retried with its original `operation_id` — no special recovery path (`system-architecture.md` §10.5).

8. **Triggers** — after auth, on foreground, on connectivity restore, on manual retry, on debounced local change; single-flight.

## Consequences

- **No lost updates**: a stale write is rejected and preserved, not silently overwritten. Correct for any number of devices.
- **Exactly-once push** under retries and process death, via `operation_id` dedupe. A dispatched op is **immutable until a terminal result**; transport failure keeps it `dispatched` and never spawns a second `pending` row, so the partial-unique index holds at all times. A concurrent edit during a dispatched op is a `pending` successor that is re-based (or, for a completed-session conflict, dropped and parked) on the predecessor's terminal ack.
- **Pull completeness** is guaranteed by the periodic full `(id, version)` reconciliation, **not** by the incremental cursor — a late transaction commit is caught within one `fullReconcileIntervalHours` window. The incremental cursor keeps steady-state latency low.
- **Clock skew is irrelevant** to who wins and cannot permanently hide a row (reconciliation is `updated_at`-independent).
- Two implementations of the concurrency check exist (client expectation + server `sync_apply`); mismatch is a real risk (AR-RISK-7), mitigated by the WORK-013 conformance suite (concurrent writers, forced skew, kill-mid-push, same-timestamp boundary, **late-commit reconciliation**, **in-flight-successor ack**) run against real Supabase before any table is exposed.
- Reconciliation adds a small periodic read (light projection); cost is trivial at the assumed data volume (AR-A2). If it never runs (bug / interval too high / app never cold-started), rows can be missed for a long time — AR-RISK-8, mitigated by running it on every cold start and alerting on `last_full_sync` age.
- `sync_conflicts` can accumulate under heavy multi-device editing; the MVP review UX is thin (AR-RISK-1 / OQ-7). Non-completed auto-reconcile keeps the common case quiet.
- Derived rows (`personal_records`, aggregates) are push-optional; the server recompute wins on pull.

## Alternatives rejected

- **Blind idempotent upsert keyed by client UUID (v1 draft):** silently overwrites a newer remote value.
- **Single-column `updated_at` cursor (v1 draft):** skips rows that share a timestamp at a page boundary.
- **Device-timestamp conflict ordering (v1 draft):** clock skew can pick the wrong winner.
- **Incremental composite cursor as the *only* pull mechanism (v2):** cannot see a row whose transaction commits after a later-timestamped row has already advanced the cursor — the v3 reconciliation fix.
- **Returning a transport-failed op to `pending` (v3 draft):** with a concurrent-edit successor already `pending`, this produces two `pending` rows for one entity and violates the partial-unique index — the v4 `dispatched`-state fix.
- **Auto-re-issuing a completed-session conflict as a pending mutation (v3 draft):** would let sync silently re-apply an edit to immutable history; v4 parks it for explicit user choice.
- **Unconditional push acknowledgement (v2):** marks a row synced while a concurrent-edit successor is still queued — the v3 successor-aware fix.
- **Server-side commit-ordered change feed** (a commit-assigned sequence, a `change_log` table, or logical replication): fully solves the late-commit case without a periodic full scan, but adds server machinery and an ordering contract that is heavier than a single-user, small-dataset app needs. Deferred; it is the natural next step if AR-A2 stops holding.
- **CRDTs / field-level merge:** unjustified complexity for a single-user domain.
- **Third-party replication engines** (WatermelonDB sync, PowerSync, Replicache, ElectricSQL): several are not Expo Go compatible → early dev-build (CON-2); large dependency + new ops surface.
- **Supabase Realtime subscriptions in MVP:** connection-management overhead; pull-on-trigger meets the requirement. Post-MVP.

## Reversibility

Medium. The engine sits behind `data/repositories`; a replication library or a server change-feed could later back `data/sync` without touching features — at the cost of the Expo Go boundary. The `version` + `operation_id` columns and the reconciliation projection carry forward to most alternatives. Re-entry conditions: AR-A1 shown false, dataset growth past AR-A2 (making the full projection expensive → adopt a change feed), or a move to a development build for other reasons.
