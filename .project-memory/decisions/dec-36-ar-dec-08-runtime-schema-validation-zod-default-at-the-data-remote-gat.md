---
id: "DEC-36"
kind: "decision"
title: "AR-DEC-08 — Runtime schema validation (Zod default) at the data/remote gateway and repository inputs"
notion_page_id: "3cfe6070-43bc-813b-94c9-d6fc29865a12"
notion_url: "https://app.notion.com/p/AR-DEC-08-Runtime-schema-validation-Zod-default-at-the-data-remote-gateway-and-repository-inputs-3cfe607043bc813b94c9d6fc29865a12"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-08 — Runtime schema validation (Zod default) at the data/remote gateway and repository inputs

## Summary

Runtime schema validation (Zod default; valibot if bundle size warrants) at the data/remote gateway (parse every response row) and repository inputs; hand-authored domain/ types are canonical; generated Supabase types confined to data/remote.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Evidence: docs/architecture/adrs/ADR-0008-boundary-validation.md.

## Consequences

Zod vs valibot tracked as AR-OQ-2. Full record: ADR-0008. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
