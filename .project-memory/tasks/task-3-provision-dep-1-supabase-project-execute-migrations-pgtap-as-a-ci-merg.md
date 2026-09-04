---
id: "TASK-3"
kind: "task"
title: "Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate"
notion_page_id: "3cfe6070-43bc-81e6-a979-d0f7472510ac"
notion_url: "https://app.notion.com/p/Provision-DEP-1-Supabase-project-execute-migrations-pgTAP-as-a-CI-merge-gate-3cfe607043bc81e6a979d0f7472510ac"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-03T15:00:00.000Z"
status: "Done"
---

# Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate

## Scope

Development DEP-1 gate: provision fitney-dev; apply migrations; run local, CI, and hosted verification; establish the db-verify workflow. Production provisioning is explicitly deferred to its separate task.

## Priority

Critical

## Executor

Claude Code

## Definition of Done

DEV GATE DONE and human-approved 2026-09-03. Private GitHub repository created; db-verify green on main; fitney-dev provisioned; migrations/reset/lint clean; hosted security advisor reviewed; 31/31 behavioral checks passed. Branch protection is tracked as a separate human task. Production remains TASK-4.

## Verification

Pass

## Commit / PR

https://github.com/DiegoDoug/fitney/commit/26ab1a6
