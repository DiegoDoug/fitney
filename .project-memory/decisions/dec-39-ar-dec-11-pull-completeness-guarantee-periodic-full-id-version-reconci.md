---
id: "DEC-39"
kind: "decision"
title: "AR-DEC-11 — Pull completeness guarantee = periodic full (id, version) reconciliation"
notion_page_id: "3cfe6070-43bc-81ce-b2ae-e3d78464c233"
notion_url: "https://app.notion.com/p/AR-DEC-11-Pull-completeness-guarantee-periodic-full-id-version-reconciliation-3cfe607043bc81ceb2aee3d78464c233"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-11 — Pull completeness guarantee = periodic full (id, version) reconciliation

## Summary

Pull completeness guarantee = periodic full (id, version) reconciliation, not the incremental cursor. sync_state.last_full_sync + Config.fullReconcileIntervalHours (default 24h) drive it on authenticated cold start / stale foreground / manual sync; per entity it pages a light (id, version, deleted_at) projection, fetches full rows only for discrepancies, treats a discrepancy on a dirty row as a conflict, and is updated_at-independent so it recovers rows whose transaction committed out of updated_at order behind the incremental cursor.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Closes the late-transaction-commit race. Evidence: docs/architecture/adrs/ADR-0003-sync-engine.md, system-architecture.md §10.3.2.

## Consequences

Added in phase-4 revision round 2. Part of ADR-0003. Never-runs risk = AR-RISK-8. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
