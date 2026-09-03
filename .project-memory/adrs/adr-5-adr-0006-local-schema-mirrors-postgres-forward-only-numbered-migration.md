---
id: "ADR-5"
kind: "adr"
title: "ADR-0006 — Local schema mirrors Postgres; forward-only numbered migrations"
notion_page_id: "3cfe6070-43bc-8188-b10d-ee00bd01400d"
notion_url: "https://app.notion.com/p/ADR-0006-Local-schema-mirrors-Postgres-forward-only-numbered-migrations-3cfe607043bc8188b10dee00bd01400d"
created: "2026-09-02T20:09:00.000Z"
last_edited: "2026-09-02T20:09:00.000Z"
status: "Accepted"
---

# ADR-0006 — Local schema mirrors Postgres; forward-only numbered migrations

## Context

The device DB and the Postgres DB must stay in lockstep so sync is a straight row copy. Migrations must be safe on fresh installs and on every historical upgrade path, with no data loss.

## Decision

The local SQLite schema mirrors the Postgres schema: same table and column names (snake_case), same keys, FKs, the server-authoritative version column on every synced row, and the §8.3 indexes. Server updated_at is trigger-generated; the client keeps local_updated_at, synced_version, and dirty alongside each mirrored row. Plus three local-only tables: sync_outbox (operation_id UNIQUE, base_version, state pending|dispatched, partial-unique one pending per (entity, entity_id); a durable immutable dispatched entry — removed only by a terminal applied/duplicate/conflict — may coexist with one pending successor and is not covered by the index), sync_state (composite (last_pulled_updated_at, last_pulled_id) incremental cursor and last_full_sync marker per entity driving the full (id, version) reconciliation — the pull completeness guarantee, §10.3.2), sync_conflicts. Migrations are numbered, forward-only TypeScript files applied by a runner tracking applied versions in schema_migrations; fresh install runs the whole chain, upgrade applies the missing tail, each migration in a transaction. No down migrations — fix forward. Postgres DDL owned by backend-data-engineering, kept in lockstep via a shared entity-definition source. FK delete: RESTRICT for rows referenced by history; CASCADE only for uncommitted child structures. Test matrix: fresh install at HEAD + upgrade from every shipped prior version; transaction-rollback and outbox-atomicity tests.

## Consequences

Sync stays a dumb row copy; no field-mapping layer. Forward-only keeps upgrades predictable; cost is discipline. expo-sqlite transactional guarantees must be verified before building the write path (AR-RISK-4 / AR-C3). Rejected: ORM auto-migrate; divergent local schema; down migrations. Reversibility: low for existing rows (forward-only by policy); the migration mechanism is replaceable, the mirrored-schema decision is foundational to ADR-0003.

## Date

2026-09-02

## Implemented

false

## Supersedes

—
