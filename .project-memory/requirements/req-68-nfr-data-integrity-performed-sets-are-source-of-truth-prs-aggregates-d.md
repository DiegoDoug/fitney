---
id: "REQ-68"
kind: "requirement"
title: "NFR-DATA-INTEGRITY — Performed sets are source of truth; PRs/aggregates deterministic idempotent; snapshots; kg/m/s; client UUIDs; forward-only migrations"
notion_page_id: "3cfe6070-43bc-81d5-aba2-d61309b07aaf"
notion_url: "https://app.notion.com/p/NFR-DATA-INTEGRITY-Performed-sets-are-source-of-truth-PRs-aggregates-deterministic-idempotent-sn-3cfe607043bc81d5aba2d61309b07aaf"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# NFR-DATA-INTEGRITY — Performed sets are source of truth; PRs/aggregates deterministic idempotent; snapshots; kg/m/s; client UUIDs; forward-only migrations

## Description

Performed sets are the source of truth; PRs and aggregates are derived, deterministic, and idempotently recomputable; historical names are snapshotted; canonical measures kg/m/s; client-generated UUIDs so offline creation never waits on the server; migrations forward-only with fresh-create and every upgrade path tested.

## Type

Non-functional

## Priority

Critical

## Acceptance Criteria

Unit + DB/integration tests; E2E scenario 5. ADR-0004/0005/0006. Routed to Architecture, Backend, Quality.

## Source

docs/product/product-strategy.md §8.2. Priority P0.

## Verified

false
