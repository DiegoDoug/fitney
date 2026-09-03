---
id: "ISS-13"
kind: "issue"
title: "OQ-7 / AR-OQ-5 / UX-OQ-6: Multi-device simultaneous-edit conflict review UX"
notion_page_id: "3cfe6070-43bc-81a9-8f92-d7511784fb45"
notion_url: "https://app.notion.com/p/OQ-7-AR-OQ-5-UX-OQ-6-Multi-device-simultaneous-edit-conflict-review-UX-3cfe607043bc81a98f92d7511784fb45"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Open"
---

# OQ-7 / AR-OQ-5 / UX-OQ-6: Multi-device simultaneous-edit conflict review UX

## Summary

The sync version protocol itself is fixed and correct for any device count (no data-loss question); what is open is how sync_conflicts are surfaced to and resolved by the user, and the exact copy/options for the FR-SYNC-05 active-session conflict choice. MVP rule is last-accepted-write-wins + conflict telemetry; a richer review UX may be needed under heavy multi-device use (AR-RISK-1).

## Type

UX Gap

## Priority

Medium

## Evidence

development-roadmap.md OQ-7 / AR-OQ-5 / UX-OQ-6; ADR-0003 step 5; system-architecture §10.4. Owner: UX + Architecture. Non-blocking.

## Proposed Resolution

UX + Architecture design the conflict review surface once real multi-device usage evidence exists; deferred by decision for MVP.
