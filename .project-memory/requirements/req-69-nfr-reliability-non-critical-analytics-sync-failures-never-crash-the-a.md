---
id: "REQ-69"
kind: "requirement"
title: "NFR-RELIABILITY — Non-critical analytics/sync failures never crash the active workout; recovery/replay/completion/recompute idempotent"
notion_page_id: "3cfe6070-43bc-81ef-ad37-cab513814f26"
notion_url: "https://app.notion.com/p/NFR-RELIABILITY-Non-critical-analytics-sync-failures-never-crash-the-active-workout-recovery-repl-3cfe607043bc81efad37cab513814f26"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# NFR-RELIABILITY — Non-critical analytics/sync failures never crash the active workout; recovery/replay/completion/recompute idempotent

## Description

Failures in non-critical analytics/sync paths never crash the active workout; crash recovery, outbox replay, session completion, and aggregate recomputation are idempotent.

## Type

Non-functional

## Priority

Critical

## Acceptance Criteria

Crash-free session rate; fault-injection tests. ADR-0003 step 7 determinism. Routed to Architecture, Client, Backend, Operations.

## Source

docs/product/product-strategy.md §8.2. Priority P0.

## Verified

false
