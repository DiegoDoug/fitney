---
id: "REV-8"
kind: "review"
title: "WORK-022 — lifecycle-recovery verification (phase-8 execution defects)"
notion_page_id: "3d0e6070-43bc-81d8-aa35-cc9be04f1743"
notion_url: "https://app.notion.com/p/WORK-022-lifecycle-recovery-verification-phase-8-execution-defects-3d0e607043bc81d8aa35cc9be04f1743"
created: "2026-09-03T02:49:00.000Z"
last_edited: "2026-09-03T02:49:00.000Z"
status: "Pass"
---

# WORK-022 — lifecycle-recovery verification (phase-8 execution defects)

## Scope

supabase/migrations/20260902090003_recompute.sql, supabase/migrations/20260902090006_security_hardening.sql, supabase/tests/01-04_*.sql. Human-authorised narrowly-scoped lifecycle recovery across security-identity + backend-data-engineering. Migrations confirmed NOT deployed to any hosted/released environment (no supabase link, no project ref) — corrected in place.

## Type

Implementation

## Reviewer

Claude Code

## Review Date

2026-09-02

## Findings

12 defects surfaced by phase-8 first local execution, all fixed per the human's approved resolutions and re-verified on Postgres 15.8: F-5 (1::smallint at 4 _week_start_for call boundaries; signature NOT widened); F-2 (not_null_violation -> structured {status:"rejected"}; defaults not merged; full-row happy-path payloads + explicit partial-payload negative test); F-8 (dedupe returns duplicate per the RPC contract); F-9 (schema-qualify extensions.uuid_generate_v5/uuid_ns_url in _pr_id/_agg_id; pinned search_path unchanged — SEC-REQ-AZ-07 upheld); F-11 (revoke sync_apply from public, anon); F-7 (array[]::uuid[]); F-1 (perform->select x12 top-level; perform in PL/pgSQL bodies preserved; ratified line-by-line); F-3/F-4 (throws_ok -> 0 rows affected + protected row unchanged); F-6 (plans corrected to 19/17/8/24; also fixed pre-existing suite-02/04 miscounts); F-12 (::numeric casts in tests/03); F-10 (tests/04 anon assertion -> the SEC-DEC-05 boundary; ISS-27 opened for the design question). Executed verification: supabase db reset x2 (clean, repeatable); supabase db lint clean at warning AND error; supabase test db = PASS 68/68; runtime probes (completed-session recompute + idempotency; _week_start_for for week_start 0-6; sync_apply full/replay/partial/anon). Evidence: docs/platform/evidence/05-08; docs/security/security-identity.md §8.1; docs/engineering/backend-data-implementation.md §9.1.

## Conditions

PASS is for the LOCAL execution only (Postgres 15.8, postgres-as-owner). Not yet run against the hosted Supabase role model (service_role BYPASSRLS, GoTrue-issued auth.uid()/auth.role()) — that re-run + a green db-verify CI gate remain required before phases 6 & 7 can be approved and client-engineering unlocked (DEC-3, SEC-C1, BD-C1). Also owed: a formal client-TS <-> server recompute golden-vector cross-run (WORK-020), and the ISS-27 decision. Remediation set to Ready-for-Review (TASK-6 / WORK-022).
