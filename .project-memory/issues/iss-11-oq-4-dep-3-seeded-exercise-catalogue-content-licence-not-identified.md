---
id: "ISS-11"
kind: "issue"
title: "OQ-4 / DEP-3: Seeded exercise catalogue + content licence not identified"
notion_page_id: "3cfe6070-43bc-8163-974e-e63e15ae5ad6"
notion_url: "https://app.notion.com/p/OQ-4-DEP-3-Seeded-exercise-catalogue-content-licence-not-identified-3cfe607043bc8163974ee63e15ae5ad6"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Decision Needed"
---

# OQ-4 / DEP-3: Seeded exercise catalogue + content licence not identified

## Summary

FR-LIB-03 needs a small, legally usable exercise dataset. supabase/seed.sql is a non-shippable placeholder (8 exercises) and shipping it is a licensing problem (BD-RISK-6). The dual-tenancy model for global seed rows is settled (SEC-DEC-05); only the dataset + licence are open.

## Type

Question

## Priority

Medium

## Evidence

development-roadmap.md OQ-4 / DEP-3 / BD-RISK-6; product-strategy §12 OQ-4; supabase/seed.sql header. Owner: Human. Non-blocking for MVP build; blocks shipping the seed catalogue.

## Proposed Resolution

Human to select and clear a permissively licensed dataset; design tolerates a shrunk seed because user-created exercises fully substitute.
