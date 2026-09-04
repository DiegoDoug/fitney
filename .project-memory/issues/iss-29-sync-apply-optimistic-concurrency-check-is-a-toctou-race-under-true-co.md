---
id: "ISS-29"
kind: "issue"
title: "sync_apply optimistic-concurrency check is a TOCTOU race under true concurrent writers -- can silently drop a conflicting edit"
notion_page_id: "3d1e6070-43bc-819d-b47f-c3070a84cd5b"
notion_url: "https://app.notion.com/p/sync_apply-optimistic-concurrency-check-is-a-TOCTOU-race-under-true-concurrent-writers-can-silent-3d1e607043bc819db47fc3070a84cd5b"
created: "2026-09-04T16:22:00.000Z"
last_edited: "2026-09-04T16:22:00.000Z"
status: "Open"
---

# sync_apply optimistic-concurrency check is a TOCTOU race under true concurrent writers -- can silently drop a conflicting edit

## Summary

WORK-013 hosted concurrent-writers testing (client/src/data/sync/tests/hosted/sync-hosted.hosted.test.ts, run against real fitney-dev) observed both of two genuinely concurrent sync_apply calls for the SAME row report status:'applied' in 1 of 7 runs, with the row's version reaching 3 instead of the expected 2 -- meaning the second writer's edit silently overwrote the first's WITHOUT either side ever seeing a 'conflict'. FR-SYNC-04 (never silently drop or lose an unsynced mutation) is at risk under concurrent multi-device writes to the same row.

## Type

Architecture Conflict

## Priority

High

## Evidence

docs/engineering/evidence/12-work013-hosted-scenarios.json (full reproduction: r1={applied:1}, r2={applied:1}, finalRow.version=3, expected 2). 6 of 7 runs behaved correctly (one applied, one conflict, version 2) -- this is a narrow, timing-dependent race window, not a deterministic failure every time.

## Proposed Resolution

supabase/migrations/20260902090006_security_hardening.sql sync_apply()'s UPDATE branch reads v_current via a plain (non-locking) SELECT, then later runs update %I t set ... where t.id = $2 -- the UPDATE's WHERE clause checks id only, never re-verifying version, so a second concurrent transaction that read the same stale v_current before either committed will still successfully overwrite. Recommended fix (NOT applied -- backend-data-engineering/security-identity own this function): make the version check part of the UPDATE's WHERE clause itself (where t.id = $2 and t.version = $3, bind base_version), treat 0 rows affected as a conflict (re-select current row+version) rather than trusting the earlier SELECT; or add for update to the initial SELECT so the second transaction blocks on the row lock and correctly re-reads the post-commit version before deciding.

## GitHub Ref

https://github.com/DiegoDoug/fitney/tree/phase-5/increment-3
