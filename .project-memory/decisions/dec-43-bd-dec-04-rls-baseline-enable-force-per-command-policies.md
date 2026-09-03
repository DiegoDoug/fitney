---
id: "DEC-43"
kind: "decision"
title: "BD-DEC-04 — RLS baseline (enable + force, per-command policies)"
notion_page_id: "3cfe6070-43bc-8117-98f4-c4cbd537611e"
notion_url: "https://app.notion.com/p/BD-DEC-04-RLS-baseline-enable-force-per-command-policies-3cfe607043bc811798f4c4cbd537611e"
created: "2026-09-02T20:07:00.000Z"
last_edited: "2026-09-02T20:07:00.000Z"
status: "Superseded"
---

# BD-DEC-04 — RLS baseline (enable + force, per-command policies)

## Summary

RLS baseline: enable + force RLS on every table; per-command policies (user_id = auth.uid(); exercises special-cases global seed rows; profiles keys on id); derived tables read-only to clients; processed_operations append-only owner-scoped.

## Area

Data

## Rationale

Owner: backend-data-engineering (baseline) → security-identity (final). Evidence: supabase/migrations/20260902090005_rls.sql.

## Consequences

SUPERSEDED / owned by SEC-DEC-01…SEC-DEC-05 (per development-roadmap.md). security-identity owns migrations 20260902090005 + 20260902090006 and any later policy/ownership-FK/definer/sync_apply change. The baseline itself is retained for traceability.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
