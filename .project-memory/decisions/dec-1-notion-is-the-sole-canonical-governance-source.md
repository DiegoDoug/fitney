---
id: "DEC-1"
kind: "decision"
title: "Notion is the sole canonical governance source"
notion_page_id: "3cfe6070-43bc-81d5-aad5-c296664f98e8"
notion_url: "https://app.notion.com/p/Notion-is-the-sole-canonical-governance-source-3cfe607043bc81d5aad5c296664f98e8"
created: "2026-09-02T20:04:00.000Z"
last_edited: "2026-09-02T20:22:00.000Z"
status: "Approved"
---

# Notion is the sole canonical governance source

## Summary

Fitney governance is migrated once from development-roadmap.md and relevant docs/ into Notion. After migration, Notion is the sole canonical source for durable project governance. The repository documentation becomes working/reference material and .project-memory/ remains a generated mirror.

## Area

Operations

## Rationale

Maintaining multiple canonical governance sources creates ambiguity between approved intent, implementation state, and agent context.

## Alternatives

(1) roadmap/docs remain canonical; (2) permanent hybrid model; (3) Notion sole canonical after controlled migration (chosen).

## Consequences

existing durable governance must be migrated once; future approved governance changes must be written to Notion; .project-memory/ must be regenerated from Notion; roadmap/docs may reference governance but must not silently override Notion. Governing decision A of the one-time controlled governance migration (2026-09-02). IMPLEMENTED 2026-09-02: 49 decisions, 9 ADRs, 71 requirements, 16 milestones (11 phases + 4 gates + MVP release), 23 issues, 6 reviews migrated; ISS-2 Resolved; development-roadmap.md header updated; .project-memory/ regenerated (npm run sync + check pass, counts reconciled).

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

true
