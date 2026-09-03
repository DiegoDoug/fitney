---
notion_page_id: "3cfe6070-43bc-8046-b281-eb56b92335af"
notion_url: "https://app.notion.com/p/Fitney-3cfe607043bc8046b281eb56b92335af"
last_edited: "2026-09-03T04:29:00.000Z"
---

# Fitney

Fitney (working title “Weight”) is an Expo / React Native offline-first workout planner and tracker for iOS and Android. Notion Shared Project Memory is the sole canonical governance source; development-roadmap.md and docs/ are working/reference material, and .project-memory/ is generated. Stack: React Native + Expo Router + strict TypeScript, expo-sqlite local-first with a transactional outbox, and Supabase Auth/Postgres/RLS with a sync_apply optimistic-concurrency RPC. Phases 1–4 are approved; phase 6 is approved with conditions; phase 7 is held pending executed verification; phase 8 platform-release is ACTIVE by explicit human authorization on 2026-09-02; phases 5 and 9–11 remain locked/not started. DEP-1 is not yet verified and Client Engineering remains locked.

## Status

In progress

## Stage

Build

## Current Focus

Phase 8 (platform-release) AWAITING APPROVAL — execution-evidence gate now SATISFIED. Human 2026-09-03: 'APPROVED - dev-only gate'; ISS-27 resolved to authenticated-only catalogue; git + one hosted fitney-dev project authorised; production deferred; WORK-020 -> phase 5 acceptance condition. Done this pass: git initialised -> github.com/DiegoDoug/fitney (private); db-verify GitHub Actions gate GREEN on main (68/68); hosted fitney-dev (Supabase, Postgres 17, MetaTrack org, $0/mo) provisioned + migrations applied + db lint --linked clean + Supabase security advisor clean (bar 1 intentional INFO) + 31 hosted behavioural checks 31/0 on the real authenticated/anon/service_role roles. 15 defects surfaced across phase-8 execution (F-1..F-14 + ISS-27) all fixed in place under WORK-022 while migrations were unshipped. Local supabase test db = 68/68. NEXT: human approval of phase 8 (and phase 7) -> then client-engineering unlocks. Deferred human steps: production Supabase project, hosted auth hardening (SEC-C2), supabase secrets set + Edge Function deploy, branch protection requiring db-verify. Open: ISS-28 (PG17 vs BD-DEC-01 PG15 — backend to ratify).

## Repository

https://github.com/DiegoDoug/fitney
