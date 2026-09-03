---
id: "ISS-10"
kind: "issue"
title: "OQ-3: Ship guest mode? Only if guest→account migration is atomic and lossless"
notion_page_id: "3cfe6070-43bc-8194-88d0-c1d696cdfa3d"
notion_url: "https://app.notion.com/p/OQ-3-Ship-guest-mode-Only-if-guest-account-migration-is-atomic-and-lossless-3cfe607043bc819488d0c1d696cdfa3d"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Decision Needed"
---

# OQ-3: Ship guest mode? Only if guest→account migration is atomic and lossless

## Summary

FR-AUTH-04 makes guest mode conditional on an atomic, lossless guest-to-account migration. Trades onboarding funnel against data-loss risk and build cost. The ADR-0009 AuthProvider seam keeps it cheap to add later or to keep cut.

## Type

Question

## Priority

Medium

## Evidence

development-roadmap.md OQ-3; product-strategy §12 OQ-3; ADR-0009. Owner: Human + Product. Non-blocking for downstream phase start.

## Proposed Resolution

Human + Product decide; if pursued, a migration-correctness test gates it.
