---
id: "REQ-53"
kind: "requirement"
title: "FR-LIB-08 — Deletion is blocked where it would break history; archive or soft-delete instead"
notion_page_id: "3cfe6070-43bc-81b1-972c-eba611fce7ea"
notion_url: "https://app.notion.com/p/FR-LIB-08-Deletion-is-blocked-where-it-would-break-history-archive-or-soft-delete-instead-3cfe607043bc81b1972ceba611fce7ea"
created: "2026-09-02T20:13:00.000Z"
last_edited: "2026-09-02T20:13:00.000Z"
status: "Approved"
---

# FR-LIB-08 — Deletion is blocked where it would break history; archive or soft-delete instead

## Description

Deletion is blocked where it would break history; archive or soft-delete instead.

## Type

Functional

## Priority

Critical

## Acceptance Criteria

Product invariant #8. FK RESTRICT for history-referenced rows (ADR-0006). Blocked at repository/domain layer.

## Source

SPEC LIB-08; docs/product/product-strategy.md §8.1. P0.

## Verified

false
