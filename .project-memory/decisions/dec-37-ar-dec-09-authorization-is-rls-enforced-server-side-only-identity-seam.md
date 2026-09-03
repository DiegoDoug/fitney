---
id: "DEC-37"
kind: "decision"
title: "AR-DEC-09 — Authorization is RLS-enforced server-side only; identity seams for deferred guest mode"
notion_page_id: "3cfe6070-43bc-817b-98ce-df2dae35ee45"
notion_url: "https://app.notion.com/p/AR-DEC-09-Authorization-is-RLS-enforced-server-side-only-identity-seams-for-deferred-guest-mode-3cfe607043bc817b98cedf2dae35ee45"
created: "2026-09-02T20:06:00.000Z"
last_edited: "2026-09-02T20:06:00.000Z"
status: "Approved"
---

# AR-DEC-09 — Authorization is RLS-enforced server-side only; identity seams for deferred guest mode

## Summary

Authorization is RLS-enforced server-side only (user_id = auth.uid(), per operation); tokens in expo-secure-store; per-user local DB file dropped on verified sign-out/deletion; every repo/sync call userId-scoped; guest mode deferred behind an AuthProvider seam; delete-account is the one required Edge Function.

## Area

Architecture

## Rationale

Owner: software-architecture (policy content → security-identity) (phase 4). Implements CON-4, FR-AUTH-05. Evidence: docs/architecture/adrs/ADR-0009-authorization-and-identity-posture.md, system-architecture.md §5, §9.

## Consequences

Policy content owned downstream by security-identity (SEC-DEC-01–05). Full record: ADR-0009. No supersession.

## Decided By

Human + ChatGPT

## Decision Date

2026-09-02

## Implemented

false
