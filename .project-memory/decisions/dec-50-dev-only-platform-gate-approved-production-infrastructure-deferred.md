---
id: "DEC-50"
kind: "decision"
title: "Dev-only platform gate approved; production infrastructure deferred"
notion_page_id: "3d0e6070-43bc-8181-81ed-d006609d7b2a"
notion_url: "https://app.notion.com/p/Dev-only-platform-gate-approved-production-infrastructure-deferred-3d0e607043bc818181edd006609d7b2a"
created: "2026-09-03T04:49:00.000Z"
last_edited: "2026-09-03T04:49:00.000Z"
status: "Approved"
---

# Dev-only platform gate approved; production infrastructure deferred

## Summary

Human approved the dev-only gate after local, CI, and hosted fitney-dev verification passed. Phase 8 and Phase 7 are approved with conditions; the DEP-1 development gate is satisfied; Client Engineering is unlocked but not started. Production Supabase infrastructure remains deferred.

## Area

Operations

## Rationale

The development environment now has repeatable migration, lint, pgTAP, CI, and real-role hosted evidence. Production provisioning is not necessary to begin the offline-first client and remains a separate release-hardening responsibility.

## Alternatives

Provision development and production together before client work — rejected as unnecessary cost and risk. Keep Client Engineering locked after the development gate passed — rejected.

## Consequences

fitney-dev is the only hosted environment currently authorized. No production project, production secrets, Edge Function deployment, hosted auth hardening, or PITR is approved by this decision. Branch protection remains a tracked human task. Quality Engineering, Production Operations, and Implementation Orchestrator remain locked.

## Decided By

Human

## Decision Date

2026-09-03

## Implemented

true

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
