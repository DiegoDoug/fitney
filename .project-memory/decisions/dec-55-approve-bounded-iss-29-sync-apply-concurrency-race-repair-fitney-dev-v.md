---
id: "DEC-55"
kind: "decision"
title: "Approve bounded ISS-29 sync_apply concurrency-race repair + fitney-dev verification"
notion_page_id: "3d1e6070-43bc-8161-a3f7-d87d10735ef5"
notion_url: "https://app.notion.com/p/Approve-bounded-ISS-29-sync_apply-concurrency-race-repair-fitney-dev-verification-3d1e607043bc8161a3f7d87d10735ef5"
created: "2026-09-04T20:13:00.000Z"
last_edited: "2026-09-04T20:46:00.000Z"
status: "Approved"
---

# Approve bounded ISS-29 sync_apply concurrency-race repair + fitney-dev verification

## Summary

Explicit human authorization 2026-09-04: fix ISS-29 (sync_apply TOCTOU concurrency race) via a NEW forward migration, routed through backend-data-engineering and security-identity. Add a controlled two-session regression proving exactly-one-applied/exactly-one-conflict/exactly-one-version-increment, gate it in CI, apply the migration to fitney-dev ONLY after local verification, rerun hosted concurrency scenarios, complete the real 200-row page-boundary case, investigate a local Postgres harness for late-commit reconciliation, and update ISS-29 + review records with before/after evidence.

## Area

Architecture

## Rationale

ISS-29 (High) found sync_apply's UPDATE branch reads the current version via a non-locking SELECT then updates by id only, never re-checking version -- a TOCTOU race that let a second concurrent writer silently overwrite a first with no conflict raised (observed 1 of 7 hosted runs).

## Alternatives

Leave ISS-29 open / unfixed for a later phase -- rejected by explicit human instruction to fix it now, bounded and routed through the owning phases.

## Consequences

Migration must not rewrite previously applied migrations (forward-only, ADR-0006); must preserve RLS/security invoker, ownership-column logic, idempotency (processed_operations), the row-metadata trigger, and the existing {applied|duplicate|conflict|rejected} response contract. Fix scope: update/tombstone contention AND concurrent replay of the same operation_id. fitney-dev application is authorized; no production changes, no database reset, no unrelated auth-setting changes.

## Decided By

Human

## Decision Date

2026-09-04

## Implemented

true

## GitHub Ref

https://github.com/DiegoDoug/fitney/pull/3
