---
id: "TASK-5"
kind: "task"
title: "Validate corrected weekly-aggregate bucketing (week_start + session-local date) vs golden vectors"
notion_page_id: "3cfe6070-43bc-817c-a357-da19cc3f7c7f"
notion_url: "https://app.notion.com/p/Validate-corrected-weekly-aggregate-bucketing-week_start-session-local-date-vs-golden-vectors-3cfe607043bc817ca357da19cc3f7c7f"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-03T02:48:00.000Z"
status: "In Progress"
---

# Validate corrected weekly-aggregate bucketing (week_start + session-local date) vs golden vectors

## Scope

Review the _week_start_for helper + rewritten recompute_week_aggregates + trigger changes in 20260902090006 (implemented by security-identity at human direction). Confirm bucketing uses profiles.week_start and (started_at at time zone session.timezone)::date, not UTC date_trunc. Extend WORK-012 golden vectors to cover week boundaries and re-run both the SQL and client TS implementations.

## Priority

Medium

## Executor

Other Agent

## Definition of Done

Validate the corrected weekly-aggregate bucketing (profiles.week_start + session-local calendar date) against the WORK-012 golden vectors. PROGRESS 2026-09-02 (WORK-022): the F-5 smallint/integer resolution bug in this exact code was found & fixed; probed _week_start_for for week_start 0-6 (Sun..Sat) -> correct week-start dates; supabase/tests/03 golden vectors green (weekly working volume 1430, e1RM 116.6667 & 129.8333, max_load 110, rep_pr {1:110,8:102.5}); idempotent recompute confirmed. Still owed: a byte-for-byte cross-run of these vectors against the client-side TS domain/{calc,pr} implementation (that impl does not exist yet -> client-engineering), and a hosted re-run.

## Verification

Partial
