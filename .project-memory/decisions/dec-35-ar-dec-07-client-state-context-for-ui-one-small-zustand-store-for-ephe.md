---
id: "DEC-35"
kind: "decision"
title: "AR-DEC-07 — Client state: Context for UI, one small Zustand store for ephemeral session UI only"
notion_page_id: "3cfe6070-43bc-81d2-afe4-c078f40ad7f0"
notion_url: "https://app.notion.com/p/AR-DEC-07-Client-state-Context-for-UI-one-small-Zustand-store-for-ephemeral-session-UI-only-3cfe607043bc81d2afe4c078f40ad7f0"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-07 — Client state: Context for UI, one small Zustand store for ephemeral session UI only

## Summary

Client state: React/Context for UI, one small Zustand store for ephemeral session UI only (no domain data); domain data read from SQLite via a thin reactive useDbQuery; TanStack Query never used against Supabase.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Evidence: docs/architecture/adrs/ADR-0007-client-state-and-data-access.md.

## Consequences

useDbQuery adequacy tracked as AR-OQ-4 / AR-RISK-3. Full record: ADR-0007. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
