---
id: "DEC-42"
kind: "decision"
title: "BD-DEC-03 — Server recompute is trigger-driven, pure, deterministic, idempotent, formula-stamped"
notion_page_id: "3cfe6070-43bc-81f5-937e-d19b1b15fb37"
notion_url: "https://app.notion.com/p/BD-DEC-03-Server-recompute-is-trigger-driven-pure-deterministic-idempotent-formula-stamped-3cfe607043bc81f5937ed19b1b15fb37"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# BD-DEC-03 — Server recompute is trigger-driven, pure, deterministic, idempotent, formula-stamped

## Summary

Server recompute (AR-OQ-3 → trigger-driven): recompute_exercise_prs / recompute_session_volume_pr / recompute_week_aggregates are pure, deterministic (ordering key (session_exercise_id, position, id)), idempotent (deterministic uuid_generate_v5 derived-row ids → pure UPSERT + tombstone-the-rest), formula_id/formula_version stamped; Epley e1RM for reps 2–10; warmups excluded from headline volume. AFTER triggers on performed_sets + workout_sessions fire when the parent session is completed. Golden vectors shared with the client TS impl (WORK-012).

## Area

Data

## Rationale

Owner: backend-data-engineering (phase 6). Implements AR-DEC-05, SPEC §12. Resolves AR-OQ-3. Evidence: docs/engineering/backend-data-implementation.md §7; supabase/migrations/20260902090003_recompute.sql, supabase/tests/03_recompute_test.sql.

## Consequences

Weekly bucketing corrected by SEC-F-9 (BD-OQ-1) — backend to validate (WORK-020). Definer/grant model finalised by SEC-DEC-03. Authored, not executed. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
