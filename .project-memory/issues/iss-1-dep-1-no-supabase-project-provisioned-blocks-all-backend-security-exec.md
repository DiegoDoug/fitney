---
id: "ISS-1"
kind: "issue"
title: "DEP-1: no Supabase project provisioned — blocks all backend/security execution & verification"
notion_page_id: "3cfe6070-43bc-81a4-8428-df5f6474de17"
notion_url: "https://app.notion.com/p/DEP-1-no-Supabase-project-provisioned-blocks-all-backend-security-execution-verification-3cfe607043bc81a48428df5f6474de17"
created: "2026-09-02T17:34:00.000Z"
last_edited: "2026-09-03T04:26:00.000Z"
status: "Resolved"
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

RESOLVED (DEV) 2026-09-03. Hosted development Supabase project fitney-dev provisioned (ref oaubwbvoaydveguqjovq, MetaTrack org, Postgres 17, $0/month free tier) after the human authorised git + one dev project. Migrations 0001–0006 + seed applied cleanly (supabase db push + db reset --linked); db lint --linked clean; Supabase security advisor clean except one intentional INFO (deletion_receipts). 31 hosted behavioural checks on the real authenticated/anon/service_role roles = 31/0 (RLS isolation, sync_apply, recompute + golden vectors, service_role BYPASSRLS, ISS-27, F-11/F-13). Local stack + db-verify GitHub Actions gate also green (github.com/DiegoDoug/fitney). The backend/security execution & verification that this issue blocked is now unblocked for dev. PRODUCTION Supabase project + hosted auth hardening + supabase secrets set + Edge Function deploy remain a deferred human step (tracked in platform-release C-2 / TASK-4). Publishable/anon key in the git-ignored .env; no service-role key stored anywhere in the repo.
