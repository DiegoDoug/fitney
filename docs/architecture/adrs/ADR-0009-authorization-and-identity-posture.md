# ADR-0009 — Authorization is RLS-enforced; identity seams for deferred guest mode

- Status: Accepted (phase 4 approved 2026-09-02) · **amended 2026-09-04 — sign-out / deletion disposition (CE-R5 v2, DEC-53, human-approved)**
- Date: 2026-09-02
- Owner: `software-architecture` (policy content → `security-identity`)
- Related: CON-4, FR-AUTH-01…05, FR-SYNC-04, NFR-SEC, roadmap OQ-3, OQ-10, SEC-OQ-1, SPEC §6.1, §14

## Context

The client is untrusted. Every user-owned table and derived view must be isolated per user. Tokens must be stored securely. Guest mode is an open product decision (OQ-3) and must not be architecturally expensive to add later.

## Decision

- **Authorization is enforced server-side by Row Level Security** (`user_id = auth.uid()`), independently for select/insert/update/delete, on every user-owned table and derived view. The client treats RLS as the authoritative boundary and never assumes it will only receive its own rows without it. Policy content and the adversarial test plan are owned by `security-identity`.
- **Authentication** is Supabase Auth (email/password for MVP), wrapped by a `services/AuthProvider` interface exposing `userId`, the session, and lifecycle events. Refresh/access tokens live only in **`expo-secure-store`**; never in SQLite, logs, or source.
- The **local SQLite database is per-user** (DB file keyed by `userId`). **Sign-out / deletion disposition (CE-R5 v2, DEC-53 — supersedes "on verified sign-out or account deletion, the file is dropped"):**
  - On **account deletion**, the client drops that user's DB file and clears secure storage **only after the `delete-account` flow returns a response confirming the server-side cascade completed** — never on a deletion request or timeout alone; an unconfirmed/failed response retains the local data and re-verifies.
  - On **user-initiated sign-out with nothing outstanding** (`sync_outbox` empty, no unresolved `sync_conflicts`), the file is dropped and secure storage cleared.
  - On **user-initiated sign-out with outstanding local work**, the file is **retained** and sign-out is a destructive action (UX-P5). Opening the choice sheet does **not** freeze local writes (a momentary freeze guards only the outstanding-work check); the account stays fully usable. Options: *back up & sign out* (freeze local writes **for the attempt**, run a final sync, then drop **only if** the outbox is empty **and** no conflict is unresolved — otherwise **restore writes** and re-prompt with the residual), *keep on this device & sign out*, or *discard N changes & sign out* (explicit informed confirm). The write freeze is held from a successful final verification through provider sign-out and teardown, and is released on a failed backup and on **Cancel**. A superseded in-flight attempt (Cancel mid-backup, an account switch, a signed-out-elsewhere) never signs out, drops a DB, or clears credentials. Sign-out **never** silently discards a `pending`/`dispatched` mutation, and there is **no time-based / automatic deletion** of unsynced or conflicted work (FR-SYNC-04).
  - **Remove account from this device** (Settings) permanently deletes a **retained, non-active** account's local file after an explicit loss confirmation naming the unsynced-change count. It refuses the active account.
  - On an **involuntary session end** (refresh failure → `session_expired`, or displacement by another account), the file is **retained** with no prompt and a non-blocking notice naming the account; secure storage for that user is cleared.
  - **Re-authentication** reactivates a retained file as the active per-user DB — draining its outbox is normal synchronization, never a deletion. A retained file leaves the device only by an explicit *remove account from this device*, a subsequent clean sign-out, or a confirmed deletion. Automatic reclamation of a **fully-drained** retained file after an inactivity window is **deferred to SEC-OQ-1**.
  - Retained data carries the **same at-rest posture** as an active per-user DB (no secrets in SQLite; tokens in `expo-secure-store` only).
- Every repository call and every sync operation is **scoped by `userId`**; `user_id` is written on every owned row client-side and enforced by RLS server-side.
- **Guest mode is deferred** (OQ-3). The seam: `AuthProvider` can represent a local-only "guest" identity with a real `userId`, and because all data is already `userId`-scoped and offline-first, guest→account promotion becomes a bounded operation (rewrite `user_id`, attach to the Supabase session, run one sync) rather than a redesign. It ships only if that promotion is atomic and lossless (FR-AUTH-04).
- The **`delete-account`** flow is a Supabase Edge Function: requires re-authentication, performs server-side cascade/anonymization (OQ-10 — resolved: hard cascade + non-PII receipt), returns a completion receipt **confirming the server-side cascade**; only then does the client drop the local DB and clear secure storage (per the disposition rules above — CE-R5 v2).

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
