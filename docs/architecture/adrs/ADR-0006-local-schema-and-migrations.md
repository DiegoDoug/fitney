# ADR-0006 — Local schema mirrors Postgres; forward-only numbered migrations

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture`
- Related: CON-3, SPEC §9.4, §15, AR-RISK-4, AR-OQ-3

## Context

The device DB and the Postgres DB must stay in lockstep so sync is a straight row copy. Migrations must be safe on fresh installs and on every historical upgrade path, with no data loss.

## Decision

- The **local SQLite schema mirrors the Postgres schema**: same table and column names (snake_case), same keys, FKs, the server-authoritative `version` column on every synced row, and the indexes listed in `system-architecture.md` §8.3 (from SPEC §9.4). Server `updated_at` is trigger-generated; the client keeps `local_updated_at`, `synced_version`, and `dirty` alongside each mirrored row.
- Plus **three local-only tables** (schema detail in `system-architecture.md` §8.3): `sync_outbox` (`operation_id` UNIQUE, `base_version`, `state` `pending`|`dispatched`, partial-unique one `pending` per `(entity, entity_id)`; a durable, immutable `dispatched` entry — removed only by a terminal `applied`/`duplicate`/`conflict` — may coexist with one `pending` successor and is not covered by the index), `sync_state` (**composite `(last_pulled_updated_at, last_pulled_id)`** incremental pull cursor **and** `last_full_sync` marker per entity — the latter drives the full `(id, version)` reconciliation that is the pull completeness guarantee, §10.3.2), `sync_conflicts`.
- Migrations are **numbered, forward-only** TypeScript files (`data/local/migrations/NNNN_*.ts`) applied by a runner that tracks applied versions in a `schema_migrations` table. Fresh install runs the whole chain; upgrade applies the missing tail; each migration runs in a transaction. **No down migrations** — a bad migration is fixed forward.
- Postgres DDL + migrations are owned by `backend-data-engineering` and kept in lockstep via a **shared entity-definition source** (types + a schema description consumed by both sides).
- **FK delete behaviour:** RESTRICT for rows referenced by history; CASCADE only for uncommitted child structures. History-breaking deletes are blocked at the repository/domain layer → archive/soft-delete instead.
- **Test matrix:** fresh install at HEAD + upgrade from every shipped prior version; transaction-rollback and outbox-atomicity tests (SPEC §17.2).

## Consequences

- Sync stays a dumb row copy; no field-mapping layer.
- Forward-only keeps upgrades predictable; the cost is discipline (no "just tweak the last migration" after release).
- `expo-sqlite` transactional guarantees in the locked SDK must be verified before building the write path (AR-RISK-4 / AR-C3).

## Alternatives rejected

- **ORM auto-migrate (e.g. drizzle push):** non-deterministic on upgrade; hard to test every path.
- **Divergent local schema (denormalized for the client):** reintroduces a mapping layer and conflict-prone transforms on sync.
- **Down migrations:** rarely correct with real user data; encourage unsafe "rollback" habits.

## Reversibility

Low for existing rows (forward-only by policy). The migration *mechanism* is replaceable; the mirrored-schema decision is foundational to ADR-0003.
