---
id: "REQ-60"
kind: "requirement"
title: "FR-SYNC-03 — Sync runs after auth, on foreground, on connectivity restore, on manual retry, on debounced change; failed ops retained with backoff"
notion_page_id: "3cfe6070-43bc-8154-b519-eab8dfc58e4a"
notion_url: "https://app.notion.com/p/FR-SYNC-03-Sync-runs-after-auth-on-foreground-on-connectivity-restore-on-manual-retry-on-debou-3cfe607043bc8154b519eab8dfc58e4a"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# FR-SYNC-03 — Sync runs after auth, on foreground, on connectivity restore, on manual retry, on debounced change; failed ops retained with backoff

## Description

Sync runs after auth, on foreground, on connectivity restore, on manual retry, and on debounced local change; failed operations are retained with backoff until resolved or explicitly discarded.

## Type

Functional

## Priority

High

## Acceptance Criteria

ADR-0003 triggers + durable dispatched state. WORK-013 conformance suite.

## Source

SPEC §11.2; docs/product/product-strategy.md §8.1. P1.

## Verified

false
