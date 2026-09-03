---
id: "TASK-3"
kind: "task"
title: "Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate"
notion_page_id: "3cfe6070-43bc-81e6-a979-d0f7472510ac"
notion_url: "https://app.notion.com/p/Provision-DEP-1-Supabase-project-execute-migrations-pgTAP-as-a-CI-merge-gate-3cfe607043bc81e6a979d0f7472510ac"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-03T04:27:00.000Z"
status: "Review"
---

# Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate

## Scope

Create dev + prod Supabase projects. Run supabase db reset (migrations 20260902090001–06 + seed.sql) and supabase test db (pgTAP suites 01–04) and supabase db lint. Wire all three into CI as a required merge gate.

## Priority

Critical

## Executor

Claude Code

## Definition of Done

Provision DEP-1 + execute migrations & pgTAP as a CI merge gate. DEV DONE 2026-09-03. Git initialised -> github.com/DiegoDoug/fitney (private). Hosted fitney-dev (Supabase, PG17, MetaTrack org, $0/mo) provisioned; supabase db push + db reset --linked applied 0001–0006 + seed clean; db lint --linked clean; Supabase security advisor clean bar 1 intentional INFO; 31 hosted behavioural checks 31/0. .github/workflows/db-verify.yml green on main (supabase db start -> db reset -> db lint --fail-on error -> supabase test db = 68/68). Local stack also 68/68. Remaining before Done: enable branch protection requiring the db-verify check (human, GitHub UI); production project (TASK-4).

## Verification

Pass
