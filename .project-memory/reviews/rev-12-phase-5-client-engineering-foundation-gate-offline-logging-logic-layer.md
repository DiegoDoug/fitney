---
id: "REV-12"
kind: "review"
title: "Phase 5 — Client engineering: Foundation gate + offline-logging logic layers"
notion_page_id: "3d0e6070-43bc-8180-94c6-fd44a82b8f78"
notion_url: "https://app.notion.com/p/Phase-5-Client-engineering-Foundation-gate-offline-logging-logic-layers-3d0e607043bc818094c6fd44a82b8f78"
created: "2026-09-03T17:02:00.000Z"
last_edited: "2026-09-03T17:02:00.000Z"
status: "Pass with Conditions"
---

# Phase 5 — Client engineering: Foundation gate + offline-logging logic layers

## Scope

Phase 5 first pass on branch phase-5/client-foundation (PR #1 to main): Foundation gate + all logic layers (domain/data/sync/repositories/services). Screens wired, not device-verified. Execution authorized by the human 2026-09-03 after Phase 5 UNLOCKED in canonical Notion (DEC-50).

## Type

Implementation

## Reviewer

Claude Code

## Review Date

2026-09-03

## Findings

CREATE. Delivered: Expo Router SDK 54 + strict TS + Expo Go; deps pinned to expo install output; light+dark tokens (VIS-DEC-03) + typography fallback (VIS-DEC-07) + app shell + five-position nav (Log = raised action, UX-DEC-01); layered dependency rule ENFORCED in CI (client/.dependency-cruiser.cjs + .github/workflows/client-verify.yml, 0 violations); expo-sqlite driver seam + forward-only migration runner mirroring the server schema (15 synced + 4 derived + 3 local-only tables; one-active partial-unique index); repository interfaces + local impls (atomic row + sync_outbox entry per mutation); full sync engine per ADR-0003 v4 (durable immutable dispatched state, operation_id exactly-once, successor-aware terminal acknowledgement, hybrid pull = composite (updated_at,id) cursor + full (id,version) reconciliation, parked completed-session conflicts); secure expo-secure-store token storage; typed Zod-validated data/remote gateway confined to one directory (no Supabase import elsewhere — lint-verified); client UUIDv7/v4 service; parameterised SQLite. WORK-020 GREEN: client TS domain/{calc,pr,week,uuid5} matches supabase/tests/03_recompute_test.sql byte-for-byte (max_load 110; e1RM 129.8333 & 116.6667 + formula epley/1; rep_pr {1:110,5:100,8:102.5}; session_volume 1430; weekly working volume 1430 bucket 2026-08-31 week_start=1; exercise weekly best_e1rm 129.8333; week_start 0-6 boundaries; round(,4) half-up; idempotency). Derived-row ids via a pure UUIDv5 matched to uuid_generate_v5 (RFC DNS test vector). VERIFICATION from client/: tsc -p tsconfig.logic.json PASS (0 errors); depcruise src app PASS (0 errors, 1 no-orphans warn on rest-timer.ts — logic tested, UI wiring deferred); jest PASS 40/40 across 9 suites (migration matrix incl. upgrade path; outbox atomicity + rollback + coalescing; one-active-session; offline create+log+edit+complete + relaunch-restore with no confirmed-set loss; idempotent finish; dispatched retry same operation_id; dispatched predecessor + pending successor; transport-failure-after-server-success -> duplicate; completed-session conflict PARKED not auto-re-issued; incremental pull + tombstone soft-delete + LATE-COMMIT reconciliation + dirty-row conflict; local/server schema-contract parity; WORK-020 golden vectors; UUIDv5 RFC vector). No supabase/ migration/function/pgTAP/config/seed file changed. Owned decisions CE-DEC-01..08. Preflight (before any client code): repo public; 'Protect Main' ruleset active + enforced (PR required, db-verify required check, strict/up-to-date, force-push + deletion blocked, no bypass) — TASK-7 satisfied; full-history + tracked-tree exposure audit clean (no service-role key/token/private key/HMAC material/populated .env; no unsafe pull_request_target). No later lifecycle phase started.

## Conditions

CE-C1 device verification — screens/nav/gestures/keyboard/VoiceOver/TalkBack/Dynamic Type/dark-mode/neumorphic/RTL authored, NOT device-verified (WORK-007, needs a runnable build). CE-C2 real-Supabase sync — engine verified vs a contract-modelling fake; full WORK-013 conformance suite against a provisioned project still required before any user-owned table is exposed (needs DEP-1 client-linked). CE-C3 expo-sqlite@~16 transaction/WAL/prepared-statement guarantees on the locked SDK unverified (WORK-010); runInTransaction uses explicit BEGIN IMMEDIATE. CE-C4 auth slice (Supabase Auth -> userId, sign-up/in/out/reset, onboarding, per-user DB) + SEC-RESID-1 (server-verifiable delete-account re-auth before beta) are the next client-engineering slice. CE-C5 routed: CE-R1 db-verify.yml pull_request trigger widened from paths:[supabase/] to all PRs so the required check reports on client-only PRs (non-weakening; -> platform-release to ratify, workflow owner); CE-R2 ISS-28 / BD-DEC-01 — Phase 5 targeted PostgreSQL 17 without editing the backend-owned decision (-> backend-data-engineering to ratify). CE-C6 full-app typecheck (routes + data/remote gateway) + jest-expo component tests wired into CI with the screen slice. Decisions to formalise in the Decisions DB on approval: CE-DEC-01 (Expo SDK 54 lock + version pins), CE-DEC-02 (Expo project root = client/), CE-DEC-03 (SQLite driver seam), CE-DEC-04 (local schema type mapping), CE-DEC-05 (Zod boundary validation, resolves AR-OQ-2), CE-DEC-06 (icon family not locked — VIS-OQ-3/WORK-008), CE-DEC-07 (client TS recompute parity locked by shared golden vectors), CE-DEC-08 (db-verify trigger widening). Roadmap/Notion follow-ups: WORK-020 -> done (client cross-run green); WORK-011 -> done (boundary lint CI gate); TASK-7 -> done (branch protection verified) + record repo is public.

## GitHub Ref

https://github.com/DiegoDoug/fitney/pull/1
