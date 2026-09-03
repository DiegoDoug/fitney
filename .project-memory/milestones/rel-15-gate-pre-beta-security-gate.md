---
id: "REL-15"
kind: "milestone"
title: "Gate — Pre-beta security gate"
notion_page_id: "3cfe6070-43bc-81d7-9411-f76d0fa9667f"
notion_url: "https://app.notion.com/p/Gate-Pre-beta-security-gate-3cfe607043bc81d79411f76d0fa9667f"
created: "2026-09-02T20:16:00.000Z"
last_edited: "2026-09-02T20:16:00.000Z"
status: "Planned"
---

# Gate — Pre-beta security gate

## Objective

Before beta: replace the 300 s delete-account re-auth heuristic with server-verifiable / nonce-based re-authentication (SEC-RESID-1, governing decision D); define the data-retention + backup/PITR policy (SEC-OQ-1); run an external penetration test (SEC-RESID-6).

## Type

Gate

## Exit Criteria

Server-verifiable re-auth shipped; retention/PITR policy recorded and reflected in the privacy statement; external pen test completed with findings triaged. Gates beta, not the MVP build. WORK-021.
