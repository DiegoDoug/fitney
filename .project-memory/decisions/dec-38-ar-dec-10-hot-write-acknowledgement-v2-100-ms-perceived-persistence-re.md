---
id: "DEC-38"
kind: "decision"
title: "AR-DEC-10 — Hot-write acknowledgement v2: ≤100 ms perceived persistence, \"recorded\" only after commit"
notion_page_id: "3cfe6070-43bc-8126-a165-f2b320c686cf"
notion_url: "https://app.notion.com/p/AR-DEC-10-Hot-write-acknowledgement-v2-100-ms-perceived-persistence-recorded-only-after-commi-3cfe607043bc8126a165f2b320c686cf"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-10 — Hot-write acknowledgement v2: ≤100 ms perceived persistence, "recorded" only after commit

## Summary

Hot-write acknowledgement (v2): field edits render immediately from component state; the SQLite transaction targets ≤100 ms perceived persistence (SM-4) with no same-frame/≤16 ms commit claim; a set is "recorded" only after commit; on commit failure the values stay editable, the row shows "Not saved — retrying", and Finish is blocked until resolved.

## Area

Architecture

## Rationale

Owner: software-architecture (phase 4). Refines the SM-4 interpretation; aligns with UX §10 persist-failure state. Evidence: system-architecture.md §7.2, §11; ADR-0001.

## Consequences

Corrected during phase-4 revision round 1 (removed the ≤16 ms same-frame commit claim). No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
