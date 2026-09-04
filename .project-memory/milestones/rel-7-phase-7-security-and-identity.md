---
id: "REL-7"
kind: "milestone"
title: "Phase 7 — Security and identity"
notion_page_id: "3cfe6070-43bc-8134-ba7c-fcdf6a87c0f8"
notion_url: "https://app.notion.com/p/Phase-7-Security-and-identity-3cfe607043bc8134ba7cfcdf6a87c0f8"
created: "2026-09-02T20:15:00.000Z"
last_edited: "2026-09-03T15:00:00.000Z"
status: "Approved"
---

# Phase 7 — Security and identity

## Objective

Ownership of RLS migrations; child→parent composite-FK integrity; definer recompute model; global-seed guard; hardened sync_apply; OQ-10 hard cascade + non-PII receipt; delete-account rewrite; 24-assertion adversarial suite; threat model. Skill: security-identity.

## Type

Phase

## Exit Criteria

HUMAN APPROVED WITH CONDITIONS 2026-09-03 after DEC-3 execution evidence was satisfied. Local pgTAP passed 68/68; CI db-verify passed; hosted fitney-dev behavioral verification passed 31/31 across authenticated, anon, and service_role; hosted advisor findings F-13/F-14 remediated; ISS-27 resolved to authenticated-only catalogue access. Remaining pre-beta/production conditions: stronger deletion re-auth, retention/PITR decision, production auth/secrets/function deployment, planned external validation, and ISS-28 PostgreSQL 17 ratification.

## GitHub Ref

https://github.com/DiegoDoug/fitney/commit/26ab1a6
