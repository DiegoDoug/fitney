---
id: "REQ-58"
kind: "requirement"
title: "FR-SYNC-01 — Local store serves all normal reads/writes; network never on the critical path"
notion_page_id: "3cfe6070-43bc-8189-ad2a-e9113a172a25"
notion_url: "https://app.notion.com/p/FR-SYNC-01-Local-store-serves-all-normal-reads-writes-network-never-on-the-critical-path-3cfe607043bc8189ad2ae9113a172a25"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# FR-SYNC-01 — Local store serves all normal reads/writes; network never on the critical path

## Description

The local store serves all normal reads and writes; the network is never on the critical path for logging, completion, or recovery.

## Type

Functional

## Priority

Critical

## Acceptance Criteria

Product invariant #3. ADR-0001. E2E scenario 2.

## Source

SPEC §11, CLAUDE.md; docs/product/product-strategy.md §8.1. P0.

## Verified

false
