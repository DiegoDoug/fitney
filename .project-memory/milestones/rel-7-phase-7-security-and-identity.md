---
id: "REL-7"
kind: "milestone"
title: "Phase 7 — Security and identity"
notion_page_id: "3cfe6070-43bc-8134-ba7c-fcdf6a87c0f8"
notion_url: "https://app.notion.com/p/Phase-7-Security-and-identity-3cfe607043bc8134ba7cfcdf6a87c0f8"
created: "2026-09-02T20:15:00.000Z"
last_edited: "2026-09-02T20:15:00.000Z"
status: "Ready for Review"
---

# Phase 7 — Security and identity

## Objective

Ownership of RLS migrations; child→parent composite-FK integrity; definer recompute model; global-seed guard; hardened sync_apply; OQ-10 hard cascade + non-PII receipt; delete-account rewrite; 24-assertion adversarial suite; threat model. Skill: security-identity.

## Type

Phase

## Exit Criteria

Artifact docs/security/security-identity.md. Reviewed PASS WITH CONDITIONS but HELD — NOT APPROVED (human 2026-09-02): 0 executed tests, verification gate unsatisfied. Stays Pass with Conditions / unapproved until DEP-1 is provisioned and supabase/tests/01–04 + db reset + db lint execute successfully (governing decision C). Realises SEC-DEC-01…SEC-DEC-05. Ordering: after phase 6; final approval depends on the platform-release DEP-1 execution evidence.
