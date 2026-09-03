---
id: "REV-2"
kind: "review"
title: "Phase 7 — Security & Identity review"
notion_page_id: "3cfe6070-43bc-8160-ba4d-dfffd2e301bc"
notion_url: "https://app.notion.com/p/Phase-7-Security-Identity-review-3cfe607043bc8160ba4ddfffd2e301bc"
created: "2026-09-02T17:33:00.000Z"
last_edited: "2026-09-03T04:51:00.000Z"
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

Original security findings were remediated. WORK-022 then fixed execution findings F-1…F-14, including hosted advisor findings that exposed internal RPC-executable functions and mutable search paths. ISS-27 narrowed catalogue reads to authenticated users. Verification: local pgTAP 68/68, CI db-verify green, hosted fitney-dev 31/31 behavioral checks; security advisor clean except one intentional deletion_receipts informational item.

## Conditions

SEC-C1 / DEC-3 DISCHARGED 2026-09-03: local 68/68, CI green, hosted fitney-dev 31/31 on authenticated/anon/service_role. Human approved Phase 7 with conditions. Remaining before beta/production: strengthen deletion re-auth; decide retention/PITR; configure production auth hardening and secrets; deploy and verify delete-account; perform planned external security validation. ISS-28 PostgreSQL 17 ratification remains open and non-blocking for Client Engineering.

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
