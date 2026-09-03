---
id: "DEC-41"
kind: "decision"
title: "BD-DEC-02 — sync_apply(...) RPC is the single push entry point (SECURITY INVOKER)"
notion_page_id: "3cfe6070-43bc-81a4-a0b2-d2be8a3d1e42"
notion_url: "https://app.notion.com/p/BD-DEC-02-sync_apply-RPC-is-the-single-push-entry-point-SECURITY-INVOKER-3cfe607043bc81a4a0b2d2be8a3d1e42"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# BD-DEC-02 — sync_apply(...) RPC is the single push entry point (SECURITY INVOKER)

## Summary

sync_apply(operation_id, entity, entity_id, op, payload, base_version) → jsonb RPC (SECURITY INVOKER) is the single push entry point: operation_id dedupe via processed_operations (records only applied/duplicate; conflict not recorded so a retry re-evaluates); insert-if-absent → v1; update/tombstone only if base_version = version; mismatch → {status:conflict, version, row} with nothing written. RLS scoping makes cross-account entity_id behave as a rejected insert. AR-OQ-6 resolved toward the RPC; conditional-PATCH remains a valid alternative (trigger owns the bump).

## Area

Data

## Rationale

Owner: backend-data-engineering (phase 6). Implements AR-DEC-03, §8.4 invariant. Resolves AR-OQ-6. Evidence: docs/engineering/backend-data-implementation.md §6.1; supabase/migrations/20260902090004_sync_apply.sql.

## Consequences

Later hardened by SEC-DEC-03 (fixed search_path, per-entity ownership column forced to caller, generic rejection). Authored, not executed. No supersession (extended by SEC-DEC-03).

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
