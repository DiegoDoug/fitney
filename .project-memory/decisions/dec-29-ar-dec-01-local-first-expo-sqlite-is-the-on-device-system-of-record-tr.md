---
id: "DEC-29"
kind: "decision"
title: "AR-DEC-01 — Local-first: expo-sqlite is the on-device system of record + transactional outbox"
notion_page_id: "3cfe6070-43bc-8149-886c-e170ede4e174"
notion_url: "https://app.notion.com/p/AR-DEC-01-Local-first-expo-sqlite-is-the-on-device-system-of-record-transactional-outbox-3cfe607043bc8149886ce170ede4e174"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-01 — Local-first: expo-sqlite is the on-device system of record + transactional outbox

## Summary

Local-first: expo-sqlite is the on-device system of record; every domain mutation writes row(s) + a sync_outbox entry in one transaction; UI never awaits the network.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Implements CON-3. Evidence: docs/architecture/adrs/ADR-0001-local-first-system-of-record.md, system-architecture.md §7.2.

## Consequences

Foundational to ADR-0003. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
