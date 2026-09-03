---
id: "DEC-7"
kind: "decision"
title: "DEC-003 — Offline-first reliability is a P0 product invariant"
notion_page_id: "3cfe6070-43bc-8103-88f3-e9e2a2ce387f"
notion_url: "https://app.notion.com/p/DEC-003-Offline-first-reliability-is-a-P0-product-invariant-3cfe607043bc810388f3e9e2a2ce387f"
created: "2026-09-02T20:05:00.000Z"
last_edited: "2026-09-02T20:05:00.000Z"
status: "Approved"
---

# DEC-003 — Offline-first reliability is a P0 product invariant

## Summary

Offline-first reliability is a P0 product invariant: connectivity never blocks logging, completion, or active-session recovery; the offline logging vertical slice is proven before broad screen construction.

## Area

Product

## Rationale

Owner: product-strategy (phase 1). Source: docs/product/product-strategy.md §9, §11.2.

## Consequences

Drives ADR-0001 (local-first) and ADR-0003 (sync engine). No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-01

## Implemented

false
