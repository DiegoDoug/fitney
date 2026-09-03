---
id: "DEC-4"
kind: "decision"
title: "300-second re-auth heuristic is development-only"
notion_page_id: "3cfe6070-43bc-8152-ae15-ea483e287161"
notion_url: "https://app.notion.com/p/300-second-re-auth-heuristic-is-development-only-3cfe607043bc8152ae15ea483e287161"
created: "2026-09-02T20:04:00.000Z"
last_edited: "2026-09-02T20:04:00.000Z"
status: "Approved"
---

# 300-second re-auth heuristic is development-only

## Summary

The current 300-second re-authentication heuristic may be used during development only. A server-verifiable re-authentication mechanism is required before beta.

## Area

Security

## Rationale

A client/time heuristic is insufficient as the durable security control for beta users.

## Alternatives

Keep the 300s heuristic through GA — rejected; defer replacement to GA rather than beta — rejected.

## Consequences

SEC-RESID-1 remains tracked until the server-verifiable mechanism exists; beta is gated on replacement of the heuristic; do not defer this requirement to GA. Governing decision D of the 2026-09-02 governance migration. Implemented = false until the replacement mechanism exists.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
