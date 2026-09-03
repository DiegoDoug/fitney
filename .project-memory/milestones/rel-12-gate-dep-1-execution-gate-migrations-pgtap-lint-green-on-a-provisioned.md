---
id: "REL-12"
kind: "milestone"
title: "Gate — DEP-1 execution gate (migrations + pgTAP + lint green on a provisioned Supabase project)"
notion_page_id: "3cfe6070-43bc-815f-bae6-e43b9d5ad429"
notion_url: "https://app.notion.com/p/Gate-DEP-1-execution-gate-migrations-pgTAP-lint-green-on-a-provisioned-Supabase-project-3cfe607043bc815fbae6e43b9d5ad429"
created: "2026-09-02T20:16:00.000Z"
last_edited: "2026-09-03T04:27:00.000Z"
status: "Ready for Review"
---

# Gate — DEP-1 execution gate (migrations + pgTAP + lint green on a provisioned Supabase project)

## Objective

Execute supabase db reset (migrations 20260902090001–06 + seed) + supabase test db (pgTAP suites 01–04) + supabase db lint green on the provisioned DEP-1 project, and wire them as a CI merge gate.

## Type

Gate

## Exit Criteria

All four pgTAP suites pass; db reset applies the full migration chain cleanly; db lint clean; CI merge gate live. MET 2026-09-03 (local + CI + hosted-dev). LOCAL: db reset x2 + db lint clean (warning+error) + supabase test db PASS 68/68. CI: .github/workflows/db-verify.yml green on main (supabase db start -> db reset --local -> db lint --local --fail-on error -> supabase test db). HOSTED (fitney-dev, PG17): db push + db reset --linked applied 0001–0006 + seed clean; db lint --linked clean; Supabase security advisor clean bar 1 intentional INFO; 31 behavioural checks on real roles = 31/0. Residual: enable branch protection on main requiring the db-verify check (human, GitHub UI); the pgTAP suites themselves can't run via supabase test db --linked (restricted test role cannot write auth.users) — covered by local + CI. This gate no longer blocks client-engineering on execution evidence; the remaining gate is human approval of phases 7 & 8.
