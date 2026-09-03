---
id: "ISS-23"
kind: "issue"
title: "Foundation risk: expo-sqlite guarantees, reactive query layer, boundary-lint wiring, and schema/snapshot drift"
notion_page_id: "3cfe6070-43bc-8135-969f-dfdb4feabddd"
notion_url: "https://app.notion.com/p/Foundation-risk-expo-sqlite-guarantees-reactive-query-layer-boundary-lint-wiring-and-schema-snap-3cfe607043bc8135969fdfdb4feabddd"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Open"
---

# Foundation risk: expo-sqlite guarantees, reactive query layer, boundary-lint wiring, and schema/snapshot drift

## Summary

Consolidated standing risk for the Foundation increment. (AR-RISK-4) expo-sqlite transactional/WAL guarantees in the locked SDK may be weaker than assumed → outbox atomicity at risk. (AR-RISK-3) A hand-rolled reactive query layer over expo-sqlite may be inadequate; adopting a replication lib later breaks Expo Go and forces an early dev-build. (AR-RISK-6) Boundary-lint not wired to CI → layering erodes, silently breaking the offline guarantee. (AR-RISK-5 / RISK-1) Snapshot duplication (template→planned→session) implemented inconsistently → mutable template data leaks into history; offline sync + snapshot-vs-reference integrity is the hardest part and is easy to underestimate. (BD-RISK-7) Client SQLite mirror and server schema drift over time (no shared machine-readable entity definition yet). (RISK-5) Expo Go constraints may force compromises that do not survive the dev-build migration.

## Type

Risk

## Priority

Medium

## Evidence

development-roadmap.md RISK-1, RISK-5, AR-RISK-3/4/5/6, BD-RISK-7; ADR-0001/0002/0006. Owner: software-architecture + client-engineering + quality-engineering.

## Proposed Resolution

Mitigated by: WORK-010 (verify expo-sqlite transaction/WAL + reactive-layer feasibility against the locked SDK before building the write path; negative result pulls the dev-build earlier); WORK-011 boundary-lint CI gate + network-stubbed smoke test; WORK-017 shared machine-readable entity definition as the client↔server lockstep source; prove the offline logging vertical slice before broad screen work.
