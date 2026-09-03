---
id: "ISS-2"
kind: "issue"
title: "Governance source-of-truth conflict: lifecycle decisions / ADRs / requirements live in development-roadmap.md, not in the Notion Shared Project Memory"
notion_page_id: "3cfe6070-43bc-8158-b252-cac940b97430"
notion_url: "https://app.notion.com/p/Governance-source-of-truth-conflict-lifecycle-decisions-ADRs-requirements-live-in-development-r-3cfe607043bc8158b252cac940b97430"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T20:19:00.000Z"
status: "Resolved"
---

# Governance source-of-truth conflict: lifecycle decisions / ADRs / requirements live in development-roadmap.md, not in the Notion Shared Project Memory

## Summary

Phases 1–7 produced ~40 accepted decisions (DEC / AR-DEC / BD-DEC / SEC-DEC), 9 Accepted ADRs (ADR-0001–0009), a full requirement set (FR-/NFR-), risks, work items, and a human review log — all recorded in development-roadmap.md + docs/. The Notion Shared Project Memory databases (Decisions, Architecture Decisions, Requirements, Milestones) are EMPTY for Fitney, so the generated .project-memory/ mirror reports ‘no decisions / no ADRs / no requirements’, contradicting project reality.

## Type

Architecture Conflict

## Priority

High

## Evidence

development-roadmap.md (Accepted decisions table; ADR-0001–0009; human review log through phase 7); docs/architecture/adrs/ (9 files, Status: Accepted); .project-memory/manifest.json counts all zero; Notion queries on all 9 data sources returned 0 rows (2026-09-02).

## Proposed Resolution

RESOLVED 2026-09-02 by the one-time controlled governance migration. The durable governance set has been migrated from development-roadmap.md + docs/ into the Notion Shared Project Memory: the four governing Decisions (A Notion-canonical governance, B platform-release next, C phase-7 held pending executed verification, D 300 s re-auth dev-only) plus DEC-001…DEC-006, UX-DEC-01…UX-DEC-09, VIS-DEC-01…VIS-DEC-09, AR-DEC-01…AR-DEC-11, BD-DEC-01…BD-DEC-05, SEC-DEC-01…SEC-DEC-05 (source IDs preserved in titles/bodies; BD-DEC-04 marked Superseded); ADR-0001…ADR-0009 in Architecture Decisions (all Accepted); the full FR-/NFR- requirement set in Requirements (Status = Approved, none Verified — no executed verification); lifecycle phases 1–11 + the DEP-1 execution gate, boundary-lint gate, sync-conformance gate, pre-beta security gate, and the MVP release in Milestones & Releases; still-relevant open questions and risks (OQ-1–9, DEP-5, UX-OQ/VIS-OQ/AR-OQ/BD-OQ residuals, and three consolidated standing-risk issues) in Issues & Open Questions; and phase-1–4 approval reviews + the phase-4 revision history in Reviews & Verification. Implementation noise, obsolete notes, resolved historical risks, and completed scratch tasks were intentionally excluded. Notion is now the SOLE canonical source of durable project governance; development-roadmap.md and docs/ are working/reference material and must not override canonical Notion records; .project-memory/ is the generated one-way mirror (regenerated after this migration). See governing Decision A.
