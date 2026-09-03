---
id: "REQ-41"
kind: "requirement"
title: "FR-DATA-06 — Estimated 1RM uses Epley for 2–10 reps; not computed for invalid inputs"
notion_page_id: "3cfe6070-43bc-81aa-be91-cbfc2c7167ca"
notion_url: "https://app.notion.com/p/FR-DATA-06-Estimated-1RM-uses-Epley-for-2-10-reps-not-computed-for-invalid-inputs-3cfe607043bc81aabe91cbfc2c7167ca"
created: "2026-09-02T20:13:00.000Z"
last_edited: "2026-09-02T20:13:00.000Z"
status: "Approved"
---

# FR-DATA-06 — Estimated 1RM uses Epley for 2–10 reps; not computed for invalid inputs

## Description

Estimated 1RM uses Epley for 2–10 reps; not computed for zero reps, invalid loads, or unsupported modes.

## Type

Functional

## Priority

High

## Acceptance Criteria

Epley e1RM = load × (1 + reps/30). Golden vectors (WORK-012) in supabase/tests/03 — unrun (DEP-1). Alternative formulas post-MVP (OQ-6).

## Source

SPEC DATA-06; docs/product/product-strategy.md §8.1. P1.

## Verified

false
