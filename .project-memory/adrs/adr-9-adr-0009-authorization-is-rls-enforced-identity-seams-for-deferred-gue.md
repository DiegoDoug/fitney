---
id: "ADR-9"
kind: "adr"
title: "ADR-0009 — Authorization is RLS-enforced; identity seams for deferred guest mode"
notion_page_id: "3cfe6070-43bc-81e9-9e22-f88bb0522f35"
notion_url: "https://app.notion.com/p/ADR-0009-Authorization-is-RLS-enforced-identity-seams-for-deferred-guest-mode-3cfe607043bc81e99e22f88bb0522f35"
created: "2026-09-02T20:10:00.000Z"
last_edited: "2026-09-04T13:20:00.000Z"
status: "Accepted"
---

# ADR-0009 — Authorization is RLS-enforced; identity seams for deferred guest mode

## Context

The client is untrusted. Every user-owned table and derived view must be isolated per user. Tokens must be stored securely. Guest mode is an open product decision (OQ-3) and must not be architecturally expensive to add later.

## Decision

Authorization is enforced server-side by Row Level Security (user_id = auth.uid()), independently for select/insert/update/delete, on every user-owned table and derived view. The client treats RLS as the authoritative boundary. Policy content and the adversarial test plan are owned by security-identity. Authentication is Supabase Auth (email/password for MVP), wrapped by a services/AuthProvider interface exposing userId, the session, and lifecycle events. Refresh/access tokens live only in expo-secure-store; never in SQLite, logs, or source. The local SQLite database is per-user (DB file keyed by userId). SIGN-OUT / DELETION DISPOSITION (CE-R5 v2, DEC-53, human-approved 2026-09-04; supersedes the earlier 'on verified sign-out or account deletion the file is dropped'): (a) on account deletion the client drops that user's DB file and clears secure storage ONLY AFTER the delete-account flow returns a response confirming the server-side cascade completed — never on a deletion request or timeout alone; on an unconfirmed/failed response the local data is retained and deletion is re-verified. (b) On a user-initiated sign-out with nothing outstanding (sync_outbox empty, no unresolved sync_conflicts) the file is dropped and secure storage cleared. (c) On a user-initiated sign-out with outstanding local work the file is RETAINED and sign-out is a destructive action (UX-P5): back up & sign out (freeze local writes, run a final sync, then drop ONLY IF the outbox is empty AND no conflict is unresolved — else fall back), keep on this device & sign out, or discard N changes & sign out (explicit informed confirm). Sign-out NEVER silently discards a pending or dispatched mutation, and there is NO time-based / automatic deletion of unsynced or conflicted work (FR-SYNC-04). (d) On an involuntary session end (refresh failure → session_expired, or displacement by another account signing in) the file is RETAINED with no prompt and a non-blocking notice naming the account; secure storage for that user is cleared. (e) Re-authentication reactivates a retained file as the active per-user DB — draining its outbox is normal synchronization and never deletes the file; a retained file leaves the device only by an explicit 'remove account from this device', a subsequent clean sign-out, or a confirmed deletion. Automatic reclamation of a fully-drained retained file after an inactivity window is DEFERRED to SEC-OQ-1. Retained data carries the same at-rest posture as an active per-user DB (no secrets in SQLite; tokens in expo-secure-store only). Every repository call and every sync operation is scoped by userId; user_id is written on every owned row client-side and enforced by RLS server-side. Guest mode is deferred (OQ-3). The seam: AuthProvider can represent a local-only 'guest' identity with a real userId, and because all data is already userId-scoped and offline-first, guest→account promotion becomes a bounded operation (rewrite user_id, attach to the Supabase session, run one sync). It ships only if that promotion is atomic and lossless (FR-AUTH-04). The delete-account flow is a Supabase Edge Function: requires re-authentication, performs server-side cascade/anonymization (behaviour choice is OQ-10 — resolved: hard cascade + non-PII receipt), returns a completion receipt confirming the server-side cascade; the client then drops the local DB and clears secure storage (per (a) above).

## Consequences

No privileged key in the client; a single publishable/anon key per environment. Cross-account isolation is verifiable with two-user adversarial tests (SM-9, NFR-SEC) before any table is exposed. Guest mode stays cheap to add or to keep cut. Rejected: client-side authorization / trusting query filters; shared local DB with a user_id column filter; building guest mode now. Reversibility: high for the identity seams (interface-based). RLS-as-authorization is a deliberate standard Supabase posture; if a BFF is ever introduced it would sit in front of, not replace, RLS.

## Date

2026-09-02

## Implemented

false

## Supersedes

—
