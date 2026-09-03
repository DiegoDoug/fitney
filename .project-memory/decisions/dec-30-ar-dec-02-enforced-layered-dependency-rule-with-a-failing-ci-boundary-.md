---
id: "DEC-30"
kind: "decision"
title: "AR-DEC-02 — Enforced layered dependency rule with a failing CI boundary check"
notion_page_id: "3cfe6070-43bc-81af-b257-ece3ce9d4c06"
notion_url: "https://app.notion.com/p/AR-DEC-02-Enforced-layered-dependency-rule-with-a-failing-CI-boundary-check-3cfe607043bc81afb257ece3ce9d4c06"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-02 — Enforced layered dependency rule with a failing CI boundary check

## Summary

Enforced layered dependency rule (app → features → domain/services/repository-interfaces → local/sync → remote gateway); Supabase client referenced in one directory; boundary lint is a failing CI check shipped in Phase 0.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Implements CON-5. Evidence: docs/architecture/adrs/ADR-0002-layered-dependency-rule.md, system-architecture.md §6.

## Consequences

CI gate = WORK-011 (client-engineering). Full record: ADR-0002. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
