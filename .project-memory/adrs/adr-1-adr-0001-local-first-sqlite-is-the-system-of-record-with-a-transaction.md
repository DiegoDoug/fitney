---
id: "ADR-1"
kind: "adr"
title: "ADR-0001 — Local-first: SQLite is the system of record, with a transactional outbox"
notion_page_id: "3cfe6070-43bc-81b9-83b5-f055ab4dd976"
notion_url: "https://app.notion.com/p/ADR-0001-Local-first-SQLite-is-the-system-of-record-with-a-transactional-outbox-3cfe607043bc81b983b5f055ab4dd976"
created: "2026-09-02T20:09:00.000Z"
last_edited: "2026-09-02T20:09:00.000Z"
status: "Accepted"
---

# ADR-0001 — Local-first: SQLite is the system of record, with a transactional outbox

## Context

The central experience is a reliable offline workout session. Connectivity in a gym is intermittent to absent. "Saved" must mean "durably on this device," and the server must be a synchronization target, not a dependency of any logging, completion, or recovery action.

## Decision

expo-sqlite is the system of record on the device. All reads and writes for domain data go through repositories backed by SQLite. Every domain mutation is written in one SQLite transaction that also upserts the row's single pending sync_outbox entry (carrying a stable operation_id and the base_version — ADR-0003). There is a single logical writer (the repository layer); the UI never writes elsewhere and never awaits the network to complete a user action. Synchronization (ADR-0003) drains the outbox and reconciles with Supabase in the background.

## Consequences

Screens render from local data on launch with no network wait; the layered import rule (ADR-0002) makes network-on-path structurally impossible. Write latency is a local transaction targeting ≤100 ms perceived persistence (SM-4) — no same-frame commit promised; a set is "recorded" only after commit; a commit failure keeps the input visible with "Not saved — retrying" and blocks Finish. Recovery after force-close is a query, not a procedure (SM-5). The device holds a full per-user copy of the data (AR-A2); revisit with a pull window past tens of MB. Requires disciplined transaction handling and a startup consistency check (orphan outbox rows) if expo-sqlite guarantees prove weaker than assumed (AR-RISK-4). Rejected: server-authoritative with an optimistic client cache; in-memory store persisted periodically. Reversibility: medium–low; the sync mechanism behind the outbox (ADR-0003) is replaceable without disturbing this decision.

## Date

2026-09-02

## Implemented

false

## Supersedes

—
