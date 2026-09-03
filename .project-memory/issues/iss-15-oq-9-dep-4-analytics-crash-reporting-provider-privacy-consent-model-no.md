---
id: "ISS-15"
kind: "issue"
title: "OQ-9 / DEP-4: Analytics / crash-reporting provider + privacy consent model not chosen"
notion_page_id: "3cfe6070-43bc-812c-b5aa-d3a45560f431"
notion_url: "https://app.notion.com/p/OQ-9-DEP-4-Analytics-crash-reporting-provider-privacy-consent-model-not-chosen-3cfe607043bc812cb5aad3a45560f431"
created: "2026-09-02T20:18:00.000Z"
last_edited: "2026-09-02T20:18:00.000Z"
status: "Decision Needed"
---

# OQ-9 / DEP-4: Analytics / crash-reporting provider + privacy consent model not chosen

## Summary

An Expo Go-compatible analytics / crash-reporting provider and the privacy consent model are undecided. Drives the consent flow, telemetry schema, and store disclosures. Analytics must sit behind an interface (CON-9) with sensitive values excluded from production telemetry (NFR-PRIVACY).

## Type

Question

## Priority

Medium

## Evidence

development-roadmap.md OQ-9 / DEP-4; product-strategy §12 OQ-9; CON-9. Owner: Human + Security. Non-blocking for MVP build.

## Proposed Resolution

Human + Security choose a provider and consent model; production-operations owns the telemetry schema review.
