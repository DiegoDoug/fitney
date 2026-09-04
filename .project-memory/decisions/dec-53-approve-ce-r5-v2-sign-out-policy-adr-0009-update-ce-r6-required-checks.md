---
id: "DEC-53"
kind: "decision"
title: "Approve CE-R5 v2 (sign-out policy + ADR-0009 update), CE-R6 (required checks), CE-R7 (RN/worklets pins) — bounded implementation"
notion_page_id: "3d1e6070-43bc-81bf-b890-fa0cb9842e5a"
notion_url: "https://app.notion.com/p/Approve-CE-R5-v2-sign-out-policy-ADR-0009-update-CE-R6-required-checks-CE-R7-RN-worklets-pi-3d1e607043bc81bfb890fa0cb9842e5a"
created: "2026-09-04T04:21:00.000Z"
last_edited: "2026-09-04T04:21:00.000Z"
status: "Approved"
---

# Approve CE-R5 v2 (sign-out policy + ADR-0009 update), CE-R6 (required checks), CE-R7 (RN/worklets pins) — bounded implementation

## Summary

Explicit human authorization 2026-09-04 for BOUNDED implementation of three increment-2 routed items on PR #2 (branch phase-5/auth-isolation). NOT a Phase 5 acceptance and NOT merge authorization. Phase 5 stays IN PROGRESS; Foundation exit gate stays OPEN; phases 9/10/11 stay LOCKED. PR #2 must not be merged.

## Area

Architecture

## Rationale

CE-R5 v1's proposed 30-day auto-deletion of retained local data conflicted with FR-SYNC-04. v2 (docs/engineering/client-implementation.md §14.10) removes all time-based deletion of unsynced/conflicted work, makes re-authentication reactivate the retained DB (draining != deletion), requires 'Back up & sign out' to verify an empty outbox AND zero unresolved conflicts while freezing local writes during the final check, and gates account-deletion cleanup on a CONFIRMED server deletion. CE-R6: the 'Protect Main' ruleset requires only db-verify and client-verify.yml is path-filtered to client/ — making full-app-typecheck + logic-tests required also needs that path filter removed. CE-R7: RN 0.81.5 + react-native-worklets@0.5.1 are SDK-54 expo-install output that fixes a real Reanimated-4 peer gap; CI-green.

## Alternatives

Keep CE-R5 as the interim floor (clean→drop / unsynced→retain+notice) — rejected: no user choice/preview on a dirty user-initiated sign-out, no user-initiated vs involuntary distinction, retained-file lifecycle unspecified. Keep only db-verify required (CE-R6 status quo) — rejected: the client typecheck/boundary/test gates stay advisory. Revert the RN/worklets bump — rejected: re-introduces the missing Reanimated-4 peer (crash risk outside Expo Go).

## Consequences

CE-R5 v2: implement the revised sign-out policy per §14.10 + all §14.12 acceptance conditions (final-sync failure or Cancel restores writes+scheduling; cleanup stays account-scoped; password rules gate create/reset only, sign-in still accepts existing credentials; effective hosted password policy read directly where access allows); update ADR-0009; automatic time-based cleanup stays DEFERRED (SEC-OQ-1). CE-R6: apply the client-verify.yml path-filter removal FIRST, then add full-app-typecheck + logic-tests to required_status_checks built from a FRESHLY FETCHED ruleset preserving all unrelated settings; verify a non-client PR receives the required checks. CE-R7: ratify the pins; on-device runtime confirmation stays OPEN under WORK-010. Preserves and does not close SEC-OQ-1, SEC-RESID-1, OQ-3, OQ-9/DEP-4, UX-OQ-4, ISS-28, CE-R1, CE-R2.

## Decided By

Human

## Decision Date

2026-09-04

## Implemented

false

## GitHub Ref

https://github.com/DiegoDoug/fitney/pull/2
