---
id: "ISS-21"
kind: "issue"
title: "Correctness risk: sync protocol + client/server recompute parity + unexecuted server controls"
notion_page_id: "3cfe6070-43bc-8138-8416-d6fa131dd269"
notion_url: "https://app.notion.com/p/Correctness-risk-sync-protocol-client-server-recompute-parity-unexecuted-server-controls-3cfe607043bc81388416d6fa131dd269"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Open"
---

# Correctness risk: sync protocol + client/server recompute parity + unexecuted server controls

## Summary

Consolidated standing risk. (AR-RISK-7) Sync protocol could be implemented incorrectly — cursor advanced to max(updated_at); non-atomic version check+increment; operation_id not persisted pre-request; terminal ack clearing dirty / applying O1's payload while a pending O2 exists; a transport-failed dispatched op returned to pending or terminated non-terminally; completed-session conflict auto-re-issued — reintroducing lost updates, skipped rows, or index violations. (AR-RISK-8) Full reconciliation never runs → a late-committed/cursor-skipped row missed for a long time. (AR-RISK-2) Client (TS) and server (SQL/Edge) recompute drift → different PRs/aggregates across devices. (SEC-RISK-2) Trigger-heavy write path — a bug in any BEFORE trigger blocks legitimate writes. (BD-RISK-3) Trigger-driven recompute could become hot under a future bulk import.

## Type

Risk

## Priority

High

## Evidence

development-roadmap.md AR-RISK-2/7/8, SEC-RISK-2, BD-RISK-3; ADR-0003; system-architecture §10. Owner: software-architecture + backend-data-engineering + quality-engineering.

## Proposed Resolution

Mitigated by: the WORK-013 sync-protocol conformance suite against real Supabase (Foundation-increment prerequisite); shared WORK-012 golden vectors + server-wins-on-pull; run full reconciliation on every cold start + alert on last_full_sync age; pgTAP suites 01–04 for the trigger path. All blocked on DEP-1.
