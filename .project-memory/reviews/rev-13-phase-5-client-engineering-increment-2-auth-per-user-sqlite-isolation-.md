---
id: "REV-13"
kind: "review"
title: "Phase 5 — Client engineering: increment 2 (auth → per-user SQLite isolation → onboarding) — ready for review"
notion_page_id: "3d1e6070-43bc-8131-98ff-d9cea78936fe"
notion_url: "https://app.notion.com/p/Phase-5-Client-engineering-increment-2-auth-per-user-SQLite-isolation-onboarding-ready-fo-3d1e607043bc813198ffd9cea78936fe"
created: "2026-09-04T01:53:00.000Z"
last_edited: "2026-09-04T20:46:00.000Z"
status: "In Review"
---

# Phase 5 — Client engineering: increment 2 (auth → per-user SQLite isolation → onboarding) — ready for review

## Scope

Phase 5 client-engineering INCREMENT 2 (of N) on branch phase-5/auth-isolation / PR #2. NOT a phase submission — does not seek Phase 5 approval. Scope authorized by the human: authentication -> per-user SQLite isolation -> onboarding ONLY. Increment 1 merged via PR #1 (squash) 2026-09-04. Foundation exit gate still NOT met (nothing device- or hosted-verified).

## Type

Implementation

## Reviewer

Claude Code

## Review Date

2026-09-04

## Findings

DELIVERED (increment 2, all under client/): (a) Auth — services/auth.ts AuthPort seam (pure: types, error taxonomy + enumeration-safe copy SEC-REQ-AUTH-03, form validators, deep-link parser, deterministic createFakeAuth); data/remote/auth-gateway.ts = the only @supabase auth caller (boundary lint clean); features/auth/auth-flow.ts wrapper (stable {ok,code,message} results, no email/password/token in logs). Sign-up / sign-in / sign-out / password-reset / recovery-link / email-confirm. Secure session persist + restore + refresh via the existing expo-secure-store client. Explicit bootstrapping/signed-out/authenticating/onboarding/ready/recovery/error states. Authenticated userId only via the runtime boundary (no editable UI). (b) Per-user isolation — runtime/build-container.ts assembleContainer (logic-safe, injectable db+gateway) + rewritten runtime/context.tsx driver: serialized activate/retire/retire-then-activate on a promise chain, monotonic GenerationGuard (a late account-A result is inert), SyncEngine.stop(), DB handle close, account-scoped UI cleared on sign-out, crash-safe re-resolve from the persisted session. TOKEN_REFRESHED/USER_UPDATED for the same user are no-ops. (c) Onboarding — m0002 local-only profiles.onboarding_completed_at marker (never synced); OnboardingService creates/hydrates the profile through the EXISTING outbox -> sync_apply contract (no server signup trigger; client owns first-write under RLS); idempotent completion, resumable partial, multi-device hydrate detect; ONLY the SPEC AUTH-03 fields. (d) Screens — app/(auth)/{welcome,sign-in,sign-up,forgot-password,reset-password,onboarding} + app/settings + rewritten app/_layout phase-routing & deep-link; form primitives in components/ui. PREFLIGHT: PR #1 confirmed merged; expo-doctor findings remediated via expo install (added react-native-worklets@0.5.1; react-native 0.81.4->0.81.5 — SDK 54, not an upgrade) -> doctor 18/18, expo install --check clean. VERIFICATION (from client/): full-app tsc PASS, logic tsc PASS, depcruise src app 0 errors (1 pre-existing no-orphans warn), jest 98/98 across 15 suites (40 prior + 58 new). ALL mocked-logic + real-local-SQLite (better-sqlite3 driver, FakeGateway, createFakeAuth) — NOT the Expo SQLite runtime, NOT real Supabase/GoTrue, NOT a device. New tests cover: session restore, sign-in/out/recovery transitions, A->B / A->B->A isolation (rows/outbox/cursors/conflicts/cached UI), a delayed account-A response after switching to B, repeated/overlapping auth events, offline relaunch for a previously authenticated user, unsynced-change handling at sign-out, interrupted & repeated onboarding, m0002 fresh + upgrade.

## Conditions

LIFECYCLE: Phase 5 = IN PROGRESS; increment 2 remains IN REVIEW at the phase-approval level even though its PR is merged — DO NOT approve the phase. Phases 9/10/11 remain LOCKED. Foundation exit gate NOT MET. DEC-53 RECONCILIATION (2026-09-04): the three routed items previously listed here as 'proposed, not approved' are now HUMAN-APPROVED for BOUNDED implementation via Notion Decisions DEC-53 (Approved, Human) — implemented on branch phase-5/auth-isolation: CE-R5 v2, CE-R6, CE-R7. DEC-53 is NOT Phase 5 acceptance and NOT merge authorization. DEC-54 RECONCILIATION (2026-09-04): separate human authorization merged PR #2 (squash -> commit fd0af9483d95f003702519ebd03555e96ee21739 on main, head re-verified as 69dbba0eaab8dc95e221daee0ec4adcb293193d4 with all 3 required checks SUCCESS before merge) and authorized increment-3 verification -- also NOT Phase 5 acceptance. Increment 3 delivered: retained-account discovery/removal finished (restart-safe via expo-file-system directory listing, multi-account via retainedAccounts:string[] + pure reducers); WORK-020 hosted client/server cross-run CONFIRMED (byte-for-byte via the real sync_apply RPC against fitney-dev); WORK-013 hosted subset CONFIRMED (dedupe, optimistic-concurrency conflict, cross-tenant denial through sync_apply itself, tombstone+reactive-recompute, unknown-entity reject, idempotency) -- concurrent-writers/clock-skew/kill-mid-push/successor/late-commit-reconciliation still FakeGateway-only, not hosted; a REAL hosted-auth gap found empirically (effective minimum_password_length=6 vs config.toml's declared SEC-C2 intent of 8+complexity, which is never pushed to hosted auth settings by db push/db reset --linked) -- routed to security-identity/platform-release; Management API auth-config endpoint STILL BLOCKED (no MCP tool, no personal access token available, empty/INFO-only advisor list explicitly NOT treated as verification -- precise dashboard steps given to the human instead); WORK-007 and WORK-010 CONFIRMED hardware/access-BLOCKED in this environment (no adb/emulator/xcrun; app.json's platform restriction to ios/android was correctly NOT changed to work around this). The review-history sections in this page's body are PRESERVED as the trail; where they say 'proposed / not approved / pending' for CE-R5 v2 / CE-R6 / CE-R7, DEC-53 supersedes for the bounded scope only, and DEC-54 supersedes the 'PR #2 not merged' statements for the merge itself only. See docs/engineering/client-implementation.md SS14.16 and docs/engineering/evidence/10-11 for the full increment-3 record. STILL OPEN (Foundation): no Expo runtime / device evidence (L-2d, WORK-007); better-sqlite3 != Expo SQLite close/reopen (L-2e / WORK-010); PASSWORD_RECOVERY deep-link end-to-end (L-2h); rendered jest-expo component/a11y tests (L-2j); the SignOutController<->settings.tsx wiring + sheet rendering (WORK-007); hosted password-complexity/confirmation-default/redirect-allow-list enforcement (rate-limited before observable). SEC-RESID-1 unchanged (delete-account UI out of scope). CE-R1 / CE-R2 carried, NOT resolved here; CE-R1 + ISS-28 owner ratification preserved. Owned decisions to formalise: CE-DEC-01..14. NEXT STEP: a human with a physical iOS/Android device (or macOS/Android-Studio access) for WORK-007/WORK-010; a human with fitney-dev dashboard access for the remaining hosted-auth settings; then assess the Foundation exit gate.

## GitHub Ref

https://github.com/DiegoDoug/fitney/pull/2
