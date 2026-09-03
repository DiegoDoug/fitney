---
id: "REL-8"
kind: "milestone"
title: "Phase 8 — Platform and release"
notion_page_id: "3cfe6070-43bc-81f8-ab2a-f517edce6c5f"
notion_url: "https://app.notion.com/p/Phase-8-Platform-and-release-3cfe607043bc81f8ab2af517edce6c5f"
created: "2026-09-02T20:15:00.000Z"
last_edited: "2026-09-03T02:48:00.000Z"
status: "Ready for Review"
---

# Phase 8 — Platform and release

## Objective

Provision DEP-1 (Supabase project, local + hosted); run supabase db reset (migrations 0001–0006 + seed) + supabase test db (pgTAP 01–04) + supabase db lint; wire the CI merge gate; hosted auth hardening; secret provisioning; pin the Edge Function dependency + Deno lockfile. Skill: platform-release.

## Type

Phase

## Start

2026-09-02

## Exit Criteria

EXECUTED 2026-09-02 (docs/platform/platform-release.md, PASS WITH CONDITIONS — AWAITING APPROVAL). Local Supabase provisioned + verified on Postgres 15.8. First execution surfaced 12 defects (F-1..F-12; F-5 & F-9 High — both would break the recompute path at runtime). WORK-022 (human-authorised lifecycle recovery) fixed all 12 in place across security-identity (migration 0006: F-2/F-5/F-8/F-11) + backend-data-engineering (migration 0003: F-7/F-9) + the pgTAP suites (F-1/F-3/F-4/F-6/F-10/F-12). Re-verified: supabase db reset x2 ✅, supabase db lint clean at warning + error ✅, supabase test db = PASS 68/68 ✅ (plans 19/17/8/24), runtime probes ✅. Also delivered: SEC-RESID-2 resolved (deno.json + deno.lock, @supabase/supabase-js@2.112.4); config.toml env separation + hosted auth-hardening intent; .env.example client-safe/server-only contract; .github/workflows/db-verify.yml CI gate. NOT DONE / conditions: C-1 no git repo (CI cannot run; branch protection blocked); C-2 hosted DEP-1 = human decision (all hosted provisioning / auth hardening / secrets / Edge Function deploy / PITR deferred); C-3 the gate passes LOCALLY on postgres-as-owner — phases 6 & 7 stay NOT approved (DEC-3: 0 hosted-executed tests); must re-run green on a provisioned project + CI-gate before client-engineering; C-4 WORK-022 test edits are owned by security/backend (confirm at approval); C-5 dependency pin not-latest; C-6 ISS-27 open (anon read of seed catalogue). Return-to-phase: link + db push + hosted db reset/test/lint + functions deploy + branch protection + hosted evidence once DEP-1 + git exist.
