---
id: "ISS-20"
kind: "issue"
title: "BD-OQ-3–4: Backend optimisation / retention questions (sync_apply batching; processed_operations pruning)"
notion_page_id: "3cfe6070-43bc-8114-b5b3-ed854de4579b"
notion_url: "https://app.notion.com/p/BD-OQ-3-4-Backend-optimisation-retention-questions-sync_apply-batching-processed_operations-pru-3cfe607043bc8114b5b3ed854de4579b"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Open"
---

# BD-OQ-3–4: Backend optimisation / retention questions (sync_apply batching; processed_operations pruning)

## Summary

BD-OQ-3: should sync_apply accept a batch of ops to cut round-trips, or stay one-op-per-call (current)? Later throughput optimisation. BD-OQ-4: processed_operations retention / pruning policy — the table is unbounded append; needs a pruning policy (production-operations + backend).

## Type

Question

## Priority

Low

## Evidence

development-roadmap.md BD-OQ-3, BD-OQ-4; backend-data-implementation §11. Owner: backend-data-engineering + production-operations. Non-blocking. BD-OQ-1 tracked separately (ISS-7); BD-OQ-2 resolved by SEC-DEC-03.

## Proposed Resolution

Defer BD-OQ-3 to a post-MVP throughput pass; production-operations defines the processed_operations pruning policy.
