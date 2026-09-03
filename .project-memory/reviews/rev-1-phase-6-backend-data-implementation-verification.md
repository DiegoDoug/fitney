---
id: "REV-1"
kind: "review"
title: "Phase 6 — Backend & Data implementation verification"
notion_page_id: "3cfe6070-43bc-8124-9dbc-c304d762e31d"
notion_url: "https://app.notion.com/p/Phase-6-Backend-Data-implementation-verification-3cfe607043bc81249dbcc304d762e31d"
created: "2026-09-02T17:33:00.000Z"
last_edited: "2026-09-02T22:15:00.000Z"
status: "Pass with Conditions"
---

# Phase 6 — Backend & Data implementation verification

## Scope

supabase/ (config, seed, migrations 20260902090001–05, functions/delete-account skeleton, tests 01–03) and docs/engineering/backend-data-implementation.md. Server data layer for the offline-first workout app: schema, forward-only migrations, sync_apply RPC, deterministic recompute, RLS baseline.

## Type

Implementation

## Reviewer

Claude Code

## Review Date

2026-09-02

## Findings

Verified by INSPECTION only (no DB available — DEP-1): (1) every SPEC §9 entity present with standard sync columns (id/user_id/created_at/updated_at/version/deleted_at); (2) all SPEC §9.4 indexes + a (updated_at,id) pull-cursor index per table; (3) server-authoritative updated_at/version via one BEFORE trigger; (4) sync_apply dynamic SQL reviewed — whitelisted identifiers + parameterised values, no injection path; (5) recompute is pure/deterministic with uuid_generate_v5 ids (idempotent UPSERT); (6) forward-only migration set, single baseline.
Tests authored: 01_rls_isolation_test.sql (20 assertions), 02_sync_apply_test.sql (14), 03_recompute_test.sql (8 golden vectors shared with the client TS impl). TESTS EXECUTED: NONE. typecheck/lint/build: N/A (SQL only, no TS app). Deviations recorded (BD-C5): template version→content_version; user_id denormalised onto child tables; personal_records.exercise_id nullable; added exercise_weekly_rollups.

## Conditions

BD-C1: no runtime evidence — migrations/functions/tests authored but unexecuted; platform-release must provision DEP-1 and quality-engineering must run supabase db reset + supabase test db + supabase db lint before client integration. BD-C2: RLS is a baseline — security-identity finalises + owns the adversarial suite; no user-owned table exposed via the client API until it passes on DEP-1. BD-C3: BD-OQ-1 (weekly-aggregate bucketing vs configurable week_start) + BD-OQ-2 (recompute write-grant model under FORCE RLS). BD-C4: OQ-4 (seed catalogue licence — seed.sql is a non-shippable placeholder) + OQ-10 (account-deletion behaviour). BD-C5: 4 schema deviations accepted.
Human decision: APPROVED WITH CONDITIONS 2026-09-02; proceed to security-identity; client-engineering remains LOCKED pending security finalisation + DEP-1 execution evidence.
