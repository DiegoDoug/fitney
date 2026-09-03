---
id: "REQ-5"
kind: "requirement"
title: "FR-AUTH-05 — Per-owner isolation of every user-owned server record"
notion_page_id: "3cfe6070-43bc-813d-a6ec-d822c88e6de1"
notion_url: "https://app.notion.com/p/FR-AUTH-05-Per-owner-isolation-of-every-user-owned-server-record-3cfe607043bc813da6ecd822c88e6de1"
created: "2026-09-02T20:11:00.000Z"
last_edited: "2026-09-02T20:11:00.000Z"
status: "Approved"
---

# FR-AUTH-05 — Per-owner isolation of every user-owned server record

## Description

Every user-owned server record is isolated to its owner; a user can never read or mutate another user's data through the client API.

## Type

Functional

## Priority

Critical

## Acceptance Criteria

SM-9: second account cannot read/mutate any first-account object via the API. Adversarial two-user RLS tests before any table is exposed (supabase/tests/01, 04 — unrun, DEP-1).

## Source

SPEC AUTH-05, NFR-SEC; docs/product/product-strategy.md §8.1. Priority P0.

## Verified

false
