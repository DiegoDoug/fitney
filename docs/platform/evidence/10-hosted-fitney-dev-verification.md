# Hosted verification — `fitney-dev` (2026-09-03)

Supabase project **`fitney-dev`** — ref `oaubwbvoaydveguqjovq`, org MetaTrack
(`uhzhcdfsacjflrwxuftq`), region `us-east-1`, **Postgres 17.6.1**, cost **$0/month**
(free tier). Development only; production provisioning deferred (human decision).

> No key material is recorded here. The `fitney-dev` publishable / anon key lives
> only in the git-ignored `.env`. The service-role key and
> `DELETION_RECEIPT_HMAC_KEY` are not stored anywhere in the repo.

## Migrations

`supabase link --project-ref oaubwbvoaydveguqjovq` → `supabase db push` → all six
migrations applied cleanly. `supabase db reset --linked` (after the ISS-27 / F-13 /
F-14 changes) re-applied the full chain from scratch + seed, clean. `list_migrations`
confirms `20260902090001` … `20260902090006` recorded.

## `supabase db lint --linked`

```
Linting schema: extensions
Linting schema: public
No schema errors found
```

## Supabase security advisor (`get_advisors` security) — after ISS-27 / F-13 / F-14

Only one finding, **INFO**, and it is **by design**:

| Level | Finding | Disposition |
|---|---|---|
| INFO | `public.deletion_receipts` has RLS enabled but no policies | **Intentional** (SEC-DEC-04 / SEC-REQ-DATA-02): `FORCE` RLS + zero policies ⇒ invisible to `anon`/`authenticated`; only `service_role` (Edge Function) reads/writes it. The advisor cannot know "no policy" is deliberate here. |

The first hosted advisor run (before F-13/F-14) additionally flagged **19 WARN**s:
`function_search_path_mutable` on `set_row_metadata` / `_attach_row_metadata` (→ F-14,
fixed: `set search_path = pg_catalog, public` on both), and
`anon_/authenticated_security_definer_function_executable` on `recompute_*`, the two
recompute trigger functions, `_check_ref_ownership`, `_guard_exercise_owner` (→ F-13,
fixed: `revoke all … from public, anon, authenticated` on every internal function —
same Supabase `ALTER DEFAULT PRIVILEGES` gap as F-11; the AFTER triggers still fire
because trigger invocation does not check `EXECUTE`). Re-run after the fix: **0 WARN**.

## Behavioural verification (real hosted PG17, real Supabase role model)

Run as the real `authenticated` / `anon` / `service_role` roles with GoTrue-style JWT
claims, inside `begin … rollback` (nothing persisted). Two probe batches:

| Batch | Checks | Passed | Failed |
|---|---:|---:|---:|
| `sync_apply` + recompute + golden vectors + F-13 negative | 19 | 19 | 0 |
| RLS isolation + composite-FK + forged-`user_id` + anon (ISS-27) + `service_role` BYPASSRLS + F-11/F-13 | 12 | 12 | 0 |

Covered and green on hosted:

- `sync_apply`: full-row → `applied v1`; replayed `operation_id` → `duplicate` (F-8);
  partial payload → `{"status":"rejected"}` with **no row and no raw exception** (F-2);
  stale `base_version` → `conflict` (row not overwritten); correct-version update →
  `applied v2`; tombstone → `applied`.
- Recompute: a working set on a **completed** session fires the trigger with **no
  `_week_start_for(date,integer)`** (F-5) and **no `uuid_ns_url()`** (F-9) error;
  golden vectors exact — `max_load` 110, Epley e1RM 129.8333, `session_volume` 1430,
  weekly working volume 1430, `rep_pr@8` 102.5; idempotent on trigger re-fire.
- Tenant isolation: user B sees 0 of user A's templates / sessions / PRs; B's
  `UPDATE`/`DELETE` of A's row → 0 rows; B's `INSERT` with forged `user_id = A` →
  `42501`; B's child row → A's parent (composite `(id,user_id)` FK) → `23503`; B
  cannot write `personal_records` → `42501`.
- `anon`: sees **0 exercises** (ISS-27 — catalogue is authenticated-only); sees 0
  sessions; cannot `EXECUTE sync_apply` (F-11) or `recompute_*` (F-13) → `42501`.
- `authenticated`: reads the 8 global seed exercises; **cannot** call `recompute_*`
  directly → `42501` (F-13) while the trigger path still populates the derived tables.
- `service_role`: **BYPASSRLS** confirmed — sees rows across owners (the behaviour the
  local `postgres`-as-owner run could not exercise).

## Not done on hosted

- `supabase test db --linked` cannot run the pgTAP suites: its temporary restricted
  test role cannot `INSERT INTO auth.users` (needed to mint test users), and Supabase
  installs `pgtap` into `extensions` (not on that role's `search_path`). The suites
  are proven on the **local stack and in CI** (`db-verify`, 68/68); hosted behaviour
  is proven by the probe batches above.
- Hosted auth hardening (email confirmation, leaked-password protection, rate limits)
  — SEC-C2, still deferred.
- Edge Function deploy (`delete-account`) — needs `supabase secrets set` for the
  service-role key + `DELETION_RECEIPT_HMAC_KEY` (human).
