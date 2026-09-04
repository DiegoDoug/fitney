# ISS-29 fix — before/after regression evidence (DEC-55, 2026-09-04)

Migration: `supabase/migrations/20260904200000_sync_apply_atomic_concurrency_fix.sql`.
Regression: `client/src/data/sync/__tests__/hosted/sync-apply-concurrency.hosted.test.ts`
(CI-gated in `db-verify.yml`, targets the local Supabase stack by default).

## Local verification (Supabase CLI + Docker, PG17)

- `supabase db reset` — all 7 migrations (6 prior + this one) apply cleanly from scratch.
- `supabase db lint --level error --fail-on error` — no schema errors.
- `supabase test db` — **68/68 pgTAP assertions still pass** (no regression against the existing suite; the conflict-response contract, RLS, ownership checks, and idempotency bookkeeping are unchanged).

## Red run — reproducing the old defect (temporarily reverted `sync_apply` to the pre-fix `20260902090006` body, same local DB)

| Test | Result over 3 runs |
|---|---|
| Two concurrent UPDATEs, same row, same base_version | **1/5 passed, 4/5 FAILED** (both writers reported `applied`; version reached 3, not 2) — matches the hosted ISS-29 finding (~14% hosted vs. higher locally, consistent with local's lower network latency widening the practical race window) |
| Update/tombstone contention | **FAILED all 3/3** |
| Concurrent replay of the same operation_id (UPDATE path) | **FAILED all 3/3** |
| Concurrent replay of the same operation_id (fresh-INSERT path) | **FAILED all 3/3** |

Confirms all four scenarios were genuine, reproducible gaps — not only the one originally observed hosted.

## Green run — after restoring the fix (`supabase db reset`, re-applying all migrations including this one)

- `supabase test db`: 68/68 pass (unchanged).
- `sync-apply-concurrency.hosted.test.ts`, run 3 consecutive times cleanly: **5/5 tests pass every time** (15/15 total across 3 runs):
  1. Two concurrent UPDATEs, same base_version → exactly one `applied`, exactly one `conflict`, version 1→2 (never →3).
  2. A losing COMPLETED-session edit remains recoverable through the production client (`runPush`): the conflict is parked, the loser's payload is preserved verbatim in `sync_conflicts`, the local row reflects the winner's state, the outbox is clean.
  3. Update/tombstone contention: exactly one of {update, delete} wins; never both.
  4. Concurrent replay of the same operation_id (UPDATE path): exactly one `applied`, one `duplicate`; version increments exactly once.
  5. Concurrent replay of the same operation_id (fresh-INSERT path): exactly one `applied`, one `duplicate` — **no longer misreported as `rejected`** (this was a second real gap the atomic fix also closed, found while designing the regression).

## WORK-013 gaps closed in this same pass (DEC-55 item 5)

- **Real 200-row page boundary** (`page-boundary-200.hosted.test.ts`): 201 rows sharing one Postgres transaction-time `updated_at` (one bulk `INSERT`, bounded/cheap), spanning the actual `PAGE=200` boundary. All 201 applied exactly once via `runIncrementalPull`; cursor advances correctly. PASS.
- **Late-transaction-commit reconciliation** (`late-commit-reconciliation.hosted.test.ts`): a session-capable local Postgres harness (two real `pg` connections, one held open across an explicit `BEGIN`/`COMMIT`) reproduces the scenario for real — a transaction that commits AFTER a chronologically-later one is invisible to incremental pull (confirmed: still invisible after the late commit) and IS recovered by `runFullReconciliation` (id/version-based, not `updated_at`-based). This was previously blocked because the `execute_sql` MCP tool holds no session across calls; a local `pg`-based harness (installed `pg`/`@types/pg` as client devDependencies) closes that gap entirely for local verification. **Hosted-access limitation preserved as-is**: this specific harness technique (two long-lived raw Postgres connections) is not available against hosted `fitney-dev` through any tool this session has (no direct Postgres connection string, no persistent `execute_sql` session) — the mechanism is proven correct via the local Postgres this project already provisions for CI, not hosted.

## CI gating

`db-verify.yml` now runs (after the existing `supabase test db` step, against the SAME local Postgres instance): `sync-apply-concurrency`, `late-commit-reconciliation`, and `page-boundary-200`, via a new `actions/setup-node` + `client/` `npm ci` + `jest --config jest.hosted.config.cjs <file>` step sequence. This makes `db-verify` (a required check) fail if the ISS-29 fix regresses, per DEC-55 item 3 ("random repeated runs alone are insufficient").
