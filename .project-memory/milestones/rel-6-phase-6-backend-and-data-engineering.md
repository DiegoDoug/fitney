---
id: "REL-6"
kind: "milestone"
title: "Phase 6 — Backend and data engineering"
notion_page_id: "3cfe6070-43bc-81bf-b521-c8088c995e9c"
notion_url: "https://app.notion.com/p/Phase-6-Backend-and-data-engineering-3cfe607043bc81bfb521c8088c995e9c"
created: "2026-09-02T20:15:00.000Z"
last_edited: "2026-09-02T20:15:00.000Z"
status: "Approved"
---

# Phase 6 — Backend and data engineering

## Objective

Postgres schema (SPEC §9), 5 forward-only migrations, sync_apply RPC, deterministic recompute + triggers, RLS baseline, delete-account skeleton, pgTAP suites. Skill: backend-data-engineering.

## Type

Phase

## Exit Criteria

Artifact docs/engineering/backend-data-implementation.md APPROVED WITH CONDITIONS 2026-09-02 (BD-C1…BD-C5 accepted; OQ-10 resolved to hard cascade + non-PII receipt; 8 security gates set for phase 7). OUTSTANDING: BD-C1 execution gate — migrations + lint + pgTAP must execute successfully on DEP-1 before final sign-off and before client-engineering unlocks. Realises BD-DEC-01…BD-DEC-05. Ordering: chosen ahead of phase 5 by explicit human decision.
