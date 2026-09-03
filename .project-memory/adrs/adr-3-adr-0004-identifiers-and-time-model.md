---
id: "ADR-3"
kind: "adr"
title: "ADR-0004 — Identifiers and time model"
notion_page_id: "3cfe6070-43bc-81d6-aa15-d76876c235cf"
notion_url: "https://app.notion.com/p/ADR-0004-Identifiers-and-time-model-3cfe607043bc81d6aa15d76876c235cf"
created: "2026-09-02T20:09:00.000Z"
last_edited: "2026-09-02T20:09:00.000Z"
status: "Accepted"
---

# ADR-0004 — Identifiers and time model

## Context

Offline creation must not wait for the server to assign IDs. Training data spans timezones and DST; "today", week boundaries, and plan dates must stay correct, and historical instants must be unambiguous.

## Decision

Primary keys: client-generated UUID for every entity, produced by services/IdGenerator. UUIDv7 preferred (time-ordered → better index locality); UUIDv4 acceptable if a vetted v7 generator is not available in the locked Expo Go set (AR-OQ-1). Instants stored in UTC — epoch-milliseconds INTEGER in SQLite, timestamptz in Postgres. Session timezone stored separately as an IANA zone string on workout_sessions. Plan dates date-only — TEXT YYYY-MM-DD in SQLite, date in Postgres. "Today" / week start / date boundaries computed in the user's current timezone by domain/time using the injected Clock; never from a raw local Date. Rest timer persisted as an absolute rest_timer_anchor timestamp, never a decrementing counter. Canonical measures: kilograms, meters, seconds at rest; conversion only in presentation selectors.

## Consequences

Full offline create; no ID reconciliation on sync (client UUID is the PK end to end). Correct history across travel/DST; plan dates never shift with timezone. IdGenerator and Clock are injectable → deterministic tests. Rejected: server-assigned IDs / sequences; ULID; storing local time + offset instead of UTC + IANA zone. Reversibility: high for the generator; the UTC + IANA-zone + date-only split is a low-risk standard choice.

## Date

2026-09-02

## Implemented

false

## Supersedes

—
