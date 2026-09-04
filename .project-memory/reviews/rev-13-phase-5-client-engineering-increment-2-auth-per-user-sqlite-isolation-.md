---
id: "REV-13"
kind: "review"
title: "Phase 5 — Client engineering: increment 2 (auth → per-user SQLite isolation → onboarding) — ready for review"
notion_page_id: "3d1e6070-43bc-8131-98ff-d9cea78936fe"
notion_url: "https://app.notion.com/p/Phase-5-Client-engineering-increment-2-auth-per-user-SQLite-isolation-onboarding-ready-fo-3d1e607043bc813198ffd9cea78936fe"
created: "2026-09-04T01:53:00.000Z"
last_edited: "2026-09-04T13:21:00.000Z"
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

LIFECYCLE: Phase 5 = IN PROGRESS; increment 2 remains IN REVIEW — DO NOT approve the phase; PR #2 NOT merged. Phases 9/10/11 remain LOCKED. Foundation exit gate NOT MET. DEC-53 RECONCILIATION (2026-09-04): the three routed items previously listed here as 'proposed, not approved' are now HUMAN-APPROVED for BOUNDED implementation via Notion Decisions DEC-53 (Approved, Human) — and implemented on branch phase-5/auth-isolation: CE-R5 v2 (revised sign-out policy + ADR-0009 amendment + SignOutController + regression tests + 'Remove account from this device'), CE-R6 (client-verify.yml path filter removed; ruleset 22205300 now requires db-verify + full-app-typecheck + logic-tests; verified on a non-client commit), CE-R7 (RN 0.81.5 + react-native-worklets 0.5.1 ratified; on-device confirmation stays open under WORK-010). DEC-53 is NOT Phase 5 acceptance and NOT merge authorization. The review-history sections in this page's body are PRESERVED as the trail; where they say 'proposed / not approved / pending' for CE-R5 v2 / CE-R6 / CE-R7, DEC-53 supersedes for the bounded scope only. STILL OPEN (Foundation): no hosted-GoTrue evidence (L-2c — fitney-dev client env + fitney://auth/callback allow-list + synthetic accounts); no Expo runtime / device evidence (L-2d); better-sqlite3 != Expo SQLite close/reopen (L-2e / WORK-010); PASSWORD_RECOVERY deep-link end-to-end (L-2h); rendered jest-expo component/a11y tests (L-2j); the SignOutController<->settings.tsx wiring + sheet rendering (WORK-007); effective hosted auth policy NOT inspected (MCP has no auth-config endpoint; an empty security-advisor list is NOT verification). WORK-007 / WORK-010 / WORK-013 (+ cross-run) / WORK-020 hosted cross-run all remain OPEN. SEC-RESID-1 unchanged (delete-account UI out of scope). CE-R1 / CE-R2 carried, NOT resolved here; CE-R1 + ISS-28 owner ratification preserved. Owned decisions to formalise: CE-DEC-01..14. NEXT STEP: increment 3 — fitney-dev client env + redirect config + read GET /v1/projects/{ref}/config/auth (human), then the hosted GoTrue smoke with synthetic accounts, WORK-013 conformance (client-linked), WORK-020 cross-run; then WORK-010 + WORK-007; then assess the Foundation exit gate.

## GitHub Ref

https://github.com/DiegoDoug/fitney/pull/2
