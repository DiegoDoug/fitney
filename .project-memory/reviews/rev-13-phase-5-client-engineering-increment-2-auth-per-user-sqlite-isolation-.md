---
id: "REV-13"
kind: "review"
title: "Phase 5 — Client engineering: increment 2 (auth → per-user SQLite isolation → onboarding) — ready for review"
notion_page_id: "3d1e6070-43bc-8131-98ff-d9cea78936fe"
notion_url: "https://app.notion.com/p/Phase-5-Client-engineering-increment-2-auth-per-user-SQLite-isolation-onboarding-ready-fo-3d1e607043bc813198ffd9cea78936fe"
created: "2026-09-04T01:53:00.000Z"
last_edited: "2026-09-04T01:53:00.000Z"
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

LIFECYCLE: Phase 5 = IN PROGRESS; increment 2 ready for review — DO NOT approve the phase. Phases 9/10/11 remain LOCKED. FOUNDATION EXIT GATE NOT MET: no hosted-GoTrue evidence (L-2c — needs fitney-dev client env + fitney://auth/callback redirect allow-list + synthetic test accounts; requested via secure setup, artifact §14.6), no Expo runtime / device evidence (L-2d), better-sqlite3 != Expo SQLite close/reopen (L-2e / WORK-010), PASSWORD_RECOVERY deep-link end-to-end unexercised (L-2h), rendered jest-expo component/a11y tests deferred to increment 3-4 (L-2j). WORK-007 / WORK-010 / WORK-013 (+ its cross-run) / WORK-020 hosted cross-run all remain OPEN. SEC-RESID-1 unchanged (delete-account UI out of scope this increment). ROUTED (proposed, not approved): CE-R5 unsynced-at-sign-out policy is INTERIM (clean -> drop the per-user file per ADR-0009; unsynced work -> retain it + non-blocking notice, never silent discard) -> security-identity + evidence-based-ui-ux to ratify and decide whether a blocking drain / explicit-discard UX is required and whether ADR-0009 should read 'drop once synced'. CE-R6: the 'Protect Main' ruleset requires ONLY db-verify — client-verify jobs full-app-typecheck + logic-tests run on every client PR but are advisory, not required; add them as required checks -> platform-release (extends CE-R1). CE-R7: RN 0.81.4->0.81.5 + react-native-worklets@0.5.1 applied via expo install (SDK 54, non-weakening) -> platform-release to ratify at the pinned-dependency review; npm audit reports 25 transitive dev-toolchain advisories (1 critical / 11 high) — pre-existing, noted for platform-release + quality-engineering. CE-R1 / CE-R2 carried from increment 1 (db-verify trigger widening; ISS-28 / BD-DEC-01 PG17) — NOT resolved here; CE-R1 and ISS-28 owner ratification preserved. OWNED DECISIONS (proposed, for the Decisions DB): CE-DEC-09 (AuthPort seam + single GoTrue impl), CE-DEC-10 (split build-container / container; src/runtime in the logic tsconfig), CE-DEC-11 (serialized transitions + GenerationGuard; refresh != teardown), CE-DEC-12 (local-only onboarding marker; onboarded = marker OR server-synced), CE-DEC-13 (interim sign-out disposition), CE-DEC-14 (expo install dep remediation). NEXT STEP: increment 3 — place fitney-dev client env + redirect config, run the hosted GoTrue smoke with synthetic accounts, the WORK-013 sync conformance suite (client-linked), and the WORK-020 client<->server cross-run; then WORK-010 (Expo SQLite runtime) and WORK-007 (device test of the offline-logging flow); then assess the Foundation exit gate. Also to formalise from increment 1: CE-DEC-01..08.

## GitHub Ref

https://github.com/DiegoDoug/fitney/pull/2
