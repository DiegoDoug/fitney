---
id: "REL-12"
kind: "milestone"
title: "Gate — DEP-1 execution gate (migrations + pgTAP + lint green on a provisioned Supabase project)"
notion_page_id: "3cfe6070-43bc-815f-bae6-e43b9d5ad429"
notion_url: "https://app.notion.com/p/Gate-DEP-1-execution-gate-migrations-pgTAP-lint-green-on-a-provisioned-Supabase-project-3cfe607043bc815fbae6e43b9d5ad429"
created: "2026-09-02T20:16:00.000Z"
last_edited: "2026-09-03T15:00:00.000Z"
status: "Approved"
---

# Gate — DEP-1 execution gate (migrations + pgTAP + lint green on a provisioned Supabase project)

## Objective

Execute supabase db reset (migrations 20260902090001–06 + seed) + supabase test db (pgTAP suites 01–04) + supabase db lint green on the provisioned DEP-1 project, and wire them as a CI merge gate.

## Type

Gate

## Exit Criteria

MET AND HUMAN-ACCEPTED 2026-09-03 for development. Local: reset x2, lint clean, pgTAP 68/68. CI: db-verify green on main. Hosted fitney-dev: migrations/reset/lint clean, security advisor clean except one intentional informational item, and 31/31 behavioral checks on authenticated/anon/service_role. This gate no longer blocks Phase 5. Branch protection is tracked separately as a residual platform task; production infrastructure is deferred.

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
