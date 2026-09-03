---
id: "ISS-6"
kind: "issue"
title: "SEC-OQ-1: data-retention / backup / PITR policy for non-deleted data is unspecified"
notion_page_id: "3cfe6070-43bc-812c-ace1-f79050e02719"
notion_url: "https://app.notion.com/p/SEC-OQ-1-data-retention-backup-PITR-policy-for-non-deleted-data-is-unspecified-3cfe607043bc812cace1f79050e02719"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T17:43:00.000Z"
status: "Decision Needed"
---

# SEC-OQ-1: data-retention / backup / PITR policy for non-deleted data is unspecified

## Summary

OQ-10 resolved deletion mechanics only. Retention for non-deleted user data, the backup window, and point-in-time-recovery are undefined. Blocks the beta privacy statement (not the MVP build).

## Type

Question

## Priority

Medium

## Evidence

docs/security/security-identity.md §5 SEC-REQ-DATA-03, §9 SEC-RESID-5; development-roadmap.md SEC-OQ-1.

## Proposed Resolution

Human direction 2026-09-02: do NOT pick retention numbers arbitrarily. Derive the policy in this order: (1) data class → (2) user-deletion behaviour (already: hard cascade, ISS re: OQ-10) → (3) primary-DB retention → (4) backup / PITR retention (bounded by the actual Supabase plan/environment guarantees) → (5) logs / telemetry retention → (6) privacy statement. First determine the infrastructure capability (provisioned in platform-release) and Fitney's data classes; then set durations. Owner: Human + production-operations. Remains OPEN pending infrastructure-capability + data-class review.
