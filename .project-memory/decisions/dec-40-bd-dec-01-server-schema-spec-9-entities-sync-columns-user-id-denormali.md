---
id: "DEC-40"
kind: "decision"
title: "BD-DEC-01 — Server schema: SPEC §9 entities + sync columns; user_id denormalised; server-authoritative metadata"
notion_page_id: "3cfe6070-43bc-8173-be80-cb59785354c4"
notion_url: "https://app.notion.com/p/BD-DEC-01-Server-schema-SPEC-9-entities-sync-columns-user_id-denormalised-server-authoritati-3cfe607043bc8173be80cb59785354c4"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# BD-DEC-01 — Server schema: SPEC §9 entities + sync columns; user_id denormalised; server-authoritative metadata

## Summary

Server schema: all SPEC §9 entities with the standard sync columns; user_id denormalised onto every table (incl. children) for join-free RLS; server-authoritative created_at/updated_at/version via one set_row_metadata() BEFORE trigger (client values ignored; version = 1 on insert, OLD.version+1 on every update incl. tombstone). Template content versioning renamed content_version (collides with the sync version). Five forward-only migrations (20260902090001..05).

## Area

Data

## Rationale

Owner: backend-data-engineering (phase 6). Implements AR-DEC-04/06, SPEC §9. Evidence: docs/engineering/backend-data-implementation.md §4–5; supabase/migrations/.

## Consequences

Authored, NOT executed (no DEP-1). Deviations tracked as BD-C5. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
