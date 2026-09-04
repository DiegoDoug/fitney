---
id: "REV-12"
kind: "review"
title: "Phase 5 — Client engineering: increment 1 (Foundation + logic layers) — in review, revisions requested"
notion_page_id: "3d0e6070-43bc-8180-94c6-fd44a82b8f78"
notion_url: "https://app.notion.com/p/Phase-5-Client-engineering-increment-1-Foundation-logic-layers-in-review-revisions-request-3d0e607043bc818094c6fd44a82b8f78"
created: "2026-09-03T17:02:00.000Z"
last_edited: "2026-09-03T23:48:00.000Z"
status: "In Review"
---

# Phase 5 — Client engineering: increment 1 (Foundation + logic layers) — in review, revisions requested

## Scope

Phase 5 client-engineering INCREMENT 1 (of N) on branch phase-5/client-foundation / PR #1. NOT a phase submission — does not seek Phase 5 approval. Foundation exit gate NOT met (auth, onboarding, per-user SQLite isolation unfinished; nothing device- or hosted-verified). Execution authorized by the human 2026-09-03.

## Type

Implementation

## Reviewer

Claude Code

## Review Date

2026-09-03

## Findings

Human assessment 2026-09-03: increment 1 shows progress on the logic layers but is NOT a completed Phase 5. Three distinctions: (a) logic-only tsc + 40 tests prove the TESTED LOGIC passes — the FULL APPLICATION had not passed typechecking; (b) better-sqlite3 tests = SQL behaviour under the test driver, NOT Expo SQLite runtime guarantees (WORK-010); (c) contract-fake sync tests = modelled protocol behaviour, NOT real client<->Supabase integration (WORK-013). Foundation exit gate unmet while auth / onboarding / per-user DB isolation are unfinished. WORK-020 has matching-vector + RFC-UUID evidence only — a reproducible client/server cross-run incl. actual derived-row IDs is still required (DEC-52). DELIVERED (increment 1): layered structure + boundary-lint CI gate; expo-sqlite driver seam + forward-only migrations mirroring the server schema; repository interfaces + local impls (atomic row + outbox); the sync-engine state machine (durable dispatched, operation_id exactly-once, successor-aware ack, hybrid pull + late-commit reconciliation, parked completed-session conflicts); secure token-storage + typed gateway seams; client UUID service; parameterised SQLite; offline-logging feature logic. PR #1 HARDENING PASS (done 2026-09-03 per this review): full Expo SDK 54 install (client/.npmrc legacy-peer-deps=true; package-lock.json committed); tsc -p tsconfig.json over the WHOLE app now PASSES (3 errors fixed — a ViewProps.role prop collision on AppSurface; a readonly fontVariant tuple); client-verify.yml split into full-app-typecheck (npm ci + tsc tsconfig.json + tsc tsconfig.logic.json + depcruise) + logic-tests; the full-app typecheck now blocks the PR. Re-verified: logic tsc PASS, depcruise PASS (0 err), jest 40/40. Preflight (unchanged): repo public; 'Protect Main' ruleset active + enforced (TASK-7 satisfied); exposure audit clean. No later lifecycle phase started; planning/progress/library expansion + phases 9-11 on hold.

## Conditions

LIFECYCLE: Phase 5 = IN PROGRESS; increment 1 awaiting review — DO NOT approve the phase. Remaining Foundation work (not accept-or-defer): CE-C1 device verification (WORK-007, runnable build). CE-C2 real client<->Supabase sync conformance (WORK-013, DEP-1 client-linked). CE-C2a WORK-020 reproducible hosted-dev cross-run on actual derived-row IDs (DEC-52). CE-C3 Expo SQLite transaction/WAL/prepared-statement runtime guarantees (WORK-010). CE-C4 increment 2 = authentication -> per-user SQLite isolation -> onboarding; carries SEC-RESID-1 (server-verifiable delete-account re-auth before beta). CE-C5 routed: CE-R1 db-verify.yml pull_request trigger widened to all PRs so the required check reports on client-only PRs (sensible; -> platform-release to ratify, workflow owner); CE-R2 ISS-28 / BD-DEC-01 PostgreSQL 17 ratification (-> backend-data-engineering). CE-C6 full-app typecheck CI gate = DONE this pass; jest-expo component/screen + device tests remain (increments 3-4). NEXT INCREMENT ORDER (human): authentication -> per-user SQLite -> real Expo runtime -> hosted-dev sync verification -> device-test the offline logging flow; then assess the Foundation gate. Decisions still to formalise in the Decisions DB: CE-DEC-01..08.

## GitHub Ref

https://github.com/DiegoDoug/fitney/pull/1
