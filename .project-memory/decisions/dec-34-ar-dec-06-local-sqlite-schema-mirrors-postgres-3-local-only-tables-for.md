---
id: "DEC-34"
kind: "decision"
title: "AR-DEC-06 — Local SQLite schema mirrors Postgres + 3 local-only tables; forward-only migrations"
notion_page_id: "3cfe6070-43bc-817b-94d0-f7e0e7c8a0e4"
notion_url: "https://app.notion.com/p/AR-DEC-06-Local-SQLite-schema-mirrors-Postgres-3-local-only-tables-forward-only-migrations-3cfe607043bc817b94d0f7e0e7c8a0e4"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-06 — Local SQLite schema mirrors Postgres + 3 local-only tables; forward-only migrations

## Summary

Local SQLite schema mirrors the Postgres schema + 3 local-only tables (sync_outbox, sync_state, sync_conflicts); forward-only numbered migrations with a runner + schema_migrations; fresh-create and every upgrade path tested; client/server lockstep via shared entity definitions; FKs RESTRICT for history, CASCADE only for uncommitted children.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Evidence: docs/architecture/adrs/ADR-0006-local-schema-and-migrations.md, system-architecture.md §8.

## Consequences

Shared machine-readable entity definition = WORK-017 / BD-RISK-7. Full record: ADR-0006. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
