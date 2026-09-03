---
id: "ISS-26"
kind: "issue"
title: "Phase 8 pgTAP / execution findings (F-1, F-3, F-4, F-6, F-7, F-8, F-9, F-11, F-12, F-13, F-14) — RESOLVED (WORK-022)"
notion_page_id: "3cfe6070-43bc-81fd-912a-fade9b78676e"
notion_url: "https://app.notion.com/p/Phase-8-pgTAP-execution-findings-F-1-F-3-F-4-F-6-F-7-F-8-F-9-F-11-F-12-F-13-F-14-RES-3cfe607043bc81fd912afade9b78676e"
created: "2026-09-02T23:40:00.000Z"
last_edited: "2026-09-03T04:27:00.000Z"
status: "Resolved"
---

# Phase 8 pgTAP / execution findings (F-1, F-3, F-4, F-6, F-7, F-8, F-9, F-11, F-12, F-13, F-14) — RESOLVED (WORK-022)

## Summary

Test-harness / assertion-quality findings from platform-release (phase 8) execution 2026-09-02, routed to security-identity / backend-data-engineering. F-1 (High-impact but mechanical): pgTAP suites 01-04 use perform <stmt>; at top-level SQL script scope (plpgsql-only syntax) — each file aborts before finish(). FIXED this phase (perform→select, 4 files, 12 lines, zero assertion change); as-authored copies preserved; needs owner ratification. F-3: suite 01 assertion 11 ('B cannot update a global seed exercise') uses throws_ok where correct behaviour is 0 rows affected (RLS filters, does not raise) — behaviour is secure. F-4: suite 01 assertion 13 ('processed_operations has no update policy') — same (missing UPDATE policy yields 0 rows silently). F-6: suite 01 select plan(20) but 17 assertions execute. F-7: supabase db lint warning — recompute_exercise_prs v_keep uuid[] := '{}' needs ::uuid[] (migration 0003); no functional impact.

## Type

Bug

## Priority

Low

## Evidence

docs/platform/platform-release.md §13; docs/platform/evidence/03-supabase-test-db.txt, docs/platform/evidence/02-supabase-db-lint.txt.

## Proposed Resolution

RESOLVED 2026-09-02/03 under WORK-022. Local-execution findings F-1/F-3/F-4/F-6/F-7/F-8/F-9/F-11/F-12 fixed and re-verified (see earlier note). HOSTED execution against fitney-dev (PG17) + the Supabase security advisor surfaced two more, also fixed: F-13 — recompute_ / trg_recompute_ / check_ref_ownership / _guard_exercise_owner (SECURITY DEFINER, public schema) were EXECUTE-able by anon+authenticated via /rest/v1/rpc, so a caller could invoke recompute*(<any user_id>, ...); same Supabase ALTER DEFAULT PRIVILEGES gap as F-11. Fix: migration 0006 revoke all on function ... from public, anon, authenticated on all 13 internal/helper/trigger/definer functions (triggers still fire — invocation does not check EXECUTE); tests/03 rewritten to verify the trigger-driven recompute + idempotency instead of a direct call. F-14 — set_row_metadata / _attach_row_metadata had a mutable search_path (advisor 0011); fix: set search_path = pg_catalog, public in migration 0001. Supabase security advisor re-run after the fixes: clean except one intentional INFO (deletion_receipts RLS-enabled-no-policy = service_role-only by design). Result across all surfaces: local supabase test db 68/68, db-verify CI green on main, hosted db lint --linked clean + 31 behavioural checks 31/0.
