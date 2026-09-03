---
id: "REL-13"
kind: "milestone"
title: "Gate — Dependency-boundary lint CI gate"
notion_page_id: "3cfe6070-43bc-816e-b4e6-dde558848955"
notion_url: "https://app.notion.com/p/Gate-Dependency-boundary-lint-CI-gate-3cfe607043bc816eb4e6dde558848955"
created: "2026-09-02T20:16:00.000Z"
last_edited: "2026-09-02T20:16:00.000Z"
status: "Planned"
---

# Gate — Dependency-boundary lint CI gate

## Objective

Ship the dependency-cruiser / eslint-boundaries config enforcing the ADR-0002 layer import matrix, plus a network-stubbed logging-flow smoke test, as a FAILING CI check.

## Type

Gate

## Exit Criteria

Boundary lint + smoke test run as a required CI check; a layering violation or an await on the render path fails the build. Foundation-increment prerequisite (AR-C4). WORK-011.
