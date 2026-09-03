---
id: "ISS-19"
kind: "issue"
title: "AR-OQ-1–4: Architecture open questions (UUIDv7, Zod vs valibot, recompute form, reactive query layer)"
notion_page_id: "3cfe6070-43bc-8114-9c14-e599b466cd92"
notion_url: "https://app.notion.com/p/AR-OQ-1-4-Architecture-open-questions-UUIDv7-Zod-vs-valibot-recompute-form-reactive-query-layer-3cfe607043bc81149c14e599b466cd92"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Open"
---

# AR-OQ-1–4: Architecture open questions (UUIDv7, Zod vs valibot, recompute form, reactive query layer)

## Summary

AR-OQ-1: UUIDv7 generator availability/quality in the locked Expo Go SDK (v4 is a safe default). AR-OQ-2: validation library Zod vs valibot (bundle size vs ergonomics on RN). AR-OQ-3: server recompute as a SQL function/trigger vs an Edge Function — resolved toward trigger-driven SQL (BD-DEC-03); both satisfy §10.5. AR-OQ-4: hand-rolled useDbQuery vs adopting an Expo Go-compatible reactive SQLite layer from the start (AR-RISK-3; WORK-010). None block backend/security.

## Type

Question

## Priority

Low

## Evidence

development-roadmap.md AR-OQ-1–4, AR-C5; ADR-0004/0007/0005. Owner: software-architecture + client-engineering. AR-OQ-6 already resolved toward the sync_apply RPC (BD-DEC-02).

## Proposed Resolution

Resolve at the start of the Foundation increment against the locked Expo SDK (WORK-010); a negative useDbQuery result pulls the dev-build migration earlier.
