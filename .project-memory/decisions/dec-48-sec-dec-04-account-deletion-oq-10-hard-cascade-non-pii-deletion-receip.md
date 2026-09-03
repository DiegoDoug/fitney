---
id: "DEC-48"
kind: "decision"
title: "SEC-DEC-04 — Account deletion (OQ-10) = hard cascade + non-PII deletion_receipts outside the user graph"
notion_page_id: "3cfe6070-43bc-8151-b907-dd76294c15f8"
notion_url: "https://app.notion.com/p/SEC-DEC-04-Account-deletion-OQ-10-hard-cascade-non-PII-deletion_receipts-outside-the-user-gr-3cfe607043bc8151b907dd76294c15f8"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# SEC-DEC-04 — Account deletion (OQ-10) = hard cascade + non-PII deletion_receipts outside the user graph

## Summary

Account deletion (OQ-10): hard cascade — user_id → auth.users(id) ON DELETE CASCADE added to personal_records/weekly_aggregates/exercise_weekly_rollups/processed_operations so deleting the auth user removes the whole graph. Retain only deletion_receipts (keyed HMAC of the user id + app version + timestamps; FORCE RLS, no policies → service_role-only) OUTSIDE the user graph. delete-account rewritten: re-auth = iat + last_sign_in_at within 300 s; receipt written before the destructive call.

## Area

Security

## Rationale

Owner: security-identity (phase 7). Resolves OQ-10 (human 2026-09-02), gate 7; fixes SEC-F-3/6. Evidence: docs/security/security-identity.md §5 SEC-REQ-DATA-01/02, §6 SEC-F-3/6; supabase/migrations/20260902090006 S-3 + deletion_receipts; supabase/functions/delete-account/index.ts.

## Consequences

Finalises BD-DEC-05. The 300 s re-auth heuristic is development-only per governing decision D / SEC-RESID-1 (ISS-4) — server-verifiable re-auth required before beta. Non-deleted-data retention still open = SEC-OQ-1 (ISS-6). Authored, not executed. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
