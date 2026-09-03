---
id: "RUN-2"
kind: "handoff"
title: "Phase 8 — Platform Release execution handoff"
notion_page_id: "3cfe6070-43bc-8176-ad16-e9ea2048d0ec"
notion_url: "https://app.notion.com/p/Phase-8-Platform-Release-execution-handoff-3cfe607043bc8176ad16e9ea2048d0ec"
created: "2026-09-02T22:19:00.000Z"
last_edited: "2026-09-02T22:19:00.000Z"
status: "Started"
---

# Phase 8 — Platform Release execution handoff

## Agent

Claude Code

## Type

Handoff

## Started

2026-09-02

## Input / Scope

Execute the active platform-release lifecycle phase. Provision or validate local + hosted Supabase DEP-1; execute migrations 20260902090001–06, pgTAP 01–04, and db lint; wire required CI gates; configure hosted auth and environment-scoped secrets safely; pin the delete-account Edge Function dependency and Deno lockfile; author docs/platform/platform-release.md; update canonical Notion implementation evidence.

## Output Summary

Pending Claude Code execution. Phase must end AWAITING APPROVAL with exactly one result: PASS, PASS WITH CONDITIONS, FAIL, or BLOCKED. Do not unlock client-engineering.

## Decisions Needed

Ask only for missing external authorization or a material platform/security choice. Never request that service-role credentials be pasted into source, logs, prompts, or Notion.
