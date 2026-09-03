---
id: "REV-6"
kind: "review"
title: "Phase 4 — Software architecture approval (v4, after three revision rounds on sync correctness)"
notion_page_id: "3cfe6070-43bc-8188-817b-e0dc3144705e"
notion_url: "https://app.notion.com/p/Phase-4-Software-architecture-approval-v4-after-three-revision-rounds-on-sync-correctness-3cfe607043bc8188817be0dc3144705e"
created: "2026-09-02T20:19:00.000Z"
last_edited: "2026-09-02T20:19:00.000Z"
status: "Pass with Conditions"
---

# Phase 4 — Software architecture approval (v4, after three revision rounds on sync correctness)

## Scope

docs/architecture/system-architecture.md + ADR-0001…ADR-0009 — context/trust boundaries, layered decomposition + enforcement, runtime flows, domain model, sync/consistency model, quality attributes, traceability.

## Type

Architecture

## Reviewer

Human

## Review Date

2026-09-02

## Findings

Submitted v1 PASS WITH CONDITIONS; human requested revisions three times before approval, all on sync-engine correctness: v1→v2 (composite (updated_at,id) pull cursor; real server-version optimistic concurrency; client operation_id + dedupe + replay model; remove client-clock conflict ordering; correct the hot-write acknowledgement — no ≤16 ms same-frame claim). v2→v3 (in-flight successor acknowledgement must not clear dirty / apply the returned payload while a pending successor exists; composite cursor does not cover late transaction commits → add periodic full (id, version) reconciliation + a WORK-013 late-commit test). v3→v4 (transport/5xx must not return O1 to pending while a pending successor exists — UNIQUE (entity,entity_id) WHERE state='pending' violation; make the dispatched state durable/immutable, only a terminal applied/duplicate/conflict removes it, retry with the same operation_id after process death; completed-session conflict parked, not auto-re-issued). v4 APPROVED — proceed to backend-data-engineering (chosen ahead of client-engineering by explicit human choice). Establishes AR-DEC-01…AR-DEC-11 and ADR-0001…ADR-0009.

## Conditions

AR-C1: two recompute implementations (TS device + SQL/Edge server) kept convergent by one spec + shared golden vectors (WORK-012) + server-wins-on-pull — managed risk (AR-RISK-2). AR-C2: conflict policy is server-version optimistic concurrency + durable dispatched state + parked completed-session conflicts; correct for any device count, only the multi-device review UX is thin (AR-RISK-1, OQ-7). AR-C3: expo-sqlite transaction/WAL guarantees + hand-rolled reactive query layer must be verified against the locked Expo SDK at the start of the Foundation increment (WORK-010); a negative result pulls the dev-build earlier. AR-C4: boundary-lint CI gate (WORK-011) + sync-protocol conformance suite (WORK-013) are hard Foundation-increment prerequisites. AR-C5: AR-OQ-1–6 open, none block backend/security.
