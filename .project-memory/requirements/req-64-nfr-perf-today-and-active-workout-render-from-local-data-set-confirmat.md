---
id: "REQ-64"
kind: "requirement"
title: "NFR-PERF — Today and active workout render from local data; set confirmation feedback same-frame, persists without blocking"
notion_page_id: "3cfe6070-43bc-8115-88a2-f7af560a763a"
notion_url: "https://app.notion.com/p/NFR-PERF-Today-and-active-workout-render-from-local-data-set-confirmation-feedback-same-frame-pe-3cfe607043bc811588a2f7af560a763a"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# NFR-PERF — Today and active workout render from local data; set confirmation feedback same-frame, persists without blocking

## Description

Today and an active workout render from local data without waiting on the network; set confirmation gives same-frame feedback and persists without blocking input; long lists are virtualized; search queries indexed local fields.

## Type

Non-functional

## Priority

High

## Acceptance Criteria

SM-4, SM-7; frame timing. AR-DEC-10 (feedback from component state; ≤100 ms perceived commit). Routed to Architecture, Client.

## Source

docs/product/product-strategy.md §8.2. Priority P1.

## Verified

false
