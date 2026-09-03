---
id: "DEC-45"
kind: "decision"
title: "SEC-DEC-01 — Authorization boundary = RLS + SECURITY INVOKER functions + FK integrity, all server-side"
notion_page_id: "3cfe6070-43bc-8135-afcb-f9155113f128"
notion_url: "https://app.notion.com/p/SEC-DEC-01-Authorization-boundary-RLS-SECURITY-INVOKER-functions-FK-integrity-all-server-si-3cfe607043bc8135afcbf9155113f128"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# SEC-DEC-01 — Authorization boundary = RLS + SECURITY INVOKER functions + FK integrity, all server-side

## Summary

Authorization boundary = RLS + SECURITY INVOKER functions + FK integrity, all server-side; client assumed hostile. Every user-owned table: per-command policies, predicate user_id = auth.uid(). security-identity owns supabase/migrations/20260902090005 + 20260902090006; any later change to a policy / ownership FK / definer function / sync_apply routes back here.

## Area

Security

## Rationale

Owner: security-identity (phase 7). Implements ADR-0009, NFR-SEC. Evidence: docs/security/security-identity.md §3, §5; supabase/migrations/20260902090006_security_hardening.sql.

## Consequences

Supersedes ownership of BD-DEC-04. Authored, NOT executed (no DEP-1) — SEC-C1. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
