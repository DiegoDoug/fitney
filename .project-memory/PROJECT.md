---
notion_page_id: "3cfe6070-43bc-8046-b281-eb56b92335af"
notion_url: "https://app.notion.com/p/Fitney-3cfe607043bc8046b281eb56b92335af"
last_edited: "2026-09-03T15:00:00.000Z"
---

# Fitney

Fitney (working title “Weight”) is an Expo / React Native offline-first workout planner and tracker for iOS and Android. Notion Shared Project Memory is the sole canonical governance source; development-roadmap.md and docs/ are working/reference material, and .project-memory/ is generated. Stack: React Native + Expo Router + strict TypeScript, expo-sqlite local-first with a transactional outbox, and Supabase Auth/Postgres/RLS with a sync_apply optimistic-concurrency RPC. Phases 1–4 are approved; phase 6 is approved with conditions; phase 7 is held pending executed verification; phase 8 platform-release is ACTIVE by explicit human authorization on 2026-09-02; phases 5 and 9–11 remain locked/not started. DEP-1 is not yet verified and Client Engineering remains locked.

## Status

In progress

## Stage

Build

## Current Focus

Phase 5 Client Engineering is UNLOCKED but NOT STARTED after human approval of the dev-only gate on 2026-09-03. Phases 6, 7, and 8 are Approved with Conditions; DEP-1 development gate and WORK-022 are complete. Next recommended action: resolve non-blocking ISS-28 by ratifying PostgreSQL 17, enable main branch protection requiring db-verify, then explicitly authorize Phase 5 and build the offline logging vertical slice. WORK-020 is a Phase 5 acceptance condition. Production Supabase and phases 9–11 remain deferred/locked.

## Repository

https://github.com/DiegoDoug/fitney
