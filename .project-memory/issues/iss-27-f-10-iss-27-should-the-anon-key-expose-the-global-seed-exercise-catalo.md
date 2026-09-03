---
id: "ISS-27"
kind: "issue"
title: "F-10 / ISS-27: should the anon key expose the global seed-exercise catalogue?"
notion_page_id: "3d0e6070-43bc-81aa-8248-cd431be359d1"
notion_url: "https://app.notion.com/p/F-10-ISS-27-should-the-anon-key-expose-the-global-seed-exercise-catalogue-3d0e607043bc81aa8248cd431be359d1"
created: "2026-09-03T02:47:00.000Z"
last_edited: "2026-09-03T04:26:00.000Z"
status: "Resolved"
---

# F-10 / ISS-27: should the anon key expose the global seed-exercise catalogue?

## Summary

The exercise_select RLS policy is USING (owner_user_id IS NULL OR owner_user_id = auth.uid()) with no role restriction, so an unauthenticated (anon) session can read the ~8 global seed exercises. This is consistent with SEC-DEC-05 ("global … readable by everyone") and migration 0005's comment ("global seed rows readable by all"), and the data is non-sensitive public fitness content. However, the Fitney client has NO anon / browse-before-login flow — the whole app is behind auth (ADR-0009, FR-AUTH-01) — so exposing the catalogue to the anon key is unnecessary attack surface. Surfaced by platform-release WORK-022 execution: tests/04 had asserted "anon sees no exercises", which contradicted SEC-DEC-05; the test was corrected to assert the real boundary ("anon sees no PRIVATE exercises").

## Type

Question

## Priority

Low

## Evidence

supabase/migrations/20260902090005_rls.sql (exercise_select); SEC-DEC-05; docs/security/security-identity.md §8.1 (F-10) + §9 SEC-RESID-9; supabase/tests/04_security_adversarial_test.sql (anon block). Owner: security-identity.

## Proposed Resolution

RESOLVED 2026-09-03 by human decision: the exercise catalogue (global seed + private) is AUTHENTICATED-ONLY. Implemented in migration 20260902090006 — exercise_select recreated TO authenticated using (owner_user_id is null or owner_user_id = auth.uid()). This refines the READ half of SEC-DEC-05 ("global … readable by everyone" -> "readable by every authenticated user"); the write model is unchanged. Verified on hosted fitney-dev (PG17): an anon session sees 0 exercises; an authenticated session reads the 8 global seed rows. Also verified locally (supabase test db 68/68) and in CI. tests/04 anon assertion restored to "anon sees no exercises at all". Tracked as SEC-RESID-9 (now Closed) in docs/security/security-identity.md §9.
