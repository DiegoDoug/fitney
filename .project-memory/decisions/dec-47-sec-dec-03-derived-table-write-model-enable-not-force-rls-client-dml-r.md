---
id: "DEC-47"
kind: "decision"
title: "SEC-DEC-03 — Derived-table write model: ENABLE (not FORCE) RLS, client DML revoked, definer recompute, hardened sync_apply"
notion_page_id: "3cfe6070-43bc-8123-b80e-e5de105991ca"
notion_url: "https://app.notion.com/p/SEC-DEC-03-Derived-table-write-model-ENABLE-not-FORCE-RLS-client-DML-revoked-definer-recomput-3cfe607043bc8123b80ee5de105991ca"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# SEC-DEC-03 — Derived-table write model: ENABLE (not FORCE) RLS, client DML revoked, definer recompute, hardened sync_apply

## Summary

Derived-table write model (resolves BD-OQ-2 / gate 3): derived tables ENABLE (not FORCE) RLS for owner-scoped reads, all client DML revoked; recompute_* + recompute triggers are SECURITY DEFINER (owner bypasses non-FORCE RLS) with fixed search_path = pg_catalog, public, REVOKE ALL … FROM public, no authenticated execute grant (trigger-only). sync_apply hardened: fixed search_path, per-entity ownership column forced to caller, owner_user_id stripped, FK/constraint errors normalised to a generic {status:"rejected"}.

## Area

Security

## Rationale

Owner: security-identity (phase 7). Resolves BD-OQ-2, gates 3+5; fixes SEC-F-2/4/5. Evidence: docs/security/security-identity.md §5 SEC-REQ-AZ-04/05/07, §6 SEC-F-2/4/5; supabase/migrations/20260902090006 S-2/S-8.

## Consequences

Resolves BD-OQ-2. Extends BD-DEC-02/03. Authored, not executed. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
