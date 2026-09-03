---
id: "TASK-6"
kind: "task"
title: "WORK-022 — lifecycle recovery: fix the 12 defects surfaced by phase-8 first execution"
notion_page_id: "3d0e6070-43bc-81b3-8afc-f180f6208715"
notion_url: "https://app.notion.com/p/WORK-022-lifecycle-recovery-fix-the-12-defects-surfaced-by-phase-8-first-execution-3d0e607043bc81b38afcf180f6208715"
created: "2026-09-03T02:47:00.000Z"
last_edited: "2026-09-03T02:47:00.000Z"
status: "Review"
---

# WORK-022 — lifecycle recovery: fix the 12 defects surfaced by phase-8 first execution

## Scope

Human-authorised narrowly-scoped recovery across security-identity + backend-data-engineering. Migrations 0003 + 0006 and pgTAP suites 01-04, corrected IN PLACE (migrations confirmed unshipped). F-5 (week_start_for smallint/integer -> 1::smallint x4, signature preserved), F-2 (not_null_violation -> structured {status:rejected}; full-row happy-path payloads + partial-payload negative test), F-8 (dedupe returns 'duplicate' per contract), F-9 (schema-qualify extensions.uuid* ; pinned search_path unchanged), F-11 (revoke sync_apply from anon), F-7 (array[]::uuid[]), F-1 (perform->select x12, ratified), F-3/F-4 (0-rows + protected-row-unchanged), F-6 (plans -> 19/17/8/24), F-12 (::numeric casts), F-10 (test -> SEC-DEC-05 boundary; ISS-27 opened).

## Priority

Critical

## Executor

Claude Code

## Definition of Done

LOCAL (met 2026-09-02): supabase db reset x2 clean & repeatable; supabase db lint clean at warning AND error; supabase test db = PASS 68/68 (every suite reaches finish() with an exact plan); runtime probes green (completed-session recompute; week_start 0-6; sync_apply full/replay/partial/anon). Evidence: docs/platform/evidence/05-08. OUTSTANDING: (1) re-run the same on a provisioned Supabase project against the real hosted role model + wire the db-verify CI gate green; (2) formal client-TS <-> server recompute golden-vector cross-run (WORK-020); (3) ISS-27 decision. Human approval of phases 6 & 7 remains gated on the hosted run (DEC-3).

## Due Date

2026-09-02

## Verification

Partial
