---
id: "ISS-9"
kind: "issue"
title: "OQ-2 / DEP-2: Aeonik font files + mobile app distribution licence not available"
notion_page_id: "3cfe6070-43bc-817b-a0e7-f18fc5914e33"
notion_url: "https://app.notion.com/p/OQ-2-DEP-2-Aeonik-font-files-mobile-app-distribution-licence-not-available-3cfe607043bc817ba0e7f18fc5914e33"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Decision Needed"
---

# OQ-2 / DEP-2: Aeonik font files + mobile app distribution licence not available

## Summary

VIS-DEC-07 adopts Aeonik via expo-font, but the exact files/weights (assumed Regular/Medium/Semibold/Bold) and proof of a mobile app distribution licence are not in hand. A documented fallback stack ships until then; layout is typeface-independent; no synthesized weights.

## Type

Question

## Priority

Medium

## Evidence

development-roadmap.md OQ-2 / DEP-2 / VIS-OQ-2; visual-ui-design §6.2 (VIS-DEC-07). Owner: Human. Fallback ships meanwhile, so non-blocking for MVP build; blocks shipping Aeonik.

## Proposed Resolution

Human to procure licensed files and record licence proof; until then the fallback stack is authoritative.
