---
id: "REQ-67"
kind: "requirement"
title: "NFR-PRIVACY — Sensitive values excluded from production telemetry; retention/deletion defined before beta"
notion_page_id: "3cfe6070-43bc-8110-8964-d5a2577a3aaf"
notion_url: "https://app.notion.com/p/NFR-PRIVACY-Sensitive-values-excluded-from-production-telemetry-retention-deletion-defined-before-3cfe607043bc81108964d5a2577a3aaf"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# NFR-PRIVACY — Sensitive values excluded from production telemetry; retention/deletion defined before beta

## Description

Load, body weight, free-text/exercise notes, email, and full workout payloads are excluded from production telemetry unless explicitly justified and consented; retention and deletion behavior is defined before beta.

## Type

Non-functional

## Priority

High

## Acceptance Criteria

Telemetry schema review. Policy decision-gated on OQ-9 (provider/consent) + SEC-OQ-1 (retention/PITR). CON-9. Routed to Security, Backend, Operations.

## Source

docs/product/product-strategy.md §8.2. Priority P1 (policy decision-gated).

## Verified

false
