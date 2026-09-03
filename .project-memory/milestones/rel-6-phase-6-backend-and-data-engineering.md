---
id: "REL-6"
kind: "milestone"
title: "Phase 6 — Backend and data engineering"
notion_page_id: "3cfe6070-43bc-81bf-b521-c8088c995e9c"
notion_url: "https://app.notion.com/p/Phase-6-Backend-and-data-engineering-3cfe607043bc81bfb521c8088c995e9c"
created: "2026-09-02T20:15:00.000Z"
last_edited: "2026-09-03T15:00:00.000Z"
status: "Approved"
---

# Phase 6 — Backend and data engineering

## Objective

Postgres schema (SPEC §9), 5 forward-only migrations, sync_apply RPC, deterministic recompute + triggers, RLS baseline, delete-account skeleton, pgTAP suites. Skill: backend-data-engineering.

## Type

Phase

## Exit Criteria

APPROVED WITH CONDITIONS. BD-C1 execution condition DISCHARGED 2026-09-03: local reset/lint/pgTAP passed, CI db-verify passed, and hosted fitney-dev migration/lint/real-role checks passed. WORK-022 remediation is complete. Remaining non-blocking owner work: ratify PostgreSQL 17 against the prior PG15 assumption (ISS-28). WORK-020 client/server recompute parity moved to Phase 5 as an acceptance condition.

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
