---
id: "REL-14"
kind: "milestone"
title: "Gate — Sync-protocol conformance suite (against real Supabase)"
notion_page_id: "3cfe6070-43bc-816e-ade5-d13522b17e38"
notion_url: "https://app.notion.com/p/Gate-Sync-protocol-conformance-suite-against-real-Supabase-3cfe607043bc816eade5d13522b17e38"
created: "2026-09-02T20:16:00.000Z"
last_edited: "2026-09-02T20:16:00.000Z"
status: "Planned"
---

# Gate — Sync-protocol conformance suite (against real Supabase)

## Objective

Run the sync-protocol conformance suite against a real Supabase project before any user-owned table is exposed: concurrent writers; forced clock skew; kill-mid-push replay; same-timestamp page boundary; insert/update/tombstone version checks; operation_id dedupe; in-flight-successor acknowledgement; late-transaction-commit reconciliation; lost-transport-response-with-successor; completed-session-conflict parked.

## Type

Gate

## Exit Criteria

All conformance cases green against real Supabase. Foundation-increment prerequisite (AR-C4). Mitigates AR-RISK-7 / AR-RISK-8. WORK-013.
