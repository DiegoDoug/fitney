---
id: "REL-12"
kind: "milestone"
title: "Gate — DEP-1 execution gate (migrations + pgTAP + lint green on a provisioned Supabase project)"
notion_page_id: "3cfe6070-43bc-815f-bae6-e43b9d5ad429"
notion_url: "https://app.notion.com/p/Gate-DEP-1-execution-gate-migrations-pgTAP-lint-green-on-a-provisioned-Supabase-project-3cfe607043bc815fbae6e43b9d5ad429"
created: "2026-09-02T20:16:00.000Z"
last_edited: "2026-09-03T02:48:00.000Z"
status: "Blocked"
---

# Gate — DEP-1 execution gate (migrations + pgTAP + lint green on a provisioned Supabase project)

## Objective

Execute supabase db reset (migrations 20260902090001–06 + seed) + supabase test db (pgTAP suites 01–04) + supabase db lint green on the provisioned DEP-1 project, and wire them as a CI merge gate.

## Type

Gate

## Exit Criteria

All four pgTAP suites pass; db reset applies the full migration chain cleanly; db lint clean; CI merge gate live. BLOCKS client-engineering (phase 5); exit condition for phase 8 discharging phases 6 (BD-C1) and 7 (SEC-C1). LOCAL: MET 2026-09-02 (platform-release + WORK-022): supabase db reset x2 clean & repeatable (migrations 0001-0006 + seed, Postgres 15.8); supabase db lint clean at warning AND error; supabase test db = PASS 68/68 (suites 19/17/8/24, every suite reaches finish() with an exact plan); runtime probes green. First execution found 12 defects (F-1..F-12, two High) all fixed under WORK-022. STILL REQUIRED: the same run on a provisioned Supabase project (real service_role BYPASSRLS + GoTrue auth.uid()/auth.role()) and the db-verify GitHub Actions gate actually running green (needs git init + a repo). Gate stays Blocked on the hosted run; client-engineering stays LOCKED. Evidence: docs/platform/evidence/05-08.
