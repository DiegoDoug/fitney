---
id: "TASK-5"
kind: "task"
title: "Validate corrected weekly-aggregate bucketing (week_start + session-local date) vs golden vectors"
notion_page_id: "3cfe6070-43bc-817c-a357-da19cc3f7c7f"
notion_url: "https://app.notion.com/p/Validate-corrected-weekly-aggregate-bucketing-week_start-session-local-date-vs-golden-vectors-3cfe607043bc817ca357da19cc3f7c7f"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-03T04:51:00.000Z"
status: "Ready"
---

# Validate corrected weekly-aggregate bucketing (week_start + session-local date) vs golden vectors

## Scope

Phase 5 acceptance condition. When the client TypeScript domain calculation/PR implementation exists, run the shared WORK-012 vectors against both client TypeScript and server SQL, including week_start 0–6 and session-local calendar boundaries.

## Priority

Medium

## Executor

Claude Code

## Definition of Done

Server side already passes the vectors and hosted re-run. During Phase 5, the client TypeScript and server SQL outputs must match for weekly volume, e1RM, max-load PR, rep PR, bucketing boundaries, formula version, rounding, and idempotency. Drift blocks the derived-data/sync portion and Phase 5 approval, not Phase 5 start.

## Verification

Partial

## Commit / PR

https://github.com/DiegoDoug/fitney/commit/26ab1a6
