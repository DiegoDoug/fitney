---
id: "ISS-1"
kind: "issue"
title: "DEP-1: no Supabase project provisioned — blocks all backend/security execution & verification"
notion_page_id: "3cfe6070-43bc-81a4-8428-df5f6474de17"
notion_url: "https://app.notion.com/p/DEP-1-no-Supabase-project-provisioned-blocks-all-backend-security-execution-verification-3cfe607043bc81a48428df5f6474de17"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-02T23:41:00.000Z"
status: "Investigating"
---

# DEP-1: no Supabase project provisioned — blocks all backend/security execution & verification

## Summary

No dev/prod Supabase project exists. Migrations 20260902090001–06, RLS, sync_apply, recompute, delete-account, and pgTAP suites 01–04 are authored but UNEXECUTED. Lifecycle phase 5 (client-engineering) is human-gated LOCKED until these execute successfully on DEP-1 and security is finalised.

## Type

Blocker

## Priority

Critical

## Evidence

development-roadmap.md DEP-1, WORK-015/018, BD-RISK-1, SEC-RISK-1, SEC-C1, BD-C1. Until DEP-1 is provisioned, migrations 20260902090001–06, RLS, sync_apply, recompute, delete-account, and pgTAP suites 01–04 have 0 executed tests — a runtime/semantic error (e.g. jsonb coercion in sync_apply, definer/RLS interaction on the real role model, FK creation order, auth.role() in triggers) would be undiscovered. Blocks phases 6 & 7 final approval and the client-engineering unlock (governing decisions B & C).

## Proposed Resolution

PARTIAL 2026-09-02 (platform-release phase 8): a LOCAL Supabase environment is now provisioned and verified on the target Postgres 15.8 (Supabase CLI 2.67.1 + Docker). supabase db reset applies migrations 0001–0006 + seed cleanly and repeatably; supabase db lint --fail-on error passes (1 warning). supabase test db FAILS — execution found F-5 (High) and F-2 (Medium) code defects (new issues), so phases 6/7 are still NOT verified and client-engineering stays LOCKED. STILL BLOCKED: (a) no HOSTED Supabase project for Weight/Fitney (supabase projects list shows only unrelated projects) — creating dev + prod projects is a human decision (pick org, authorize); (b) no git repository — the db-verify CI merge gate cannot run and branch protection cannot be set until git init + a GitHub repo exist. See docs/platform/platform-release.md §12–§15.
