---
id: "DEC-46"
kind: "decision"
title: "SEC-DEC-02 — Child→parent ownership integrity via composite FKs + soft-ref trigger"
notion_page_id: "3cfe6070-43bc-81c0-91d4-e8b8a2404208"
notion_url: "https://app.notion.com/p/SEC-DEC-02-Child-parent-ownership-integrity-via-composite-FKs-soft-ref-trigger-3cfe607043bc81c091d4e8b8a2404208"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Approved"
---

# SEC-DEC-02 — Child→parent ownership integrity via composite FKs + soft-ref trigger

## Summary

Child→parent ownership integrity: composite (parent_id, user_id) → parent(id, user_id) FKs on the 8 structural relationships + _check_ref_ownership() trigger for soft references (exercise_id, workout_template_id, …). A child's user_id can only reference a same-owner parent; no cross-tenant parent linkage or id-existence oracle.

## Area

Security

## Rationale

Owner: security-identity (phase 7). Resolves phase-6 gate 2; fixes SEC-F-1 (High). Evidence: docs/security/security-identity.md §6 SEC-F-1; supabase/migrations/20260902090006 S-1.

## Consequences

Authored, not executed — adversarially exercised by supabase/tests/04 (unrun). No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
