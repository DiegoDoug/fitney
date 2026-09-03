---
id: "REQ-4"
kind: "requirement"
title: "FR-AUTH-04 — Guest mode ships only if guest→account migration is atomic and lossless"
notion_page_id: "3cfe6070-43bc-8151-901f-c785efb732fb"
notion_url: "https://app.notion.com/p/FR-AUTH-04-Guest-mode-ships-only-if-guest-account-migration-is-atomic-and-lossless-3cfe607043bc8151901fc785efb732fb"
created: "2026-09-02T20:11:00.000Z"
last_edited: "2026-09-02T20:11:00.000Z"
status: "Approved"
---

# FR-AUTH-04 — Guest mode ships only if guest→account migration is atomic and lossless

## Description

Guest mode ships only if guest-to-account migration is atomic and lossless; otherwise authentication is required and no disposable pseudo-account is shipped.

## Type

Functional

## Priority

High

## Acceptance Criteria

Decision-gated on OQ-3. Migration correctness test if pursued.

## Source

SPEC AUTH-04; docs/product/product-strategy.md §8.1. Priority P1 (decision-gated, OQ-3).

## Verified

false
