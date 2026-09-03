---
id: "ISS-25"
kind: "issue"
title: "F-2: sync_apply leaks a raw NOT NULL exception on partial payloads instead of returning {status:\"rejected\"}"
notion_page_id: "3cfe6070-43bc-815d-aaa0-e5f40ebff7c1"
notion_url: "https://app.notion.com/p/F-2-sync_apply-leaks-a-raw-NOT-NULL-exception-on-partial-payloads-instead-of-returning-status-rej-3cfe607043bc815daaa0e5f40ebff7c1"
created: "2026-09-02T23:40:00.000Z"
last_edited: "2026-09-03T02:46:00.000Z"
status: "Resolved"
---

# F-2: sync_apply leaks a raw NOT NULL exception on partial payloads instead of returning {status:"rejected"}

## Summary

Found by platform-release (phase 8) local execution 2026-09-02. sync_apply's INSERT path runs insert into <t> select r.* from jsonb_populate_record(null::<t>, payload). jsonb_populate_record fills columns absent from the payload with NULL, and select r.* provides those NULLs explicitly (bypassing column DEFAULTs), so any defaulted NOT NULL column not present in the payload (e.g. workout_templates.tags, content_version, archived) triggers a not_null_violation. The migration-0006 exception handler catches foreign_key_violation / check_violation / unique_violation / insufficient_privilege but NOT not_null_violation, so the raw exception propagates to the caller. Full coalesced-row payloads (the documented real client behaviour) work correctly ({status:'applied', version:1} verified). Blocks pgTAP suite 02 entirely and suite 04 partially (both send minimal payloads).

## Type

Bug

## Priority

Medium

## Evidence

docs/platform/platform-release.md §13 (F-2); docs/platform/evidence/03-supabase-test-db.txt (suites 02 line 19, 04 line 75). Confirmed by direct runtime probe (partial payload throws; full payload applies).

## Proposed Resolution

RESOLVED 2026-09-02 under WORK-022. Fix: not_null_violation added to both sync_apply exception handlers (INSERT + UPDATE paths) in migration 20260902090006 -> a malformed partial payload now returns a structured {"status":"rejected"} and never leaks a raw NOT NULL exception. Per the approved resolution: column defaults are NOT silently merged into the payload; the documented contract (a valid upsert carries the coalesced latest full-row state) is unchanged. pgTAP happy-path cases in tests/02 + tests/04 now send full-row payloads; an explicit negative test in tests/02 proves a partial payload -> rejected, no row created, no exception. Reverified: full-row insert -> applied v1; replay -> duplicate (see F-8); valid update -> applied v2; stale base_version -> conflict; tombstone -> applied v3; unknown entity -> 22023; operation_id idempotency; RLS rejection (tests/01). Evidence: docs/platform/evidence/07-08; docs/security/security-identity.md §8.1; docs/engineering/backend-data-implementation.md §9.1.
