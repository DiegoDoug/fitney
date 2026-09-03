---
id: "TASK-6"
kind: "task"
title: "WORK-022 — lifecycle recovery: fix the 15 defects surfaced by phase-8 execution (local + hosted)"
notion_page_id: "3d0e6070-43bc-81b3-8afc-f180f6208715"
notion_url: "https://app.notion.com/p/WORK-022-lifecycle-recovery-fix-the-15-defects-surfaced-by-phase-8-execution-local-hosted-3d0e607043bc81b38afcf180f6208715"
created: "2026-09-03T02:47:00.000Z"
last_edited: "2026-09-03T04:27:00.000Z"
status: "Review"
---

# WORK-022 — lifecycle recovery: fix the 15 defects surfaced by phase-8 execution (local + hosted)

## Scope

Human-authorised narrowly-scoped recovery across security-identity + backend-data-engineering. Migrations 0001/0003/0006 + pgTAP suites 01-04, corrected IN PLACE (migrations confirmed unshipped; project provisioned only afterwards). LOCAL findings: F-1 (perform->select x12, ratified), F-2 (not_null_violation -> {status:rejected}; full-row happy-path + partial negative test), F-3/F-4 (0-rows + protected-row-unchanged), F-5 (1::smallint x4, signature preserved), F-6 (plans 19/17/8/24), F-7 (array[]::uuid[]), F-8 (dedupe -> 'duplicate' per contract), F-9 (schema-qualify extensions.uuid_), F-11 (revoke sync_apply from anon), F-12 (::numeric casts). HOSTED findings (Supabase security advisor + real role model): F-13 (revoke all internal/trigger/definer functions from public,anon,authenticated — recompute_ was RPC-callable; tests/03 rewritten to verify trigger path + idempotency), F-14 (pin search_path on set_row_metadata/_attach_row_metadata). Plus ISS-27 (exercise_select TO authenticated — human decision) and the PG15->PG17 config deviation (ISS-28).

## Priority

Critical

## Executor

Claude Code

## Definition of Done

MET on all three surfaces 2026-09-03. LOCAL: db reset x2 + db lint clean (warning+error) + supabase test db PASS 68/68 + runtime probes. CI: db-verify green on main (68/68). HOSTED (fitney-dev, PG17): db push / db reset --linked / db lint --linked clean; Supabase security advisor clean bar 1 intentional INFO; 31 behavioural checks as authenticated/anon/service_role = 31/0. Evidence docs/platform/evidence/05-10. Awaits human approval of PHASE 8. Client-TS <-> server recompute golden-vector cross-run (WORK-020) moved to phase 5 as an acceptance condition (human 2026-09-03).

## Due Date

2026-09-02

## Verification

Pass
