---
id: "DEC-33"
kind: "decision"
title: "AR-DEC-05 — Derived data via deterministic idempotent recompute, materialized locally, formula-versioned"
notion_page_id: "3cfe6070-43bc-8157-92d0-e3dc6fa35770"
notion_url: "https://app.notion.com/p/AR-DEC-05-Derived-data-via-deterministic-idempotent-recompute-materialized-locally-formula-versi-3cfe607043bc815792d0e3dc6fa35770"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-05 — Derived data via deterministic idempotent recompute, materialized locally, formula-versioned

## Summary

Derived data (PRs, aggregates): deterministic pure recompute over completed performed_sets, materialized locally, idempotent (recomputeExercise/recomputeWeek delete-and-reinsert in-tx), formula_id/formula_version stamped; server mirrors the semantics and wins on pull.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Implements FR-DATA-10, NFR-DATA-INTEGRITY. Evidence: docs/architecture/adrs/ADR-0005-derived-data-recompute.md, system-architecture.md §7.3.

## Consequences

Client/server drift risk = AR-RISK-2; golden vectors = WORK-012. Full record: ADR-0005. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
