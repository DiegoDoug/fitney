# ADR-0004 — Identifiers and time model

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture`
- Related: CON-6, SPEC §9.3, AR-OQ-1

## Context

Offline creation must not wait for the server to assign IDs. Training data spans timezones and DST; "today", week boundaries, and plan dates must stay correct, and historical instants must be unambiguous.

## Decision

- **Primary keys:** client-generated **UUID** for every entity, produced by `services/IdGenerator`. **UUIDv7 preferred** (time-ordered → better index locality on SQLite and Postgres); **UUIDv4 acceptable** if a vetted v7 generator is not available in the locked Expo Go set (AR-OQ-1).
- **Instants:** stored in **UTC** — epoch-milliseconds `INTEGER` in SQLite, `timestamptz` in Postgres.
- **Session timezone:** stored **separately** as an IANA zone string on `workout_sessions`.
- **Plan dates:** **date-only** — `TEXT` `YYYY-MM-DD` in SQLite, `date` in Postgres.
- **"Today" / week start / date boundaries:** computed in the user's *current* timezone by `domain/time` using the injected `Clock`; never from a raw local `Date`.
- **Rest timer:** persisted as an absolute `rest_timer_anchor` timestamp, never a decrementing counter (recovery-safe).
- **Canonical measures:** kilograms, meters, seconds at rest; conversion only in presentation selectors.

## Consequences

- Full offline create; no ID reconciliation on sync (client UUID is the PK end to end).
- Correct history across travel/DST; plan dates never shift with timezone.
- `IdGenerator` and `Clock` are injectable → deterministic tests for date/PR/boundary logic.

## Alternatives rejected

- **Server-assigned IDs / sequences:** break offline creation.
- **ULID:** weaker RN ecosystem support than UUID; marginal benefit over UUIDv7.
- **Storing local time + offset instead of UTC + IANA zone:** offset alone cannot resolve DST-sensitive future plan logic.

## Reversibility

High for the generator (one service; a PK *format* change is a migration). The UTC + IANA-zone + date-only split is a low-risk, standard choice unlikely to need reversal.
