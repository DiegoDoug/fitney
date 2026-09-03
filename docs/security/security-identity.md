# Security & Identity — Weight

## 1. Phase identity

- Lifecycle role: Security and identity (`security-identity`, phase 7 of 11)
- Execution date: 2026-09-02
- Roadmap state at execution: `IN PROGRESS` → `AWAITING APPROVAL`
- Upstream: phases 1–4 approved; phase 6 (`backend-data-engineering`) `APPROVED WITH CONDITIONS` with **8 gates** directed to this phase and an **OQ-10 decision** (hard cascade + non-PII receipt).
- Classification: **CREATE** (no prior security artifact) + **REVISE** of the backend RLS/functions/Edge Function it now owns.
- Reported result: `PASS WITH CONDITIONS`
- Evidence status: controls are **authored and internally reviewed**; **none executed** — no provisioned Supabase project (DEP-1). Inherits the phase-6 execution gate (BD-C1).

## 2. Scope

**In scope:** the trust model and threat scenarios for the Weight client ↔ Supabase system; authentication lifecycle (email/password, session/token, recovery, re-auth for destructive actions); authorization — **RLS is the sole server-enforced boundary** (ADR-0009) — for every user-owned table, the `sync_apply` RPC, the derived tables, the global-seed `exercises` model, and cross-account object references; secret handling; logging privacy; the `delete-account` Edge Function; and the adversarial regression suite.

**Out of scope / routed:** product scope, UX, visual design; the client-side `AuthProvider`/secure-store implementation (→ `client-engineering`, against the requirements here); hosted-environment auth configuration and secret provisioning (→ `platform-release`); running the suites as release evidence (→ `quality-engineering`); runtime alerting on auth/RLS failures (→ `production-operations`); a full external penetration test (recommended pre-beta, needs authorization).

## 3. System & trust model

| Asset | Sensitivity | Where |
|---|---|---|
| Workout data (loads, reps, notes, session times, PRs) | Personal, low-regulatory, moderate-privacy | `postgres` (RLS) + per-user device SQLite |
| Auth tokens (access + refresh) | High | Device `expo-secure-store` only; never in SQLite, logs, or artifacts |
| Account existence / email | Moderate (enumeration) | Supabase Auth (GoTrue) |
| Service-role key, `DELETION_RECEIPT_HMAC_KEY` | Critical | Server env only (Edge Function); never in client bundle or repo |
| Deletion receipts | Non-PII by construction (keyed HMAC of user id) | `deletion_receipts` (service_role only) |

| Actor | Trust |
|---|---|
| Account owner (valid JWT) | Trusted for own data only |
| Another authenticated user | Untrusted — primary adversary (tenant isolation) |
| Anonymous / no session | Untrusted |
| Holder of an unlocked device | Can read local SQLite (no secrets there); cannot get tokens without OS keystore |
| Network attacker | Mitigated by HTTPS/TLS (platform) |
| Malicious/modified client | Untrusted — may send arbitrary PostgREST filters, `sync_apply` args, forged payload fields |

**Trust boundaries:** (1) device app ↔ local storage; (2) app ↔ network (TLS); (3) **client ↔ Supabase — the load-bearing boundary; authorization = RLS + `SECURITY INVOKER` functions + FK integrity, all server-side.** The client is assumed hostile.

**Entry points:** GoTrue auth endpoints; PostgREST CRUD (all tables); `rpc/sync_apply`; `functions/v1/delete-account`; pull `SELECT`s. No server-side outbound fetches (no SSRF surface) except GoTrue-internal.

## 4. Threat scenarios / abuse cases

| ID | Scenario | Pre-mitigation risk |
|---|---|---|
| T-1 | Authenticated user A reads/mutates B's rows via a guessed/known `id` in a PostgREST filter or `sync_apply` (IDOR / broken object-level authz). | High |
| T-2 | A attaches a child row it owns to B's parent (`session_exercise.session_id = B.session`), or forges `user_id = B` on insert. | High |
| T-3 | A forges server-managed fields (`version`, `user_id`, `owner_user_id`, `updated_at`) through `sync_apply` or a direct write. | High |
| T-4 | A creates or hijacks a **global** seed exercise (`owner_user_id = NULL`) to inject content into every user's catalogue. | Medium |
| T-5 | A reads another user's derived rows (PRs/aggregates), or writes fake PRs. | Medium |
| T-6 | Error/timing oracle: `sync_apply` or a raw FK violation reveals whether a given `id` exists in another tenant. | Medium |
| T-7 | Account-existence enumeration via sign-up / password-reset / login error differences. | Medium |
| T-8 | Weak re-auth lets a stolen but stale access token trigger irreversible account deletion. | Medium |
| T-9 | Residual data after "delete my account" (derived/ledger rows not cascaded; receipt contains PII). | Medium |
| T-10 | Secret leakage — service-role key or HMAC key in the client bundle, repo, or logs. | Critical |
| T-11 | SQL injection via `sync_apply` dynamic SQL. | High if present |
| T-12 | Token/PII in server logs (PostgREST, Edge Function, `RAISE`). | Low–Medium |
| T-13 | Auth brute force / credential stuffing; `sync_apply` flooding. | Medium |
| T-14 | Dependency exposure (`supabase-js`, Deno std, `esm.sh`). | Low–Medium |

## 5. Security requirements

`[V]` verified by inspection · `[I]` inferred from design · `[U]` untested (needs DEP-1) · `[R]` routed

### Authentication & session
- **SEC-REQ-AUTH-01 [R→platform/client]** Email/password only for MVP; tokens in `expo-secure-store`; refresh handled by `supabase-js`; sign-out clears secure storage **and** drops the per-user local DB (ADR-0009).
- **SEC-REQ-AUTH-02 [R→platform]** Hosted GoTrue: enable email confirmation in **prod** (`config.toml` ships `enable_confirmations = false` for local dev only); set password policy (min length, breach check if available); enable leaked-password protection.
- **SEC-REQ-AUTH-03 [R→platform]** Enable GoTrue user-enumeration protection: uniform responses for sign-up-with-existing-email and password-reset-for-unknown-email; generic login failure text. (T-7)
- **SEC-REQ-AUTH-04 [V, partial]** Account deletion requires: `{confirm:true}`, a valid access token, `iat` within 300 s, **and** `last_sign_in_at` within 300 s (forces a real fresh sign-in, not just a token refresh). Implemented in `delete-account/index.ts`. Residual: 300 s is a heuristic; a nonce-based `/reauthenticate` flow is the stronger option — **SEC-RESID-1**.
- **SEC-REQ-AUTH-05 [R→platform]** Rate limits: keep GoTrue's built-in auth rate limits; add a per-user throttle on `delete-account`; monitor `sync_apply` call rate (single-user app → low ceiling). (T-13)

### Authorization (RLS is the boundary)
- **SEC-REQ-AZ-01 [V]** `ENABLE` + `FORCE ROW LEVEL SECURITY` on every user-owned table (`20260902090005`), independent policies per command, predicate `user_id = auth.uid()` (`profiles` keys on `id`). Derived tables: `ENABLE` (not `FORCE`) for owner-scoped reads; **all client DML revoked** (`20260902090006`).
- **SEC-REQ-AZ-02 [V]** **Child → parent ownership integrity** (gate 2): the 8 structural parent→child relationships use **composite `(parent_id, user_id)` FKs** to `parent(id, user_id)` (`20260902090006` S-1). A child's `user_id` can only reference a parent row with the *same* `user_id`. Soft references (`exercise_id`, `substitution_of_exercise_id`, `workout_template_id`, `source_workout_template_id`) are covered by the `_check_ref_ownership()` `BEFORE` trigger: a *private* referenced row must belong to the same user; *global* exercises are allowed. (T-1, T-2)
- **SEC-REQ-AZ-03 [V]** Server-managed fields are not client-writable: `set_row_metadata()` overwrites `created_at`/`updated_at`/`version` on every insert/update; `sync_apply` strips `id`/`user_id`/`owner_user_id`/`version`/`created_at`/`updated_at` from the payload and re-sets `id` and the ownership column to the caller (`20260902090006` S-8). (T-3)
- **SEC-REQ-AZ-04 [V]** `sync_apply` is `SECURITY INVOKER` with `set search_path = pg_catalog, public`; entity is a hardcoded whitelist; dynamic SQL uses `%I` for identifiers (from the whitelist / `information_schema`, never user input) and `$1`-parameterised `jsonb_populate_record` for values. **No injection path found** on inspection. (T-11)
- **SEC-REQ-AZ-05 [V]** `sync_apply` normalises `foreign_key_violation` / `check_violation` / `unique_violation` / `insufficient_privilege` on insert/update to a generic `{status:"rejected"}` — no leak of which constraint failed or whether a cross-tenant parent exists. Combined with composite FKs (which key on `(id, user_id)`), there is no id-existence oracle. (T-6)
- **SEC-REQ-AZ-06 [V]** Global-seed `exercises` model (gate 4): `owner_user_id IS NULL` = global (seeded by migrations / `service_role` only), `= auth.uid()` = private. RLS `SELECT (null OR mine)`, write `WITH CHECK (owner_user_id = auth.uid())`, plus `_guard_exercise_owner()` `BEFORE` trigger blocking (a) any client creating an `owner_user_id IS NULL` row and (b) any re-parenting. `exercises` deliberately does **not** follow the standard `user_id NOT NULL` contract — documented as an accepted dual-tenancy exception (BD-C5 style). (T-4)
- **SEC-REQ-AZ-07 [V]** Recompute write model (gate 3, BD-OQ-2): `recompute_*` and the trigger functions are `SECURITY DEFINER` (owner = migration role, which bypasses non-`FORCE` RLS on the derived tables) with `set search_path = pg_catalog, public`; `REVOKE ALL … FROM public`; no `EXECUTE` grant to `authenticated` (invoked only by the AFTER triggers). Helper functions also pinned to a fixed `search_path`. (T-5)

### Data protection & privacy
- **SEC-REQ-DATA-01 [V]** OQ-10: **hard cascade** deletion. `20260902090006` S-3 adds the missing `user_id → auth.users(id) ON DELETE CASCADE` FKs to `personal_records`, `weekly_aggregates`, `exercise_weekly_rollups`, `processed_operations`, so deleting the auth user removes the **entire** object graph. (T-9)
- **SEC-REQ-DATA-02 [V]** The only retained artifact is `deletion_receipts`: `user_ref` = HMAC-SHA256(server secret, user id), plus app version + timestamps. No email, name, or workout data. Table has `FORCE` RLS and **no policies** → invisible to `anon`/`authenticated`; only `service_role` (Edge Function) can write/read. (T-9)
- **SEC-REQ-DATA-03 [R→product/legal]** Retention period for **non-deleted** data and backups is still unspecified (OQ-10 covered deletion mechanics only) — **SEC-OQ-1**.
- **SEC-REQ-DATA-04 [I]** Analytics interface strips load/bodyweight/notes/email/payloads before dispatch (CON-9, client-side). Server telemetry: no row data in `RAISE`; PostgREST/Edge logs must not log JWTs or bodies — **SEC-REQ-LOG-01 [R→platform/ops]**. (T-12)
- **SEC-REQ-DATA-05 [I]** No file uploads, no Storage, no server-side outbound fetches → no upload-abuse or SSRF surface in MVP.

### Secrets & supply chain
- **SEC-REQ-SEC-01 [V]** Only the publishable/anon key is bundled client-side (CON-4). Service-role key and `DELETION_RECEIPT_HMAC_KEY` exist only as Edge Function env vars — **not in the repo** (verified: not present in `supabase/` or any doc). (T-10)
- **SEC-REQ-SEC-02 [R→platform]** `config.toml` contains no secrets; hosted secrets provisioned via EAS/Supabase env, rotated on suspicion.
- **SEC-REQ-SEC-03 [R→platform/quality]** Pin `supabase-js` and Deno std versions; the Edge Function imports `@supabase/supabase-js@2` from `esm.sh` — **pin to an exact version** and prefer `npm:`/`deno.land/x` with an integrity lock — **SEC-RESID-2**. Add `npm audit` / Deno `--lock` to CI. (T-14)

## 6. Findings

Severity: how exploitable × impact on tenant isolation / privacy / availability. All findings are **remediated in this phase** unless noted; all remediations are **[U] untested** pending DEP-1.

| ID | Sev | Finding (in the phase-6 baseline) | Evidence | Remediation |
|---|---|---|---|---|
| **SEC-F-1** | **High** | No child→parent ownership integrity. `session_exercises.session_id` etc. were single-column FKs to `parent(id)`; FK checks bypass RLS, so a client could insert a child it owns pointing at another user's parent, and probe parent-id existence. | `20260902090002_schema.sql` FKs; architecture §8.1 assumed denormalised `user_id` but did not mandate composite integrity | `20260902090006` S-1: `UNIQUE (id, user_id)` on 8 parents + composite `(parent_id, user_id)` FKs on 8 children; `_check_ref_ownership()` trigger for soft refs. Test: `tests/04` (gate 2 cases). |
| **SEC-F-2** | **Medium** | Recompute triggers would fail at runtime: derived tables had `FORCE` RLS + only a `SELECT` policy, and `recompute_*` ran as the invoker → INSERT/UPDATE blocked. Core feature (PRs/trends) broken. | `20260902090003` (functions `LANGUAGE plpgsql`, no `SECURITY DEFINER`) vs `20260902090005` (`FORCE` + select-only) | `20260902090006` S-2: `NO FORCE` on derived tables + revoke client DML + `SECURITY DEFINER` recompute functions with fixed `search_path`. |
| **SEC-F-3** | **Medium** | Hard-cascade account deletion would leave residual data: `personal_records`, `weekly_aggregates`, `exercise_weekly_rollups`, `processed_operations` had `user_id` with **no FK** to `auth.users`. | `20260902090002_schema.sql` (derived tables: `user_id uuid not null`, no FK) | `20260902090006` S-3: add `ON DELETE CASCADE` FKs. |
| **SEC-F-4** | **Medium** | `sync_apply` injected a `user_id` key even for `exercises` (which has `owner_user_id`), and did not strip a client-supplied `owner_user_id`; RLS still blocked cross-user writes but the code was fragile / defense-in-depth was missing. | `20260902090004_sync_apply.sql` (`|| jsonb_build_object('id', p_entity_id, 'user_id', auth.uid())`) | `20260902090006` S-8: per-entity ownership column; strip `owner_user_id`; force the correct column to `auth.uid()`; `_guard_exercise_owner()` trigger. |
| **SEC-F-5** | **Medium** | FK/constraint violations from `sync_apply` propagated raw → id-existence / cross-tenant oracle. | `20260902090004` (no exception handling on the dynamic insert/update) | `20260902090006` S-8: catch and normalise to `{status:"rejected"}`. |
| **SEC-F-6** | **Medium** | Weak re-auth on `delete-account` (decoded `iat` only; a token refresh would pass). Irreversible action. | `functions/delete-account/index.ts` v1 | Rewritten: require `iat` **and** `last_sign_in_at` within 300 s; write the receipt before the destructive call. Residual **SEC-RESID-1** (nonce reauth is stronger). |
| **SEC-F-7** | **Low** | Global-seed `exercises` dual-tenancy model was undocumented and lacked a write-guard trigger (RLS alone was correct but brittle). | `20260902090005` exercise policies | `20260902090006` S-4: documented here (§5 SEC-REQ-AZ-06) + `_guard_exercise_owner()` trigger. |
| **SEC-F-8** | **Low** | `esm.sh` unpinned import in the Edge Function. | `functions/delete-account/index.ts` | Flagged **SEC-RESID-2**; pin + lockfile in CI (routed). |
| **SEC-F-9** | Info | `recompute_week_aggregates` bucketed by UTC `date_trunc('week')`, ignoring the user's `week_start` and session-local date (a correctness, not security, bug — but this phase held the pen per human gate 6). | `20260902090003` | `20260902090006` (BD-OQ-1): `_week_start_for()` + rewritten `recompute_week_aggregates` + trigger updates using `(started_at at time zone session.timezone)::date` and `profiles.week_start`. **Boundary note:** decision ownership is `backend-data-engineering` + `client-engineering`; implemented here at explicit human direction; **backend must validate against golden vectors (WORK-012)**. |

**No injection, SSRF, upload, or crypto-misuse finding.** `sync_apply` dynamic SQL uses only whitelisted identifiers and parameterised values (SEC-REQ-AZ-04). HMAC uses WebCrypto `HMAC-SHA-256` correctly.

## 7. Controls implemented (this phase)

| Path | Change |
|---|---|
| [`supabase/migrations/20260902090006_security_hardening.sql`](../../supabase/migrations/20260902090006_security_hardening.sql) | **new** — S-1 composite ownership FKs + `_check_ref_ownership`; S-2 definer recompute + `NO FORCE` + DML revoke; S-3 deletion-cascade FKs; S-4 `_guard_exercise_owner`; S-8 hardened `sync_apply`; `deletion_receipts` table; BD-OQ-1 corrected week bucketing + `_week_start_for` + trigger rewrites |
| [`supabase/functions/delete-account/index.ts`](../../supabase/functions/delete-account/index.ts) | **rewritten** — commit to hard cascade (OQ-10); stronger re-auth (`iat` + `last_sign_in_at`); non-PII `deletion_receipts` write before the destructive call; HMAC user-ref |
| [`supabase/tests/04_security_adversarial_test.sql`](../../supabase/tests/04_security_adversarial_test.sql) | **new** — 24 assertions: cross-account read/write, composite-FK rejection, `sync_apply` forged `user_id` + cross-account parent, seed create/re-parent/hand-off, service_role seed, derived-write revoke, `processed_operations` scope + append-only, anon, null-`sub` JWT, `deletion_receipts` invisibility |
| `supabase/migrations/20260902090005_rls.sql` | **ownership transferred** to `security-identity`; content unchanged this pass (baseline is sound); 0006 adjusts the derived-table `FORCE` setting |

## 8. Verification

| Check | Method | Result |
|---|---|---|
| RLS coverage | Enumerated every table × {select,insert,update,delete}; mapped to a policy or an explicit revoke | `[V]` complete — every user-owned table has per-command policies; derived tables read-only + DML revoked; `deletion_receipts` no-policy/service-only |
| Tenant isolation (T-1, T-2) | Traced composite FK targets + `_check_ref_ownership` coverage against all parent/child and soft-ref pairs | `[V]` design; `[U]` runtime — `tests/04` gates 2 & 5 |
| Server-field forgery (T-3) | Read `set_row_metadata` + `sync_apply` strip/force logic | `[V]` |
| Injection (T-11) | Manual review of every `format()`/`execute` in `sync_apply` + `_pr_id`/`_agg_id` | `[V]` no injection path |
| Oracle (T-6) | Reviewed error paths; composite FK keys on `(id,user_id)`; `sync_apply` generic reject | `[V]` design |
| Deletion completeness (T-9) | Followed FK graph from `auth.users` after 0006 | `[V]` all user-owned + derived + ledger cascade; receipt is non-PII |
| Secrets (T-10) | `grep` for `service_role`, key material, `SUPABASE_SERVICE_ROLE_KEY` across repo | `[V]` only referenced as env var names; no key values present |
| Auth lifecycle (T-7, T-8) | Reviewed `delete-account`; GoTrue config | `[V]` function; `[R]` hosted config (SEC-REQ-AUTH-02/03/05) |
| Adversarial suite | Authored `tests/04` (24 assertions) + existing `tests/01` (20) | `[U]` — **not executed** (no DEP-1) |

**Distinguished:** design/inspection controls are `[V]`. Everything requiring a running database — every RLS policy, the composite FKs, the definer model, `sync_apply` behaviour, the Edge Function, and both adversarial suites — was `[U] untested` at phase-7 authoring. A scan/inspection is not proof of remediation.

### 8.1 WORK-022 remediation & executed verification (2026-09-02, local)

`platform-release` provisioned a local Supabase stack (Postgres 15.8, CLI 2.67.1) and executed the authored data/security layer for the first time. The initial run surfaced defects; **WORK-022** (this remediation, authorised as narrowly-scoped lifecycle recovery across `security-identity` + `backend-data-engineering`) fixed them **in place** — the migrations were never deployed to any hosted/released environment.

| ID | Defect (found by execution) | Fix | File |
|---|---|---|---|
| SEC-F-9 / **F-5** | `_week_start_for(<date>, coalesce(week_start,1))` → `coalesce(smallint,integer)` = `integer`; the function is `(date, smallint)` → `function _week_start_for(date, integer) does not exist` on every completed-session `performed_sets` write / `workout_sessions` state change. Not caught by `db reset`/`db lint` (plpgsql late binding). | `1::smallint` at all four `coalesce(…,1)` boundaries; **signature not widened** (SEC-F-9 intent preserved). Probed across `week_start` 0–6. | `20260902090006` (trg_recompute_from_performed_set, trg_recompute_from_session, recompute_week_aggregates) |
| **F-2** | `sync_apply` INSERT/UPDATE via `select r.* from jsonb_populate_record(null::t, payload)` provides explicit NULLs for defaulted `NOT NULL` columns absent from a partial payload; the exception handler did not catch `not_null_violation` → raw exception leaked to the caller. | Added `not_null_violation` to both handlers → structured `{"status":"rejected"}`. Defaults are **not** silently merged; a valid upsert must carry the coalesced full-row state (contract unchanged). Happy-path pgTAP cases now send full rows; an explicit negative test (`tests/02`) proves a partial payload is rejected with no row and no raw exception. | `20260902090006` (`sync_apply` S-8) |
| **F-8** | Dedupe path returned the stored `result` (`'applied'`) on a replayed `operation_id`, contradicting the documented `{"status":"duplicate"}` RPC contract and `tests/02`. | Return `'duplicate'` (with the original `resulting_version`). Client treats `applied`/`duplicate` identically (ADR-0003), so no behavioural risk. | `20260902090006` (`sync_apply`) |
| **F-11** | Supabase's `ALTER DEFAULT PRIVILEGES` grants `EXECUTE` on every new function to `anon`; `revoke … from public` does not remove a role-specific grant → **`anon` could call `sync_apply`** (all writes still failed RLS, but the RPC was reachable). | `revoke all on function sync_apply(…) from public, anon;`. `anon` now gets `permission denied`. | `20260902090006` |
| **F-9** | `uuid-ossp` lives in the `extensions` schema on Supabase; the pinned `search_path = pg_catalog, public` (SEC-REQ-AZ-07) cannot resolve `uuid_generate_v5` / `uuid_ns_url` → recompute throws `function uuid_ns_url() does not exist` on first trigger fire. | Schema-qualified `extensions.uuid_generate_v5` / `extensions.uuid_ns_url` in `_pr_id` / `_agg_id` — resolution is now search-path-independent; the pinned `search_path` is **unchanged** (SEC-REQ-AZ-07 upheld). | `20260902090003` |
| **F-1** | pgTAP suites used `perform <stmt>;` at top-level SQL script scope (plpgsql-only) → every suite aborted before `finish()`. | `perform` → `select` at script scope (12 statements, 4 files); `perform` inside `$$` bodies unchanged. Zero assertion change. Ratified against every changed line. | `tests/01`–`04` |
| **F-3 / F-4** | `tests/01` used `throws_ok` where a filtered RLS `UPDATE` returns **0 rows silently** (not an exception) — the assertion passed for the wrong reason / would fail once the suite ran. Also `tests/01` #7 relied on the F-2 leaked exception. | Replaced with explicit "0 rows affected" + "protected row unchanged" assertions; #7 now asserts `sync_apply` returns `rejected` and A's row is untouched. Same class fixed in `tests/04`. | `tests/01`, `tests/04` |
| **F-6** | Plan/assertion count mismatches: `tests/01` plan 20 vs 17 run; `tests/02` plan 14 vs 15; `tests/04` plan 24 vs 23. | Plans corrected to the exact executed counts (19 / 17 / 8 / 24). | `tests/01`–`04` |
| **F-7** | `db lint` warning: `recompute_exercise_prs` `v_keep uuid[] := '{}'` (text→uuid[] assignment cast). | `array[]::uuid[]`. `db lint --level warning` now clean. | `20260902090003` |
| **F-12** | `tests/03` compared `numeric` columns to bare integer literals; pgTAP `is()` needs matching types → `function is(numeric, integer, unknown) does not exist`. | Expected integers cast `::numeric`. Same golden values. | `tests/03` |
| **F-10** | `exercise_select` RLS (`owner_user_id IS NULL OR …`) lets an **anon** session read the global seed catalogue. Consistent with SEC-DEC-05 ("global … readable by everyone"), but the app has no anon flow. `tests/04` asserted "anon sees no exercises", contradicting SEC-DEC-05. | Test corrected to the real boundary ("anon sees no **private** exercises"). Whether the anon key should also expose the seed catalogue is an **open question — ISS-27** (route to `security-identity`; candidate tightening: restrict `exercise_select` `TO authenticated`). | `tests/04` (+ ISS-27) |

**Executed verification (local, Postgres 15.8):** [`docs/platform/evidence/`](../platform/evidence/)

| Command | Result |
|---|---|
| `supabase db reset` ×2 (fresh) | ✅ migrations `0001`–`0006` + seed apply cleanly and repeatably |
| `supabase db lint --level warning` | ✅ **No schema errors found** |
| `supabase db lint --level error --fail-on error` | ✅ exit 0 |
| `supabase test db` | ✅ **Result: PASS** — `01` (19) · `02` (17) · `03` (8) · `04` (24) = **68/68**, every suite reaches `finish()` with an exact plan |
| Runtime probe — set on a completed session | ✅ recompute runs; PRs/aggregates correct; idempotent on re-run |
| Runtime probe — `_week_start_for` for `week_start` 0–6 | ✅ correct week-start for every configured first day |
| Runtime probe — `sync_apply` full payload / replay / partial / anon | ✅ `applied` / `duplicate` / `rejected` (no raw exception, no row) / `permission denied` |

**Still `[U]` (hosted):** the same suites on a provisioned Supabase project against the real hosted role model (BYPASSRLS on `service_role`, GoTrue `auth.uid()`/`auth.role()`), and hosted auth hardening. Local `postgres`-as-owner `SECURITY DEFINER` behaviour matched expectations; hosted must confirm.

## 9. Residual risks

| ID | Risk | Owner | Accepted? |
|---|---|---|---|
| **SEC-RESID-1** | `delete-account` re-auth is a 300 s freshness heuristic, not a nonce-based reauthentication. A very fresh stolen token (< 5 min old, with a fresh sign-in) could trigger deletion. | `security-identity` + `client-engineering` | Accept for MVP; upgrade to `/reauthenticate` nonce or password re-entry before GA. |
| **SEC-RESID-2** | Edge Function imports `@supabase/supabase-js@2` from `esm.sh` unpinned; supply-chain exposure. | `platform-release` + `quality-engineering` | Must fix before first hosted deploy: pin exact version + Deno `--lock`. |
| **SEC-RESID-3** | **LOCAL execution done (2026-09-02).** WORK-022 fixed ten defects surfaced by first run; `db reset` + `db lint` + `supabase test db` (68/68) + runtime probes all green on Postgres 15.8 (§8.1). **HOSTED still unverified**: the real Supabase role model (`service_role` BYPASSRLS, GoTrue-issued `auth.uid()`/`auth.role()`) may still differ from `postgres`-as-owner locally. | `platform-release` + `quality-engineering` | **Not accepted for client integration until the HOSTED run is green + CI-gated.** Inherits BD-C1. |
| **SEC-RESID-4** | `_guard_exercise_owner` relies on `auth.role() = 'service_role'` (or NULL) to permit global-seed writes. **Local run confirmed:** `supabase/seed.sql` runs after all migrations as the migration role (`auth.role()` NULL) and its 8 global inserts succeed; `tests/04` also confirms a `service_role` global insert succeeds and an `authenticated` one is blocked. Re-confirm on the hosted seed path. | `backend-data-engineering` + `security-identity` | Track; low impact (seeds are dev-only until OQ-4). |
| **SEC-RESID-5** | Data retention (non-deleted data, backups, PITR window) is unspecified — **SEC-OQ-1**. | Human + `production-operations` | Track; not blocking MVP build, blocking beta privacy statement. |
| **SEC-RESID-6** | No external penetration test of the deployed API. | Human | Recommended before beta; needs authorization + a staging env. |
| **SEC-RESID-7** | Trigger-heavy write path (`set_row_metadata` + `_check_ref_ownership` + `_guard_exercise_owner` + recompute triggers) — a bug in any BEFORE trigger blocks legitimate writes. High test surface. | `quality-engineering` | Covered by `tests/01`–`04` + WORK-013; must be green on DEP-1. |
| **SEC-RESID-8** | Weekly-aggregate correctness fix (SEC-F-9) was implemented outside this phase's decision ownership; WORK-022 additionally corrected an `smallint`/`integer` resolution bug in it (F-5) and probed `week_start` 0–6 + the `tests/03` golden vectors (1430 weekly volume, e1RM 116.6667/129.8333) — all green locally. | `backend-data-engineering` | Backend to formally review + cross-validate vs the WORK-012 client TS golden vectors before Data & Progress. |
| **SEC-RESID-9** | `exercise_select` RLS lets an **anon** session read the global seed catalogue (consistent with SEC-DEC-05, but the app has no anon flow). **ISS-27** — open question / candidate tightening (`exercise_select TO authenticated`). | `security-identity` | Track; not blocking (public fitness data; no anon path in the client). Decide before beta. |

## 10. Requirement traceability

| Upstream | Security control |
|---|---|
| NFR-SEC / FR-AUTH-05 (cross-account isolation) | SEC-REQ-AZ-01/02/03; SEC-F-1 fix; `tests/01` + `tests/04` |
| ADR-0009 (RLS is the authorization boundary) | §3 trust model; SEC-REQ-AZ-01…07 |
| FR-AUTH-01…04 (auth lifecycle) | SEC-REQ-AUTH-01…05 (mostly routed to platform/client) |
| FR-SET-03 (account deletion + receipt) | SEC-REQ-DATA-01/02; `delete-account` rewrite; `deletion_receipts` |
| OQ-10 (deletion behaviour) | RESOLVED — hard cascade + non-PII receipt (SEC-REQ-DATA-01/02) |
| CON-4 / CON-9 (no service key client-side; telemetry privacy) | SEC-REQ-SEC-01; SEC-REQ-DATA-04; SEC-REQ-LOG-01 |
| NFR-PRIVACY | SEC-REQ-DATA-01…04; SEC-OQ-1 (retention) |
| BD-OQ-2 (recompute grants) | RESOLVED — SEC-REQ-AZ-07 / SEC-F-2 fix |
| BD-OQ-1 (week bucketing) | Implemented per human direction (SEC-F-9); validation routed to backend |
| Phase-6 gate 1 (client-engineering lock) | §11 release conditions |
| Phase-6 gate 5 (adversarially test every policy) | `tests/04` + §8; authoritative suite ownership now here |

## 11. Release conditions (blocking gates for `client-engineering` and beyond)

1. **DEP-1 execution (inherits BD-C1 / gate 1):** on a provisioned project, `supabase db reset` applies `0001`–`0006` + `seed.sql` cleanly, and **all four** pgTAP suites (`01`–`04`) pass. `client-engineering` stays `LOCKED` until this is green. (SEC-RESID-3) — **LOCAL: MET 2026-09-02** (`db reset` ×2, `db lint` clean, `supabase test db` = PASS 68/68, §8.1). **HOSTED: still required** — re-run on a provisioned project to confirm against the real Supabase role model.
2. **Hosted auth hardening (SEC-REQ-AUTH-02/03/05):** email confirmation on, user-enumeration protection on, leaked-password protection on, auth rate limits confirmed — before any non-dev environment.
3. **Secrets provisioned (SEC-REQ-SEC-01/02):** `SUPABASE_SERVICE_ROLE_KEY` and `DELETION_RECEIPT_HMAC_KEY` set as Edge Function env; confirmed absent from the client bundle (build-time check).
4. **Edge Function dependency pin (SEC-RESID-2):** exact-version import + Deno lockfile before first deploy.
5. **RLS ownership:** `security-identity` remains owner of `20260902090005` + `20260902090006`; any later schema change touching a policy, an ownership FK, a definer function, or `sync_apply` routes back here.
6. **Pre-beta:** resolve SEC-RESID-1 (nonce reauth), SEC-OQ-1 (retention policy), and commission an external pen test (SEC-RESID-6).

## 12. Status

**`PASS WITH CONDITIONS`.**

The security model is defined end-to-end: trust boundaries and a threat catalogue tied to the real system; RLS as the sole authorization boundary with per-command policies on every table; **child→parent ownership integrity enforced by composite FKs** plus triggers for soft references; server-managed fields non-forgeable; a hardened `sync_apply` with no injection path and no id-existence oracle; a documented and guarded global-seed model; a working recompute-write model under RLS; hard-cascade account deletion with a non-PII receipt outside the user graph; and a 24-assertion adversarial suite. Nine findings in the phase-6 baseline (one High, five Medium, three Low/Info) are remediated in `20260902090006` and the rewritten Edge Function.

Conditions:

- **SEC-C1 (inherits BD-C1):** **LOCAL execution now PASSES.** `platform-release` provisioned a local Postgres 15.8 stack; WORK-022 remediated ten defects surfaced by first execution (F-1…F-12, §8.1); `supabase db reset` ×2 + `supabase db lint` (clean) + `supabase test db` = **PASS 68/68**, plus targeted runtime probes. **HOSTED execution is still outstanding** — the same must be re-run on a provisioned Supabase project (real `service_role` BYPASSRLS, GoTrue) and CI-gated. `client-engineering` stays `LOCKED` until the hosted run is green and this phase is approved (SEC-RESID-3, release condition 1).
- **SEC-C2:** Hosted auth configuration (SEC-REQ-AUTH-02/03/05) and secret provisioning (SEC-REQ-SEC-01/02) + the Edge Function dependency pin (SEC-RESID-2) are routed to `platform-release` and are hard gates for any non-dev environment.
- **SEC-C3:** SEC-RESID-1 (nonce-based re-auth for deletion) and SEC-OQ-1 (data-retention / backup policy) are accepted for the MVP build but must be resolved before beta; an external pen test is recommended.
- **SEC-C4 (boundary note):** SEC-F-9 (weekly-aggregate bucketing, BD-OQ-1) was implemented here at explicit human direction though decision ownership is `backend-data-engineering`; backend must review and validate it against the WORK-012 golden vectors.
- **SEC-C5:** The global-seed `exercises` table is an accepted deviation from the standard `user_id NOT NULL` contract (dual tenancy), now documented and guarded.

### Next human decision required

Review `docs/security/security-identity.md` and `supabase/migrations/20260902090006_security_hardening.sql` + `supabase/tests/04_security_adversarial_test.sql` + the rewritten `supabase/functions/delete-account/index.ts`. Then record one of:

- `APPROVED — proceed to platform-release` (natural next: it must provision DEP-1 so the phase-6 + phase-7 execution gates can be discharged; optionally accepting SEC-C1…SEC-C5), or
- `APPROVED — proceed to client-engineering` (only if you also lift or restate gate 1 — not recommended; DEP-1 execution is still required before client integration), or
- `APPROVED WITH CONDITIONS` / revision requests.

`client-engineering` (phase 5) remains `LOCKED` under the human gate until migrations + lint + pgTAP execute successfully on DEP-1 and this phase is finalised. The lifecycle will not advance automatically.
