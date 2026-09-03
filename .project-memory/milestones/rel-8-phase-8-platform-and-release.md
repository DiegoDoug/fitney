---
id: "REL-8"
kind: "milestone"
title: "Phase 8 — Platform and release"
notion_page_id: "3cfe6070-43bc-81f8-ab2a-f517edce6c5f"
notion_url: "https://app.notion.com/p/Phase-8-Platform-and-release-3cfe607043bc81f8ab2af517edce6c5f"
created: "2026-09-02T20:15:00.000Z"
last_edited: "2026-09-03T04:27:00.000Z"
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

EXECUTED + hosted-dev + CI verified 2026-09-03 (docs/platform/platform-release.md, PASS WITH CONDITIONS — AWAITING APPROVAL). Git: initialised -> github.com/DiegoDoug/fitney (private); db-verify GitHub Actions gate green on main (migrations + db lint + supabase test db 68/68). Hosted fitney-dev (Supabase, Postgres 17, MetaTrack org, $0/mo) provisioned; migrations + db lint --linked clean; Supabase security advisor clean bar 1 intentional INFO (deletion_receipts); 31 hosted behavioural checks on the real authenticated/anon/service_role roles = 31/0 (incl. service_role BYPASSRLS, composite-FK + forged-user_id rejection, F-13, ISS-27). Local supabase test db = 68/68. 15 defects surfaced across execution (F-1..F-14 + ISS-27) all fixed in place under WORK-022 (migrations were unshipped). SEC-RESID-2 resolved. Conditions: C-1 branch protection requiring db-verify still to be enabled (human, GitHub UI); C-2 PRODUCTION Supabase + hosted auth hardening + secrets + Edge Function deploy + PITR deferred (human); C-3 phases 6 & 7 approval + client-engineering unlock require human approval of phase 8 (DEC-3 — execution-evidence gate now satisfied); C-4 WORK-022 migration/test edits owned by security/backend, confirm at approval; C-5 dep pin not-latest; C-6 ISS-28 PG17 deviation (backend to ratify). ISS-27 RESOLVED.
