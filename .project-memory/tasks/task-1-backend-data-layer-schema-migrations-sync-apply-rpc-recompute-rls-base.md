---
id: "TASK-1"
kind: "task"
title: "Backend data layer — schema, migrations, sync_apply RPC, recompute, RLS baseline, delete-account, pgTAP"
notion_page_id: "3cfe6070-43bc-814e-be93-d4b59625d934"
notion_url: "https://app.notion.com/p/Backend-data-layer-schema-migrations-sync_apply-RPC-recompute-RLS-baseline-delete-account-pg-3cfe607043bc814ebe93d4b59625d934"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-03T02:47:00.000Z"
status: "Review"
---

# Backend data layer — schema, migrations, sync_apply RPC, recompute, RLS baseline, delete-account, pgTAP

## Scope

supabase/config.toml; supabase/seed.sql; supabase/migrations/20260902090001_init_helpers.sql; 20260902090002_schema.sql; 20260902090003_recompute.sql; 20260902090004_sync_apply.sql; 20260902090005_rls.sql; supabase/functions/delete-account/index.ts (skeleton); supabase/tests/01_rls_isolation_test.sql; 02_sync_apply_test.sql; 03_recompute_test.sql; docs/engineering/backend-data-implementation.md.

## Priority

Critical

## Executor

Claude Code

## Definition of Done

Schema, 6 migrations, sync_apply RPC, recompute + triggers, RLS baseline, delete-account, pgTAP suites. LOCALLY EXECUTED & GREEN 2026-09-02 (platform-release + WORK-022): supabase db reset x2, db lint clean, supabase test db PASS 68/68 on Postgres 15.8. WORK-022 fixed F-7/F-9 in migration 0003 (this task's territory) + F-2/F-8 sync_apply contract. Outstanding before Done: hosted DEP-1 execution against the real Supabase role model + CI gate; formal recompute golden-vector cross-run vs the client TS impl (TASK-5).

## Verification

Partial
