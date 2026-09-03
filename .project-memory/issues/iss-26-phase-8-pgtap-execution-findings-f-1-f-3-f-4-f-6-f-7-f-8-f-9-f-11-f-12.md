---
id: "ISS-26"
kind: "issue"
title: "Phase 8 pgTAP / execution findings (F-1, F-3, F-4, F-6, F-7, F-8, F-9, F-11, F-12) — RESOLVED (WORK-022)"
notion_page_id: "3cfe6070-43bc-81fd-912a-fade9b78676e"
notion_url: "https://app.notion.com/p/Phase-8-pgTAP-execution-findings-F-1-F-3-F-4-F-6-F-7-F-8-F-9-F-11-F-12-RESOLVED-WORK--3cfe607043bc81fd912afade9b78676e"
created: "2026-09-02T23:40:00.000Z"
last_edited: "2026-09-03T02:47:00.000Z"
status: "Resolved"
---

# Phase 8 pgTAP / execution findings (F-1, F-3, F-4, F-6, F-7, F-8, F-9, F-11, F-12) — RESOLVED (WORK-022)

## Summary

Test-harness / assertion-quality findings from platform-release (phase 8) execution 2026-09-02, routed to security-identity / backend-data-engineering. F-1 (High-impact but mechanical): pgTAP suites 01-04 use perform <stmt>; at top-level SQL script scope (plpgsql-only syntax) — each file aborts before finish(). FIXED this phase (perform→select, 4 files, 12 lines, zero assertion change); as-authored copies preserved; needs owner ratification. F-3: suite 01 assertion 11 ('B cannot update a global seed exercise') uses throws_ok where correct behaviour is 0 rows affected (RLS filters, does not raise) — behaviour is secure. F-4: suite 01 assertion 13 ('processed_operations has no update policy') — same (missing UPDATE policy yields 0 rows silently). F-6: suite 01 select plan(20) but 17 assertions execute. F-7: supabase db lint warning — recompute_exercise_prs v_keep uuid[] := '{}' needs ::uuid[] (migration 0003); no functional impact.

## Type

Bug

## Priority

Low

## Evidence

docs/platform/platform-release.md §13; docs/platform/evidence/03-supabase-test-db.txt, docs/platform/evidence/02-supabase-db-lint.txt.

## Proposed Resolution

RESOLVED 2026-09-02 under WORK-022. F-1: perform->select at top-level SQL scope (12 statements across all 4 suites), ratified line-by-line; perform inside PL/pgSQL bodies preserved. F-3/F-4: throws_ok replaced with explicit "0 rows affected" + "protected row unchanged" assertions in tests/01 and tests/04 (RLS filters a forbidden UPDATE to 0 rows silently; it does not raise). F-6: plans corrected to the exact executed counts (01=19, 02=17, 03=8, 04=24) — this also fixed pre-existing miscounts in suites 02 and 04. F-7: v_keep uuid[] := array[]::uuid[] in migration 0003 -> supabase db lint --level warning is now clean. Additional defects surfaced once the suites ran end-to-end and fixed in the same recovery: F-8 (sync_apply dedupe returned the stored 'applied' instead of the documented 'duplicate' -> now returns 'duplicate'); F-9 (uuid-ossp lives in the extensions schema; the pinned search_path could not resolve uuid_generate_v5/uuid_ns_url -> schema-qualified in _pr_id/_agg_id, search_path unchanged); F-11 (anon had EXECUTE on sync_apply via Supabase default privileges -> revoke ... from public, anon); F-12 (tests/03 compared numeric columns to bare integer literals -> ::numeric casts). Result: supabase test db = PASS 68/68, all suites reach finish() with exact plans; db lint clean at warning + error. Evidence: docs/platform/evidence/05-08; docs/security/security-identity.md §8.1. F-10 (anon read of the global seed catalogue) is tracked separately as ISS-27 (open question).
