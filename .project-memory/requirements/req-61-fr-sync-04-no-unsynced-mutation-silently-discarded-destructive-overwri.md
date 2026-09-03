---
id: "REQ-61"
kind: "requirement"
title: "FR-SYNC-04 — No unsynced mutation silently discarded; destructive overwrite of completed history needs explicit action + recoverable conflict copy"
notion_page_id: "3cfe6070-43bc-81e4-9cdd-f08292b77cd8"
notion_url: "https://app.notion.com/p/FR-SYNC-04-No-unsynced-mutation-silently-discarded-destructive-overwrite-of-completed-history-nee-3cfe607043bc81e49cddf08292b77cd8"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# FR-SYNC-04 — No unsynced mutation silently discarded; destructive overwrite of completed history needs explicit action + recoverable conflict copy

## Description

No unsynced mutation is silently discarded during sign-out, conflict resolution, or migration; destructive overwrite of a completed session always needs an explicit local action and preserves a recoverable conflict copy.

## Type

Functional

## Priority

Critical

## Acceptance Criteria

ADR-0003: rejected local change preserved in sync_conflicts; completed-session conflicts parked for explicit user choice.

## Source

SPEC §11.2, CLAUDE.md; docs/product/product-strategy.md §8.1. P0.

## Verified

false
