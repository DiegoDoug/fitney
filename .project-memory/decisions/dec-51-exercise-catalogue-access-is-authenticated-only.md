---
id: "DEC-51"
kind: "decision"
title: "Exercise catalogue access is authenticated-only"
notion_page_id: "3d0e6070-43bc-8135-ad3c-ef0ea0997583"
notion_url: "https://app.notion.com/p/Exercise-catalogue-access-is-authenticated-only-3d0e607043bc8135ad3cef0ea0997583"
created: "2026-09-03T04:49:00.000Z"
last_edited: "2026-09-03T04:49:00.000Z"
status: "Approved"
---

# Exercise catalogue access is authenticated-only

## Summary

Global seed exercises and private exercises are readable only by authenticated users. The anon role reads zero exercises.

## Area

Security

## Rationale

Fitney has no anonymous browsing flow. Restricting catalogue reads to authenticated users removes unnecessary public API surface while preserving the global-seed dual-tenancy model.

## Alternatives

Keep global seed exercises world-readable through the anon key — rejected because there is no product requirement for anonymous catalogue access.

## Consequences

The exercise_select policy is scoped TO authenticated. SEC-DEC-05 is refined only for read audience: global rows remain service-managed and readable by every authenticated user, while ownership and immutability rules remain unchanged. ISS-27 is resolved.

## Decided By

Human

## Decision Date

2026-09-03

## Implemented

true

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
