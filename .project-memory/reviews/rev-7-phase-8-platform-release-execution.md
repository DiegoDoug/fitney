---
id: "REV-7"
kind: "review"
title: "Phase 8 — Platform & Release execution"
notion_page_id: "3cfe6070-43bc-81cd-a32e-ebe4c96e0b93"
notion_url: "https://app.notion.com/p/Phase-8-Platform-Release-execution-3cfe607043bc81cda32eebe4c96e0b93"
created: "2026-09-02T23:40:00.000Z"
last_edited: "2026-09-03T02:48:00.000Z"
status: "Pass with Conditions"
---

# Phase 8 — Platform & Release execution

## Scope

docs/platform/platform-release.md + docs/platform/evidence/ + .github/workflows/db-verify.yml + supabase/config.toml + supabase/functions/delete-account/{deno.json,deno.lock} + .env.example. Provisioning and validation of DEP-1 (local); execution of the authored data/security layer.

## Type

Release

## Reviewer

Claude Code

## Review Date

2026-09-02

## Findings

Local Supabase environment provisioned on the target Postgres 15.8 (Supabase CLI 2.67.1, Docker). First-ever execution of the authored data/security layer surfaced 12 defects that inspection-only review missed: F-5 (High — _week_start_for(date,integer) does not exist; every completed-session recompute throws), F-9 (High — uuid-ossp unresolvable under the pinned search_path; recompute throws), F-2/F-8/F-11 (Medium — sync_apply NOT NULL leak / wrong dedupe status / anon EXECUTE), F-1/F-3/F-4/F-6/F-7/F-10/F-12 (Low — test-harness / assertion / plan / lint). WORK-022 (human-authorised, narrowly scoped across security-identity + backend-data-engineering) fixed all 12 in place (migrations confirmed unshipped). Re-verified 2026-09-02: supabase db reset x2 clean & repeatable; supabase db lint = No schema errors found (warning + error); supabase test db = Result: PASS — 68/68, every suite reaches finish() with an exact plan (19/17/8/24); runtime probes: completed-session recompute runs & is idempotent, _week_start_for correct for week_start 0-6, sync_apply full->applied / replay->duplicate / partial->rejected (no row, no raw exception) / anon->permission denied. Cross-account isolation, forged-user_id / cross-tenant-parent rejection, derived-table write revocation, seed immutability-to-clients, null-sub JWT, and deletion_receipts invisibility all hold on the real Postgres role model. SEC-RESID-2 resolved (deno.json + deno.lock pin). db-verify CI gate added. No secret in source / logs / evidence / Notion. Still [U]: the hosted role model (service_role BYPASSRLS, GoTrue) and hosted auth hardening.

## Conditions

C-1: no git repository — CI cannot run and branch protection cannot be configured; needs human git init + GitHub repo. C-2: hosted DEP-1 (dev + prod Supabase projects) is a human decision (pick org, authorize creation); all hosted provisioning, hosted auth hardening, secret provisioning, Edge Function deploy, and PITR/retention config are deferred to it. C-3 (UPDATED 2026-09-02 post WORK-022): supabase test db now PASSES 68/68 LOCALLY (after WORK-022 fixed the 12 defects F-1..F-12), plus db reset x2 and db lint clean at warning + error. BUT this is on postgres-as-owner, not the real hosted role model — phases 6 & 7 stay NOT approved (DEC-3: zero hosted-executed tests); the suites must re-run green on a provisioned Supabase project AND the db-verify CI gate must be green before client-engineering unlocks. C-4: the F-1 perform->select correction and the F-3/F-4/F-6/F-10/F-12 + payload edits were made under WORK-022; security-identity / backend-data-engineering own those files and confirm at approval. C-5: Edge Function pinned to 2.112.4 (not latest 2.114.0) pending Deno supply-chain min-age. C-6 (NEW): ISS-27 — whether the anon key should expose the global seed-exercise catalogue (currently permitted per SEC-DEC-05); non-blocking, decide before beta. Recommended next human action: authorize DEP-1 + run git init/create repo; then the hosted re-run discharges the phase-6/7 verification gate.
