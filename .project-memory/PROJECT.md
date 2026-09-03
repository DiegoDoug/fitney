---
notion_page_id: "3cfe6070-43bc-8046-b281-eb56b92335af"
notion_url: "https://app.notion.com/p/Fitney-3cfe607043bc8046b281eb56b92335af"
last_edited: "2026-09-03T02:49:00.000Z"
---

# Fitney

Fitney (working title “Weight”) is an Expo / React Native offline-first workout planner and tracker for iOS and Android. Notion Shared Project Memory is the sole canonical governance source; development-roadmap.md and docs/ are working/reference material, and .project-memory/ is generated. Stack: React Native + Expo Router + strict TypeScript, expo-sqlite local-first with a transactional outbox, and Supabase Auth/Postgres/RLS with a sync_apply optimistic-concurrency RPC. Phases 1–4 are approved; phase 6 is approved with conditions; phase 7 is held pending executed verification; phase 8 platform-release is ACTIVE by explicit human authorization on 2026-09-02; phases 5 and 9–11 remain locked/not started. DEP-1 is not yet verified and Client Engineering remains locked.

## Status

In progress

## Stage

Build

## Current Focus

Phase 8 (platform-release) AWAITING APPROVAL. WORK-022 lifecycle recovery COMPLETE 2026-09-02: first local execution of the authored data/security layer (local Supabase, Postgres 15.8) surfaced 12 defects (F-1..F-12; F-5 & F-9 High — both broke the recompute path at runtime; inspection had missed all of them). Human-authorised narrow recovery across security-identity (migration 0006: F-2/F-5/F-8/F-11) + backend-data-engineering (migration 0003: F-7/F-9) + pgTAP suites (F-1/F-3/F-4/F-6/F-10/F-12) fixed everything in place (migrations unshipped). Re-verified: supabase db reset x2 clean, supabase db lint clean (warning + error), supabase test db = PASS 68/68, runtime probes green. SEC-RESID-2 resolved; db-verify CI gate added. NEXT: (1) human authorises hosted DEP-1 (dev + prod Supabase projects) + git init/GitHub repo; (2) platform-release re-runs db reset/test db/db lint on the hosted project against the real role model + wires the CI gate green; (3) client-TS <-> server recompute golden-vector cross-run (WORK-020); (4) ISS-27 decision (anon read of seed catalogue). Phases 6 & 7 stay NOT approved (DEC-3: zero hosted-executed tests); client-engineering stays LOCKED.

## Repository

—
