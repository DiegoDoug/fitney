# Platform and Release — Weight / Fitney

## 1. Phase identity

- Lifecycle role: Platform and release (phase 8 of 11)
- Owning skill: `platform-release`
- Execution date: 2026-09-02
- Roadmap/Notion state at execution: `IN PROGRESS` (authorized by governing decision **DEC‑2**, Notion Shared Project Memory)
- Artifact status: DRAFT, submitted for human approval
- Reported result: **PASS WITH CONDITIONS** (see §12)

## 2. Sources inspected

| Source | Use |
|---|---|
| `CLAUDE.md`, `SPEC.md` | Product boundaries, technical invariants, authority order |
| `.claude/skill-system/{lifecycle,decision-ownership,artifact-standard}.md`, `.claude/skills/platform-release/references/phase-contract.md` | Phase contract, ownership boundary, artifact shape |
| Notion Shared Project Memory (canonical) + `.project-memory/` mirror | Governing decisions DEC‑1…4, ADR‑0001…0009, requirements, milestones, issues ISS‑1…23, reviews |
| `development-roadmap.md`, `docs/architecture/*`, `docs/engineering/backend-data-implementation.md`, `docs/security/security-identity.md` | Accepted architecture, backend/security implementation contract and conditions |
| `supabase/` — `config.toml`, `migrations/20260902090001…06`, `functions/delete-account/index.ts`, `tests/01…04`, `seed.sql` | The authored data/security layer under verification |
| `.github/workflows/sync-project-memory.yml` | Existing CI |
| Repository tree, tooling (`git`, `docker`, `supabase`, `deno`, `eas`), Supabase CLI auth state | Runtime evidence |

## 3. Existing-state assessment

| Area | State found |
|---|---|
| **VCS** | **No git repository.** `git rev-parse` fails. No remote, no history, no branch. |
| CI | One workflow (`sync-project-memory.yml`) — Notion→mirror only. No build/test/DB gate. |
| Supabase local | `config.toml` minimal (project_id, `db.major_version=15`, dev auth flags, one function). No env separation. |
| Supabase hosted | **DEP‑1 not provisioned.** Supabase CLI *is* logged in; `supabase projects list` shows 5 unrelated projects across 3 orgs — none is Weight/Fitney. |
| Migrations | 6 forward-only SQL migrations authored, **never executed** (BD‑RISK‑1 / SEC‑RISK‑1). |
| pgTAP suites | 4 suites (01 RLS isolation, 02 sync_apply, 03 recompute, 04 adversarial), **never executed**. |
| Edge Function | `delete-account/index.ts` present; imports `@supabase/supabase-js@2` **unpinned** from `esm.sh` (SEC‑RESID‑2). No `deno.json`/`deno.lock`. |
| Tooling | `supabase` CLI 2.67.1, Docker 29.7.2 (daemon running), Node 24, `eas` 19.0.8. `deno` absent (installed during this phase → 2.9.6). |

## 4. Execution mode classification

| Deliverable | Mode | Rationale |
|---|---|---|
| Local Supabase environment + migration/pgTAP/lint execution | **CREATE** | Never executed; no environment existed |
| `supabase/config.toml` (env separation, auth hardening intent) | **REVISE** | Minimal file existed; expanded, no behavioural change to migrations |
| DB verification CI gate (`.github/workflows/db-verify.yml`) | **CREATE** | No such gate existed |
| Edge Function dependency pinning (`deno.json` + `deno.lock`) — SEC‑RESID‑2 | **CREATE** | No lockfile existed |
| `.env.example` Supabase client-safe / server-only contract | **REVISE** | Notion-only file existed |
| Hosted project topology + provisioning | **CREATE (blocked)** | DEP‑1 unprovisioned; provisioning is a human decision (§5, §12 C‑2) |
| This artifact | **CREATE** | Did not exist |

## 5. Environment topology

Three environments; risk-appropriate separation.

| Env | DB | Purpose | Auth email confirm | Seed | Secrets source |
|---|---|---|---|---|---|
| **local** | `supabase start` (Docker, Postgres 15.8) | Dev + CI verification | off (Mailpit) | placeholder `seed.sql` | CLI-generated, 127.0.0.1-only, non-sensitive |
| **development** (hosted, *to provision* — DEP‑1) | Supabase project, small tier | Integration, staging QA, `client-engineering` target | **on** | placeholder until OQ‑4 licensed dataset | Supabase dashboard secrets + `supabase secrets set`; CI `SUPABASE_ACCESS_TOKEN` in GitHub secrets |
| **production** (hosted, *to provision* — DEP‑1) | Supabase project, prod tier, PITR per SEC‑OQ‑1 (ISS‑6, undecided) | Release | **on** + SMTP sender | licensed dataset only (OQ‑4) | as development; separate project, separate keys |

Client (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) is per-environment and publishable only. The **service-role key and `DELETION_RECEIPT_HMAC_KEY` are server-only** (Edge Function runtime + CI), never bundled, never committed (CON‑4). `.env` is git-ignored; `.env.example` documents the split with placeholders only.

## 6. Supabase project and migration strategy

- **DB version:** Postgres **15** (`config.toml` `db.major_version = 15`), matching BD‑DEC‑01. Local image `supabase/postgres:15.8.1.085` (CLI 2.67.1 pin). Verified running: `PostgreSQL 15.8` — [evidence](evidence/00-versions.txt).
- **Migrations:** forward-only (ADR‑0006), `supabase/migrations/20260902090001…06`, applied by `supabase db reset` / `supabase db start`. No down migrations.
- **Fresh-create:** `supabase db reset` recreates the database and applies the whole chain + seed. Executed ≥3× cleanly this phase — [evidence](evidence/01-supabase-db-reset.txt), [first-start](evidence/04-first-start-migrations.txt). Only output is the benign `NOTICE: extension "pgcrypto"/"uuid-ossp" already exists, skipping` (base image pre-installs them; migration 0001 uses `create extension if not exists`).
- **Upgrade paths:** N/A — this is the initial migration set (no prior shipped version). The CI gate (§7) enforces fresh-create on every change; upgrade-path testing becomes a `quality-engineering` concern once a version ships.
- **Hosted apply:** once DEP‑1 exists — `supabase link --project-ref <ref>` then `supabase db push` (development first, then production). Not performed (DEP‑1).

## 7. CI/CD gates

**New:** `.github/workflows/db-verify.yml` — merge gate on any `supabase/**` change.

Steps (reproduced locally this phase):
1. `supabase db start`
2. `supabase db reset --local` — migration chain from scratch + seed
3. `supabase db lint --local --level warning --fail-on error`
4. `supabase test db` — pgTAP suites 01–04

This gate is **currently RED** and must stay red until F‑2 and F‑5 (§9, routed to owners) are fixed and re-verified. It is the concrete implementation of roadmap **WORK‑018 / SEC‑C1 / BD‑C1** ("migrations + lint + pgTAP execute successfully on DEP‑1 before `client-engineering` unlocks"); local execution satisfies the "execute successfully" intent independent of hosted provisioning.

**Cannot be created yet (no git remote):** branch protection / required-check configuration, `supabase/setup-cli` running against a real Actions runner, and the sync-project-memory workflow's `git push`. These need `git init` + a GitHub repository (human action, §12 C‑1).

**Not owned here:** the boundary-lint CI gate (WORK‑011) and the sync-protocol conformance suite (WORK‑013) are `client-engineering` / `quality-engineering` Foundation-increment prerequisites.

## 8. Authentication and secret-management configuration

- **Local (`config.toml`):** `enable_confirmations = false` (dev/CI speed), refresh-token rotation on, `minimum_password_length = 8`, conservative `[auth.rate_limit]`, `verify_jwt = true` for `functions.delete-account`.
- **Hosted (intended, security-identity SEC‑C2 — applied at the dashboard / `config push` once linked, NOT done here):** email confirmations **on**, secure email change on, real SMTP sender, leaked-password (HIBP) protection on, user-enumeration protection on, auth rate limits as `config.toml`.
- **Secrets:**
  - Client: only `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable) per environment.
  - Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `DELETION_RECEIPT_HMAC_KEY` — injected via `supabase secrets set` (Edge runtime) and GitHub Actions secrets (CI). `SUPABASE_ACCESS_TOKEN` / `SUPABASE_PROJECT_REF` for CI `link`/`push`.
  - **No secret value is committed.** Local `supabase start` prints CLI-generated keys valid only on `127.0.0.1`; they are not reproduced in this artifact, the roadmap, Notion, or any tracked file.

## 9. Edge Function deployment and dependency pinning

- **SEC‑RESID‑2 resolved.** `supabase/functions/delete-account/`:
  - `deno.json` — `imports` map pins `@supabase/supabase-js` → `npm:@supabase/supabase-js@2.112.4` (exact; `2.113`/`2.114` were published <24 h before execution and are blocked by Deno's minimum-dependency-age supply-chain policy — `2.112.4`, 2026‑08‑24, is the newest safe stable).
  - `deno.lock` — generated (`deno cache --lock`); SHA‑512 integrity for the full transitive tree (`auth-js`, `functions-js`, `phoenix`, `postgrest-js`, `realtime-js`, `storage-js`, `supabase-js`, `tslib`, `iceberg-js`).
  - `index.ts` import changed from `https://esm.sh/@supabase/supabase-js@2` (unpinned) → bare `@supabase/supabase-js`.
  - `deno check --config=deno.json index.ts` → clean ([deno 2.9.6]).
- **Deploy (not performed — DEP‑1):** `supabase functions deploy delete-account --project-ref <ref>` after `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=… DELETION_RECEIPT_HMAC_KEY=…`. `config.toml` `verify_jwt = true` is enforced.
- **Function behaviour** (re-auth freshness heuristic, hard-cascade, non-PII receipt) is owned by `security-identity` (SEC‑DEC‑04) and unchanged here. The 300 s heuristic remains development-only per **DEC‑4**; server-verifiable re-auth is a pre-beta gate (ISS‑4).

## 10. Commands executed and actual results

Local, Supabase CLI 2.67.1, Postgres 15.8, Docker 29.7.2. Full logs: [`docs/platform/evidence/`](evidence/).

| Command | Result | Evidence |
|---|---|---|
| `supabase start` | ✅ exit 0 — stack up; migrations 0001–0006 + seed applied on first init | [04](evidence/04-first-start-migrations.txt) |
| `supabase db reset` (×3) | ✅ exit 0 — full chain re-applied from scratch + seed each time; repeatable; only benign `extension already exists` NOTICE | [01](evidence/01-supabase-db-reset.txt) |
| `supabase db lint --level warning` | ⚠️ 0 errors, **1 warning** — `recompute_exercise_prs`: `v_keep uuid[] := '{}'` text→uuid[] cast (F‑7) | [02](evidence/02-supabase-db-lint.txt) |
| `supabase db lint --level error --fail-on error` | ✅ exit 0 — no error-level findings | [02b](evidence/02b-supabase-db-lint-failonerror.txt) |
| `supabase test db` (suites as authored) | ❌ **FAIL** — all 4 suites abort on `perform` at top-level SQL scope (F‑1) | [03 (earlier run)](evidence/03-supabase-test-db.txt) |
| `supabase test db` (after F‑1 mechanical fix) | ❌ **FAIL** — 01: 15/17 assertions pass (2 fail: F‑3/F‑4 wrong matcher; plan off by 3, F‑6). 02: 0 run (blocked by F‑2). 03: 0 run (blocked by **F‑5**, a real runtime bug). 04: 6/6 run assertions pass, then blocked by F‑2. | [03](evidence/03-supabase-test-db.txt) |
| Runtime probe: record a working set on a completed session | ❌ **ERROR** — `function _week_start_for(date, integer) does not exist` (F‑5) | §9 of [03](evidence/03-supabase-test-db.txt) reproduces it |
| Runtime probe: `sync_apply` with a full coalesced-row payload | ✅ `{"status":"applied","version":1}` — model sound for real client payloads | — |
| Runtime probe: `sync_apply` with a partial payload | ❌ raw `NOT NULL` exception on `tags` (F‑2) — RPC does not return structured `{"status":"rejected"}` | — |
| RLS assertions that executed (01: 15, 04: 6) | ✅ **PASS** — cross-account SELECT/UPDATE/DELETE/INSERT denial; `sync_apply` cross-account + forged-`user_id` rejection; composite-FK rejection; seed create/re-parent/hand-off blocked; `service_role` seed allowed; derived-table client-write revoked; `processed_operations` owner-scoped; anon denied; null-`sub` JWT sees nothing | [03](evidence/03-supabase-test-db.txt) |
| `deno check --config=deno.json index.ts` | ✅ clean | — |
| `git *` | ❌ `not a git repository` | — |
| `supabase projects list` | ✅ authenticated; **no Weight/Fitney project** | — |

### 10.1 WORK-022 re-run — after the routed defects were fixed (2026-09-02)

The human authorised **WORK-022** (narrowly-scoped lifecycle recovery across `security-identity` + `backend-data-engineering`). All ten defects above were fixed **in place** (migrations unshipped), plus five more that only surfaced once the suites ran end-to-end (F‑8…F‑12 — see §13). Re-verified locally (Postgres 15.8):

| Command | Result | Evidence |
|---|---|---|
| `supabase db reset` ×2 (fresh) | ✅ exit 0 — `0001`–`0006` + seed apply cleanly and repeatably | [05](evidence/05-work022-db-reset.txt) |
| `supabase db lint --level warning` | ✅ **No schema errors found** (F‑7 fixed) | [06](evidence/06-work022-db-lint.txt) |
| `supabase db lint --level error --fail-on error` | ✅ exit 0 | [06](evidence/06-work022-db-lint.txt) |
| `supabase test db` | ✅ **Result: PASS** — `01`/`02`/`03`/`04` = 19/17/8/24 = **68/68**; every suite reaches `finish()` with an exact plan | [07](evidence/07-work022-test-db.txt) |
| Runtime probe — working set on a completed session | ✅ recompute runs; `est_1rm`/`max_load`/`session_volume`/`weekly` correct; idempotent on re-run; `workout_sessions` status/`ended_at`/`deleted_at` changes OK | [08](evidence/08-work022-runtime-probes.txt) |
| Runtime probe — `_week_start_for` for `week_start` 0–6 | ✅ correct week-start for every configured first day (Sun/Mon/…/Sat) | [08](evidence/08-work022-runtime-probes.txt) |
| Runtime probe — `sync_apply` full / replay / partial / anon | ✅ `{"status":"applied"}` / `{"status":"duplicate"}` / `{"status":"rejected"}` (no row, no raw exception) / `permission denied for function sync_apply` | [08](evidence/08-work022-runtime-probes.txt) |

**BD-C1 / SEC-C1 are met LOCALLY.** The hosted re-run (real `service_role` BYPASSRLS + GoTrue) and the CI gate going green remain required before `client-engineering`.

## 11. Changed paths

| Path | Change |
|---|---|
| `supabase/config.toml` | Expanded: `[db.seed]`, `[api]`, `[auth]` + `[auth.email]` + `[auth.rate_limit]` + `[auth.mfa]`, `[edge_runtime]`, `[analytics]`; hosted-vs-local comments. `major_version = 15` unchanged. No migration/behaviour change. |
| `.github/workflows/db-verify.yml` | **New** — DB verification merge gate (reset + lint + pgTAP). |
| `supabase/functions/delete-account/deno.json` | **New** — pins `@supabase/supabase-js@2.112.4`. |
| `supabase/functions/delete-account/deno.lock` | **New** — integrity lockfile. |
| `supabase/functions/delete-account/index.ts` | Import line only: unpinned esm.sh → bare specifier. No logic change. |
| `.env.example` | **New** Supabase section: client-safe vs server-only vars, placeholders only. |
| `.gitignore` | Added `supabase/.branches/`, `supabase/.temp/`. |
| `supabase/tests/01…04_*.sql` | **WORK-022:** F‑1 (`perform`→`select`, 12 stmts, ratified); F‑3/F‑4 (`throws_ok` → 0-rows + protected-row-unchanged in `tests/01` and `tests/04`); F‑6 (plans corrected to 19/17/8/24); F‑10 (`tests/04` anon assertion → "no **private** exercises", per SEC-DEC-05 + ISS-27); F‑12 (`tests/03` `::numeric` casts); full-row payloads + an explicit partial-payload negative test in `tests/02`; `tests/01` #7 → asserts `sync_apply` `rejected` + A's row untouched. Every changed line is documented in `security-identity.md` §8.1. |
| `supabase/migrations/20260902090003_recompute.sql` | **WORK-022 (backend):** F‑9 — schema-qualify `extensions.uuid_generate_v5` / `extensions.uuid_ns_url` in `_pr_id`/`_agg_id`; F‑7 — `v_keep uuid[] := array[]::uuid[]`. |
| `supabase/migrations/20260902090006_security_hardening.sql` | **WORK-022 (security):** F‑5 — `1::smallint` at the four `_week_start_for` `coalesce(…,1)` boundaries (signature unchanged); F‑2 — `not_null_violation` added to both `sync_apply` handlers → structured `{"status":"rejected"}`; F‑8 — dedupe returns `{"status":"duplicate"}` per contract; F‑11 — `revoke … from public, anon` on `sync_apply`. |
| `CLAUDE.md` | Authority-wording only: "canonical lifecycle state" and "Accepted roadmap decisions" → Notion Shared Project Memory canonical, `development-roadmap.md`/`docs/` working/reference (per DEC‑1). No product/architecture/lifecycle decision changed. **Verified present in the repo copy** (the review copy attached to the WORK-022 prompt was stale). |
| `docs/security/security-identity.md`, `docs/engineering/backend-data-implementation.md` | **WORK-022:** added an executed-verification section (§8.1 / §9.1), updated residual risks / open questions / conditions. |
| `docs/platform/platform-release.md`, `docs/platform/evidence/*` | This artifact + captured command evidence (incl. `05`–`08` for the WORK-022 re-run). |

## 12. Requirement and decision traceability

| Upstream | This phase |
|---|---|
| DEC‑2 (platform-release is next phase) | Phase executed |
| DEP‑1 / ISS‑1 (Supabase project) | Local provisioned + verified; hosted **blocked** on a human decision (C‑2) |
| BD‑C1 / SEC‑C1 / WORK‑018 (migrations + lint + pgTAP execute successfully) | **LOCAL: MET (WORK-022, §10.1)** — `db reset` ×2 ✅, `db lint` clean at warning **and** error ✅, `supabase test db` = **PASS 68/68** ✅, runtime probes ✅. **HOSTED still required** + CI gate green. Phases 6 & 7 stay **not-approved** pending the hosted run (DEC‑3 upheld — 0 hosted-executed tests). |
| SEC‑RESID‑2 / ISS‑5 (Edge Function unpinned dependency) | **Resolved** — `deno.json` + `deno.lock`, exact pin |
| SEC‑C2 (hosted auth hardening) | Intent captured in `config.toml` + §8; **application deferred** to DEP‑1 (C‑2) |
| CON‑4 (no service-role key shipped/committed) | Upheld — client-safe/server-only split documented; no secret committed; evidence files scanned clean |
| NFR‑PORTABILITY / CON‑2 | Local stack is Docker/Expo-Go-independent; EAS/dev-build (DEP‑5) untouched, pre-production |
| BD‑OQ‑1 / SEC‑F‑9 / ISS‑7 / WORK‑020 (weekly bucketing) | F‑5 (found here) **fixed** under WORK-022; probed for `week_start` 0–6 + `tests/03` golden vectors green locally. **Formal cross-validation vs the WORK‑012 client TS vectors still owed.** |

Downstream consumers: `client-engineering` (blocked — needs the **hosted** run + CI gate green), `quality-engineering` (CI gate + evidence + client↔server golden-vector cross-run), `production-operations` (SEC‑OQ‑1 retention/PITR, ISS‑6), `security-identity` / `backend-data-engineering` (WORK-022 landed; hosted re-verify + ISS‑27).

## 13. Findings — all fixed under WORK-022 (2026-09-02)

All twelve were fixed **in place** (migrations unshipped) by `security-identity` + `backend-data-engineering` under the human-authorised WORK-022 recovery, then re-verified locally (§10.1). Per-line detail: [`security-identity.md`](../security/security-identity.md) §8.1.

| ID | Sev | Finding | Fix | Status |
|---|---|---|---|---|
| **F‑1** | High* | pgTAP `01`–`04` use `perform <stmt>;` at top-level SQL scope (plpgsql-only) → every suite aborts before `finish()`. | `perform`→`select` at script scope (12 stmts); `perform` in `$$` bodies unchanged; ratified line-by-line. | ✅ fixed |
| **F‑2** | Med | `sync_apply` INSERT/UPDATE leaked a raw `not_null_violation` on a partial payload (defaulted `NOT NULL` cols nulled by `jsonb_populate_record`). | `not_null_violation` added to both handlers → structured `{"status":"rejected"}`. Defaults not merged; full-row payloads still work. `tests/02` gains a partial-payload negative test. | ✅ fixed |
| **F‑5** | **High** | `20260902090006`: `_week_start_for(<date>, coalesce(week_start,1))` → `coalesce(smallint,integer)` = `integer`; fn is `(date,smallint)` → `function _week_start_for(date, integer) does not exist` on every completed-session write. | `1::smallint` at all four boundaries; **signature not widened**. Probed for `week_start` 0–6. | ✅ fixed |
| **F‑8** | Med | `sync_apply` dedupe returned the stored `'applied'` on a replayed `operation_id`, contradicting the `{"status":"duplicate"}` RPC contract + `tests/02`. | Return `'duplicate'` (+ original `resulting_version`). | ✅ fixed |
| **F‑9** | **High** | `uuid-ossp` is in the `extensions` schema; pinned `search_path = pg_catalog, public` can't resolve `uuid_generate_v5`/`uuid_ns_url` → recompute throws `function uuid_ns_url() does not exist` on first trigger fire. | Schema-qualified `extensions.…` in `_pr_id`/`_agg_id`; pinned `search_path` unchanged (SEC-REQ-AZ-07 upheld). | ✅ fixed |
| **F‑11** | Med | Supabase `ALTER DEFAULT PRIVILEGES` grants `EXECUTE` to `anon` on every new function; `revoke … from public` doesn't remove it → `anon` could call `sync_apply` (writes still failed RLS). | `revoke all on function sync_apply(…) from public, anon;`. | ✅ fixed |
| **F‑3 / F‑4** | Low | `tests/01`/`04` used `throws_ok` where a filtered RLS `UPDATE` returns **0 rows silently**; `tests/01` #7 relied on the F‑2 leaked exception. | Replaced with "0 rows affected" + "protected row unchanged"; #7 asserts `sync_apply` → `rejected` + A's row intact. | ✅ fixed |
| **F‑6** | Low | Plan/assertion mismatches (`01`: 20 vs 17; `02`: 14 vs 15; `04`: 24 vs 23). | Plans corrected to exact counts: **19 / 17 / 8 / 24**. | ✅ fixed |
| **F‑7** | Info | `db lint` warning: `v_keep uuid[] := '{}'` (text→uuid[] cast). | `array[]::uuid[]`. `db lint --level warning` now clean. | ✅ fixed |
| **F‑12** | Low | `tests/03` compared `numeric` columns to bare integer literals → `function is(numeric, integer, unknown) does not exist`. | Expected integers cast `::numeric`; same golden values. | ✅ fixed |
| **F‑10** | Low | `exercise_select` RLS lets an **anon** session read the global seed catalogue (consistent with SEC-DEC-05; app has no anon flow). `tests/04` asserted "anon sees no exercises", contradicting SEC-DEC-05. | Test → "anon sees no **private** exercises". **Open question tracked as ISS‑27** (candidate: `exercise_select TO authenticated`) → `security-identity`. | ✅ test fixed; **ISS‑27 open** |

\* F‑1 severity is "blocks all execution" but the fix is mechanical.

**Result after WORK-022:** `supabase db reset` ×2 ✅ · `supabase db lint` clean (warning + error) ✅ · `supabase test db` **PASS 68/68** ✅ · runtime probes ✅ (§10.1). The RLS/tenant-isolation model holds on the real Postgres role model — no cross-account leak, no privilege escalation, forged-`user_id`/cross-tenant-parent writes rejected, derived tables un-writable by clients, seed rows immutable to clients, `anon`/null-`sub` JWT see nothing, `anon` cannot call `sync_apply`.

## 14. Risks, deviations, blockers, open questions

**Blockers**
- **B‑1 (hosted DEP‑1):** no Weight/Fitney Supabase project. Creating hosted projects is billable and names infrastructure under a specific org — a human decision, not taken here. All hosted work (link, `db push`, `functions deploy`, hosted auth hardening, secret provisioning, PITR) is deferred.
- **B‑2 (no git repo):** `git init` + a GitHub repository are prerequisites for the CI gate to actually run, branch protection, and the existing sync workflow's `git push`.

**Deviations**
- **D‑1:** Under the human-authorised **WORK-022**, `platform-release` edited migrations (`0003`, `0006`) and pgTAP suites (`01`–`04`) owned by `security-identity` / `backend-data-engineering`. Each change is documented per-line in `security-identity.md` §8.1; the owners confirm at approval. Rationale: WORK-022 explicitly scoped lifecycle recovery across those two phases; migrations are unshipped so in-place correction is permitted.
- **D‑2:** local `deno` installed via `npm i -g deno` to generate the lockfile; not a project dependency.
- **D‑3:** Edge Function pinned to `@supabase/supabase-js@2.112.4` not the latest `2.114.0` (supply-chain min-age policy). Revisit when a newer stable is ≥24 h old.
- **D‑4:** local analytics (`vector`/logflare) container restarts on Windows without `DOCKER_HOST=tcp://localhost:2375`; non-essential for DB/RLS/pgTAP verification.

**Open questions (do NOT block phase 8; not resolved here)**
- SEC‑OQ‑1 / ISS‑6 — retention + backup/PITR window (needed for production tier + privacy statement; pre-beta).
- OQ‑9 / DEP‑4 — analytics/crash provider + consent (telemetry env config).
- OQ‑4 / DEP‑3 — licensed seed dataset (production seeding).
- DEP‑5 — EAS build/distribution + store accounts (pre-production hardening).
- SEC‑RESID‑1 / ISS‑4 — server-verifiable re-auth for `delete-account` (pre-beta; DEC‑4).

## 15. Downstream handoff

1. **Human:** decide DEP‑1 — pick an org, authorize creation of `weight-dev` and `weight-prod` Supabase projects (or authorize me, with the org + cost confirmed, to create them via the Supabase MCP). Provide the project refs. Run `git init` and create the GitHub repo, or authorize it.
2. **`security-identity` + `backend-data-engineering`:** ~~fix F‑5 / F‑2 / …~~ **DONE under WORK-022 (§10.1, §13).** Remaining: (a) formally cross-validate the recompute golden vectors against the WORK‑012 client TS implementation; (b) decide **ISS‑27** (anon read of the seed catalogue); (c) re-verify on the hosted project once DEP‑1 exists.
3. **`platform-release` (return):** once DEP‑1 + `git` — `supabase link`/`db push` (dev then prod), re-run `db reset` + `test db` + `db lint` on the hosted DB, apply hosted auth hardening, `supabase secrets set`, `supabase functions deploy delete-account`, wire branch protection to require `db-verify`, capture hosted evidence.
4. **`quality-engineering`:** adopt the CI gate; own the client↔server golden-vector cross-run and upgrade-path testing once a version ships.
5. **`production-operations`:** SEC‑OQ‑1 retention/PITR.

## 16. Verification performed

See §10, **§10.1**, and [`docs/platform/evidence/`](evidence/). After WORK-022: `supabase db reset` ×2 pass; `supabase db lint` clean at **warning and error**; `supabase test db` = **PASS 68/68** (every suite reaches `finish()` with an exact plan); runtime probes confirm the F‑5 recompute path, `week_start` 0–6 bucketing, and `sync_apply` full/replay/partial/anon behaviour. The Edge Function type-checks against its pinned lock (`deno check`). Evidence files scanned — no secrets.

## 17. Status

**PASS WITH CONDITIONS.**

Platform deliverables are complete and verified where authorized: a working local Supabase environment on the target Postgres 15, a repeatable fresh-create migration chain, a clean schema lint (warning + error), a DB-verification CI gate, resolved SEC‑RESID‑2 dependency pinning, environment/secret separation, and captured command evidence. First-ever local execution of the authored data/security layer surfaced **twelve defects** (two High: F‑5, F‑9; the rest Medium/Low) that inspection-only review missed — exactly what the DEP‑1 execution gate exists to catch. Under the human-authorised **WORK-022** recovery, `security-identity` + `backend-data-engineering` fixed all twelve in place (migrations unshipped); the suite now **passes 68/68 locally**.

Conditions:
- **C‑1:** `git init` + GitHub repository required for the `db-verify` CI gate to actually run and for branch protection (human action).
- **C‑2:** hosted DEP‑1 (development + production Supabase projects) requires a human decision (org + authorization); all hosted provisioning, hosted auth hardening, secret provisioning, Edge Function deploy, and PITR/retention config are deferred to it.
- **C‑3:** the pgTAP + lint gate now **passes locally**, but on `postgres`-as-owner, not the real hosted role model. **Phases 6 and 7 stay NOT approved** (DEC‑3: zero *hosted*-executed tests). The suites must re-run green on a provisioned Supabase project **and** the `db-verify` CI gate must be green before `client-engineering` unlocks.
- **C‑4:** the F‑1 `perform`→`select` correction and the F‑3/F‑4/F‑6/F‑10/F‑12 test edits were made under WORK-022; `security-identity` / `backend-data-engineering` own the files and should confirm the edits at approval.
- **C‑5:** Edge Function dependency pinned to `2.112.4` (not latest) pending supply-chain min-age; hosted `deno.lock` reproducibility to be confirmed on first deploy.
- **C‑6 (open question):** **ISS‑27** — whether the anon key should expose the global seed-exercise catalogue (`exercise_select` currently permits it, per SEC-DEC-05). Not blocking; decide before beta.

### Next human decision

Review this artifact + `security-identity.md` §8.1 + `backend-data-implementation.md` §9.1. Then record `APPROVED — proceed to <next>` (accepting C‑1…C‑6), `APPROVED WITH CONDITIONS`, or request revisions. The lifecycle does not advance and `client-engineering` stays `LOCKED` until an explicit human approval is recorded, DEP‑1 is provisioned, and the pgTAP + CI gate is green on the hosted project.
