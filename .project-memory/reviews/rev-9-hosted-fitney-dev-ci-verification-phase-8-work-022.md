---
id: "REV-9"
kind: "review"
title: "Hosted fitney-dev + CI verification (phase 8 / WORK-022)"
notion_page_id: "3d0e6070-43bc-81fb-88af-ca802080f203"
notion_url: "https://app.notion.com/p/Hosted-fitney-dev-CI-verification-phase-8-WORK-022-3d0e607043bc81fb88afca802080f203"
created: "2026-09-03T04:28:00.000Z"
last_edited: "2026-09-03T04:28:00.000Z"
status: "Pass"
---

# Hosted fitney-dev + CI verification (phase 8 / WORK-022)

## Scope

Git init + GitHub repo + one hosted dev Supabase project, per the human's 'APPROVED - dev-only gate'. fitney-dev: ref oaubwbvoaydveguqjovq, MetaTrack org (human-selected), Postgres 17.6, us-east-1, $0/month (get_cost + confirm_cost recorded). Production deferred.

## Type

Release

## Reviewer

Claude Code

## Review Date

2026-09-03

## Findings

Git: git init -> initial commit -> gh repo create fitney --private -> pushed github.com/DiegoDoug/fitney. .env confirmed git-ignored, never committed. db-verify GitHub Actions gate GREEN on main: supabase db start -> db reset --local (+ seed) -> db lint --local --fail-on error (clean) -> supabase test db (01/02/03/04 ok, Result PASS, Tests=68). Hosted: supabase link + db push applied all 6 migrations clean on PG17; db reset --linked (after ISS-27/F-13/F-14) re-applied the full chain + seed clean; db lint --linked clean. Supabase security advisor after the fixes: ONE finding, INFO, by design - deletion_receipts RLS-enabled-no-policy (SEC-DEC-04: FORCE RLS + zero policies = service_role-only). Pre-fix advisor: 19 WARNs -> F-13 (recompute_/trigger/definer functions RPC-executable by anon+authenticated - same ALTER DEFAULT PRIVILEGES gap as F-11) + F-14 (mutable search_path on set_row_metadata/attach_row_metadata); both fixed under WORK-022; advisor re-run clean. 31 hosted behavioural checks (begin..rollback, as the real authenticated/anon/service_role roles with GoTrue-style claims) = 31/0: sync_apply full->applied / replay->duplicate / partial->rejected (no row, no raw exception) / stale->conflict / update->v2 / tombstone; trigger recompute (F-5/F-9) + exact golden vectors (max_load 110, e1RM 129.8333, session_volume/weekly 1430) + idempotency; tenant isolation (B sees 0 of A; UPDATE/DELETE 0 rows; forged user_id 42501; cross-tenant composite FK 23503; B cannot write personal_records 42501); service_role BYPASSRLS confirmed; ISS-27 anon sees 0 exercises; F-11/F-13 anon+authenticated cannot EXECUTE sync_apply/recompute. supabase test db --linked itself not usable (restricted test role cannot INSERT INTO auth.users) - suites covered by local + CI. Evidence: docs/platform/evidence/09, 10.

## Conditions

PASS covers local + hosted-DEV + CI. Deferred (human): production Supabase project; hosted auth hardening (SEC-C2); supabase secrets set + functions deploy delete-account; enable branch protection on main requiring the db-verify check. ISS-28 (Postgres 17 vs BD-DEC-01's PG15) routed to backend-data-engineering. WORK-020 client-TS<->server recompute cross-run moved to phase 5. Phase 8 stays AWAITING APPROVAL; phases 6/7 approval + client-engineering unlock need human approval of phase 8 (DEC-3).
