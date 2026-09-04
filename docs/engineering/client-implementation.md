# Client Implementation — Fitney

> **Status: Phase 5 IN PROGRESS — increment 2 ready for review (branch
> `phase-5/auth-isolation`). This is NOT a phase submission and does not seek
> Phase 5 approval.** Increment 1 merged via PR #1 (squash, 2026-09-04). The
> Foundation exit gate (SPEC §18) is **still not met**: auth / onboarding / per-
> user SQLite isolation are now *implemented and logic-verified* but **not**
> device-verified, **not** verified against real hosted GoTrue, and the
> offline-logging slice is not device-tested (WORK-007 / WORK-010 / WORK-013
> remain open). This artifact grows increment by increment until the Foundation
> gate is met and the offline-logging vertical slice is device- and hosted-
> verified. Increment-2 detail is **§14**.

## 1. Phase identity

- Lifecycle role: **Client engineering** (`client-engineering`, phase 5 of 11)
- Execution date: 2026-09-03
- Roadmap state: `UNLOCKED` (canonical Notion, DEC-50, 2026-09-03) → **`IN PROGRESS`** (increment 1 under review; the phase is not being submitted)
- Execution authorization: explicit human instruction, 2026-09-03 ("I explicitly authorize lifecycle Phase 5 — `client-engineering`")
- Upstream approvals relied on: `product-strategy` (2026-09-01), `evidence-based-ui-ux` (2026-09-02), `visual-ui-design` (2026-09-02), `software-architecture` v4 (2026-09-02), `backend-data-engineering` (APPROVED WITH CONDITIONS 2026-09-02), `security-identity` (APPROVED WITH CONDITIONS 2026-09-03, REV-10), `platform-release` (APPROVED WITH CONDITIONS — dev-only gate — 2026-09-03, REV-11)
- Classification: **CREATE** (greenfield — no prior client code, `docs/engineering/client-implementation.md` was `MISSING`)
- Increment status: see §12
- Feature branch: `phase-5/client-foundation` → PR #1
- Increment 1 scope (human choice 2026-09-03): **Foundation structure + all logic layers** (domain / data / sync / repositories / services) with pure-layer tests + a full-app typecheck. Screens are wired but **not** device-verified; sync-vs-hosted-Supabase deferred to WORK-013; **auth / onboarding / per-user DB isolation are increment 2**.
- Increment sequence agreed with the human (2026-09-03): (1) *this* — Foundation structure + logic layers + full-app typecheck gate; (2) authentication → per-user SQLite → onboarding; (3) real Expo runtime verification (WORK-010) + hosted-dev sync verification (WORK-013); (4) device-test the offline-logging flow (WORK-007); then the Foundation gate is assessed and the vertical slice is signed off. Planning / Progress / Library expansion and phases 9–11 stay on hold throughout.

## 2. Sources inspected

| Source | Use |
|---|---|
| `CLAUDE.md`, `SPEC.md` §4–§18, `development-roadmap.md`, `.project-memory/` (re-synced from canonical Notion 2026-09-03) | Requirements, invariants, constraints, lifecycle state |
| `.claude/skill-system/{lifecycle,decision-ownership,artifact-standard}.md`, `.claude/skills/client-engineering/{SKILL.md,references/phase-contract.md}` | Method, ownership boundary, artifact shape |
| `docs/architecture/system-architecture.md` (v4, APPROVED) + `docs/architecture/adrs/ADR-0001…0009` | §6.1 layered rule, §7 flows, §8 domain/persistence, §10 sync engine, §11 quality attributes, §12 tech choices |
| `docs/product/ux-product-design.md` (APPROVED) | Route map (SPEC §4.2), UX-DEC-01/03/04/07/08, §10 state matrix |
| `docs/design/visual-ui-design.md` (APPROVED) | §6.1 tokens (VIS-DEC-03), §6.2 type (VIS-DEC-07 fallback), §6.3 spacing/radius/elevation, §7 components, VIS-DEC-04/05/06 |
| `docs/engineering/backend-data-implementation.md` + `supabase/migrations/20260902090001…06_*.sql`, `supabase/tests/03_recompute_test.sql` | Server schema to mirror, `sync_apply` contract, recompute semantics + **golden vectors** (WORK-020) |
| `docs/security/security-identity.md`, `supabase/migrations/…0006_security_hardening.sql` | `sync_apply` hardened surface, RLS-as-authorization, DEC-51 authenticated-only catalogue, secure token storage |
| `docs/platform/platform-release.md`, `.github/workflows/db-verify.yml` | CI gate, dev-only gate scope, pinned-dependency policy |
| Repository tree + Git/GitHub state (rulesets API) | Confirmed greenfield client; branch-protection / exposure preflight (§11) |

## 3. Execution mode and ownership boundary

**CREATE.** This phase owns: the client layer implementation, navigation, state, rendering integration, the local persistence + migration runner, repository implementations, the sync engine, feature-logic for the offline logging vertical slice, the client TypeScript recompute (`domain/{calc,pr,week}`), boundary-lint wiring, and the client CI workflow.

Out of boundary (routed, not decided here): product scope; UX interaction decisions; visual token values; the Postgres schema / RLS policy content / `sync_apply` implementation; environments / EAS / hosted provisioning; test strategy sign-off / release-quality acceptance. Two cross-phase items surfaced and are routed in §10.

## 4. Accepted inputs and consequential assumptions

### 4.1 Accepted inputs

- Local-first: `expo-sqlite` is the operational store; connectivity is never on the logging / completion / recovery path (CON-3, AR-DEC-01, NFR-OFFLINE).
- Every domain mutation is one local transaction: mirrored row + `sync_outbox` entry, atomic (AR-DEC-01/03).
- Layered dependency rule (ADR-0002): `app → features → domain/services/repository-interfaces → data/local + data/sync → data/remote`. UI never imports Supabase.
- Sync engine per ADR-0003 v4: transactional outbox, `operation_id` exactly-once, durable immutable **`dispatched`** state, `pending` successor coalescing, server-`version` optimistic concurrency, hybrid pull (composite `(updated_at,id)` cursor + full `(id,version)` reconciliation), completed-session conflicts **parked**.
- Client-generated UUIDs (v7 preferred, v4 fallback — AR-OQ-1); UTC instants + IANA session tz + date-only plan dates (AR-DEC-04); canonical kg/m/s (SPEC §9.3).
- Forward-only numbered client migrations mirroring the server schema (ADR-0006).
- Expo Go compatibility; `expo install`-locked versions; no custom native modules (CON-2).
- Tokens support light + dark from day one (VIS-DEC-03); Aeonik deferred, documented fallback stack ships (VIS-DEC-07, DEP-2).
- RLS is the authorization boundary; tokens only in `expo-secure-store` (ADR-0009).
- Derived data is deterministic, idempotent, `formula_id`/`formula_version`-stamped; server wins on pull (AR-DEC-05).

### 4.2 Consequential assumptions

| ID | Assumption | If wrong |
|---|---|---|
| CE-A1 | **Expo SDK 54** (`expo@54.0.37`) is the locked prototype SDK; the `bundledNativeModules.json` versions are what `expo install` resolves (`expo-router ~6.0.24`, `expo-sqlite ~16.0.10`, `expo-secure-store ~15.0.8`, `react-native 0.81.4`, `react 19.1.0`). | If a different SDK is chosen, re-pin via `expo install`; the logic layers are SDK-independent. |
| CE-A2 | `expo-sqlite@~16` supports `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`, WAL, and prepared statements as the outbox atomicity design needs (AR-A4 / AR-RISK-4 / AR-C3). **Not yet verified on-device** — WORK-010. | Negative result → swap `runInTransaction` for `withExclusiveTransactionAsync`, or pull the dev-build migration earlier (accepted fallback). |
| CE-A3 | The Expo app lives in `client/` (its own project root), NOT the repo root, because the root already hosts the Notion project-memory bridge (`src/*.mjs`, root `package.json`, `sync-project-memory.yml`). SPEC §10.5's `app/`+`src/` layout is preserved **inside** `client/`. SPEC §4.2 explicitly allows route structure to evolve. | Purely a location choice; no behavioural impact. Documented so downstream phases know where the client is. |
| CE-A4 | The client recompute keys derived rows by the **same deterministic UUIDv5** the server uses (`domain/uuid5.ts` re-implements `uuid_generate_v5(url_ns, name)`), so local recompute rows reconcile 1:1 with server rows on pull instead of orphaning. | If Postgres `uuid-ossp` ever changes its v5 algorithm (it will not — RFC-fixed), ids drift; the RFC DNS-namespace test vector guards this. |
| CE-A5 | For a non-completed push `conflict`, the reconciled local change is **always** "still meaningful" in MVP (re-applied as one fresh pending entry) — never silently dropped (FR-SYNC-04). A smarter "no longer meaningful" heuristic is post-MVP. | Over-conservative: may re-push a change the user has since abandoned; safe direction (no data loss). |

## 5. Owned decisions

| ID | Decision |
|---|---|
| **CE-DEC-01** | Expo SDK **54** locked; dependency versions pinned to SDK-54 `bundledNativeModules` (= `expo install` output). `@supabase/supabase-js` pinned to `2.112.4` (matches the Edge Function pin, C-5). |
| **CE-DEC-02** | The Expo project root is **`client/`** (CE-A3). Repo-root tooling (Notion bridge) is untouched. |
| **CE-DEC-03** | SQLite **driver seam** (`data/local/driver.ts` `SqlDatabase`): the app binds `expo-sqlite` (`driver.native.ts`), logic tests bind `better-sqlite3` (`src/test/`). One transaction implementation (`runInTransaction`, explicit `BEGIN IMMEDIATE`) shared by both so behaviour is identical. |
| **CE-DEC-04** | Local schema type mapping (SQLite has no enum/array/jsonb/timestamptz): enum→`TEXT`+CHECK, `text[]`/`jsonb`→`TEXT` JSON, `timestamptz`→`TEXT` ISO (server value copied verbatim — dumb sync), `date`→`TEXT 'YYYY-MM-DD'`, `numeric`→`REAL`, `boolean`→`INTEGER 0/1`. Per-row sync-meta columns added locally: `synced_version`, `dirty`, `local_updated_at`. |
| **CE-DEC-05** | Validation library: **Zod** (`^3.24.1`) at the `data/remote` gateway seam (AR-OQ-2 resolved toward Zod for ecosystem maturity on RN; valibot revisit only if bundle size proves a problem). |
| **CE-DEC-06** | Icon family: **not locked this pass** (VIS-OQ-3 / WORK-008). The screen components use text glyphs (`✓`, `○`, `+`) as placeholders; the outlined family (`lucide-react-native` or `@expo/vector-icons` Ionicons-outline) is locked with the screen-verification slice, before any device claim. |
| **CE-DEC-07** | Client TS recompute (`domain/{calc,pr,week,uuid5}`) mirrors the server SQL exactly; the shared golden vectors (`src/test/golden-vectors.ts` ⇔ `supabase/tests/03_recompute_test.sql`) are asserted by `recompute.golden.test.ts` (WORK-020). |
| **CE-DEC-08** | `db-verify` GitHub Actions trigger widened to run on **every** PR (was path-filtered to `supabase/**`), so the required-status-check surface is populated for client-only PRs. Non-weakening (same gate, run more often). **Routed to `platform-release` for ratification** (owner of the workflow / C-1 / TASK-7). |

## 6. What was delivered

Repo-relative paths under `client/`.

### 6.1 Foundation

| Area | Paths | Notes |
|---|---|---|
| Expo Router + strict TS + Expo Go | `package.json`, `app.json`, `tsconfig.json` (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`), `tsconfig.logic.json`, `babel.config.js`, `metro.config.js`, `expo-env.d.ts` | SDK 54; `expo-router` typed routes; `newArchEnabled` |
| Locked deps via `expo install` values | `package.json` `dependencies` | pinned to SDK-54 `bundledNativeModules` (CE-DEC-01) |
| Theme tokens (light + dark), typography fallback, elevation | `src/design-system/{tokens,typography,elevation,theme}.ts` | VIS-DEC-03 sand/Persian-blue ramps; VIS-DEC-07 fallback stack; VIS-DEC-05 restraint (raised-2 only on 4 elements); Android neumorphic fallback (VIS-RISK-4) |
| App shell + 5-tab navigation | `app/_layout.tsx`, `app/(tabs)/_layout.tsx` (+ `index`/`plan`/`progress`/`library`/`log-placeholder`), `app/log.tsx`, `app/(auth)/{_layout,sign-in}.tsx` | Today · Plan · **Log(+) raised action** · Progress · Library; Log opens a sheet, not a tab (UX-DEC-01); Android back + safe areas via `expo-router` + `react-native-safe-area-context` |
| Feature/domain/data/service boundaries | `src/{domain,services,data/repositories,data/local,data/sync,data/remote,features,components,design-system}/` | matches system-architecture.md §6.1 |
| Boundary lint enforced in CI | `.dependency-cruiser.cjs`, `eslint.config.js` (`eslint-plugin-boundaries` mirror), `.github/workflows/client-verify.yml` | ADR-0002 / AR-RISK-6 / AR-C4 — **fails the build on any cross-layer import**; `only-remote-imports-supabase` + `only-local-imports-sqlite-driver` guards |
| `expo-sqlite` local operational DB | `src/data/local/driver.ts` (+ `driver.native.ts`), WAL + `foreign_keys=ON` | CE-DEC-03 seam |
| Forward-only client migrations mirroring the server schema | `src/data/local/schema/migrations.ts` (`0001_initial`), `src/data/local/migrate.ts` (`schema_migrations` ledger) | all 15 synced entities + 4 derived tables + 3 local-only tables (`sync_outbox` w/ partial-unique-one-pending index, `sync_state`, `sync_conflicts`); one-active-session partial-unique index; no down migrations |
| Repository interfaces + local implementations | `src/data/repositories/types.ts`, `src/data/local/repositories.ts` (+ `sql.ts`, `row-codec.ts`, `outbox-writer.ts`) | profile / exercise / session / performedSet / derived; every mutating call `userId`-scoped and transactional |
| Secure Supabase session storage | `src/data/remote/session-storage.ts`, `src/data/remote/client.ts` | `expo-secure-store`, 2 KB-chunked; only anon key + URL bundled (CON-4); confined to `data/remote` |
| Typed remote gateway isolated under `data/remote` | `src/data/remote/gateway.ts`, `src/data/remote/schemas/index.ts` (Zod) | implements the sync `SyncGatewayPort`; every response row Zod-parsed (ADR-0008); `sync_apply` RPC binding |
| No direct Supabase from screens/components/hooks | enforced by `.dependency-cruiser.cjs` `only-remote-imports-supabase` (0 violations) | verified — §11 |
| Client-generated UUID service | `src/services/ids.ts` | RFC 9562 v7 (time-ordered) + v4; pure (entropy injected) |
| Parameterised SQLite access | `src/data/local/sql.ts` (`assertIdentifier` + bound values everywhere), `row-codec.ts` | no string interpolation of user values (NFR-SEC) |
| Required states | Today (loading / signed-out / active / empty / offline-implicit), Library (empty / typing / results / no-results), Active workout (restoring / empty / **persist-failure → "Not saved — retrying" + Finish blocked**), Summary | screens are **wired, not device-verified** — see §9 |

### 6.2 Offline logging vertical slice (logic + wired screens)

| Step (task list) | Implementation | Verified by |
|---|---|---|
| 1. Search/select an exercise from local SQLite | `features/library/exercise-search.ts` + `ExerciseRepository.search` (indexed `name_normalized`, `ESCAPE`-safe LIKE, ranked) | `offline-logging.test.ts` (seed + query path); boundary lint |
| 2. Create / repeat a workout | `features/logging/session-service.ts` `startSession` + `domain/snapshot.ts` (`snapshotSession` — the one place copies are made, AR-RISK-5) | `offline-logging.test.ts` |
| 3. Start & recover the single active session | `SessionRepository.createActive` (one-active guard + DB partial-unique index), `SessionService.restoreActive` (a query, not a recovery procedure) | `offline-logging.test.ts` (relaunch via a fresh repo instance over the same DB restores the session + all completed sets); `migrate.test.ts` (index exists) |
| 4. Add / edit / complete sets without network | `features/logging/set-service.ts` (`addSet`/`editSet`/`completeSet`/`uncompleteSet`/`removeSet`); no per-set confirmation (UX-DEC-07) | `offline-logging.test.ts` (harness `online:false`) |
| 5. Persist each confirmed mutation atomically with its outbox op | `data/local/outbox-writer.ts` `enqueueMutation` inside `runInTransaction` | `outbox-atomicity.test.ts` (row + 1 pending entry; a throw rolls back BOTH) |
| 6. `pending` / durable immutable `dispatched` outbox protocol | `sync_outbox.state` + partial-unique index; `push.ts` never mutates a `dispatched` entry pre-terminal | `push.test.ts` (transport failure keeps it `dispatched` w/ same `operation_id`) |
| 7. Rest-timer recovery from an absolute anchor | `features/logging/rest-timer.ts` (`restTimerView`, `addFifteen`, `startAnchor`) — anchor is a timestamp, never a countdown | `offline-logging.test.ts` (`remaining` recomputed after a simulated 40 s gap; `+15s`) |
| 8. Finish the session idempotently | `SessionService.finishSession` (terminal-status check → no-op) | `offline-logging.test.ts` (double finish) |
| 9. Relaunch & restore active/completed without confirmed-set loss | as step 3 | `offline-logging.test.ts` |
| 10. Reconnect & synchronize via `sync_apply` | `data/sync/{push,pull,engine}.ts` against `SyncGatewayPort` (real impl `data/remote/gateway.ts`) | `push.test.ts` / `pull.test.ts` against `FakeGateway` (server contract model); **real Supabase → WORK-013** |
| 11. Surface conflicts / sync failures without blocking logging | `SyncEngine` catches all errors → `SyncIndicatorState` (`saved`/`syncing`/`offline`/`needs_attention`); completed-session conflict **parked** in `sync_conflicts` | `push.test.ts` (`conflict on a COMPLETED session is parked and NOT auto-re-issued`), `pull.test.ts` |
| 12. Basic completion summary + history entry | `features/logging/session-summary.ts` + `app/workout/summary/[sessionId].tsx`; `app/(tabs)/progress.tsx` History list | `offline-logging.test.ts` (completed list + materialised PRs); screen wired |

### 6.3 WORK-020 — client TS ↔ server SQL recompute parity — **increment-1 evidence only**

**Not yet complete.** This increment establishes *matching-vector* evidence: `src/domain/{calc,pr,week,uuid5}.ts` + `src/test/golden-vectors.ts` (a hand-copy of `supabase/tests/03_recompute_test.sql`) produce the same numbers in `src/domain/__tests__/recompute.golden.test.ts`, and `domain/uuid5.ts` matches the RFC DNS-namespace UUIDv5 vector. **Still required before the derived-data/sync portion is accepted (DEC-52):** a *reproducible cross-run* that executes the recompute on hosted-dev against the same session fixture and asserts the client and server agree on the **actual materialised derived-row IDs and values** (not a hand-copied fixture, not just an RFC UUID unit test). Tracked as an open condition (§9 L-2a, §12 CE-C2a).

Matching-vector table (from the identical hand-copied fixture):

| Quantity | Server (`03_recompute_test.sql`) | Client (this pass) |
|---|---|---|
| `max_load` PR | 110 | 110 ✓ |
| `est_1rm` (Epley) PR | 129.8333, `formula_id='epley'`, `formula_version=1` | 129.8333, epley, 1 ✓ |
| 2nd e1RM (100×5) | 116.6667 | 116.6667 ✓ |
| `rep_pr` | {1:110, 5:100, 8:102.5} | {1:110, 5:100, 8:102.5} ✓ |
| `session_volume` PR | 1430 | 1430 ✓ |
| weekly working volume | 1430 (bucket `2026-08-31`, Monday `week_start=1`) | 1430, `2026-08-31` ✓ |
| exercise weekly `best_e1rm` | 129.8333 | 129.8333 ✓ |
| rounding | `round(numeric, 4)` half-up | `roundTo(x, 4)` float-safe half-up ✓ |
| `week_start` 0–6 | `_week_start_for(local_date, week_start)` | `weekStartFor` — all 7 offsets asserted ✓ |
| idempotency | re-fire trigger → stable values | second `recomputeAll` byte-identical ✓ |

`domain/uuid5.ts` (pure SHA-1 UUIDv5) is validated against the RFC DNS-namespace test vector so client-side derived-row ids match `uuid_generate_v5` on the server (CE-A4).

## 7. Verification performed

All commands run from `client/`.

| Gate | Command | Result |
|---|---|---|
| **Strict TypeScript — FULL APP** (every `.ts`/`.tsx`: `app/` routes, `data/remote/gateway.ts`, `client.ts`, `session-storage.ts`, components, runtime) | `npx tsc --noEmit -p tsconfig.json` | **PASS** (exit 0, 0 errors) — added as a CI gate in this hardening pass. First run surfaced 3 errors (a `ViewProps.role` prop collision on `AppSurface`; a `readonly` `fontVariant` tuple) — both fixed. |
| Strict TypeScript — logic layers subset (runs without the native RN toolchain) | `npx tsc --noEmit -p tsconfig.logic.json` | **PASS** (0 errors) |
| Dependency-boundary rule (ADR-0002) over `src` + `app` | `npx depcruise src app --config .dependency-cruiser.cjs` | **PASS** — 0 errors, 1 warning (`no-orphans`: `features/logging/rest-timer.ts` — logic tested; UI wiring is increment 2) |
| Logic + sync + migration + WORK-020 (matching-vector) suites | `npx jest --config jest.config.cjs --ci` | **PASS** — 9 suites, **40/40 tests**. NOTE: these use a `better-sqlite3` test driver (**not** the Expo SQLite runtime — WORK-010) and a contract-modelling `FakeGateway` (**not** real client↔Supabase integration — WORK-013). |
| Full-app typecheck as a CI gate | `.github/workflows/client-verify.yml` job `full-app-typecheck` | **wired** — `npm ci` (Expo SDK 54, `client/.npmrc` `legacy-peer-deps=true`) + `tsc -p tsconfig.json` + `tsc -p tsconfig.logic.json` + `depcruise`; blocks the PR on any failure |

### 7.1 Test inventory (against the phase task list)

| Required test | File | Status |
|---|---|---|
| fresh SQLite creation + supported upgrade paths | `data/local/__tests__/migrate.test.ts` | ✓ (fresh chain; re-run no-op; truncated-then-full upgrade; one-active index present) |
| transaction rollback + row/outbox atomicity | `data/local/__tests__/outbox-atomicity.test.ts` | ✓ |
| dependency-boundary violations | `.dependency-cruiser.cjs` gate (CI) | ✓ (fails build on any cross-layer import) |
| one-active-session enforcement | `features/logging/__tests__/offline-logging.test.ts` ("refuses to start a second active session") + `migrate.test.ts` (index) | ✓ |
| offline creation + set logging | `offline-logging.test.ts` (harness `online:false`) | ✓ |
| force-close / relaunch recovery | `offline-logging.test.ts` (fresh repo over same DB) | ✓ |
| idempotent session completion | `offline-logging.test.ts` (double finish) | ✓ |
| outbox coalescing | `outbox-atomicity.test.ts` + `data/sync/__tests__/push.test.ts` | ✓ (one pending, stable `operation_id`, latest payload) |
| `dispatched` retry with the same `operation_id` | `push.test.ts` ("transport failure BEFORE apply … retry succeeds"; "AFTER server success … retry returns duplicate") | ✓ |
| a `dispatched` predecessor with a `pending` successor | `push.test.ts` ("successor is NOT sent this pass, then re-based to the returned version") | ✓ |
| transport failure after server success | `push.test.ts` (exactly-once via `operation_id` dedupe → `duplicate`) | ✓ |
| conflict parking for completed-session changes | `push.test.ts` ("conflict on a COMPLETED session is parked and NOT auto-re-issued") + `pull.test.ts` | ✓ |
| local/server schema-contract parity | `src/test/schema-parity.test.ts` (Zod schema keys ≡ SQLite columns) | ✓ (8 entity schemas) |
| unit conversion only at presentation | `domain/__tests__/calc.test.ts` (`units` block) + `services/unit-formatter.ts` (canonical kg at rest) | ✓ |
| accessibility labels + core interaction states | `components/{ui,SetRow}.tsx` (`accessibilityRole`/`Label`/`State`, ≥48 dp targets, ≥2 non-hue cues per state) | **authored, not device-verified** — WORK-007 |
| late-transaction-commit reconciliation | `pull.test.ts` ("full reconciliation recovers a row a late transaction commit left behind the incremental cursor") | ✓ (WORK-013 subset) |
| dirty local row overtaken on pull → conflict preserved | `pull.test.ts` | ✓ |
| WORK-020 golden-vector cross-run | `domain/__tests__/recompute.golden.test.ts` | ✓ (11 assertions incl. `week_start` 0–6 + idempotency) |
| UUIDv5 parity for derived-row ids | `domain/__tests__/uuid5.test.ts` (RFC DNS vector) | ✓ |

### 7.2 Existing DB verification — unchanged

No `supabase/` migration, function, test, `config.toml`, or pgTAP file was modified. `db lint`, RLS, and the pgTAP suites are untouched. The only `.github/workflows/db-verify.yml` change is **widening the `pull_request` trigger** to run on all PRs (CE-DEC-08) — the job steps are byte-identical, so the gate is not weakened.

## 8. State coverage

| Surface | loading | empty | active/success | validation | failure | offline | recovery |
|---|---|---|---|---|---|---|---|
| Today (`app/(tabs)/index.tsx`) | ✓ | ✓ ("Nothing planned") | ✓ (active-session card, raised-2) | n/a | (sync failure → indicator, non-blocking) | ✓ (renders from local; "Saved on device") | ✓ (`restoreActive`) |
| Library search (`exercise-search.ts` + screen) | ✓ | ✓ (recents) | ✓ (results) | n/a | — | ✓ (local index only) | n/a |
| Active workout (`app/workout/active/[sessionId].tsx`) | ✓ ("Restoring session…") | ✓ ("No exercises yet") | ✓ (SetRow prescribed→active→recorded) | `validatePerformedSet` (no negatives; zero load ok) | ✓ **"Not saved — retrying" + Finish blocked** (AR-DEC-10) | ✓ (no network on path) | ✓ (query on mount) |
| Completion summary | ✓ | — | ✓ (working sets / volume / status) | n/a | — | ✓ | ✓ (re-derives on finish) |
| Sync (`SyncEngine`) | `syncing` | — | `saved` | — | `needs_attention` (+ logged, never thrown to UI) | `offline` | `cold-start` reconciliation |

Screen states are **implemented in code**; visual/interaction/AX correctness on a device is WORK-007 (see §9).

## 9. Limitations & deferred work

| # | Item | Owner / tracking |
|---|---|---|
| L-1 | **No device / simulator verification.** Screens, navigation, gestures, keyboard-avoidance, VoiceOver/TalkBack, Dynamic Type reflow, dark-mode render, neumorphic rendering, RTL are **authored, not verified**. | WORK-007 (`client-engineering` + `quality-engineering`) — needs a runnable build |
| L-2 | **Sync not run against real Supabase.** `push`/`pull` are tested against a `FakeGateway` that models the `sync_apply` / PostgREST contract — this is *modelled protocol behaviour*, not client↔Supabase integration. The full WORK-013 conformance suite (concurrent writers, forced clock skew, kill-mid-push, same-timestamp page boundary, lost-response-with-successor, parked completed-session conflict) against a provisioned project is still required before any table is exposed. | WORK-013 (`software-architecture` + `backend-data-engineering` + `quality-engineering`) — needs DEP-1 client-linked |
| L-2a | **WORK-020 cross-run incomplete.** Only matching-vector + RFC-UUID evidence exists (a hand-copied fixture). A reproducible run against hosted-dev asserting client vs server agree on the actual materialised derived-row IDs + values is still required (DEC-52). | WORK-020 (`client-engineering` + `backend-data-engineering`) — needs DEP-1 client-linked |
| L-2b | **`better-sqlite3` tests ≠ Expo SQLite runtime.** The 40 tests exercise SQL behaviour under the test driver; the Expo SQLite transaction/WAL/prepared-statement guarantees are unverified (same as L-5). | WORK-010 |
| L-3 | **Auth / onboarding / per-user DB isolation not implemented → the Foundation exit gate is NOT met.** `RuntimeProvider` boots the container from an injected `userId`; Supabase Auth → `userId`, sign-up/in/out/reset, onboarding (SPEC AUTH-03), and per-user DB switch-on-sign-in / drop-on-sign-out (ADR-0009) are **increment 2**. `session-storage.ts` + `client.ts` seams are in place but not wired to a live session. | `client-engineering` (increment 2) |
| L-4 | **Planning / Progress-Overview-PRs-Trends / full Library / Settings** screens are shells. Only the logging vertical slice is functional end-to-end (per the "prove the slice first" guardrail). | `client-engineering` (SPEC §18 Phase 2–4 increments) |
| L-5 | `expo-sqlite@~16` transaction/WAL guarantees not verified on the locked SDK (AR-A4 / AR-C3). `runInTransaction` uses explicit `BEGIN IMMEDIATE`; may need `withExclusiveTransactionAsync`. | WORK-010 (`software-architecture` + `client-engineering`) |
| L-6 | Icon family not locked (VIS-OQ-3); text-glyph placeholders in components. | WORK-008 |
| L-7 | ~~Full-app `tsc -p tsconfig.json` not run.~~ **RESOLVED in the PR #1 hardening pass:** full-app `tsc -p tsconfig.json` (Expo SDK 54 installed) runs and **passes** (3 initial errors fixed), and is now a CI gate (`client-verify.yml` job `full-app-typecheck`). `jest-expo` component/screen tests remain deferred to the screen-verification increment. | `client-engineering` + `quality-engineering` |
| L-8 | Reactive `useDbQuery` layer (AR-OQ-4 / AR-RISK-3) not built; screens read repos imperatively in `useFocusEffect`/`useEffect`. | `client-engineering` (Foundation hardening) |
| L-9 | `no-orphans` warning on `features/logging/rest-timer.ts` — logic tested, UI wiring in the active screen deferred to the screen slice. | `client-engineering` |
| L-10 | WORK-017 (shared machine-readable entity definition) not extracted; `domain/entities.ts` + `data/local/schema/migrations.ts` + `data/remote/schemas/` are hand-kept in lockstep, guarded by `schema-parity.test.ts`. | `client-engineering` + `backend-data-engineering` |

## 10. Cross-phase items routed (not decided here)

| ID | Item | Routed to |
|---|---|---|
| CE-R1 | **CE-DEC-08** — `db-verify.yml` `pull_request` trigger widened to run on all PRs so the required check reports on client-only PRs. Non-weakening; needs ratification by the workflow owner. | `platform-release` |
| CE-R2 | **ISS-28 / BD-DEC-01** — PostgreSQL 17 is the observed dev/CI/hosted target; BD-DEC-01 assumed PG15. This phase targeted PG17 (no schema change needed) and did **not** edit the backend-owned decision. Formal BD-DEC-01 ratification. | `backend-data-engineering` |
| CE-R3 | AR-OQ-1 (UUIDv7 availability in the locked SDK) — client defaults to v7 with a v4 fallback in `services/ids.ts`; confirm the RN CSPRNG path on-device. | `client-engineering` + `software-architecture` |
| CE-R4 | AR-OQ-4 (`useDbQuery` vs a reactive SQLite lib) — not resolved; imperative reads for now. | `software-architecture` + `client-engineering` |

## 11. Preflight — Git/GitHub & public-repo exposure audit

Performed before any client code was written (task §1). Evidence: GitHub rulesets API + full-history scan.

| Check | Result |
|---|---|
| Working tree clean; `main` = `origin/main` | ✓ |
| Repository visibility | ✓ **public** (`DiegoDoug/fitney`) |
| Active ruleset on `main` ("Protect Main", `enforcement: active`, targets `~DEFAULT_BRANCH`) | ✓ |
| Pull requests required | ✓ (`pull_request` rule) |
| `db-verify` required status check | ✓ (`required_status_checks`, context `db-verify`) |
| Branches must be current before merge | ✓ (`strict_required_status_checks_policy: true`) |
| Force pushes blocked | ✓ (`non_fast_forward`) |
| Branch deletion blocked | ✓ (`deletion`; `creation` also restricted) |
| No unrestricted bypass making the rule advisory | ✓ (`bypass_actors: []`, `current_user_can_bypass: "never"`) |
| `.github/workflows/db-verify.yml` runs on `pull_request` | ✓ (widened this pass to all PRs — CE-DEC-08) |
| No Supabase service-role key / access token / PAT / private key / signing / HMAC material in tracked tree or full history | ✓ none found |
| No populated `.env` tracked or in history | ✓ `.env` git-ignored + untracked + absent from history; `.env.example` = placeholders + inert Notion DB UUIDs |
| No unsafe `pull_request_target` / privileged execution of untrusted fork code | ✓ neither workflow uses `pull_request_target`; `sync-project-memory.yml` runs only on `schedule`/`dispatch` |

Branch protection is **demonstrably enforced**; the exposure audit is **clean**. TASK-7 marked satisfied (see §13). No credential value is reproduced anywhere in this artifact.

## 12. Status

**Phase 5 = `IN PROGRESS`. Increment 1 = awaiting review on PR #1 (NOT a phase submission).**

Delivered and verified where verifiable in this environment: full-app strict TypeScript (`tsc -p tsconfig.json`, now a CI gate), the layered dependency-boundary rule enforced in CI, forward-only client migrations mirroring the server schema, repository interfaces + local implementations, the sync-engine state machine (transactional outbox with the durable `dispatched` state, `operation_id` exactly-once, successor-aware acknowledgement, hybrid pull with late-commit reconciliation, parked completed-session conflicts), secure token-storage + typed-gateway seams confined to one directory, a client UUID service, parameterised SQLite access, and WORK-020 *matching-vector* evidence. 9 test suites, 40/40 — under a `better-sqlite3` driver and a contract-fake gateway.

**What this establishes vs. what it does not:**

| Reported evidence | Establishes | Does NOT establish |
|---|---|---|
| full-app `tsc` (0 errors) + 40 tests | the app typechecks; the tested logic passes | correct runtime behaviour on device |
| `better-sqlite3` tests | SQL behaviour under the test driver | Expo SQLite transaction/WAL/prepared-statement guarantees (WORK-010) |
| `FakeGateway` sync tests | modelled protocol behaviour (dispatched/successor/ack/reconciliation/parked-conflict) | real client ↔ Supabase integration (WORK-013) |
| WORK-020 golden vectors + RFC UUID test | the client recompute matches a hand-copied fixture; UUIDv5 is RFC-correct | a reproducible client/server cross-run on hosted-dev against actual derived-row IDs (DEC-52) |

**The Foundation exit gate (SPEC §18) is NOT met** — authentication, onboarding, and per-user SQLite isolation are unfinished (L-3), and no state is device- or hosted-verified.

Open conditions (none of these is "accept or defer" — they are the remaining Foundation work):

- **CE-C1 (device verification):** L-1 — WORK-007 on a runnable build.
- **CE-C2 (real-Supabase sync):** L-2 — WORK-013 against DEP-1 client-linked.
- **CE-C2a (WORK-020 cross-run):** L-2a — reproducible hosted-dev cross-run on real derived-row IDs (DEC-52).
- **CE-C3 (Expo SQLite runtime):** L-2b / L-5 — WORK-010.
- **CE-C4 (auth → per-user DB → onboarding):** L-3 — increment 2; also carries SEC-RESID-1 (before beta).
- **CE-C5 (routed items):** CE-R1 (`db-verify` trigger widening → `platform-release` to ratify), CE-R2 (ISS-28 / BD-DEC-01 → `backend-data-engineering`).
- **CE-C6 (CI depth):** ~~L-7~~ full-app typecheck gate **done** this pass; `jest-expo` component/screen tests + device tests remain (increments 3–4).

### Increment 1 → next steps (agreed with the human 2026-09-03)

1. **PR #1 hardening (this pass):** full-app `tsc` runs, 3 errors fixed, wired as a CI gate. Lifecycle framing corrected to *Phase 5 IN PROGRESS / increment 1 in review*. **Do not merge as a phase approval.**
2. **Increment 2:** authentication → per-user SQLite isolation → onboarding.
3. **Increment 3:** real Expo runtime verification (WORK-010) + hosted-dev sync verification (WORK-013) + the WORK-020 cross-run.
4. **Increment 4:** device-test the offline-logging flow (WORK-007). Then the Foundation gate is assessed.

Planning / Progress / Library expansion and phases 9–11 stay on hold throughout.

## 13. Roadmap / Notion updates applied

- `development-roadmap.md`: lifecycle row 5 → **`IN PROGRESS`** (result `—`, "increment 1 in review, not a phase submission, Foundation exit gate not met"); artifact registry entries → `IN PROGRESS`; add `client/`; WORK-020 → *matching-vector evidence; hosted cross-run still required*; WORK-011 (boundary lint) → `DONE`; WORK-010 / WORK-013 / WORK-007 / WORK-008 / WORK-017 → carry with owners; CE-DEC-01…08; CE-RISK-1…3; human review log → **REVISIONS REQUESTED** (increment 1, not a phase submission); TASK-7 → `Done`; validator re-run → PASS.
- Notion (canonical): Reviews & Verification entry *"Phase 5 — Client engineering: Foundation gate + offline-logging logic layers"* → **retitled/reframed as an increment-1 review with REVISIONS REQUESTED**; REL-5 milestone → `Active` (Phase 5 in progress); TASK-7 → `Done` (branch protection verified, repo public). CE-DEC-01…08 enumerated for formalization into the Decisions DB.
- `.project-memory/` regenerated from Notion and validated (`validate_system.py` PASS, `npm run check` OK).

---

## 14. Increment 2 — Authentication → per-user SQLite isolation → onboarding

- Execution date: 2026-09-04
- Branch: `phase-5/auth-isolation` → PR to `main` (this increment). **Not a phase submission.**
- Authorization: explicit human instruction to execute Phase 5 increment 2 only (scope: authentication → per-user SQLite isolation → onboarding; Phase 5 stays IN PROGRESS).
- Classification: **CREATE** (auth/onboarding/isolation seams existed only as stubs in increment 1 — `RuntimeProvider` booted from an injected `userId`; `session-storage.ts` + `client.ts` were wired but not driven).
- Upstream relied on: `security-identity` (REV-10, APPROVED WITH CONDITIONS) §5 SEC-REQ-AUTH-01…05 / SEC-REQ-AZ-01; `evidence-based-ui-ux` §10 state matrix + §10.6 back/recovery; `visual-ui-design` §6–§7 tokens/components; `software-architecture` ADR-0009 + system-architecture §6.4; SPEC §6.1 AUTH-01…05, §18 Phase 0.

### 14.1 Preflight findings

| # | Finding | Action |
|---|---|---|
| P-1 | PR #1 **merged** (squash) 2026-09-04; `origin/main` @ `625c6a5`; local tree identical to `origin/main` (squash pre-image). | Branched `phase-5/auth-isolation` from `origin/main`. Working tree clean. Nothing merged automatically. |
| P-2 | **Required-merge-check discrepancy.** The `Protect Main` ruleset (id 22205300, active, `bypass_actors: []`) requires **only `db-verify`** as a required status check (strict). `client-verify.yml` jobs `full-app-typecheck` + `logic-tests` run on every client PR (they will report green on this PR) but are **advisory** — not in `required_status_checks`. Canonical Notion TASK-7 only ever scoped `db-verify`. The instruction's expectation ("full-app-typecheck, logic-tests … remain required merge checks") is **not currently true**. | **Not fixed** (branch-protection / security setting, `platform-release`-owned, needs a human). Routed as **CE-R6** — add contexts `full-app-typecheck` + `logic-tests` to the ruleset (extends CE-R1). |
| P-3 | `expo-doctor` (installed toolchain) flagged: (a) missing peer dep `react-native-worklets` (Reanimated 4 split it out — "app may crash outside Expo Go"); (b) `react-native` patch drift `0.81.4` → SDK-54-expected `0.81.5`. Both pre-existing on `main` (increment 1). | Remediated with **`npx expo install`** (the mandated version-selection path — SDK 54, not an SDK upgrade, `legacy-peer-deps` not used as evidence): `react-native-worklets@0.5.1` added; `react-native` → `0.81.5`. After: `expo install --check` clean, `expo-doctor` **18/18**. `@supabase/supabase-js` unchanged (`2.112.4`, only alphabetised by the tool). On-device runtime verification of the RN bump still belongs to WORK-010. `npm audit` reports 25 advisories (1 critical / 11 high / 13 moderate) in the transitive RN/Expo dev toolchain — pre-existing, not chased (fix requires breaking changes); noted for `platform-release` / `quality-engineering`. |
| P-4 | Baseline gates on the fresh branch: full-app `tsc` PASS, logic `tsc` PASS, `depcruise` 0 errors (1 pre-existing `no-orphans` warn), `jest` 40/40. | Recorded as the pre-implementation baseline. |

### 14.2 What was delivered (paths under `client/`)

| Area | Paths | Notes |
|---|---|---|
| **AuthPort seam (pure)** | `src/services/auth.ts`, `src/services/index.ts` (+`Services.auth`) | `AuthPort` interface (ADR-0009 `services/AuthProvider`); `AuthUser/AuthSession/AuthChange`; provider-agnostic `AuthErrorCode` + `classifyAuthError` + `authErrorMessage`; `ENUMERATION_SENSITIVE` set + neutral copy (SEC-REQ-AUTH-03); `validateEmail/Password`, `validateSignIn/SignUpForm`; `parseAuthUrl` (recovery/PKCE deep links); `createFakeAuth` (deterministic, emits `INITIAL_SESSION` on subscribe). No token/email/password is logged from here. |
| **GoTrue gateway (the only `@supabase` auth caller)** | `src/data/remote/auth-gateway.ts` | `createSupabaseAuthPort(sb, { redirectTo })`: `signUp/signInWithPassword/signOut/resetPasswordForEmail/updateUser`, `onAuthStateChange` → `AuthChange`, `handleDeepLink` → `setSession` / `exchangeCodeForSession`. Session persistence / restoration / auto-refresh come from the existing `data/remote/client.ts` (`storage: secureSessionStorage` = `expo-secure-store` chunked, `autoRefreshToken`, `persistSession`). Excluded from `tsconfig.logic.json`; typechecked in the full-app CI job. Boundary lint: `only-remote-imports-supabase` satisfied (no `@supabase` import outside `data/remote`). |
| **Auth feature wrapper** | `src/features/auth/auth-flow.ts` | `AuthFlow` — screen-facing `{ ok } | { ok:false, code, message, enumerationSensitive }` results; uniform password-reset copy; maps `AuthError` + raw provider errors; sanitised logging/analytics only (`signed_in` / `signed_out`). `features/*` depends on the `AuthPort` *interface*; the concrete gateway is injected at the root. |
| **Per-user composition (logic-safe)** | `src/runtime/build-container.ts` | `assembleContainer(userId, deps)` — injectable `db` + `SyncGatewayPort`; wires `migrate → repos → SyncEngine → SessionService/SetService/ExerciseSearch/OnboardingService`. `AppContainer` gains `userId`, `onboarding`, `outstandingWork()` (outbox + open conflicts), `dispose()` (stop sync, close the handle; idempotent). Moving the wiring here is what makes isolation testable without the RN toolchain. |
| **Account lifecycle (pure)** | `src/runtime/account-lifecycle.ts` | `decideAccountAction(activeUserId, AuthChange)` → `activate | retire | retire-then-activate | ignore | recovery` — distinguishes a real `SIGNED_OUT` / account change from `TOKEN_REFRESHED` / `USER_UPDATED` (same user → no teardown) and from a mere loss of connectivity (no event). `GenerationGuard` (`bump()`/`isCurrent()`) — a late async result from account A is inert once the runtime moved on. `decideSignOutDisposition(work)` — **interim** unsynced-work policy (see §14.4 / CE-R5). |
| **Runtime driver** | `src/runtime/context.tsx` (rewritten), `src/runtime/container.ts` (native), `src/data/local/driver.native.ts` (`deleteDatabase`), `src/data/sync/engine.ts` (`stop()`/`isStopped()`) | `RuntimeProvider` subscribes to `AuthPort`, runs transitions on a **serialized promise chain** (A and B never interleave), stamps every build with a generation, disposes a stale build, gates onboarding, kicks a first non-blocking sync (and promotes onboarding→ready if a hydrate pulls a server-synced profile), clears account-scoped UI state by unmounting the tab tree on `signed-out`. `useRuntime()` keeps its original 3-state contract (`loading | signed-out | ready`) so existing tab/workout screens are untouched; new `useAuth()` / `useOnboarding()` expose the richer state. `SyncEngine.stop()` makes `requestSync` inert (no protocol change; the engine owns no timers). Clean sign-out drops the per-user file via `SQLite.deleteDatabaseAsync` (in `data/local`, not `runtime`, to satisfy `only-local-imports-sqlite-driver`). DEV-only `EXPO_PUBLIC_DEV_USER_ID` (non-production builds) boots a seeded user with a local-only fake session — an explicit env opt-in, **not** an implicit guest fallback (AUTH-04). |
| **Onboarding gate (local-only marker)** | `src/data/local/schema/migrations.ts` (`m0002`), `src/data/local/repositories.ts`, `src/data/repositories/types.ts`, `src/test/schema-parity.test.ts` | `m0002` = additive `ALTER TABLE profiles ADD COLUMN onboarding_completed_at INTEGER` — a **local-only** marker in the `dirty`/`synced_version`/`local_updated_at` family; added to `stripLocalMeta` + `schema-parity` `LOCAL_ONLY`. `ProfileRepository.getOnboardingState` (`profileExists`/`completed`/`serverSynced`/prefill `draft`) + `markOnboardingComplete` (set-once `COALESCE`, **never** enqueues an outbox op). |
| **Onboarding feature** | `src/features/onboarding/onboarding-service.ts`, `src/services/analytics.ts` (`onboarding_completed` etc.) | `OnboardingService.getState` / `submit(userId, input)`. `submit` writes the profile through the **existing** contract — `ProfileRepository.upsert` = local `profiles` row + `profile` outbox upsert, atomic → `sync_apply` under RLS `profile_insert with check (id = auth.uid())` (no server signup trigger exists; the client owns first-write of its own profile). Idempotent (outbox coalesces; marker set-once). Resumable (partial row → prefilled `draft`). Hydrate (a server-synced row ⇒ `complete`, form skipped). `OnboardingInput` = display name, unit, week start, default rest, optional goal — **only** the AUTH-03 fields. |
| **Screens** | `app/(auth)/{_layout,welcome,sign-in,sign-up,forgot-password,reset-password,onboarding}.tsx`, `app/settings.tsx`, `app/_layout.tsx` (rewritten routing + deep-link), `app/(tabs)/index.tsx` (Settings link) | `AuthRouter` in the root redirects by phase: `signed-out`/`authenticating` → `(auth)/welcome`, `recovery` → `reset-password`, `onboarding` → `(auth)/onboarding`, `ready` → `(tabs)`; `error` → inline retry screen. Deep links (`fitney://…#access_token=…&type=recovery` / `?code=…`) routed to `handleAuthDeepLink`. `redirectTo` = `Linking.createURL('/auth/callback')` — **must be allow-listed in Supabase Auth settings** (hosted config → `platform-release`, SEC-C2). Screen states: bootstrapping, submitting (spinner + disabled), field validation, form-level failure banner (neutral copy), confirm-email, uniform reset confirmation, container-init error + retry. Sign-out lives in `app/settings.tsx`. |
| **Form primitives** | `src/components/ui.tsx` | `AppTextField` (always-visible label, ≥48 dp, error = border-weight + glyph + text, not hue alone — VIS-DEC-06), `FieldError`, `FormBanner` (`error`/`success`/`info`, `accessibilityRole="alert"` for errors), `SegmentedControl` (selected = border + fill + ✓ + weight; `radiogroup`/`radio`; ≥48 dp), `NumberStepper` (−/value/+, ≥48 dp targets, tabular value). |

### 14.3 Verification performed (all from `client/`)

| Gate | Command | Result |
|---|---|---|
| Strict TypeScript — **full app** | `npx tsc --noEmit -p tsconfig.json` | **PASS** (0 errors) |
| Strict TypeScript — logic layers (`src/runtime/**` added to the logic project; `container.ts` excluded) | `npx tsc --noEmit -p tsconfig.logic.json` | **PASS** (0 errors) |
| Dependency-boundary rule (ADR-0002) | `npx depcruise src app --config .dependency-cruiser.cjs` | **PASS** — 0 errors, 1 pre-existing `no-orphans` warn (`features/logging/rest-timer.ts`). One violation caught + fixed mid-work (`runtime/container.ts` imported `expo-sqlite` directly → moved `deleteDatabase` into `data/local/driver.native.ts`). |
| Logic + sync + migration + WORK-020 + **auth/isolation/onboarding** suites | `npx jest --config jest.config.cjs --ci` | **PASS** — **15 suites, 98/98** (40 prior + 58 new). Driver = `better-sqlite3`; sync = `FakeGateway`; auth = `createFakeAuth`. **NOT** the Expo SQLite runtime, **NOT** real Supabase/GoTrue, **NOT** a device. |
| Expo dependency check | `npx expo install --check` | **Dependencies are up to date** (after §14.1 P-3) |
| Expo Doctor (installed toolchain) | `npx expo-doctor@1.20.4` | **18/18 checks passed** (after §14.1 P-3) |

#### New test inventory (against the increment-2 verification list)

| Required coverage | File | Layer |
|---|---|---|
| Session persistence / restoration / refresh / storage failure | `createFakeAuth` restore + `INITIAL_SESSION` (`src/services/__tests__/auth.test.ts`); **storage-failure + real token refresh against hosted GoTrue is deferred** (§14.4 L-2c) | mocked logic; hosted = deferred |
| Sign-in failure, sign-out, password-recovery state transitions | `src/features/auth/__tests__/auth-flow.test.ts`, `src/services/__tests__/auth.test.ts` | mocked logic |
| Account A → B → A isolation across rows, outbox, cursors, conflicts, cached UI | `src/runtime/__tests__/account-isolation.test.ts` (`A→B` separation; `A→B→A` over a **retained file** with a fresh handle; cached UI = unmount on `signed-out`) | real local SQLite (better-sqlite3) |
| A delayed account-A response arriving after switching to B | `account-isolation.test.ts` ("a late result from account A cannot be applied after the runtime moved to B" — `GenerationGuard`) + `account-lifecycle.test.ts` | real local SQLite + pure |
| Repeated auth events / overlapping account transitions | `account-lifecycle.test.ts` (`decideAccountAction` matrix: same-user `SIGNED_IN`/`TOKEN_REFRESHED`/`USER_UPDATED` → `ignore`; `SIGNED_OUT` while out → `ignore`) + `account-isolation.test.ts` ("dispose idempotent; repeated activation over the same file") | pure + real local SQLite |
| Offline relaunch for a previously authenticated user | `account-isolation.test.ts` ("offline relaunch … still reads/writes locally" — `indicator: 'offline'`, `gateway.applyLog` empty, local set add works) | real local SQLite |
| Unsynced-change handling at sign-out | `account-lifecycle.test.ts` (`decideSignOutDisposition`) + `account-isolation.test.ts` (`outstandingWork().outbox > 0` ⇒ `dropLocalDb === false`) | pure + real local SQLite |
| Interrupted + repeated onboarding / profile initialization | `src/features/onboarding/__tests__/onboarding-service.test.ts` (resumable partial → `draft`; idempotent re-submit → 1 coalesced outbox row, marker unchanged; hydrate; validation throw), `src/data/local/__tests__/profile-onboarding.test.ts`, `src/data/local/__tests__/migrate.test.ts` (m0002 fresh + v1→v2 upgrade, existing rows survive) | mocked logic + real local SQLite |
| Component behaviour for auth/onboarding loading / validation / failure / navigation states | screen **logic** covered via `AuthFlow` result transitions + `validate*` + `parseAuthUrl` + the phase→route table; **rendered-component (`jest-expo`) tests deferred to increment 3–4** (no `jest-expo` harness in-repo yet — consistent with §7 L-7) | mocked logic; rendered = deferred |

### 14.4 Limitations & deferred work (increment 2)

| # | Item | Owner / tracking |
|---|---|---|
| L-2c | **No hosted GoTrue evidence.** Sign-up / sign-in / confirm-email / recovery-link / token-refresh / storage-failure have not run against a real Supabase Auth instance. Needs DEP-1 **client-linked** (`EXPO_PUBLIC_SUPABASE_URL` + anon key for `fitney-dev`) **and** the `fitney://auth/callback` redirect allow-listed in the project's Auth settings **and** synthetic test accounts. Requested via secure setup (§14.6). | `client-engineering` + `platform-release` (hosted config = SEC-C2) — increment 3 |
| L-2d | **No Expo runtime / device evidence.** The account-transition + secure-store + deep-link paths are authored, not run on a simulator or device. `expo-secure-store` chunking, `SQLite.deleteDatabaseAsync` semantics, `Linking.useURL` timing, and the RN `0.81.5` bump are unverified on-device. | WORK-007 / WORK-010 — increment 3–4; CE-C1 / CE-C3 |
| L-2e | **`better-sqlite3` ≠ Expo SQLite.** `dispose()` closes a handle and the app re-opens the per-user file on relaunch; the retain/relaunch tests model this with file-backed better-sqlite3. The real `expo-sqlite` close/re-open + WAL behaviour is WORK-010. | WORK-010 |
| L-2f | **Sign-out disposition is INTERIM (CE-R5).** ADR-0009 says "drop the local DB on verified sign-out"; that is unambiguous only when everything is synced. `decideSignOutDisposition` currently: clean → drop; **unsynced work → RETAIN the file** (nothing discarded), clear the session, show a non-blocking notice, reuse on next sign-in as that user. A blocking "back up first / explicit discard" confirmation UX is a **product/security owner decision** — routed. Never silently discards `pending`/`dispatched` ops. | **CE-R5** → `security-identity` + `evidence-based-ui-ux` |
| L-2g | **Stale per-user files are not garbage-collected.** A crash during an A→B switch (B's session persisted, A's file retained) leaves A's file on disk. No leak (each file is `userId`-scoped, only re-openable by re-authenticating as A), but a janitor for orphaned files is not built. | `client-engineering` — Foundation hardening |
| L-2h | **`PASSWORD_RECOVERY` deep-link handling is authored, not exercised.** `parseAuthUrl` is unit-tested; the end-to-end `Linking → handleDeepLink → sb.auth.setSession → PASSWORD_RECOVERY → reset-password` chain needs the hosted flow + a device. | increment 3 (with L-2c) |
| L-2i | **SEC-RESID-1 unchanged.** `delete-account` re-auth is still the 300 s heuristic; the `delete-account` UI/flow is **not** in this increment (out of scope). Carried to before-beta. | `security-identity` + `client-engineering` |
| L-2j | Rendered `jest-expo` component/screen tests + a11y assertions (VoiceOver/TalkBack order, Dynamic Type reflow, RTL, keyboard-avoidance on the auth forms) deferred to increment 3–4 (no jest-expo harness yet). | `client-engineering` + `quality-engineering` — WORK-007 |

**This increment does not discharge the Foundation exit gate.** WORK-007, WORK-010, WORK-013 (incl. its cross-run) and WORK-020's hosted cross-run remain **open**.

### 14.5 Cross-phase items routed (not decided here)

| ID | Item | Routed to |
|---|---|---|
| **CE-R5** | Sign-out with **unsynced local work**: interim policy = retain the per-user DB + non-blocking notice (never silent discard). Owner decision needed on whether a blocking drain / explicit-discard confirmation UX is required, and whether ADR-0009's "drop on sign-out" should be reworded to "drop **once synced**". | `security-identity` + `evidence-based-ui-ux` |
| **CE-R6** | `Protect Main` ruleset requires only `db-verify`. Add contexts `full-app-typecheck` + `logic-tests` (from `client-verify.yml`) to the required checks so the client gates are enforced, not advisory. Extends CE-R1. | `platform-release` |
| CE-R7 | RN patch bump `0.81.4 → 0.81.5` + new dep `react-native-worklets@0.5.1` applied via `expo install` during preflight (SDK 54, non-weakening). Confirm at the pinned-dependency review; on-device runtime confirmation is WORK-010. `npm audit` toolchain advisories (1 critical / 11 high) noted. | `platform-release` + `quality-engineering` |
| CE-R1 / CE-R2 | (carried from increment 1) `db-verify` trigger widening → `platform-release`; ISS-28 / BD-DEC-01 PG17 → `backend-data-engineering`. **Not resolved here.** | as noted |

### 14.6 Secure setup requested (for increment 3 hosted Auth smoke)

Needed before any real GoTrue evidence can be produced; **do not** provision or reset anything hosted without human action:

1. `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` for **`fitney-dev`** placed in `client/.env` (client-safe values only — never a service-role key).
2. `fitney://auth/callback` (and the Expo dev-client / Expo Go variants) added to the `fitney-dev` project's **Auth → URL Configuration → Redirect URLs**.
3. Confirm dev-env GoTrue settings: `enable_confirmations` state, leaked-password protection, user-enumeration protection (SEC-REQ-AUTH-02/03) — read-only confirmation, no changes by this phase.
4. 2–3 **synthetic** test accounts (throwaway addresses) for the smoke — never real user credentials.

### 14.7 Owned decisions (increment 2)

| ID | Decision |
|---|---|
| **CE-DEC-09** | The `services/AuthProvider` of ADR-0009 is realised as `AuthPort` (pure interface in `services/auth.ts`) + a single GoTrue impl in `data/remote/auth-gateway.ts`. Screens never see `AuthPort` directly — auth actions are exposed through the runtime context (`useAuth`). |
| **CE-DEC-10** | Per-user composition is split: `runtime/build-container.ts` (`assembleContainer`, logic-safe, injectable `db`+`gateway`) + `runtime/container.ts` (native `expo-sqlite`/Supabase wiring). `src/runtime/**` is added to `tsconfig.logic.json` (minus `container.ts`) so account isolation is unit-tested without the RN toolchain. |
| **CE-DEC-11** | Account transitions run on a **serialized promise chain** with a monotonic `GenerationGuard`; a build whose generation is stale is disposed, never mounted. `TOKEN_REFRESHED`/`USER_UPDATED` for the active user are **no-ops** (not a teardown). |
| **CE-DEC-12** | Onboarding-complete is a **local-only** `profiles.onboarding_completed_at` marker (`m0002`), set-once, never synced. `onboarded = marker set OR the row is server-synced` (the second half handles multi-device hydrate). |
| **CE-DEC-13** | **Interim** sign-out disposition (CE-R5): clean → drop the per-user file (ADR-0009); unsynced work present → retain it + non-blocking notice. Never silently discards `pending`/`dispatched` ops. |
| **CE-DEC-14** | Preflight dep remediation via `expo install` only (SDK 54): `react-native-worklets@0.5.1` + `react-native@0.81.5`. Not an SDK upgrade; routed for ratification (CE-R7). |

### 14.8 Status

**Phase 5 = `IN PROGRESS`. Increment 2 = ready for review (branch `phase-5/auth-isolation`).** Not a phase submission; does not seek Phase 5 approval. Phases 9, 10, 11 remain **LOCKED**.

Delivered + verified where verifiable here: the auth seam + GoTrue gateway behind the approved boundary; the per-user runtime lifecycle (serialized activate/retire/switch, generation guard, sync stop, DB close, clean-drop vs unsynced-retain, account-scoped UI clear, crash-safe re-resolve from the persisted session); the onboarding gate + service through the existing outbox/`sync_apply` contract; all auth/onboarding screens with their loading/validation/failure/navigation states; full-app `tsc` + logic `tsc` + boundary lint + `jest` **98/98** + `expo-doctor` 18/18.

**Not established:** any hosted-GoTrue behaviour, any on-device/simulator behaviour, `expo-sqlite` close/re-open semantics, the recovery deep-link end-to-end, rendered-component/a11y tests. **WORK-007 / WORK-010 / WORK-013 (+ its cross-run) / WORK-020 hosted cross-run stay open; the Foundation exit gate is not met.**

### Next verification step

Increment 3: place `fitney-dev` client env + redirect config (§14.6), then run the **hosted GoTrue smoke** on the designated dev environment with synthetic accounts (sign-up → confirm → sign-in → token refresh → password recovery → sign-out), the **WORK-013** sync conformance suite against the client-linked project, and the **WORK-020** reproducible client↔server recompute cross-run — then WORK-010 (Expo SQLite runtime) and WORK-007 (device test of the offline-logging flow), after which the Foundation exit gate is assessed.

---

## 14.9 Bounded pre-merge review (2026-09-04)

Read-only + reversible-prep review of PR #2. **No merge. Phase 5 stays IN PROGRESS; phases 9/10/11 LOCKED.** No ADR, ruleset, or approved-decision record was changed — §14.10 below is a **PROPOSED** policy awaiting owner approval.

### 14.9.1 PR head & checks (verified)

| | |
|---|---|
| PR | [#2](https://github.com/DiegoDoug/fitney/pull/2), state OPEN, `mergeStateStatus: CLEAN` |
| Head commit | `6cb08091e2f020b200642be5bf362912ee5e06ec` (local `phase-5/auth-isolation` == this; 0 commits behind `origin/main`; working tree clean) |
| `db-verify` (required) | ✅ SUCCESS (01:56:49→01:59:26Z) |
| `full-app-typecheck` | ✅ SUCCESS (01:56:49→01:58:50Z) |
| `logic-tests` | ✅ SUCCESS (01:56:50→01:57:23Z) |

### 14.9.2 Concrete merge blockers

1. **Governance gate** — this is *not* a Phase 5 submission; only the human advances the lifecycle. PR #2 must not be merged as a phase approval.
2. **CE-R5 unresolved** — the sign-out disposition is INTERIM. §14.10 is a **proposal**; it needs `security-identity` + `evidence-based-ui-ux` sign-off before the behaviour is settled. Merging the code is possible before that (the code never discards), but the review record must not read as ratified.
3. **CE-R6 not applied** — `full-app-typecheck` + `logic-tests` are still advisory (see 14.9.3). Requires a ruleset change the human/`platform-release` must authorize.
4. **Foundation exit gate open** — WORK-007 / WORK-010 / WORK-013 (+ its cross-run) / WORK-020 hosted cross-run. Not a blocker for merging *this increment* (it is explicitly not a phase submission), but blocks Phase 5 approval.

Nothing in the diff itself blocks a technical merge: CI is green, boundary lint clean, no ADR/schema/`supabase/` change, deps are `expo install`-sourced and SDK-54-compatible.

### 14.9.3 CE-R6 — required checks (platform-release; verified, NOT applied)

Verified against the live ruleset + workflows:

- Ruleset **"Protect Main"** (id `22205300`, `enforcement: active`, `bypass_actors: []`, `current_user_can_bypass: never`, `strict_required_status_checks_policy: true`) lists **one** required check: `db-verify` (`integration_id: 15368` = GitHub Actions).
- Check names are the CI **job** names: `db-verify` (`db-verify.yml`), `full-app-typecheck` + `logic-tests` (`client-verify.yml`).
- **Trigger coupling (the gotcha):** `client-verify.yml`'s `pull_request:` trigger is **path-filtered** to `client/**` + its own file. `db-verify.yml`'s `pull_request:` trigger has **no** path filter (widened by CE-DEC-08 for exactly this reason). GitHub does **not** auto-pass a required check whose workflow never ran — it stays "Expected / waiting" and **blocks merge**. So a PR that touches only non-`client/**` files (e.g. a governance-only `.project-memory/**` + roadmap PR) would deadlock the moment `full-app-typecheck` / `logic-tests` become required.

**Minimal change — two coupled parts, present for approval:**

1. `.github/workflows/client-verify.yml` — drop the `paths:` filter on the `pull_request:` trigger (keep the `push: [main]` filter). Non-weakening: same jobs, run on every PR, matching `db-verify.yml`.
   ```diff
      pull_request:
   -    paths:
   -      - "client/**"
   -      - ".github/workflows/client-verify.yml"
      workflow_dispatch:
   ```
2. Ruleset `22205300` — add two contexts to `required_status_checks`:
   ```
   required_status_checks: [
     { context: "db-verify",          integration_id: 15368 },
     { context: "full-app-typecheck", integration_id: 15368 },   # add
     { context: "logic-tests",        integration_id: 15368 },   # add
   ]
   ```
   Apply via `gh api --method PUT repos/DiegoDoug/fitney/rulesets/22205300 --input <full-ruleset-body>` (the PUT replaces the whole ruleset; the body must re-send `name`, `target`, `enforcement`, `conditions`, all existing `rules`, `bypass_actors: []`).

**Authorization:** a repository ruleset is a security/settings change and is `platform-release`-owned (TASK-7 canonically scoped it to `db-verify` only). **Not applied here.** Extends CE-R1. Human review 2026-09-04: *"I support the proposed CE-R6 required-check changes … subject to their stated verification"* — supported in principle, pending the human's own verification of GitHub state; not yet applied.

**Prepared change for review (2026-09-04).**

*Part 1 — `.github/workflows/client-verify.yml`* (apply on the PR branch or a follow-up; inert until Part 2):

```diff
--- a/.github/workflows/client-verify.yml
+++ b/.github/workflows/client-verify.yml
@@
   pull_request:
-    paths:
-      - "client/**"
-      - ".github/workflows/client-verify.yml"
   workflow_dispatch:
```

The `push:` trigger keeps its `paths:` filter unchanged (post-merge runs on `main` need not run for non-client pushes). After this, `full-app-typecheck` + `logic-tests` report on **every** PR.

*Part 2 — ruleset `22205300`* (repo-settings change; run by a maintainer / `platform-release`):

```bash
gh api --method PUT repos/DiegoDoug/fitney/rulesets/22205300 \
  --input ce-r6-ruleset-22205300.json
```

`ce-r6-ruleset-22205300.json` — the complete current ruleset body with `full-app-typecheck` + `logic-tests` added to `required_status_checks` (the PUT replaces the whole ruleset; `name` / `target` / `enforcement` / `conditions` / all existing `rules` / `bypass_actors: []` are re-sent verbatim):

```json
{
  "name": "Protect Main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "exclude": [], "include": ["~DEFAULT_BRANCH"] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "creation" },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "db-verify",          "integration_id": 15368 },
          { "context": "full-app-typecheck", "integration_id": 15368 },
          { "context": "logic-tests",        "integration_id": 15368 }
        ]
      }
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "require_extra_approval_for_unattributed_changes": true,
        "allowed_merge_methods": ["merge", "squash", "rebase"]
      }
    }
  ]
}
```

**Order matters:** apply Part 1 first (or together). Applying Part 2 alone, while `client-verify.yml` is still path-filtered, would block any non-`client/**` PR (e.g. a governance-only sync) until Part 1 lands. Verify after both: open a trivial non-client PR and confirm all three checks report and the merge box requires them.

**Ready-to-apply artifact:** `ce-r6-ruleset-22205300.json` (this exact body) is staged in the session scratchpad for `--input`; it is not committed to the repo (a ruleset body is not a source artifact).

### 14.9.4 CE-R7 — RN / worklets bump (platform-release; verified outcome)

`react-native` `0.81.4 → 0.81.5`, `+ react-native-worklets@0.5.1`; `@supabase/supabase-js` unchanged (`2.112.4`, only alphabetised). Assessment:

- **SDK-54-compatible, `expo install`-sourced.** `0.81.5` is SDK 54's `bundledNativeModules` pin; `react-native-worklets@0.5.1` is what `expo install react-native-worklets` resolves for SDK 54 + `react-native-reanimated@4.1.7`. **Not** an SDK upgrade; `legacy-peer-deps` was not used as compatibility evidence (`expo install --check` → up to date; `expo-doctor` → 18/18).
- **Corrects a real latent gap:** Reanimated 4 requires `react-native-worklets` as a **separate direct peer dependency** (split out in v4); it was missing on `main` since increment 1 — inert inside Expo Go (worklets bundled) but a crash risk in a dev-build / production.
- **CI-green** on the bumped lockfile (`full-app-typecheck` + `logic-tests`).
- **Not established:** on-device runtime behaviour of `0.81.5` / worklets (Reanimated worklet execution, gesture transitions) — folds into WORK-010 / the increment-3 device pass.

**Recommended outcome:** ratify the lockfile change at the pinned-dependency review; record that `react-native-worklets` is now a **direct dependency that must be re-pinned via `expo install` alongside Reanimated on every future SDK bump**. `npm audit` reports 25 transitive dev-toolchain advisories (1 critical / 11 high) — pre-existing, `npm audit fix --force` would break the RN toolchain; leave for `platform-release` + `quality-engineering`.

### 14.9.5 Increment-3 environment inspection (read-only; no credentials exposed)

| Item | State |
|---|---|
| `client/.env` | **absent** (only `client/.env.example`). `data/remote/client.ts` needs `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` (via `app.json` `extra` or `process.env`). |
| Supabase CLI link | `supabase/.temp/project-ref` present (git-ignored) — the CLI is linked to the dev project (`fitney-dev`, ref recorded in the roadmap / DEP-1). |
| `supabase/config.toml` `[auth]` | `site_url` / `additional_redirect_urls` = `http://localhost:19006` only. **`fitney://auth/callback` (+ Expo Go `exp://` / `https://auth.expo.io/...` variants) is NOT allow-listed** — the redirect the client now builds via `Linking.createURL('/auth/callback')`. Needs adding to `additional_redirect_urls` (config-push) or the hosted dashboard (SEC-C2). |
| `config.toml` `enable_confirmations` | `false` with a "LOCAL ONLY" comment; hosted SEC-C2 requires `true`. Hosted `fitney-dev` state to be **confirmed read-only** before the smoke (drives whether the smoke includes a mailbox step). |
| `config.toml` `minimum_password_length` | `8` — matches the client `MIN_PASSWORD_LENGTH`. |
| `config.toml` `password_requirements` | `"lower_upper_letters_digits"` — was **stricter than the client** (length-only). **FIXED on this branch (human correction 2026-09-04):** `validatePassword` now enforces length ≥ 8 **and** a lowercase letter **and** an uppercase letter **and** a digit, and the sign-up / reset hints state all four. The client is aligned **to** the approved hosted policy — the hosted policy is not weakened. `PASSWORD_POLICY_HINT` in `services/auth.ts` is the single source of the copy. |
| `enable_anonymous_sign_ins` | `false` — consistent with AUTH-04 / OQ-3 (no guest). |
| WORK-013 client harness | **does not exist.** `src/data/sync/__tests__/{push,pull}.test.ts` cover the `FakeGateway` subset only; a suite pointing `createSupabaseGateway(getSupabase())` at `fitney-dev` with a synthetic account JWT is increment-3 work to author. |

**Missing access / config / hardware for increment 3:**

1. `client/.env` populated with the `fitney-dev` **client-safe** URL + anon key (never a service-role key).
2. `fitney://auth/callback` + Expo Go redirect variants allow-listed in `fitney-dev` Auth settings.
3. Read-only confirmation of `fitney-dev` GoTrue state: `enable_confirmations`, leaked-password protection, user-enumeration protection, rate limits (SEC-REQ-AUTH-02/03).
4. 2–3 **synthetic** throwaway test accounts scoped to `fitney-dev` (never real credentials, never production).
5. `SUPABASE_ACCESS_TOKEN` for any CLI `--linked` step (WORK-013 / WORK-020 cross-run) — a human step; keep to `fitney-dev`.
6. **Hardware**: an iOS Simulator + Android emulator (or physical devices) + a Metro dev server for WORK-007 / WORK-010 (Expo runtime, `expo-sqlite` close/re-open, secure-store chunking, deep-link timing, RN 0.81.5 + worklets). Not available in this environment.

**Prepared verification commands (run in increment 3, isolated to `fitney-dev` + synthetic accounts):**

- Hosted GoTrue smoke — `cd client && EXPO_PUBLIC_SUPABASE_URL=… EXPO_PUBLIC_SUPABASE_ANON_KEY=… npx expo start` on a simulator; drive sign-up → (confirm) → sign-in → force `TOKEN_REFRESHED` (short `jwt_expiry` or `sb.auth.refreshSession`) → `resetPasswordForEmail` → open the recovery deep link → `updatePassword` → sign-out; assert the `AuthChange` sequence + secure-store round-trip. New harness: `src/data/remote/__tests__/auth-gateway.hosted.test.ts` (guarded by env, excluded from `jest.config.cjs`).
- Sync conformance (WORK-013) — new `src/data/sync/__tests__/conformance.hosted.test.ts` against the real gateway + a synthetic JWT: concurrent writers, forced skew, kill-mid-push replay, same-timestamp page boundary, in-flight-successor ack, late-commit reconciliation, lost-response-with-successor, parked completed-session conflict.
- WORK-020 cross-run — seed a fixture session on `fitney-dev`, let the server triggers materialise derived rows, pull, and assert client `domain/{calc,pr,week,uuid5}` output == the actual materialised `personal_records` / `weekly_aggregates` / `exercise_weekly_rollups` IDs + values (DEC-52).
- WORK-010 — on-device: `expo-sqlite` `BEGIN IMMEDIATE` / WAL / prepared-statement behaviour, `deleteDatabaseAsync` after `closeAsync`, per-user file re-open on relaunch.
- WORK-007 — device test of the offline-logging flow end to end (no confirmed-set loss on force-close/relaunch) + auth/onboarding screens (Dynamic Type, VoiceOver/TalkBack order, RTL, keyboard-avoidance).

### 14.10 CE-R5 — sign-out with unsynced work: PROPOSED policy (NOT approved)

> **Revision v2 — 2026-09-04**, after human review of v1. Five corrections applied
> (all tightening toward FR-SYNC-04): (1) **no time-based deletion of unsynced or
> conflicted work** — ever; (2) re-authentication **reactivates** the retained DB
> (draining its outbox is normal sync, never a deletion); (3) "Back up & sign out"
> must verify an **empty outbox AND zero unresolved conflicts** and **freeze local
> writes during the final check**; (4) account-deletion cleanup follows a
> **confirmed** server deletion, not a request; (5) client password validation is
> **aligned to** the approved hosted policy, not the reverse (applied in code —
> §14.9.5). v1 is superseded.

Assessed with `security-identity` + `evidence-based-ui-ux` against ADR-0001 (SQLite is the system of record), ADR-0003 §2/§5 + FR-SYNC-04 ("never silently drop or lose an unsynced mutation"; a `dispatched` op is *retained until a terminal protocol result or explicit user discard*), ADR-0009 (per-user DB dropped on sign-out / deletion), SEC §3 (local SQLite holds **no secrets**; tokens live only in `expo-secure-store`), UX-P4 (state stated plainly, ambiently) and UX-P5 (destructive actions name the object, preview the effect, are recoverable).

**Core finding.** ADR-0009's "drop on sign-out" is a shared-device privacy measure and is correct **only when everything is already synced**. When `sync_outbox` is non-empty or `sync_conflicts` has unresolved rows, an unconditional drop permanently loses un-backed-up performed data (the source of truth for history) — a direct FR-SYNC-04 violation. The shipped floor (clean → drop; unsynced → retain + non-blocking notice) never discards, but it (a) offers no user choice or preview on a user-initiated dirty sign-out, (b) does not distinguish a user-initiated sign-out from an involuntary session end (`decideSignOutDisposition` takes only `OutstandingWork`, not the cause — so an involuntary *clean* expiry currently drops the DB), and (c) leaves the retained-file lifecycle unspecified.

**Proposed policy (v2).** "Outstanding work" ≡ `sync_outbox` has any `pending` **or** `dispatched` row, **or** `sync_conflicts` has an unresolved row.

| Case | Behaviour |
|---|---|
| **Account deletion** | The client drops the per-user DB file + clears secure storage **only after** the `delete-account` Edge Function returns a **success response confirming the server-side cascade completed** (the completion receipt — SEC-DEC-04). On a lost / ambiguous / failed response: **retain** local data, surface "we couldn't confirm your account was deleted", and retry the verification (delete is idempotent server-side); never drop on a mere deletion *request* or a timeout. |
| **User-initiated sign-out, no outstanding work** | Drop the file, clear secure storage. No prompt. (ADR-0009 unchanged for this case.) |
| **User-initiated sign-out, outstanding work present** | Sign-out is a **destructive action** (UX-P5): a blocking sheet names the account and the count and offers **Back up & sign out** / **Keep on this device & sign out** / **Discard N changes & sign out** / **Cancel**. Never a dead end. |
| — **"Back up & sign out"** | (i) **Freeze local writes** — put the runtime into a read-only state and pause the sync scheduler's local-change trigger so nothing new can be enqueued during the check; (ii) run a final `push` + `pull` + reconcile; (iii) **re-assert `outbox == 0` AND no unresolved `sync_conflicts`**; (iv) only if (iii) holds → drop the file + clear secure storage. If (iii) does not hold (a conflict was parked, a push transport-failed, a `dispatched` op is still outstanding) → **do not drop**; return to the Keep / Discard / Cancel choice with the residual count shown. Un-freeze on Cancel. Disabled/relabelled offline ("You're offline — can't back up now"). |
| — **"Keep on this device & sign out"** | Retain the file; drop nothing; clear secure storage. |
| — **"Discard N changes & sign out"** | Second explicit confirm naming N and stating it is irreversible → then drop the file. This is the **only** path (besides *Remove account from this device*) that discards unsynced work, and it is explicit and informed. |
| **Involuntary session end** — refresh failure (`session_expired`) or displacement by another account signing in | **Always retain** the file (regardless of outbox state) + clear that user's secure storage. **No blocking prompt** (may be backgrounded; the other account is waiting). A non-blocking notice names the affected account. |
| **Re-authentication as a retained account's `userId`** | The retained file is simply **re-opened as that user's active per-user DB**. Its outbox drains through normal sync (ADR-0003); the file is **never dropped as a side effect of draining**. It is dropped only later by a subsequent *user-initiated sign-out with no outstanding work*, a *confirmed account deletion*, or an explicit *Remove account from this device*. |
| **Retention of a retained file** | A retained file **with outstanding work is retained indefinitely** — there is **no time-based or automatic deletion** of unsynced mutations or unresolved conflicts (FR-SYNC-04). It leaves the device only by reconciliation (re-auth + drain) or explicit informed discard (the *Discard* option above, or *Remove account from this device*). A retained file that is **fully drained** (zero outbox, zero open conflicts — e.g. an involuntary clean expiry) holds nothing that can be lost; whether such a file is also reclaimed after an inactivity window, and the window length, is **deferred to SEC-OQ-1** (not decided here). Any launch-time GC MUST skip a file with outstanding work. |
| **Remove account from this device** (new Settings action) | Explicit; the confirm names N outstanding changes and states they will be permanently lost; on confirm → drop the file + clear that user's secure storage. |
| **Protection of retained data** | Same at-rest posture as an active per-user DB: OS file permissions + platform disk encryption (iOS Data Protection / Android FBE); **no secrets** are in SQLite (SEC §3). A retained file is only openable through the app by re-authenticating as its `userId`. Any future at-rest-encryption requirement from **SEC-OQ-1** applies equally to active and retained files. |

**Exact user-facing choices** (dirty user-initiated sign-out sheet — copy proposed, `evidence-based-ui-ux` to finalise):

- Title: **"Sign out of ‹account›?"**
- Body: **"N changes are saved on this device but not backed up yet."**
- **Back up & sign out** (primary; disabled offline with the reason shown; only completes if the post-sync re-check finds nothing outstanding)
- **Keep on this device & sign out** (secondary)
- **Discard N changes & sign out** (destructive; second confirm: *"Permanently delete N unsynced changes from this device? This can't be undone."*)
- **Cancel**

**Proposed ADR-0009 wording (v2)** — replace the third bullet ("The **local SQLite database is per-user** … that user's local DB file is dropped."):

> - The **local SQLite database is per-user** (DB file keyed by `userId`).
> - On **account deletion**, the client drops that user's DB file and clears secure storage **only after the `delete-account` flow returns a response confirming the server-side cascade completed**; on an unconfirmed/failed response the local data is retained and deletion is re-verified (never dropped on a request alone).
> - On **user-initiated sign-out with no outstanding local work** (`sync_outbox` empty, no unresolved `sync_conflicts`), the file is dropped and secure storage cleared.
> - On **user-initiated sign-out with outstanding local work**, the file is **retained** and sign-out is a destructive action (UX-P5): *back up & sign out* (freeze local writes, run a final sync, then drop **only if** the outbox is empty and no conflict is unresolved — otherwise fall back to the choices below), *keep on this device & sign out* (retain), or *discard N changes & sign out* (explicit informed confirm, then drop). Sign-out **never** silently discards a `pending` or `dispatched` mutation, and there is **no time-based deletion** of unsynced work (FR-SYNC-04).
> - On an **involuntary session end** (refresh failure → `session_expired`, or displacement by another account), the file is **retained** with no prompt and a non-blocking notice naming the account; secure storage for that user is cleared.
> - **Re-authentication** as a retained account reactivates its file as the active per-user DB; draining its outbox is normal synchronization and never deletes the file. A retained file leaves the device only by an explicit *Remove account from this device* or a subsequent clean sign-out / confirmed deletion. Retained data carries the same at-rest posture as an active per-user DB (no secrets in SQLite; tokens in `expo-secure-store` only).

**Status: PROPOSED (v2) — do not ratify the current implementation and do not treat this as an accepted ADR delta until the human approves.** Implementation delta once approved (increment 3+): pass the sign-out *cause* into `decideSignOutDisposition`; add a "freeze local writes" state to the runtime + a post-sync re-check for *Back up & sign out*; add the dirty-sign-out choice sheet + copy; add *Settings → Remove account from this device*; make account-deletion cleanup gate on the confirmed `delete-account` receipt; a launch-time GC (if any) reclaims **only** fully-drained non-current files, with the window deferred to **SEC-OQ-1**. Preserves and does not close SEC-OQ-1, SEC-RESID-1, OQ-3, OQ-9/DEP-4, UX-OQ-4, ISS-28, CE-R1, CE-R2.

### 14.11 Human review response — 2026-09-04

Human review of §14.9–14.10 (no policy or phase approved). Outcomes:

| Item | Human position | This pass |
|---|---|---|
| **CE-R5 v1** | Revise before approval; the 30-day deletion is the main gap. Five required corrections. | **§14.10 revised to v2** — all five applied: (1) no time-based deletion of unsynced/conflicted work, ever — retained until reconciliation or explicit informed discard; (2) re-auth *reactivates* the retained DB, draining ≠ deletion; (3) *Back up & sign out* verifies empty outbox **and** zero unresolved conflicts and **freezes local writes** during the final check; (4) account-deletion cleanup gates on a **confirmed** server deletion, not a request; (5) client password validation **aligned to** the approved hosted policy (code, below). Still **PROPOSED** — not ratified; Foundation acceptance stays open. |
| **CE-R6** | Supported "subject to their stated verification"; CI success is *reported* evidence, not independently checked by the human. | Prepared change staged for review (§14.9.3) — `client-verify.yml` path-filter diff + full ruleset PUT body (`ce-r6-ruleset-22205300.json`). **Not applied** (repo-settings / `platform-release`). |
| **CE-R7** | Ratification supported "subject to their stated verification". | Verified outcome recorded (§14.9.4). On-device confirmation of RN `0.81.5` + worklets remains in WORK-010 / increment 3. **Not independently applied** beyond the `expo install` result already in the PR. |
| **Password policy (correction 5)** | Align the client to the approved hosted policy; do not weaken the hosted policy to make tests pass. | **Applied on the branch.** `services/auth.ts` `validatePassword` now enforces length ≥ 8 **and** lowercase **and** uppercase **and** digit — mirroring `supabase/config.toml` `minimum_password_length = 8` + `password_requirements = "lower_upper_letters_digits"`. `PASSWORD_POLICY_HINT` is the single source of the sign-up / reset copy. `AuthFlow.resetPassword` now calls `validatePassword` (was a bare length check). Tests updated to compliant fixtures (no policy weakened). Gates re-run: full-app `tsc` PASS, logic `tsc` PASS, `depcruise` 0 err, `jest` 98/98. `config.toml` is unchanged. |

**Not changed:** no ADR file, no ruleset, no approved-decision record. Phase 5 stays **IN PROGRESS**; the Foundation exit gate stays **open**. All issue IDs preserved (SEC-OQ-1, SEC-RESID-1, OQ-3, OQ-9/DEP-4, UX-OQ-4, ISS-28, CE-R1, CE-R2).

**Files changed this pass:** `client/src/services/auth.ts`, `client/src/features/auth/auth-flow.ts`, `client/app/(auth)/sign-up.tsx`, `client/app/(auth)/reset-password.tsx`, `client/src/services/__tests__/auth.test.ts`, `client/src/features/auth/__tests__/auth-flow.test.ts`, this artifact (§14.9.3, §14.9.5, §14.10, §14.11).
