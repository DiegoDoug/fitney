# Backend & Data Implementation — Weight

## 1. Phase identity

- Lifecycle role: Backend and data engineering (`backend-data-engineering`, phase 6 of 11)
- Execution date: 2026-09-02
- Roadmap state at execution: `IN PROGRESS` → `AWAITING APPROVAL`
- Upstream approvals: phases 1–4 approved (`product-strategy`, `evidence-based-ui-ux`, `visual-ui-design`, `software-architecture` v4). `client-engineering` (phase 5) intentionally deferred by the human; backend runs first.
- Classification: **CREATE** (no prior schema, migrations, functions, tests, or backend artifact)
- Reported result: `PASS WITH CONDITIONS`

## 2. Sources inspected

| Source | Use |
|---|---|
| `docs/architecture/system-architecture.md` (v4, APPROVED) + `docs/architecture/adrs/` (ADR-0001…0009, Accepted) | The binding contract: §8 data architecture, §8.4 optimistic-concurrency invariant, §9 API contracts, §10 sync model, §10.5 determinism invariants, §15 downstream routing to this phase |
| `docs/product/product-strategy.md` (APPROVED) | FR-* / NFR-*, invariants, CON-3/4/6/9, DEP-1/3/4, OQ-4/10 |
| `SPEC.md` §9 (domain model), §9.2 (entity fields), §9.3 (data rules), §9.4 (constraints/indexes), §12 (calculations), §14 (security), §16 (observability), §17 (testing) | Entity shape, calculation formulas, index list, test matrix |
| `development-roadmap.md` | AR-DEC-01…11, AR-OQ-1…6, AR-RISK-1…8, WORK-010…013, DEP-1/3/4 |
| `.claude/skills/backend-data-engineering/{SKILL.md,references/phase-contract.md}` + skill-system contracts | Method, ownership boundary, output shape |
| Repository tree | Confirmed greenfield: no `supabase/`, no `package.json`, no prior migrations |

## 3. Execution mode and ownership boundary

**CREATE.** This phase authors the server schema, forward-only migrations, the `sync_apply` RPC, the deterministic recompute functions and their triggers, the RLS **baseline**, the `delete-account` Edge Function skeleton, the seed placeholder, and the pgTAP conformance/golden test suites — all implementing the approved architecture.

**Owned here:** server-side data structures, DDL, migration design and ordering, `updated_at`/`version` mechanics, `sync_apply` behaviour, server recompute implementation and its equivalence contract with the client, integration contract for the one Edge Function, query bounding and indexes, and the test scaffolds at the DB layer.

**Not owned (routed):**
- **RLS policy content, threat model, adversarial-test authority, account-deletion behaviour (OQ-10), guest-mode security (OQ-3)** → `security-identity`. `20260902090005_rls.sql` is a *baseline* explicitly marked "security-identity holds final authority."
- **Provisioning the Supabase project (DEP-1), environment separation, migration CI gate, key injection** → `platform-release`.
- **Running WORK-012 (recompute golden vectors both sides) and WORK-013 (sync conformance) as release evidence** → `quality-engineering` (this phase provides the executable suites).
- **Client SQLite mirror migrations** → `client-engineering` (kept in lockstep with §4 here).
- Product scope, UX, visual design — unchanged; nothing routed back.

## 4. Schema (canonical column contract — the client mirror must match)

Server DDL: [`supabase/migrations/20260902090002_schema.sql`](../../supabase/migrations/20260902090002_schema.sql). The client SQLite schema (ADR-0006) mirrors these names, keys, and FKs; this section is the lockstep source of truth.

### 4.1 Standard columns on every synced user-owned table

| Column | Type | Rule |
|---|---|---|
| `id` | `uuid` PK | Client-generated (UUIDv7 preferred; AR-DEC-04). Server `default gen_random_uuid()` is a fallback only. |
| `user_id` | `uuid not null` | Denormalised onto **every** table incl. children → join-free RLS. `= auth.uid()`. FK `auth.users(id) on delete cascade`. |
| `created_at` | `timestamptz not null` | **Server-set** by `set_row_metadata()` trigger; client value ignored. |
| `updated_at` | `timestamptz not null` | **Server-set** by trigger on every insert/update. Drives the incremental pull cursor `(updated_at, id)` (§10.3.1). |
| `version` | `integer not null` | **Server-maintained** optimistic-concurrency token (AR-DEC-03). Trigger: `1` on insert, `OLD.version + 1` on every update (incl. tombstone). Unconditional bump makes both `sync_apply` and the conditional-PATCH fallback correct (AR-OQ-6). |
| `deleted_at` | `timestamptz null` | Tombstone. Soft delete = an UPDATE (so `version` bumps and the row flows through the incremental feed). |

Template **content** versioning (LIB-06) is a separate `content_version integer` column — renamed from SPEC §9.2's `version` to avoid colliding with the sync token. Recorded as a deviation in §12.

### 4.2 Entities

| Group | Tables | Notes |
|---|---|---|
| Identity | `profiles` | PK = `auth.users.id`; `user_id = id` (CHECK). Units/rest/haptics/theme/plate increment (SET-01). |
| Reusable (mutable, `content_version`) | `exercises`, `superset_templates` + `_items`, `workout_templates` + `_items`, `set_prescriptions`, `week_templates` + `_days` | `exercises.owner_user_id` NULL = global seed (read-all / write-none); non-null = private. `name_normalized` generated column + index for SM-7 local/remote search parity. |
| Planned (snapshot on create) | `plan_weeks`, `planned_workouts`, `planned_workout_items` | `planned_workout_items` carries `exercise_name_snapshot` + `tracking_mode_snapshot` + `prescription jsonb` — **snapshot, not reference** (FR-PLAN-09). |
| Performed (source of truth) | `workout_sessions`, `session_exercises`, `performed_sets` | `session_exercises` carries name/mode snapshots (FR-DATA-03). `workout_sessions.timezone` = IANA zone; `rest_timer_anchor` = absolute (AR-DEC-04). |
| Derived (server-authoritative, recomputed) | `personal_records`, `weekly_aggregates`, `exercise_weekly_rollups` | **Deterministic `uuid_generate_v5` ids** from the natural key → recompute is a stable UPSERT with minimal sync churn. Not client-writable. |
| Sync ledger | `processed_operations` | Append-only; records only `applied`/`duplicate`. Owner-scoped. |

### 4.3 Constraints & indexes (from SPEC §9.4)

- `unique plan_weeks(user_id, week_start_date) where deleted_at is null`
- `unique workout_sessions(user_id) where status = 'active' and deleted_at is null` — one active session (FR-LOG-12)
- `personal_records` natural unique `(user_id, coalesce(exercise_id, <nil>), category, coalesce(rep_count, -1))`
- `weekly_aggregates` / `exercise_weekly_rollups` natural unique on their keys
- `workout_sessions (user_id, started_at desc)`, `(user_id, status)`
- `performed_sets (session_exercise_id, position)`
- `planned_workouts (user_id, scheduled_date)`
- `exercises (name_normalized)`
- **Every synced table** has `(updated_at, id)` for the incremental pull cursor
- Numeric CHECKs: no negative `load_kg`/`reps`/`duration_s`/`distance_m`; zero `load_kg` allowed (bodyweight); `rpe` 0–10; `reps_min ≤ reps_max`
- FK delete behaviour: `on delete cascade` from `auth.users` (whole-account delete); `on delete cascade` parent→child for uncommitted structures; history-breaking deletes are blocked at the app/domain layer (FR-LIB-08) and by the absence of a hard-DELETE path in `sync_apply` (it only tombstones).

## 5. Migrations

Forward-only, numbered, transactional per file (ADR-0006). No down migrations.

| File | Contents |
|---|---|
| [`20260902090001_init_helpers.sql`](../../supabase/migrations/20260902090001_init_helpers.sql) | `pgcrypto`, `uuid-ossp`; `set_row_metadata()` trigger fn (server-authoritative `created_at`/`updated_at`/`version`); `_attach_row_metadata()` helper |
| [`20260902090002_schema.sql`](../../supabase/migrations/20260902090002_schema.sql) | Enums; all tables; constraints; indexes; metadata triggers |
| [`20260902090003_recompute.sql`](../../supabase/migrations/20260902090003_recompute.sql) | `_epley_e1rm`, `_pr_id`, `_agg_id`; `recompute_exercise_prs`, `recompute_session_volume_pr`, `recompute_week_aggregates`; AFTER triggers on `performed_sets` and `workout_sessions` |
| [`20260902090004_sync_apply.sql`](../../supabase/migrations/20260902090004_sync_apply.sql) | `sync_apply(...)` RPC + grants |
| [`20260902090005_rls.sql`](../../supabase/migrations/20260902090005_rls.sql) | Enable + FORCE RLS on every table; per-command policies; **baseline — security-identity finalises** |

**Upgrade-path posture.** This set establishes the **baseline** (`v0`). There is no historical upgrade to test yet. Contract for every future migration (routed to `quality-engineering` / `platform-release`): fresh-create at HEAD **and** upgrade from every previously shipped version must pass, in CI, before merge (SPEC §15, §17.2). Forward-fix only.

**Rollback / roll-forward.** No down migrations. A bad migration caught pre-release is fixed by a new forward migration. Post-release data-affecting mistakes are handled by a corrective forward migration plus, if needed, a one-off backfill script committed alongside it with its own validation query. Destructive column drops require a two-release deprecation window (write-both, then stop-reading, then drop).

## 6. API & integration contracts

### 6.1 `sync_apply` RPC (push) — architecture §8.4 / §10.2

`sync_apply(operation_id uuid, entity text, entity_id uuid, op text, payload jsonb, base_version int) → jsonb`

| Result | Shape | Meaning |
|---|---|---|
| applied | `{"status":"applied","version":<int>}` | Insert (→ v1) or `base_version`-matched update/tombstone (→ `base_version+1`) |
| duplicate | `{"status":"duplicate","version":<int>}` | `operation_id` already in `processed_operations` — returns the stored result (exactly-once) |
| conflict | `{"status":"conflict","version":<int>,"row":<jsonb>}` | `base_version` ≠ current server `version`; **nothing written**; current row returned |

- **`SECURITY INVOKER`** — RLS applies; the version lookup and all writes are the caller's rows only, so a cross-account `entity_id` behaves as "row not visible" → treated as an insert → rejected by the `WITH CHECK (user_id = auth.uid())` policy. (Adversarial test: [`tests/01_rls_isolation_test.sql`](../../supabase/tests/01_rls_isolation_test.sql).)
- **Dedupe** is on `operation_id`. Only `applied`/`duplicate` are recorded; a `conflict` is **not** recorded, so a retry re-evaluates against the current version (matches ADR-0003's "conflict is not a terminal stored result").
- Server-managed columns (`version`, `created_at`, `updated_at`) are stripped from `payload`; `id` and `user_id` are forced. The client sends the **coalesced latest full row state**, so NOT NULL columns are always present on an upsert.
- **Mechanism note (AR-OQ-6):** implemented as one `rpc` for atomicity. The conditional-PATCH alternative (`PATCH ?id=eq&version=eq` + a `processed_operations` upsert) satisfies the same invariant because the unconditional `version` bump lives in the trigger; either can be adopted without schema change.
- Failure semantics: unknown `entity`/`op` → `22023` exception (client treats as a permanent error, moves the op to a dead-letter for user review). Transport/5xx are handled entirely client-side (`dispatched` state, ADR-0003) — the server has no partial-apply state because each call is one statement in one implicit transaction.

### 6.2 Read paths (pull) — architecture §10.3

Plain PostgREST selects through the client's `data/remote` gateway, RLS-scoped:
- **Incremental:** `?updated_at=gt.<u>` plus the `(updated_at,id)` lexicographic predicate, `order=updated_at,id`, `limit=N`. Every synced table has the supporting index.
- **Full reconciliation (AR-DEC-11):** `?select=id,version,deleted_at&order=id` light projection; full-row fetch only for discrepancies.
- Derived tables are pulled read-only and overwritten client-side.

### 6.3 `delete-account` Edge Function — FR-SET-03

[`supabase/functions/delete-account/index.ts`](../../supabase/functions/delete-account/index.ts). `POST` with the user's JWT + `{confirm:true}` → `{deleted:true, receipt_id, at}`. Re-auth enforced (`auth_time`/`iat` within 300 s; final policy → security-identity). Uses the **service-role key as a server secret** (never client-side, CON-4). Default behaviour = **hard cascade** via the `auth.users` FK. **OQ-10 (cascade vs anonymise) is unresolved** — the anonymise branch is a marked TODO; the deletion-receipt audit store is a TODO routed to `production-operations`.

### 6.4 External integrations

None beyond Supabase (Auth, PostgREST, one Edge Function) and the analytics interface (client-side, provider deferred — DEP-4). No message broker, no third-party API, no Storage (SPEC §10.3).

## 7. Recompute — determinism & client equivalence (AR-DEC-05, AR-RISK-2)

- Pure function of the **ordered** set of completed `performed_sets` in completed, non-deleted sessions; ordering key `(session_exercise_id, position, id)`. No wall-clock, no iteration-order dependence.
- **Formulas (must match client `domain/calc` + `domain/pr` byte-for-byte):**
  - `set_volume_kg = load_kg × reps`; `session_volume_kg = Σ` over completed `working|backoff|drop|failure` sets (warmups excluded from headline — SPEC §12.1).
  - `e1RM = round(load_kg × (1 + reps/30), 4)` for `reps ∈ [2,10]` only; `formula_id='epley'`, `formula_version=1` stamped on the materialised row.
  - PR categories: `max_load` (max load, reps ≥ 1), `est_1rm` (best Epley), `rep_pr` (best load at each rep count 1–12), `session_volume` (max single-session working volume; `exercise_id` NULL). Ties do **not** create a new PR (no "equaled PR" in MVP).
- **Idempotent:** deterministic `uuid_generate_v5` ids → every run is a pure UPSERT; rows that no longer qualify are tombstoned. Safe to re-run after a crash.
- **Trigger-driven (AR-OQ-3 → trigger):** AFTER triggers on `performed_sets` and `workout_sessions` recompute the affected exercise + week + session-volume when the parent session is `completed`. Transactional; cannot drift as an "after the fact" job. Cost is trivial at AR-A2 volume. On pull, the server's derived values are authoritative (client converges).
- **WORK-012:** [`tests/03_recompute_test.sql`](../../supabase/tests/03_recompute_test.sql) encodes shared golden vectors; the identical vectors run against the client TS implementation. Divergence fails the build.

## 8. Requirement → implementation traceability

| Requirement | Implementation |
|---|---|
| FR-AUTH-05 / NFR-SEC (per-user isolation) | `20260902090005_rls.sql` (FORCE RLS, per-command policies, `user_id = auth.uid()`), `sync_apply` `SECURITY INVOKER`, [`tests/01`](../../supabase/tests/01_rls_isolation_test.sql) |
| FR-SYNC-01…05 (offline sync, no lost/silent-dropped writes) | `version` column + trigger, `sync_apply` (§6.1), `processed_operations` dedupe, `(updated_at,id)` indexes, [`tests/02`](../../supabase/tests/02_sync_apply_test.sql) |
| FR-PLAN-09 / FR-LIB-06 / FR-DATA-03 (snapshot, not reference) | `*_snapshot` columns + `prescription`/`default_prescription` jsonb on planned/session tables; no server JOIN from history to templates |
| FR-DATA-04…10 / SPEC §12 (calculations, deterministic recompute) | `20260902090003_recompute.sql`, triggers, `formula_id`/`formula_version`, [`tests/03`](../../supabase/tests/03_recompute_test.sql) |
| FR-LOG-12 (one active session) | partial unique `workout_sessions(user_id) where status='active' and deleted_at is null` |
| FR-LOG-13/14, §9.3 (numeric validation, tracking modes) | CHECK constraints; `tracking_mode` enum + `*_snapshot` |
| FR-SET-02 (export) | plain owner-scoped selects (client assembles JSON/CSV from local DB; no server endpoint needed) |
| FR-SET-03 (account deletion + receipt) | `delete-account` Edge Function (§6.3) |
| FR-SET-04 / units | canonical kg/m/s columns only; no server-side unit logic |
| FR-LIB-03 (seed catalogue) | `seed.sql` placeholder; **licensed catalogue pending OQ-4/DEP-3** |
| NFR-DATA-INTEGRITY / §10.5 invariants | server-authoritative `updated_at`/`version`; idempotent recompute; deterministic ordering keys; forward-only migrations |
| CON-9 / SPEC §16.2 (observability) | operational signals emitted client-side; server contributes `processed_operations` rate, RLS denials (PostgREST logs), migration status — consumed by `production-operations` |

## 9. Verification performed & evidence

| Check | Method | Result |
|---|---|---|
| Lifecycle gate | Read roadmap; phases 1–4 approved, phase 6 IN PROGRESS (human ordered backend before client) | Entry permitted |
| Architecture compliance | Cross-checked every table/function against AR-DEC-01…11, §8.4 invariant, §10 model | Conforms; no architecture contract weakened; one naming deviation recorded (§12) |
| Schema completeness | Walked SPEC §9.2 entity list + §9.4 index list into `20260902090002_schema.sql` | All entities + all named indexes present |
| Concurrency invariant | Authored `sync_apply` + `set_row_metadata`; wrote [`tests/02`](../../supabase/tests/02_sync_apply_test.sql) covering insert/duplicate/update/stale-conflict/tombstone/unknown-entity | Suite authored; **not executed** (see conditions) |
| RLS isolation | Authored FORCE-RLS baseline; wrote [`tests/01`](../../supabase/tests/01_rls_isolation_test.sql) — 20 assertions, two-user select/insert/update/delete + rpc + anon + derived + processed_operations | Suite authored; **not executed** |
| Recompute equivalence | Authored functions + triggers; wrote [`tests/03`](../../supabase/tests/03_recompute_test.sql) golden vectors (Epley, volume, rep_pr, session_volume, weekly, idempotency) | Suite authored; **not executed**; client-side counterpart is WORK-012 |
| Migration safety | Forward-only; single baseline; upgrade-path contract recorded (§5) | No historical upgrade exists yet; **no execution evidence** |

### 9.1 Executed verification — WORK-022 (2026-09-02, local Postgres 15.8)

`platform-release` provisioned a local Supabase stack and executed this layer for the first time. Defects surfaced; **WORK-022** (narrowly-scoped lifecycle recovery, `backend-data-engineering` + `security-identity`) fixed them in place (migrations never shipped). Backend-owned fixes:

| ID | Defect | Fix | File |
|---|---|---|---|
| **F-9** | `uuid-ossp` is in the `extensions` schema on Supabase; the pinned `search_path = pg_catalog, public` couldn't resolve `uuid_generate_v5` / `uuid_ns_url` → recompute threw `function uuid_ns_url() does not exist` on first trigger fire (not caught by `db reset`/`db lint`). | Schema-qualified `extensions.uuid_generate_v5` / `extensions.uuid_ns_url` in `_pr_id` / `_agg_id` (search-path-independent; pinned `search_path` unchanged). | `20260902090003` |
| **F-7** | `db lint` warning: `v_keep uuid[] := '{}'` (text→uuid[] assignment cast). | `array[]::uuid[]`. | `20260902090003` |
| **F-8** | `sync_apply` returned the stored `'applied'` on a replayed `operation_id`, contradicting the documented `{"status":"duplicate"}` RPC contract (§6.1) and `tests/02`. | Return `'duplicate'` with the original `resulting_version`. | `20260902090006` (`sync_apply`) |
| **F-2** (contract clarification) | Confirmed and enforced: a valid upsert **must** carry the coalesced latest full-row state; column defaults are **not** merged into a partial payload; a partial payload now returns a structured `{"status":"rejected"}` (never a raw `NOT NULL` exception). pgTAP happy-path cases send full rows + an explicit negative test. | `security-identity` fix in `20260902090006`; contract text here unchanged | §6.1 |

`security-identity` also fixed **F-5** (`_week_start_for` `smallint`/`integer` resolution — BD-OQ-1 code) and **F-11** (`sync_apply` executable by `anon`). Full defect table: [`docs/security/security-identity.md`](../security/security-identity.md) §8.1.

**Executed evidence** ([`docs/platform/evidence/`](../platform/evidence/)):

| Command | Result |
|---|---|
| `supabase db reset` ×2 (fresh) | ✅ `0001`–`0006` + seed apply cleanly & repeatably |
| `supabase db lint --level warning` / `--fail-on error` | ✅ **No schema errors found** |
| `supabase test db` | ✅ **PASS** — `01`/`02`/`03`/`04` = 19/17/8/24 = **68/68**, exact plans |
| Recompute golden vectors (`tests/03` + runtime probe) | ✅ Epley e1RM 116.6667 & 129.8333, `max_load` 110, `session_volume` 1430, `weekly` 1430, `rep_pr` {1:110, 8:102.5}; idempotent on re-run; correct `week_start`-relative bucketing for `week_start` 0–6 |
| `sync_apply` (runtime probe) | ✅ full → `applied`; replay → `duplicate`; partial → `rejected` (no row, no exception); `anon` → `permission denied` |

**Still outstanding — HOSTED:** re-run the same on a provisioned Supabase project (real `service_role` BYPASSRLS, GoTrue `auth.uid()`/`auth.role()`), wire the CI gate, and formally cross-validate the recompute golden vectors against the WORK-012 client TS implementation. **BD-C1 is met locally; the hosted run + CI gate remain required before `client-engineering`.**

## 10. Data risks

| ID | Risk | Mitigation | Owner |
|---|---|---|---|
| BD-RISK-1 | Migrations / functions authored but never executed. | **LOCAL RUN DONE 2026-09-02 (§9.1):** first execution found F-2/F-5/F-7/F-8/F-9/F-11 (+ test defects F-1/F-3/F-4/F-6/F-10/F-12); all fixed under WORK-022; `db reset` + `db lint` + `supabase test db` (68/68) + runtime probes now green on Postgres 15.8. **Residual:** the hosted role model (`service_role` BYPASSRLS, GoTrue) is still unverified; re-run on DEP-1 + CI-gate before client integration. | `backend-data-engineering`, `quality-engineering`, `platform-release` |
| BD-RISK-2 | `recompute_week_aggregates` buckets by `date_trunc('week', started_at at UTC)` (Mon-based), but the product supports a configurable `week_start` (SET-01). Weekly aggregates may not match the user's chosen week boundary. | Resolve: either bucket by the user's `week_start` in the recompute (pass it in), or compute week boundaries only client-side and treat `weekly_aggregates` as UTC-ISO-week rollups the client re-buckets. Routed as **BD-OQ-1**. | `backend-data-engineering` + `client-engineering` |
| BD-RISK-3 | Trigger-driven recompute on every `performed_sets` write could become hot if a future feature bulk-imports sessions. | AR-A2 bounds it for MVP; if bulk import lands, switch those paths to a deferred `recompute` queue. | `backend-data-engineering` |
| BD-RISK-4 | The recompute triggers must run with rights to write `personal_records`/`weekly_aggregates`/`exercise_weekly_rollups` while those tables have FORCE RLS and no write policy. The exact grant/definer model needs confirming on the provisioned project. | Marked inline in `20260902090005_rls.sql`; routed to `security-identity` to finalise (likely `SECURITY DEFINER` on the recompute functions owned by a dedicated role, or a `service_role`-only write policy). **BD-OQ-2**. | `security-identity`, `backend-data-engineering` |
| BD-RISK-5 | `delete-account` default is hard cascade; if OQ-10 resolves to anonymise, the FK `on delete cascade` design and the function both change. | OQ-10 is flagged; the function has a TODO branch; schema change is a forward migration. | Human + `security-identity` |
| BD-RISK-6 | Seed catalogue is a placeholder; shipping it would be a licensing problem. | `seed.sql` header warns "do not ship"; gated on OQ-4/DEP-3. | Human, `backend-data-engineering` |
| BD-RISK-7 | Client SQLite mirror and server schema drift over time. | §4 is the single lockstep contract; a shared machine-readable entity definition should be extracted in the Foundation increment (routed to `client-engineering`). | `client-engineering`, `backend-data-engineering` |

## 11. Open questions

| ID | Question | Owner | Blocking? |
|---|---|---|---|
| BD-OQ-1 | Weekly aggregate bucketing vs. the user's configurable `week_start` (BD-RISK-2). Implemented in `20260902090006` (`_week_start_for` + rewritten recompute/triggers using session-local date + `profiles.week_start`); WORK-022 fixed the `smallint`/`integer` resolution bug (F-5) and probed `week_start` 0–6 + the `tests/03` golden vectors locally — all green. **Formal cross-validation against the WORK-012 client TS golden vectors still owed before Data & Progress.** | `backend-data-engineering` + `client-engineering` | No |
| BD-OQ-2 | Exact write-grant / definer model for the recompute triggers under FORCE RLS (BD-RISK-4). | `security-identity` | No — resolve before DEP-1 adversarial RLS tests |
| BD-OQ-3 | Should `sync_apply` accept a batch (array of ops) to cut round-trips, or stay one-op-per-call? Architecture assumes per-op; batching is a later optimisation. | `backend-data-engineering` | No |
| BD-OQ-4 | `processed_operations` retention / pruning policy (unbounded append). | `production-operations` + `backend-data-engineering` | No |
| Inherited | OQ-4 (seed licence), OQ-10 (deletion behaviour), AR-OQ-3/6 (recompute + sync mechanism — resolved here toward trigger + rpc, confirm on DEP-1) | Human / security | No |

## 12. Deviations from upstream specs (recorded, non-silent)

| Deviation | From | Rationale | Routed |
|---|---|---|---|
| Template `version` field renamed `content_version` | SPEC §9.2 | Collides with the architecture's sync `version` token (AR-DEC-03). Both are needed. | Informational; no owner action |
| `user_id` denormalised onto **child** tables (`*_items`, `set_prescriptions`, `session_exercises`, `performed_sets`, `week_template_days`, `planned_workout_items`) | SPEC §9.2 (children lack `user_id`) | Join-free RLS; SPEC §9.4 already hints at denormalised `user_id` for indexing. Integrity: client always sets it; a CHECK/trigger validating child.`user_id` = parent.`user_id` is a follow-up (BD-OQ, low risk). | `security-identity` to confirm the integrity trigger is required |
| `personal_records.exercise_id` nullable (for `session_volume`) | SPEC §9.2 implies per-exercise | `session_volume` is a whole-session PR (SPEC §12/DATA-05). Natural unique index coalesces NULL. | Informational |
| Added `exercise_weekly_rollups` | Not in SPEC §9.2 | Needed for DATA-08 exercise-specific e1RM trends without per-read computation. | Informational |

## 13. Paths changed

```
supabase/config.toml                              (new)
supabase/seed.sql                                 (new — placeholder, do not ship)
supabase/migrations/20260902090001_init_helpers.sql   (new)
supabase/migrations/20260902090002_schema.sql         (new)
supabase/migrations/20260902090003_recompute.sql      (new)
supabase/migrations/20260902090004_sync_apply.sql     (new)
supabase/migrations/20260902090005_rls.sql            (new — baseline; security-identity finalises)
supabase/functions/delete-account/index.ts        (new — skeleton, OQ-10 TODO)
supabase/tests/01_rls_isolation_test.sql          (new — pgTAP)
supabase/tests/02_sync_apply_test.sql             (new — pgTAP)
supabase/tests/03_recompute_test.sql             (new — pgTAP, golden vectors)
docs/engineering/backend-data-implementation.md   (new — this file)
```

## 14. Downstream needs

| Phase | Needs from this phase / must do |
|---|---|
| `security-identity` | Take ownership of `20260902090005_rls.sql`; finalise policies; resolve BD-OQ-2 (recompute write grants) and the child `user_id` integrity trigger; author the authoritative adversarial suite (extend `tests/01`); resolve OQ-10 and finalise `delete-account`; threat model over `sync_apply`. **No table is exposed via the client API until the adversarial RLS suite passes on DEP-1.** |
| `platform-release` | Provision DEP-1 (dev + prod projects); wire `supabase db reset` / `supabase test db` / `supabase db lint` into CI as a merge gate; inject anon/service-role keys per environment (service-role server-only); deploy the Edge Function. |
| `client-engineering` | Mirror §4 into the SQLite schema + forward-only client migrations (ADR-0006); extract a shared machine-readable entity definition (BD-RISK-7); implement the TS `domain/{calc,pr}` to pass the WORK-012 golden vectors; consume the `sync_apply` contract (§6.1) and the two-mechanism pull (§6.2). |
| `quality-engineering` | Run the three pgTAP suites + WORK-012 (both implementations) + WORK-013 (sync conformance) as release evidence; own the migration upgrade-path matrix (§5) in CI. |
| `production-operations` | Consume `processed_operations` rate, RLS-denial logs, migration status; own the deletion-receipt audit store and `processed_operations` retention (BD-OQ-4). |

## 15. Status

**`PASS WITH CONDITIONS`.**

The complete server data layer is authored and internally consistent with approved architecture: schema for all SPEC §9 entities with the standard sync columns; five forward-only migrations; the `sync_apply` optimistic-concurrency RPC with `operation_id` dedupe; deterministic idempotent recompute with triggers and golden vectors; an RLS baseline with FORCE RLS and per-command policies; the `delete-account` Edge Function skeleton; and three pgTAP suites (RLS isolation, sync conformance, recompute equivalence). Requirement traceability and downstream routing are complete.

Conditions for the reviewer to accept or defer:

- **BD-C1:** **No runtime evidence.** Migrations, functions, and tests are authored but **not executed** — DEP-1 (a provisioned Supabase project) is not available and a local stack is not verified in this environment. Accepted on the basis that `platform-release` provisions DEP-1 and `quality-engineering` runs the §9 commands + the three suites as a gate **before** `client-engineering` integrates against them (BD-RISK-1). A migration is **not** labelled "safe" here — only "authored and unit-test-covered pending execution."
- **BD-C2:** The RLS in `20260902090005_rls.sql` is a **baseline**; `security-identity` holds final authority and owns the adversarial test suite. No user-owned table is exposed via the client API until that suite passes on DEP-1.
- **BD-C3:** **BD-OQ-1** (weekly-aggregate bucketing vs. configurable `week_start`) and **BD-OQ-2** (recompute write-grant model under FORCE RLS) are open; neither blocks the security phase, both must resolve before the Data & Progress increment.
- **BD-C4:** Inherited unresolved decisions surface here: **OQ-4** (seed catalogue licence — `seed.sql` is a non-shippable placeholder) and **OQ-10** (account-deletion behaviour — `delete-account` implements cascade with an anonymise TODO).
- **BD-C5:** Recorded deviations (§12): `version` → `content_version` for template content; `user_id` denormalised onto child tables; `personal_records.exercise_id` nullable; added `exercise_weekly_rollups`. None weaken an accepted decision.

### Next human decision required

Review `docs/engineering/backend-data-implementation.md` and `supabase/`. Then record one of:

- `APPROVED — proceed to security-identity` (the natural next phase — it must finalise RLS before client integration; optionally accepting BD-C1…BD-C5, reproduced in the human review log), or
- `APPROVED — proceed to client-engineering` (accepting that RLS finalisation + DEP-1 execution then become hard gates inside that phase), or
- `APPROVED WITH CONDITIONS` naming which are accepted vs. must resolve first, or
- revision requests.

Phases 5 and 7 stay `LOCKED` until an explicit human approval is recorded. The lifecycle will not advance automatically.
