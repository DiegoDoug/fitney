---
id: "TASK-2"
kind: "task"
title: "Security hardening — child→parent ownership FKs, definer recompute, sync_apply hardening, deletion cascade + non-PII receipt, adversarial suite"
notion_page_id: "3cfe6070-43bc-81f4-bde4-f5b94342ca9a"
notion_url: "https://app.notion.com/p/Security-hardening-child-parent-ownership-FKs-definer-recompute-sync_apply-hardening-deletion-c-3cfe607043bc81f4bde4f5b94342ca9a"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-03T02:47:00.000Z"
status: "Review"
---

# Security hardening — child→parent ownership FKs, definer recompute, sync_apply hardening, deletion cascade + non-PII receipt, adversarial suite

## Scope

supabase/migrations/20260902090006_security_hardening.sql; supabase/tests/04_security_adversarial_test.sql; supabase/functions/delete-account/index.ts (rewrite — hard cascade, re-auth, HMAC receipt); docs/security/security-identity.md. Ownership of 20260902090005_rls.sql moved to security-identity.

## Priority

Critical

## Executor

Claude Code

## Definition of Done

RLS + composite FKs + definer recompute + hardened sync_apply + deletion cascade + non-PII receipt + adversarial suite. LOCALLY EXECUTED & GREEN 2026-09-02 (WORK-022): migration 0006 fixes F-2 (not_null -> structured reject), F-5 (_week_start_for smallint), F-8 (dedupe -> duplicate), F-11 (revoke sync_apply from anon); supabase test db = PASS 68/68; adversarial suite tests/04 = 24/24 (cross-account isolation, forged user_id, cross-tenant parent, composite-FK rejection, seed model, derived-write revoke, processed_operations scope, anon cannot call sync_apply, null-sub JWT, deletion_receipts invisible). Outstanding before Done: hosted re-run (real service_role BYPASSRLS + GoTrue), CI gate green, ISS-27 decision.

## Verification

Partial
