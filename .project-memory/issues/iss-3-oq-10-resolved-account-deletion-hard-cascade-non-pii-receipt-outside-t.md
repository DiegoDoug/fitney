---
id: "ISS-3"
kind: "issue"
title: "OQ-10 resolved: account deletion = hard cascade + non-PII receipt outside the user graph"
notion_page_id: "3cfe6070-43bc-81fa-8717-e4a139e5cfa1"
notion_url: "https://app.notion.com/p/OQ-10-resolved-account-deletion-hard-cascade-non-PII-receipt-outside-the-user-graph-3cfe607043bc81fa8717e4a139e5cfa1"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T17:34:00.000Z"
status: "Resolved"
---

# OQ-10 resolved: account deletion = hard cascade + non-PII receipt outside the user graph

## Summary

Open question: does completed-account deletion cascade-delete or anonymise user data, and what is retained?

## Type

Question

## Priority

Medium

## Evidence

Human decision 2026-09-02 (recorded in development-roadmap.md review log, phase-6 approval): ‘Hard cascade deletion for MVP; retain only a non-PII deletion receipt outside the deleted user graph.’ Implemented in supabase/migrations/20260902090006_security_hardening.sql (ON DELETE CASCADE FKs to auth.users on personal_records / weekly_aggregates / exercise_weekly_rollups / processed_operations; deletion_receipts table = keyed HMAC of the user id + app version + timestamps, FORCE RLS + no policies → service-role only) and supabase/functions/delete-account/index.ts (rewritten).

## Proposed Resolution

RESOLVED — hard cascade for MVP; the only retained artifact is a non-PII receipt. NOTE: the retention period / backup / PITR policy for NON-deleted data is a separate open item (see the ‘SEC-OQ-1’ issue).
