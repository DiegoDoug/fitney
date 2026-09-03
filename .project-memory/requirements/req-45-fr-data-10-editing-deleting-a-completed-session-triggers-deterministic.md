---
id: "REQ-45"
kind: "requirement"
title: "FR-DATA-10 — Editing/deleting a completed session triggers deterministic idempotent recompute"
notion_page_id: "3cfe6070-43bc-8193-bfbd-cf91333ece22"
notion_url: "https://app.notion.com/p/FR-DATA-10-Editing-deleting-a-completed-session-triggers-deterministic-idempotent-recompute-3cfe607043bc8193bfbdcf91333ece22"
created: "2026-09-02T20:13:00.000Z"
last_edited: "2026-09-02T20:13:00.000Z"
status: "Approved"
---

# FR-DATA-10 — Editing/deleting a completed session triggers deterministic idempotent recompute

## Description

Editing or deleting a completed session triggers deterministic, idempotent recomputation of affected PRs and aggregates.

## Type

Functional

## Priority

Critical

## Acceptance Criteria

AR-DEC-05 / BD-DEC-03. E2E scenario 5. Server triggers authored (supabase/migrations/...03), NOT executed (DEP-1).

## Source

SPEC DATA-10, CLAUDE.md; docs/product/product-strategy.md §8.1. P0.

## Verified

false
