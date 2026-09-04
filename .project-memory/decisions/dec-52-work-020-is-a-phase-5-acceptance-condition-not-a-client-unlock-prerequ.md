---
id: "DEC-52"
kind: "decision"
title: "WORK-020 is a Phase 5 acceptance condition, not a client-unlock prerequisite"
notion_page_id: "3d0e6070-43bc-81d8-b57a-c1f6f3dafe1f"
notion_url: "https://app.notion.com/p/WORK-020-is-a-Phase-5-acceptance-condition-not-a-client-unlock-prerequisite-3d0e607043bc81d8b57ac1f6f3dafe1f"
created: "2026-09-03T04:49:00.000Z"
last_edited: "2026-09-03T04:49:00.000Z"
status: "Approved"
---

# WORK-020 is a Phase 5 acceptance condition, not a client-unlock prerequisite

## Summary

The client-TypeScript/server-SQL recompute golden-vector cross-run moves into Client Engineering as a hard acceptance condition. It no longer blocks starting Phase 5 because the required client implementation does not yet exist.

## Area

Architecture

## Rationale

Requiring a client/server cross-run before Client Engineering creates the client implementation is circular. The server vectors are already green; equivalence becomes testable during Phase 5.

## Alternatives

Keep WORK-020 as a prerequisite to unlock Phase 5 — rejected because it creates an impossible dependency.

## Consequences

Phase 5 can start after explicit human authorization. WORK-020 must pass before the derived-data/sync portion of Client Engineering is accepted and before Phase 5 approval.

## Decided By

Human

## Decision Date

2026-09-03

## Implemented

true

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
