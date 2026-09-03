---
id: "DEC-31"
kind: "decision"
title: "AR-DEC-03 — Sync engine v4: transactional outbox + optimistic concurrency + hybrid pull"
notion_page_id: "3cfe6070-43bc-81bf-920d-c293e0cd49ec"
notion_url: "https://app.notion.com/p/AR-DEC-03-Sync-engine-v4-transactional-outbox-optimistic-concurrency-hybrid-pull-3cfe607043bc81bf920dc293e0cd49ec"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-03 — Sync engine v4: transactional outbox + optimistic concurrency + hybrid pull

## Summary

Sync engine (v4, after three REVISION REQUESTED rounds): transactional outbox with a stable client operation_id (server-deduped, exactly-once) and coalesced-latest-state replay. Outbox state = pending | dispatched: pending is mutable and holds the partial-unique index (one per (entity,id)); dispatched is durable and immutable — removed only by a terminal applied/duplicate/conflict; transport failure / 5xx / timeout / process death keep it dispatched and retryable with the same operation_id, never returning to pending while a pending successor exists; dispatched retries before its pending successor; return to pending only if provably never sent and no successor. Successor-aware terminal acknowledgement: a terminated O1 with a pending O2 re-bases O2 to the returned version and keeps the row dirty (never marks synced / never applies O1's payload). Server-maintained integer version optimistic concurrency — insert-if-absent / update-only-if base_version = version / atomic increment / mismatch returns conflict (never overwrite) / same for tombstones. Hybrid pull: composite (updated_at, id) incremental cursor for latency plus periodic full (id, version) reconciliation (AR-DEC-11) as the completeness guarantee. Conflict winner decided solely by the version protocol, never by device clock. Stale writes preserved in sync_conflicts: non-completed auto-reconcile as one fresh pending mutation; completed-session conflicts are parked for explicit user choice and never auto-re-issued (their O2 is dropped). Two-active-session → UI conflict choice, never auto-merge. No CRDT/replication-lib/realtime/server-change-feed in MVP.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Implements CON-3, FR-SYNC-01–05. Evidence: docs/architecture/adrs/ADR-0003-sync-engine.md, system-architecture.md §7.2, §8.3–8.4, §10.

## Consequences

Revised v1→v4 after three REVISION REQUESTED review rounds (blind-upsert / single-column cursor / clock ordering; in-flight successor ack + late-commit reconciliation; transport-failure dispatched-state durability). Conformance suite = WORK-013. Full record: ADR-0003. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
