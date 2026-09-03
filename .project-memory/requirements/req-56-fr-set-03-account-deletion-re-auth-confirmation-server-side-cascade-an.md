---
id: "REQ-56"
kind: "requirement"
title: "FR-SET-03 — Account deletion: re-auth, confirmation, server-side cascade/anonymization, completion receipt"
notion_page_id: "3cfe6070-43bc-814e-85ce-de098809f280"
notion_url: "https://app.notion.com/p/FR-SET-03-Account-deletion-re-auth-confirmation-server-side-cascade-anonymization-completion-r-3cfe607043bc814e85cede098809f280"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# FR-SET-03 — Account deletion: re-auth, confirmation, server-side cascade/anonymization, completion receipt

## Description

Account deletion requires re-authentication, explicit confirmation, appropriate server-side cascade/anonymization, and a completion receipt.

## Type

Functional

## Priority

High

## Acceptance Criteria

OQ-10 resolved: hard cascade + non-PII deletion_receipts (SEC-DEC-04). Re-auth heuristic is dev-only; server-verifiable re-auth before beta (governing decision D / SEC-RESID-1). delete-account Edge Function authored, unexecuted.

## Source

SPEC SET-03; docs/product/product-strategy.md §8.1. P1 (server behavior was decision-gated, OQ-10 — resolved).

## Verified

false
