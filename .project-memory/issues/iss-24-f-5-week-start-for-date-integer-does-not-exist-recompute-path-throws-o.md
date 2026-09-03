---
id: "ISS-24"
kind: "issue"
title: "F-5: _week_start_for(date, integer) does not exist — recompute path throws on every completed-session write"
notion_page_id: "3cfe6070-43bc-81a7-865d-e3e868be393c"
notion_url: "https://app.notion.com/p/F-5-_week_start_for-date-integer-does-not-exist-recompute-path-throws-on-every-completed-sessio-3cfe607043bc81a7865de3e868be393c"
created: "2026-09-02T23:40:00.000Z"
last_edited: "2026-09-03T02:46:00.000Z"
status: "Resolved"
---

# F-5: _week_start_for(date, integer) does not exist — recompute path throws on every completed-session write

## Summary

Found by platform-release (phase 8) local execution 2026-09-02. Migration 20260902090006 defines _week_start_for(p_local_date date, p_week_start smallint). Its callers trg_recompute_from_performed_set and trg_recompute_from_session pass _week_start_for(<date>, coalesce(p.week_start, 1)); coalesce(smallint, integer) resolves to integer, and there is no _week_start_for(date, integer), so the trigger throws 'function _week_start_for(date, integer) does not exist' at fire time. Every INSERT/UPDATE/DELETE on a completed-session performed_sets row, and every workout_sessions status/started_at/ended_at/deleted_at change, fails. FR-DATA-10 recompute path is non-functional. Not caught by supabase db reset or supabase db lint (plpgsql late binding); confirmed by direct runtime probe on Postgres 15.8.

## Type

Bug

## Priority

High

## Evidence

docs/platform/platform-release.md §13 (F-5); docs/platform/evidence/03-supabase-test-db.txt (suite 03 abort at line 31). Realizes BD-RISK-1 / SEC-RISK-1. Related: ISS-7 (BD-OQ-1 / SEC-F-9 corrected weekly bucketing — the defect is in that code).

## Proposed Resolution

RESOLVED 2026-09-02 under WORK-022. Fix: 1::smallint at all four _week_start_for(<date>, coalesce(...,1)) boundaries in migration 20260902090006 (trg_recompute_from_performed_set, trg_recompute_from_session, recompute_week_aggregates variable init + profile lookup). The _week_start_for(date, smallint) signature was PRESERVED (not widened to integer), per the approved resolution. Verified: recording a working set on a completed session now runs the recompute path with no error; probed for profiles.week_start = 0..6 (Sun..Sat) with correct week-start dates; supabase/tests/03 golden vectors green (weekly volume 1430, e1RM 116.6667 / 129.8333); idempotent on re-run. Evidence: docs/platform/evidence/07-work022-test-db.txt, 08-work022-runtime-probes.txt; docs/security/security-identity.md §8.1. Residual: formal client-TS <-> server golden-vector cross-run (WORK-020) and the hosted re-run still owed.
