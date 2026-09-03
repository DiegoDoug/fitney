---
id: "ISS-28"
kind: "issue"
title: "ISS-28: hosted + local + CI are Postgres 17, not the Postgres 15 assumed by BD-DEC-01"
notion_page_id: "3d0e6070-43bc-815f-80e3-c1d36b22753f"
notion_url: "https://app.notion.com/p/ISS-28-hosted-local-CI-are-Postgres-17-not-the-Postgres-15-assumed-by-BD-DEC-01-3d0e607043bc815f80e3c1d36b22753f"
created: "2026-09-03T04:26:00.000Z"
last_edited: "2026-09-03T04:26:00.000Z"
status: "Decision Needed"
---

# ISS-28: hosted + local + CI are Postgres 17, not the Postgres 15 assumed by BD-DEC-01

## Summary

BD-DEC-01 and the earlier supabase/config.toml assumed Postgres 15. Supabase no longer provisions PG15 for new projects: the hosted fitney-dev project (created 2026-09-03) is Postgres 17.6, and supabase link consequently switched the linked local stack to PG17 as well; CI (supabase db start) follows the same version. config.toml major_version was changed 15 -> 17 by platform-release to match the enforced reality.

## Type

Architecture Conflict

## Priority

Low

## Evidence

supabase/config.toml (major_version 17 + comment); docs/platform/evidence/10-hosted-fitney-dev-verification.md; docs/engineering/backend-data-implementation.md §9.2; get_project(fitney-dev) -> database.version 17.6.1. All 6 migrations + the 4 pgTAP suites (68/68) + 31 hosted behavioural probes pass on PG17. Nothing in the schema uses a version-specific feature.

## Proposed Resolution

backend-data-engineering to ratify Postgres 17 as the target major version (update BD-DEC-01 / the backend implementation contract), OR require a legacy PG15 project if there is a specific reason. Non-blocking for phase 8 (everything is green on 17); should be settled before client-engineering locks its DB assumptions.
