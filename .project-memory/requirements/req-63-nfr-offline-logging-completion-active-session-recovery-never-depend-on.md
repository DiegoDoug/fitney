---
id: "REQ-63"
kind: "requirement"
title: "NFR-OFFLINE — Logging, completion, active-session recovery never depend on connectivity"
notion_page_id: "3cfe6070-43bc-819e-98d3-cb0b334aa0a1"
notion_url: "https://app.notion.com/p/NFR-OFFLINE-Logging-completion-active-session-recovery-never-depend-on-connectivity-3cfe607043bc819e98d3cb0b334aa0a1"
created: "2026-09-02T20:14:00.000Z"
last_edited: "2026-09-02T20:14:00.000Z"
status: "Approved"
---

# NFR-OFFLINE — Logging, completion, active-session recovery never depend on connectivity

## Description

Logging, completion, and active-session recovery never depend on connectivity; a confirmed set survives force-close and reconnect with no loss.

## Type

Non-functional

## Priority

Critical

## Acceptance Criteria

SM-4, SM-5, SM-10; E2E scenario 2. Routed to Architecture, Client, Backend, Quality.

## Source

docs/product/product-strategy.md §8.2. Priority P0.

## Verified

false
