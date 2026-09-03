# Client Implementation — Fitney

> **Status: Phase 5 IN PROGRESS — increment 1 awaiting review. This is NOT a phase
> submission and does not seek Phase 5 approval.** The Foundation exit gate
> (SPEC §18) is **not** met: authentication, onboarding, and per-user SQLite
> isolation are unfinished; screens are not device-verified; sync is not verified
> against real Supabase. Human assessment 2026-09-03 requested revisions on PR #1
> (full-app typecheck as a CI gate — done in this pass) and correct lifecycle
> framing before any merge. This artifact grows increment by increment until the
> Foundation gate is met and the offline-logging vertical slice is device- and
> hosted-verified.

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
