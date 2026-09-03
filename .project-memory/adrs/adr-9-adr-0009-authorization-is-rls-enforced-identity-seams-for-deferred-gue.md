---
id: "ADR-9"
kind: "adr"
title: "ADR-0009 — Authorization is RLS-enforced; identity seams for deferred guest mode"
notion_page_id: "3cfe6070-43bc-81e9-9e22-f88bb0522f35"
notion_url: "https://app.notion.com/p/ADR-0009-Authorization-is-RLS-enforced-identity-seams-for-deferred-guest-mode-3cfe607043bc81e99e22f88bb0522f35"
created: "2026-09-02T20:10:00.000Z"
last_edited: "2026-09-02T20:10:00.000Z"
status: "Accepted"
---

# ADR-0009 — Authorization is RLS-enforced; identity seams for deferred guest mode

## Context

The client is untrusted. Every user-owned table and derived view must be isolated per user. Tokens must be stored securely. Guest mode is an open product decision (OQ-3) and must not be architecturally expensive to add later.

## Decision

Authorization is enforced server-side by Row Level Security (user_id = auth.uid()), independently for select/insert/update/delete, on every user-owned table and derived view. The client treats RLS as the authoritative boundary. Policy content and the adversarial test plan are owned by security-identity. Authentication is Supabase Auth (email/password for MVP), wrapped by a services/AuthProvider interface exposing userId, the session, and lifecycle events. Refresh/access tokens live only in expo-secure-store; never in SQLite, logs, or source. The local SQLite database is per-user (DB file keyed by userId). On verified sign-out or account deletion, that user's local DB file is dropped. Every repository call and every sync operation is scoped by userId; user_id is written on every owned row client-side and enforced by RLS server-side. Guest mode is deferred (OQ-3). The seam: AuthProvider can represent a local-only "guest" identity with a real userId, and because all data is already userId-scoped and offline-first, guest→account promotion becomes a bounded operation (rewrite user_id, attach to the Supabase session, run one sync). It ships only if that promotion is atomic and lossless (FR-AUTH-04). The delete-account flow is a Supabase Edge Function: requires re-authentication, performs server-side cascade/anonymization (behaviour choice is OQ-10), returns a completion receipt; the client then drops the local DB and clears secure storage.

## Consequences

No privileged key in the client; a single publishable/anon key per environment. Cross-account isolation is verifiable with two-user adversarial tests (SM-9, NFR-SEC) before any table is exposed. Guest mode stays cheap to add or to keep cut. Rejected: client-side authorization / trusting query filters; shared local DB with a user_id column filter; building guest mode now. Reversibility: high for the identity seams (interface-based). RLS-as-authorization is a deliberate standard Supabase posture; if a BFF is ever introduced it would sit in front of, not replace, RLS.

## Date

2026-09-02

## Implemented

false

## Supersedes

—
