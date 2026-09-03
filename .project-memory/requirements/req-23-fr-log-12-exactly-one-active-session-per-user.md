---
id: "REQ-23"
kind: "requirement"
title: "FR-LOG-12 — Exactly one active session per user"
notion_page_id: "3cfe6070-43bc-816a-b72a-f79efb0e6fb8"
notion_url: "https://app.notion.com/p/FR-LOG-12-Exactly-one-active-session-per-user-3cfe607043bc816ab72af79efb0e6fb8"
created: "2026-09-02T20:12:00.000Z"
last_edited: "2026-09-02T20:12:00.000Z"
status: "Approved"
---

# FR-LOG-12 — Exactly one active session per user

## Description

Exactly one active session per user; starting another forces resume, finish, or explicit discard.

## Type

Functional

## Priority

Critical

## Acceptance Criteria

Partial unique index (user_id) where status='active' and deleted_at is null. Product invariant #4.

## Source

SPEC LOG-12, CLAUDE.md; docs/product/product-strategy.md §8.1. Priority P0.

## Verified

false
