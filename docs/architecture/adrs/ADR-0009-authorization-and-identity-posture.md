# ADR-0009 — Authorization is RLS-enforced; identity seams for deferred guest mode

- Status: Accepted (phase 4 approved 2026-09-02)
- Date: 2026-09-02
- Owner: `software-architecture` (policy content → `security-identity`)
- Related: CON-4, FR-AUTH-01…05, NFR-SEC, roadmap OQ-3, SPEC §6.1, §14

## Context

The client is untrusted. Every user-owned table and derived view must be isolated per user. Tokens must be stored securely. Guest mode is an open product decision (OQ-3) and must not be architecturally expensive to add later.

## Decision

- **Authorization is enforced server-side by Row Level Security** (`user_id = auth.uid()`), independently for select/insert/update/delete, on every user-owned table and derived view. The client treats RLS as the authoritative boundary and never assumes it will only receive its own rows without it. Policy content and the adversarial test plan are owned by `security-identity`.
- **Authentication** is Supabase Auth (email/password for MVP), wrapped by a `services/AuthProvider` interface exposing `userId`, the session, and lifecycle events. Refresh/access tokens live only in **`expo-secure-store`**; never in SQLite, logs, or source.
- The **local SQLite database is per-user** (DB file keyed by `userId`). On verified sign-out or account deletion, that user's local DB file is dropped.
- Every repository call and every sync operation is **scoped by `userId`**; `user_id` is written on every owned row client-side and enforced by RLS server-side.
- **Guest mode is deferred** (OQ-3). The seam: `AuthProvider` can represent a local-only "guest" identity with a real `userId`, and because all data is already `userId`-scoped and offline-first, guest→account promotion becomes a bounded operation (rewrite `user_id`, attach to the Supabase session, run one sync) rather than a redesign. It ships only if that promotion is atomic and lossless (FR-AUTH-04).
- The **`delete-account`** flow is a Supabase Edge Function: requires re-authentication, performs server-side cascade/anonymization (behaviour choice is OQ-10), returns a completion receipt; the client then drops the local DB and clears secure storage.

## Consequences

- No privileged key in the client; a single publishable/anon key per environment.
- Cross-account isolation is verifiable with two-user adversarial tests (SM-9, NFR-SEC) before any table is exposed.
- Guest mode stays cheap to add or to keep cut.

## Alternatives rejected

- **Client-side authorization / trusting query filters:** a client bug or a crafted request exposes other users' data.
- **Shared local DB with a `user_id` column filter:** a filtering bug leaks across accounts on a shared device; per-user DB files fail safe.
- **Building guest mode now:** unproven product value (OQ-3) and migration-correctness cost; the seam is enough.

## Reversibility

High for the identity seams (interface-based). RLS-as-authorization is a deliberate, standard Supabase posture and is not expected to reverse; if a BFF is ever introduced it would sit in front of, not replace, RLS.
