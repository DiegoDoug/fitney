---
id: "DEC-49"
kind: "decision"
title: "SEC-DEC-05 — Global-seed exercises: accepted dual-tenancy exception to user_id NOT NULL, guarded by RLS + trigger"
notion_page_id: "3cfe6070-43bc-81c6-b95b-f257f98c6f70"
notion_url: "https://app.notion.com/p/SEC-DEC-05-Global-seed-exercises-accepted-dual-tenancy-exception-to-user_id-NOT-NULL-guarded-by--3cfe607043bc81c6b95bf257f98c6f70"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# SEC-DEC-05 — Global-seed exercises: accepted dual-tenancy exception to user_id NOT NULL, guarded by RLS + trigger

## Summary

Global-seed exercises is an accepted dual-tenancy exception to the user_id NOT NULL contract: owner_user_id IS NULL = global (migrations / service_role only), = auth.uid() = private. Guarded by RLS + _guard_exercise_owner() trigger (blocks client creation of a global row and any re-parenting).

## Area

Security

## Rationale

Owner: security-identity (phase 7). Resolves gate 4; documents the deviation. Evidence: docs/security/security-identity.md §5 SEC-REQ-AZ-06, §6 SEC-F-7; supabase/migrations/20260902090006 S-4.

## Consequences

Accepted deviation (SEC-C5). Seed content itself non-shippable until OQ-4 licensing resolved. Authored, not executed. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
