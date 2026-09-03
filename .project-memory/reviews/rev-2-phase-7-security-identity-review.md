---
id: "REV-2"
kind: "review"
title: "Phase 7 — Security & Identity review"
notion_page_id: "3cfe6070-43bc-8160-ba4d-dfffd2e301bc"
notion_url: "https://app.notion.com/p/Phase-7-Security-Identity-review-3cfe607043bc8160ba4ddfffd2e301bc"
created: "2026-09-02T17:33:00.000Z"
last_edited: "2026-09-02T22:15:00.000Z"
status: "Pass with Conditions"
---

# Phase 7 — Security & Identity review

## Scope

Threat model + RLS finalisation for the Weight/Fitney client↔Supabase system. Artifacts: supabase/migrations/20260902090006_security_hardening.sql, supabase/tests/04_security_adversarial_test.sql, rewritten supabase/functions/delete-account/index.ts, docs/security/security-identity.md. Ownership of 20260902090005_rls.sql transferred to security-identity.

## Type

Security

## Reviewer

Claude Code

## Review Date

2026-09-02

## Findings

9 findings in the phase-6 baseline, ALL remediated in 20260902090006 + the Edge Function rewrite:
• SEC-F-1 (HIGH) child→parent ownership: single-column FKs bypass RLS → a client could attach a child it owns to another user's parent / probe parent-id existence. Fix: composite (parent_id,user_id)→parent(id,user_id) FKs on 8 relationships + _check_ref_ownership trigger for soft refs.
• SEC-F-2 (MED) recompute triggers would fail under FORCE RLS on derived tables. Fix: NO FORCE + revoke client DML + SECURITY DEFINER recompute with fixed search_path.
• SEC-F-3 (MED) hard-cascade deletion left orphans: derived/ledger tables had no FK to auth.users. Fix: ON DELETE CASCADE FKs.
• SEC-F-4/5 (MED) sync_apply fragility + FK/constraint error oracle. Fix: per-entity ownership column forced, owner_user_id stripped, errors normalised to generic {status:"rejected"}.
• SEC-F-6 (MED) weak re-auth on delete-account. Fix: iat + last_sign_in_at within 300s.
• SEC-F-7 (LOW) global-seed exercises model undocumented/brittle. Fix: documented dual-tenancy + _guard_exercise_owner trigger.
• SEC-F-8 (LOW) unpinned esm.sh import → SEC-RESID-2.
• SEC-F-9 (INFO) weekly bucketing ignored week_start/session-local date → corrected (BD-OQ-1; backend to validate).
No injection / SSRF / crypto-misuse finding. Verified by inspection: RLS command coverage; tenant-isolation design; server-field forgery blocked; secrets absent from repo; deletion-cascade completeness.
Tests authored: 04_security_adversarial_test.sql (24 assertions) + 01 (20). TESTS EXECUTED: NONE.

## Conditions

SEC-C1 (inherits BD-C1): nothing executed — no DEP-1. Every RLS policy, composite FK, SECURITY DEFINER grant, sync_apply path, the Edge Function, and both adversarial suites are untested. client-engineering stays LOCKED until supabase db reset + supabase test db (suites 01–04) pass on a provisioned project.
SEC-C2: hosted auth hardening + secret provisioning + Edge Function dependency pin → platform-release; hard gates for any non-dev environment.
SEC-C3: SEC-RESID-1 nonce/server-verifiable re-auth (required BEFORE BETA per human 2026-09-02) + SEC-OQ-1 data-retention policy + external pen test — required before beta.
SEC-C4: SEC-F-9 corrected weekly bucketing implemented outside security-identity's decision ownership at human direction; backend-data-engineering must validate vs golden vectors.
SEC-C5: exercises dual-tenancy deviation accepted.

HUMAN DISPOSITION 2026-09-02: Phase 7 is NOT approved as completed. The implementation is authored + reviewed, but 0 executed tests means the verification gate is unsatisfied. Phase 7 stays 'Pass with Conditions' / unapproved until DEP-1 is provisioned and the authored security verification suite executes successfully. Next lifecycle phase = platform-release (to provision DEP-1).
