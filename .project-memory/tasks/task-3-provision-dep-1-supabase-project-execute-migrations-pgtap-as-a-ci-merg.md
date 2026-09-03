---
id: "TASK-3"
kind: "task"
title: "Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate"
notion_page_id: "3cfe6070-43bc-81e6-a979-d0f7472510ac"
notion_url: "https://app.notion.com/p/Provision-DEP-1-Supabase-project-execute-migrations-pgTAP-as-a-CI-merge-gate-3cfe607043bc81e6a979d0f7472510ac"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T22:18:00.000Z"
status: "In Progress"
---

# Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate

## Scope

Create dev + prod Supabase projects. Run supabase db reset (migrations 20260902090001–06 + seed.sql) and supabase test db (pgTAP suites 01–04) and supabase db lint. Wire all three into CI as a required merge gate.

## Priority

Critical

## Executor

Claude Code

## Definition of Done

All four pgTAP suites pass; migrations apply on a fresh DB; db lint clean; CI gate active. This is the hard gate that unlocks client-engineering.

## Verification

Not Run
