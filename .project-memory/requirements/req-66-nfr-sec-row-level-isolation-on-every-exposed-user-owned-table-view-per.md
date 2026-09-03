---
id: "REQ-66"
kind: "requirement"
title: "NFR-SEC — Row-level isolation on every exposed user-owned table/view, per-command policies, adversarially tested before client exposure; no privileged key in client"
notion_page_id: "3cfe6070-43bc-8178-b8af-ef70aa01a7aa"
notion_url: "https://app.notion.com/p/NFR-SEC-Row-level-isolation-on-every-exposed-user-owned-table-view-per-command-policies-adversar-3cfe607043bc8178b8afef70aa01a7aa"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# NFR-SEC — Row-level isolation on every exposed user-owned table/view, per-command policies, adversarially tested before client exposure; no privileged key in client

## Description

Row-level isolation on every exposed user-owned table and derived view, with independent select/insert/update/delete policies, adversarially tested before client exposure; no privileged key in the client; server-side validation of IDs, enums, measures, date ranges, and ownership; tokens in secure storage; export and deletion cover local and remote data.

## Type

Non-functional

## Priority

Critical

## Acceptance Criteria

SM-9; adversarial RLS tests (supabase/tests/01, 04 — authored, NOT executed, DEP-1); E2E scenario 6. SEC-DEC-01–05. Routed to Security, Backend, Quality.

## Source

docs/product/product-strategy.md §8.2. Priority P0.

## Verified

false
