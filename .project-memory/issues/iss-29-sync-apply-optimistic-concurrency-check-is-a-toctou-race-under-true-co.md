---
id: "ISS-29"
kind: "issue"
title: "sync_apply optimistic-concurrency check is a TOCTOU race under true concurrent writers -- can silently drop a conflicting edit"
notion_page_id: "3d1e6070-43bc-819d-b47f-c3070a84cd5b"
notion_url: "https://app.notion.com/p/sync_apply-optimistic-concurrency-check-is-a-TOCTOU-race-under-true-concurrent-writers-can-silent-3d1e607043bc819db47fc3070a84cd5b"
created: "2026-09-04T16:22:00.000Z"
last_edited: "2026-09-04T20:46:00.000Z"
status: "Resolved"
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

RESOLVED 2026-09-04 (DEC-55). Migration supabase/migrations/20260904200000_sync_apply_atomic_concurrency_fix.sql makes the version check + write one atomic compare-and-swap (UPDATE ... WHERE id=$2 AND version=$3), with a processed_operations recheck on a zero-rows-affected result so a concurrent operation_id replay reports 'duplicate' (never a spurious 'conflict'); the same recheck fixed a second real gap in the INSERT path's unique_violation handler (previously misreported a replay as 'rejected'). Verified: red-run against the reverted old function reproducibly FAILED (4/5, 0/3, 0/3, 0/3 across 4 scenarios); green-run against the fix passed 5/5 across 3 clean local runs plus 4 clean hosted runs against fitney-dev. CI-gated in db-verify.yml (client/src/data/sync/tests/hosted/sync-apply-concurrency.hosted.test.ts). Applied to fitney-dev only (no db reset, no unrelated auth change); security advisor unchanged; WORK-020 hosted evidence re-confirmed unchanged. Full record: docs/engineering/evidence/13-iss29-fix-regression.md, docs/engineering/client-implementation.md SS14.20.

## GitHub Ref

https://github.com/DiegoDoug/fitney/tree/phase-5/increment-3
