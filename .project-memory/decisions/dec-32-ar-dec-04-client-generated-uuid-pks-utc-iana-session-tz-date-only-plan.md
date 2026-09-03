---
id: "DEC-32"
kind: "decision"
title: "AR-DEC-04 — Client-generated UUID PKs; UTC + IANA session tz + date-only plan dates; canonical kg/m/s"
notion_page_id: "3cfe6070-43bc-812a-9bc5-c11da81d65a6"
notion_url: "https://app.notion.com/p/AR-DEC-04-Client-generated-UUID-PKs-UTC-IANA-session-tz-date-only-plan-dates-canonical-kg-m--3cfe607043bc812a9bc5c11da81d65a6"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-04 — Client-generated UUID PKs; UTC + IANA session tz + date-only plan dates; canonical kg/m/s

## Summary

Client-generated UUID PKs (v7 preferred, v4 fallback); UTC instants (epoch-ms / timestamptz, server-generated updated_at by trigger) + separate IANA session timezone + date-only plan dates; canonical kg/m/s at rest, convert only in presentation; rest timer as an absolute anchor timestamp.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Implements CON-6. Evidence: docs/architecture/adrs/ADR-0004-identifiers-and-time.md.

## Consequences

UUIDv7 availability tracked as AR-OQ-1. Full record: ADR-0004. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
