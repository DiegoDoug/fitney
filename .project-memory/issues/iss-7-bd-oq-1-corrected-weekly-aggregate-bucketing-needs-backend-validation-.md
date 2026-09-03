---
id: "ISS-7"
kind: "issue"
title: "BD-OQ-1: corrected weekly-aggregate bucketing needs backend validation against golden vectors"
notion_page_id: "3cfe6070-43bc-81be-99fd-f206add6a39a"
notion_url: "https://app.notion.com/p/BD-OQ-1-corrected-weekly-aggregate-bucketing-needs-backend-validation-against-golden-vectors-3cfe607043bc81be99fdf206add6a39a"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T23:41:00.000Z"
status: "Open"
---

# BD-OQ-1: corrected weekly-aggregate bucketing needs backend validation against golden vectors

## Summary

The human directed the resolution: weekly aggregates must use profiles.week_start and the session-local calendar date ((started_at at time zone session.timezone)::date), not UTC date_trunc('week'). security-identity implemented this in 20260902090006 (SEC-F-9) at the human’s direction — outside its decision ownership. backend-data-engineering must review it and validate against the WORK-012 golden vectors before the Data & Progress increment.

## Type

Question

## Priority

Medium

## Evidence

docs/security/security-identity.md §6 SEC-F-9, §12 SEC-C4; supabase/migrations/20260902090006_security_hardening.sql (_week_start_for, rewritten recompute_week_aggregates, trigger updates); development-roadmap.md BD-OQ-1.

## Proposed Resolution

backend-data-engineering to review the SEC-F-9 corrected weekly bucketing in migration 20260902090006 (_week_start_for + rewritten recompute_week_aggregates / trg_recompute_from_* using (started_at at time zone session.timezone)::date + profiles.week_start) and validate against the WORK-012 golden vectors before the Data & Progress increment. UPDATE 2026-09-02 (platform-release phase 8 execution): this exact code contains defect F-5 (High) — _week_start_for(date, integer) does not exist because coalesce(p.week_start, 1) promotes smallint→integer and the function is declared (date, smallint). Every completed-session performed_sets write currently throws. F-5 must be fixed (cast/widen) as part of this validation. See new issue 'F-5: _week_start_for(date, integer) does not exist' and roadmap WORK-020 / WORK-022.
