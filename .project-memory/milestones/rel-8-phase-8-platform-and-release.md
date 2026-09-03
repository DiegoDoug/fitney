---
id: "REL-8"
kind: "milestone"
title: "Phase 8 — Platform and release"
notion_page_id: "3cfe6070-43bc-81f8-ab2a-f517edce6c5f"
notion_url: "https://app.notion.com/p/Phase-8-Platform-and-release-3cfe607043bc81f8ab2af517edce6c5f"
created: "2026-09-02T20:15:00.000Z"
last_edited: "2026-09-03T15:00:00.000Z"
status: "Approved"
---

# Phase 8 — Platform and release

## Objective

Provision DEP-1 (Supabase project, local + hosted); run supabase db reset (migrations 0001–0006 + seed) + supabase test db (pgTAP 01–04) + supabase db lint; wire the CI merge gate; hosted auth hardening; secret provisioning; pin the Edge Function dependency + Deno lockfile. Skill: platform-release.

## Type

Phase

## Start

2026-09-02

## Exit Criteria

HUMAN APPROVED WITH CONDITIONS 2026-09-03 — dev-only gate. Evidence: local reset x2 + lint clean + pgTAP 68/68; private GitHub repository; db-verify green on main; hosted fitney-dev migrations/lint/security-advisor review + 31/31 real-role behavioral checks. DEP-1 development execution gate is satisfied and Client Engineering may unlock. Residual conditions: enable branch protection requiring db-verify; ratify PostgreSQL 17 (ISS-28); retain exact dependency pin until reviewed; production Supabase, production auth hardening, secrets, delete-account deploy, retention/PITR, and release infrastructure remain deferred.

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
