# Product Strategy — Weight

## 1. Phase identity

- Lifecycle role: Product strategy (phase 1 of 11)
- Owning skill: `product-strategy`
- Execution date: 2026-09-01
- Roadmap state at execution: `UNLOCKED` → `AWAITING APPROVAL`
- Artifact status: DRAFT, submitted for human approval
- Reported result: `PASS WITH CONDITIONS`

## 2. Sources inspected

| Source | Type | Use |
|---|---|---|
| `SPEC.md` (Draft v1) | Supplied product specification | Primary input; formalized and validated here |
| `CLAUDE.md` (project + global) | Human project instructions | Product boundaries, invariants, authority order |
| `development-roadmap.md` | Canonical lifecycle state | Entry gate, registry, decision/constraint ledger |
| `.claude/skill-system/lifecycle.md`, `decision-ownership.md`, `artifact-standard.md` | Lifecycle contract | Execution mode, ownership boundary, artifact shape |
| `.claude/skills/product-strategy/references/phase-contract.md` | Phase contract | Owned decisions, blocking conditions, review bar |
| `INSTALL.md`, `tests/simulations.md` | Scaffold docs | Confirmed greenfield lifecycle install, no product code |
| Repository tree (root, `.claude/`, `tests/`) | Runtime evidence | Confirmed: no application code, no prior `docs/` artifacts |

No implementation, issue tracker, analytics, interviews, or competitive research exist. `SPEC.md` is the only substantive product evidence.

## 3. Execution mode classification

**`CREATE`** for `docs/product/product-strategy.md` (no prior owned artifact exists).

The phase treats `SPEC.md` as a **`VALIDATE`** input: it is a detailed but human-unratified draft. This artifact adopts its defensible product decisions, restates them as a decision-ready contract, separates fact from assumption, removes solution-shaped framing from product-level requirements (routing implementation prescriptions to their owning phases as constraints), and surfaces the decisions a human must still make.

## 4. Vision, problem, users, jobs, value

### 4.1 Vision

Weight is a personal, local-first mobile app that lets an individual lifter open the app, know what to train, record a set in seconds, and see whether training is progressing — without the setup cost or visual noise of a coaching platform.

### 4.2 Problem

Committed individual lifters currently choose between two poor options:

- **Notes apps / spreadsheets:** fast to start, but no structure, no reusable plan, no history/PR/trend understanding, and fragile in a gym context.
- **Full training platforms:** structured, but heavy onboarding, social and coaching features the solo user does not want, cluttered screens, and workflows that assume good connectivity.

There is an unserved middle: reliable weekly planning plus fast in-gym logging plus automatic training insight, for one person, offline-first.

### 4.3 Target user

| Attribute | Statement | Confidence |
|---|---|---|
| Primary user | An individual lifter who trains several times per week and wants more structure than a notes app | Assumption (from `SPEC.md` §1.2); no user research |
| Context of use | Phone used in a gym, often one-handed, with intermittent or no connectivity | Assumption (`SPEC.md` §1.3) |
| Motivation | Wants a repeatable weekly plan and evidence that training is progressing | Assumption |
| Explicitly excluded users | Coaches, teams, athletes needing shared programming, social/competitive users, nutrition/wearable-driven users | Confirmed decision (`SPEC.md` §2.3, `CLAUDE.md` product boundaries) |

### 4.4 Jobs to be done

1. **Log a workout quickly and reliably** during or after training, even with no network.
2. **Plan training by week** using reusable exercises, supersets, workouts, and week templates.
3. **Understand training** through history, personal records, per-exercise progress, and workload trends, with no extra data entry.

### 4.5 Value proposition

- **Over a notes app:** reusable weekly plans, automatic history/PR/trend analysis, and a logging flow built for one-handed gym use.
- **Over a coaching platform:** single-user simplicity, calm monochrome UI, one primary tap to start today's workout, and logging that never blocks on connectivity.

## 5. Evidence and confidence

| Class | Items |
|---|---|
| **Confirmed** (human instruction / `CLAUDE.md` / `SPEC.md` explicit constraint) | Single-user personal MVP; offline-first logging is the central vertical slice; weekly planning is the primary planning model; performed sets are the source of truth; templates/plans snapshot into sessions and never rewrite completed history; canonical units kg/m/s; kg + lb presentation; iOS + Android phones; Expo/React Native/Expo Router/strict TS; Expo Go compatibility during prototype/MVP; `expo-sqlite` local operational DB; Supabase auth + Postgres + RLS; no custom native modules pre-dev-build; out-of-scope list in §7.2 |
| **Evidence-backed inference** | The "unserved middle" positioning (from `SPEC.md` problem framing, no market data); tap-count and latency targets as design goals (stated as product acceptance targets, not measured baselines); that one-handed intermittent-connectivity gym use is the dominant context |
| **Assumption** (recorded, not blocking) | Who the primary user is and their motivations (no research); that weekly planning matters more than periodization for this user; that Aeonik files + mobile distribution license will be supplied before release; that a legally usable seed exercise catalog can be obtained |
| **Unresolved decision** (human owns; see §12) | Product name/brand; guest mode; dark-mode launch scope; exact seed catalog + license; bodyweight/assisted load semantics; alternative e1RM formulas; multi-device simultaneous-edit conflict UX; analytics/crash provider + consent; data retention period; account-deletion server behavior |

## 6. Goals and success measures

### 6.1 Product goals

| ID | Goal |
|---|---|
| GOAL-1 | Starting today's planned workout is one primary tap from Today. |
| GOAL-2 | Every working-set entry is possible without leaving the active workout screen. |
| GOAL-3 | A usable week plan can be built in under two minutes by reusing or duplicating existing items. |
| GOAL-4 | All logging and active-workout functionality works fully offline, with reliable recovery after force-close. |
| GOAL-5 | Completed sessions become history, PRs, and trends with no additional user action. |
| GOAL-6 | Information architecture stays understandable as the exercise/template library grows. |

### 6.2 Success measures and observable signals

These are **product acceptance targets**, not analytics claims. Baselines are to be measured during usability testing (owned downstream by UX product design and quality engineering).

| ID | Measure | Target | Observable signal | Traces to |
|---|---|---|---|---|
| SM-1 | Open app → start today's planned workout | 1 primary tap | Instrumented tap count / usability session | GOAL-1, FR-TODAY, FR-LOG |
| SM-2 | Open app → start empty / repeated / template workout | 2–3 taps | Usability session | GOAL-1, FR-LOG |
| SM-3 | Log or update a set after fields are focused | ≤ 5 s for a familiar user | Timed usability task | GOAL-2, FR-LOG |
| SM-4 | Local persistence after a set edit | ≤ 100 ms perceived; no network dependency | Instrumented write timing; airplane-mode test | GOAL-4, NFR-OFFLINE, NFR-PERF |
| SM-5 | Recover active workout after force-close | No confirmed set lost | Force-close/relaunch test scenario | GOAL-4, NFR-OFFLINE |
| SM-6 | Create next week from current/previous week | ≤ 3 primary actions | Usability session | GOAL-3, FR-PLAN |
| SM-7 | Find an existing exercise | Results visible ≤ 300 ms locally | Instrumented local search timing | GOAL-6, FR-LIB |
| SM-8 | Core touch targets | ≥ 48 × 48 dp | Design spec + automated layout check | NFR-A11Y |
| SM-9 | Cross-account isolation | Second account cannot read or mutate any first-account object via the API | Adversarial RLS test across two users | NFR-SEC |
| SM-10 | Offline→online history parity | Remote history identical to what was logged offline | End-to-end acceptance scenario | GOAL-4, NFR-OFFLINE |

## 7. Scope

### 7.1 In scope (MVP)

Account + onboarding; Today dashboard; offline workout logging (planned / empty / repeated / past) with active-session recovery; weekly planning with planned-workout editor; workout templates and week templates; a seeded exercise catalog + user-created exercises; supersets; progress (Overview, History, PRs, Trends) with per-exercise detail; core PR categories; data export (JSON + CSV); account deletion; settings (units, week start, rest timer, haptics/sound, theme, plate increments); background synchronization with visible failure recovery.

### 7.2 Out of scope (MVP) — confirmed

Coach/team programming and shared plans; social feed, followers, comments, leaderboards, public profiles; nutrition, meal, sleep, wearable integrations; AI-generated programming; video exercise analysis; marketplace / paid trainer content; advanced periodization beyond week templates and planned weeks; web or desktop authoring UI; Apple Health / Health Connect / watch apps / live activities; custom native modules while Expo Go compatibility is required; multiple concurrent active sessions per user; provider/social login (post-MVP).

### 7.3 Priority rationale

Priority follows the "prove the offline logging vertical slice first" invariant in `CLAUDE.md`:

| Priority | Definition | Contents |
|---|---|---|
| **P0 — Must (MVP-blocking)** | The product has no value or is unsafe without it | Auth + isolation (RLS); offline logging + active-session recovery; Today start path; performed-set source-of-truth + immutable history; snapshot-not-reference for completed sessions; core sync with no silent data loss; account deletion + export |
| **P1 — Must (MVP release definition)** | Required for the §11 release definition but built after the slice is proven | Weekly planning + planned-workout editor; workout & week templates; progress (Overview/History/PRs/Trends) + per-exercise detail; seeded exercise catalog; settings; supersets |
| **P2 — Should** | Expected in MVP, degradable without breaking the release | Rest-timer refinements (+15 s / pause / skip / silent); optional set fields (RPE/RIR/tempo/notes); trends beyond the basic set; archive/version behavior for library items; drag-and-drop planning as enhancement over explicit day actions |
| **P3 — Later (post-MVP)** | Deferred by decision | Provider login; alternative e1RM formulas; richer multi-device conflict UX; exercise media/storage; any §7.2 item if later reconsidered |

## 8. Product requirements

Requirements are numbered for downstream traceability. IDs prefixed `FR-` are functional; `NFR-` are product-level non-functional outcomes. Where `SPEC.md` couples a requirement to a specific technology, the outcome is stated here and the technology is recorded as a constraint in §10 and routed to Software Architecture / Backend / Security.

### 8.1 Functional requirements

#### Authentication & onboarding
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-AUTH-01 | Email/password sign-up, sign-in, sign-out, password reset, and a persisted session across launches. | P0 | AUTH-01 |
| FR-AUTH-02 | Authentication secrets are held only in platform-secure storage; no privileged server credential ever ships in the client. | P0 | AUTH-02, `CLAUDE.md` |
| FR-AUTH-03 | Onboarding collects only: display name, preferred unit (lb/kg), week start day, default rest timer, optional training goal. | P1 | AUTH-03 |
| FR-AUTH-04 | Guest mode ships **only if** guest-to-account migration is atomic and lossless; otherwise authentication is required and no disposable pseudo-account is shipped. | P1 (decision-gated, see OQ-3) | AUTH-04 |
| FR-AUTH-05 | Every user-owned server record is isolated to its owner; a user can never read or mutate another user's data through the client API. | P0 | AUTH-05, NFR-SEC |

#### Today
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-TODAY-01 | Today shows the selected date, a seven-day strip, and the selected-day state. | P1 | TODAY-01 |
| FR-TODAY-02 | An active workout is surfaced above all other Today content. | P0 | TODAY-02 |
| FR-TODAY-03 | A planned workout for the day offers start, edit, move, and overflow actions. | P1 | TODAY-03 |
| FR-TODAY-04 | With no plan for the day, Today offers repeat-last, choose-template, and start-empty. | P1 | TODAY-04 |
| FR-TODAY-05 | Today shows a compact weekly status: completed vs planned sessions and total completed working sets or volume. | P2 | TODAY-05 |
| FR-TODAY-06 | Today links to the most recent completed workout without becoming a long activity feed. | P2 | TODAY-06 |

#### Workout logging
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-LOG-01 | A session can be created from a planned workout, a template, a prior workout, or an empty start. | P0 | LOG-01 |
| FR-LOG-02 | Sessions have states: draft, active, completed, cancelled. | P0 | LOG-02 |
| FR-LOG-03 | Set types supported: warmup, working, drop, failure, backoff. | P1 | LOG-03 |
| FR-LOG-04 | Default visible per-set fields: load, reps/metric, completion, and previous performance. | P0 | LOG-04 |
| FR-LOG-05 | Optional per-set/session fields: RPE, RIR, tempo, set note, session note — hidden until requested. | P2 | LOG-05 |
| FR-LOG-06 | During a session the user can add, duplicate, reorder, skip, substitute, or remove exercises and sets without leaving the session. | P0 | LOG-06 |
| FR-LOG-07 | Exercises can be grouped into ordered supersets/circuits with a shared group label. | P1 | LOG-07 |
| FR-LOG-08 | A completed set is persisted locally immediately and remains editable afterward. | P0 | LOG-08, NFR-OFFLINE |
| FR-LOG-09 | Rest timer starts from the exercise or user default and supports +15 s, skip, pause, and silent/vibration preference. | P2 | LOG-09 |
| FR-LOG-10 | Accidental session loss is prevented: cancel requires confirmation; completed workouts are recoverable via edit history or soft deletion. | P0 | LOG-10 |
| FR-LOG-11 | The finish flow shows duration, exercises, working sets, total volume, PRs, and notes before confirmation. | P1 | LOG-11 |
| FR-LOG-12 | Exactly one active session per user; starting another forces resume, finish, or explicit discard. | P0 | LOG-12, `CLAUDE.md` |
| FR-LOG-13 | Numeric entry supports decimal loads, hardware-keyboard entry, and configurable plate increments without forcing a calculator. | P1 | LOG-13 |
| FR-LOG-14 | Exercise tracking modes: weight_reps, reps, duration, distance; the UI renders only the relevant fields. | P1 | LOG-14 |

#### Weekly planning
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-PLAN-01 | The week is the default and primary planning unit. | P1 | PLAN-01, `CLAUDE.md` |
| FR-PLAN-02 | The user can navigate to the previous/next week and jump to the current week. | P1 | PLAN-02 |
| FR-PLAN-03 | A planned workout can be added, edited, duplicated, moved, archived, and deleted. | P1 | PLAN-03 |
| FR-PLAN-04 | A week can be created from blank, from the previous week, or from a week template. | P1 | PLAN-04 |
| FR-PLAN-05 | A planned workout can be created from blank, from a workout template, or from a prior completed session. | P1 | PLAN-05 |
| FR-PLAN-06 | Planned exercises carry order, superset group, target sets, rep range, load target, RPE/RIR target, rest duration, tempo, and notes. | P1 | PLAN-06 |
| FR-PLAN-07 | Move/duplicate use explicit day actions; drag-and-drop is enhancement-only and never the sole interaction. | P2 | PLAN-07 |
| FR-PLAN-08 | A plan records each session as unstarted, active, completed, skipped, or missed. | P1 | PLAN-08 |
| FR-PLAN-09 | Starting a plan creates a session snapshot; later plan edits never mutate that session. | P0 | PLAN-09, `CLAUDE.md` |
| FR-PLAN-10 | Applying template updates to an existing future plan requires a preview and explicit confirmation. | P2 | PLAN-10 |

#### Progress, history & PRs
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-DATA-01 | Progress has four peer views: Overview, History, PRs, Trends. | P1 | DATA-01 |
| FR-DATA-02 | History filters by date range, exercise, workout name, and completion status. | P1 | DATA-02 |
| FR-DATA-03 | Completed history shows the values performed, never current template values. | P0 | DATA-03, `CLAUDE.md` |
| FR-DATA-04 | Exercise detail shows recent performances, max load, estimated 1RM, best set by rep count, total volume, and frequency. | P1 | DATA-04 |
| FR-DATA-05 | PR categories: max load, estimated 1RM, rep PR at a given load, session volume; each PR records its formula/category. | P1 | DATA-05 |
| FR-DATA-06 | Estimated 1RM uses Epley for 2–10 reps; not computed for zero reps, invalid loads, or unsupported modes. | P1 | DATA-06 |
| FR-DATA-07 | Working volume for weight_reps is load_kg × reps per completed set; warmups excluded from the headline but still queryable. | P1 | DATA-07 |
| FR-DATA-08 | Trends cover weekly completed workouts, working sets, volume, and per-exercise e1RM. | P2 | DATA-08 |
| FR-DATA-09 | Charts expose exact values on selection and never rely on color alone to distinguish series. | P1 | DATA-09, NFR-A11Y |
| FR-DATA-10 | Editing or deleting a completed session triggers deterministic, idempotent recomputation of affected PRs and aggregates. | P0 | DATA-10, `CLAUDE.md` |

#### Library
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-LIB-01 | Library holds Exercises, Supersets, Workout Templates, and Week Templates. | P1 | LIB-01 |
| FR-LIB-02 | Each collection supports search, sort, recent items, create, duplicate, edit, archive, and insert/use. | P1 | LIB-02 |
| FR-LIB-03 | A small, legally usable exercise catalog is seeded; user-created exercises stay private. | P1 (content decision-gated, OQ-4) | LIB-03 |
| FR-LIB-04 | Exercise fields: name, aliases, primary muscles, secondary muscles, equipment, tracking mode, unilateral flag, instructions, archive state. | P1 | LIB-04 |
| FR-LIB-05 | Supersets reference exercises and order but may override prescriptions when inserted into a workout. | P1 | LIB-05 |
| FR-LIB-06 | Templates are versionable; completed sessions always keep a denormalized display snapshot. | P0 | LIB-06, `CLAUDE.md` |
| FR-LIB-07 | Archived entities leave default creation/search but remain visible in historical records. | P1 | LIB-07 |
| FR-LIB-08 | Deletion is blocked where it would break history; archive or soft-delete instead. | P0 | LIB-08 |

#### Settings & data ownership
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-SET-01 | Configurable: weight unit, week start, rest timer, haptics/sound, theme, plate increments. | P1 | SET-01 |
| FR-SET-02 | Export: user data as JSON and completed sets/sessions as CSV. | P1 | SET-02 |
| FR-SET-03 | Account deletion requires re-authentication, explicit confirmation, appropriate server-side cascade/anonymization, and a completion receipt. | P1 (server behavior decision-gated, OQ-10) | SET-03 |
| FR-SET-04 | Unit changes affect presentation only; stored canonical values stay kg/m/s. | P0 | SET-04, `CLAUDE.md` |

#### Synchronization (product-visible behavior)
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-SYNC-01 | The local store serves all normal reads and writes; the network is never on the critical path for logging, completion, or recovery. | P0 | §11, `CLAUDE.md` |
| FR-SYNC-02 | "Saved" in the UI means saved on this device; a distinct indicator exposes Saved, Syncing, Offline, and Needs-attention states without blocking the workout. | P0 | §11.1 |
| FR-SYNC-03 | Sync runs after auth, on foreground, on connectivity restore, on manual retry, and on debounced local change; failed operations are retained with backoff until resolved or explicitly discarded. | P1 | §11.2 |
| FR-SYNC-04 | No unsynced mutation is silently discarded during sign-out, conflict resolution, or migration; destructive overwrite of a completed session always needs an explicit local action and preserves a recoverable conflict copy. | P0 | §11.2, `CLAUDE.md` |
| FR-SYNC-05 | If another device holds an active session, the user is shown a conflict choice; two active sessions are never merged automatically. | P1 | §11.3 |

### 8.2 Product-level non-functional requirements

| ID | Outcome | Priority | Signal | Routed to |
|---|---|---|---|---|
| NFR-OFFLINE | Logging, completion, and active-session recovery never depend on connectivity; a confirmed set survives force-close and reconnect with no loss. | P0 | SM-4, SM-5, SM-10; E2E scenario 2 | Architecture, Client, Backend, Quality |
| NFR-PERF | Today and an active workout render from local data without waiting on the network; set confirmation gives same-frame feedback and persists without blocking input; long lists are virtualized; search queries indexed local fields. | P1 | SM-4, SM-7; frame timing | Architecture, Client |
| NFR-A11Y | Meets WCAG AA contrast for meaningful text/controls; VoiceOver/TalkBack name/role/value/state and logical order; completion, PR, error, missed, and selection are never signalled by color or elevation alone; OS text scaling never hides actions; Reduce Motion and reduced transparency honored; charts have text/table alternatives; ≥ 48 dp core targets. | P0 | SM-8; accessibility audit | UX, Visual, Client, Quality |
| NFR-SEC | Row-level isolation on every exposed user-owned table and derived view, with independent select/insert/update/delete policies, adversarially tested before client exposure; no privileged key in the client; server-side validation of IDs, enums, measures, date ranges, and ownership; tokens in secure storage; export and deletion cover local and remote data. | P0 | SM-9; adversarial RLS tests; E2E scenario 6 | Security, Backend, Quality |
| NFR-PRIVACY | Load, body weight, free-text/exercise notes, email, and full workout payloads are excluded from production telemetry unless explicitly justified and consented; retention and deletion behavior is defined before beta. | P1 (policy decision-gated, OQ-9/OQ-10) | Telemetry schema review | Security, Backend, Operations |
| NFR-DATA-INTEGRITY | Performed sets are the source of truth; PRs and aggregates are derived, deterministic, and idempotently recomputable; historical names are snapshotted; canonical measures kg/m/s; client-generated UUIDs so offline creation never waits on the server; migrations forward-only with fresh-create and every upgrade path tested. | P0 | Unit + DB/integration tests; E2E scenario 5 | Architecture, Backend, Quality |
| NFR-RELIABILITY | Failures in non-critical analytics/sync paths never crash the active workout; crash recovery, outbox replay, session completion, and aggregate recomputation are idempotent. | P0 | Crash-free session rate; fault-injection tests | Architecture, Client, Backend, Operations |
| NFR-INTL | Dates, decimal separators, first day of week, and units are localized; layouts tolerate longer translated labels and RTL. | P2 | Layout review with pseudo-localization | UX, Visual, Client |
| NFR-PORTABILITY | The product runs on iOS and Android phones through the selected Expo Go SDK during prototype/MVP and is architected to move to an Expo development build before production, with native integrations kept behind interfaces. | P0 | Expo Go compatibility check; dev-build migration plan | Architecture, Platform |

## 9. Product invariants (must hold across all downstream phases)

1. Today makes the next workout action obvious.
2. A working set can be recorded without leaving the active workout.
3. Network availability never blocks logging, completion, or active-session recovery.
4. Only one active session per user (MVP).
5. Templates and plans seed snapshots; later edits never rewrite completed history.
6. Performed sets are the source of truth for historical values, PRs, and aggregates.
7. Canonical measures are kilograms, meters, seconds; convert only for presentation.
8. Destructive actions preserve recoverability where technically possible.
9. Weekly planning is the primary planning model for MVP.
10. Neumorphism conveys hierarchy only — never the sole cue for interactivity, selection, completion, focus, error, or disabled state.

## 10. Constraints

| ID | Constraint | Source | Class | Routed to |
|---|---|---|---|---|
| CON-1 | Client is React Native + Expo + Expo Router + strict TypeScript. | `CLAUDE.md`, `SPEC.md` §10.1 | Technical mandate | Architecture, Client |
| CON-2 | Expo Go compatibility maintained through prototype/MVP; package versions chosen via `expo install` and locked; no custom native modules until an approved development-build migration. | `CLAUDE.md`, `SPEC.md` §10.2 | Technical mandate | Architecture, Client, Platform |
| CON-3 | `expo-sqlite` is the local operational database and normal read/write source; every domain mutation is persisted transactionally with an outbox entry. | `CLAUDE.md`, `SPEC.md` §11 | Technical mandate | Architecture, Backend, Client |
| CON-4 | Supabase provides authentication and the synchronized Postgres datastore; RLS enabled and adversarially tested before any user-owned table is exposed; service-role key never shipped or requested. | `CLAUDE.md`, `SPEC.md` §10.3 | Technical + security mandate | Architecture, Backend, Security |
| CON-5 | UI components must not call Supabase directly; access flows through feature logic → domain services → repository interfaces → local repositories → sync → Supabase gateway. | `CLAUDE.md`, `SPEC.md` §10.4 | Architecture mandate | Architecture, Client, Backend |
| CON-6 | Instants stored in UTC with session timezone stored separately; plan dates are date-only. | `CLAUDE.md` | Data mandate | Architecture, Backend |
| CON-7 | Visual system is monochromatic, softly neumorphic, utilitarian, data-aware, restrained; custom cross-platform with iOS-adapted interaction, not a native-iOS-compliance claim. | `CLAUDE.md`, `SPEC.md` §8 | Design mandate | Visual UI, UX |
| CON-8 | Aeonik is used only once the exact files, weights, and mobile distribution license are available; missing weights are never synthesized. | `CLAUDE.md`, `SPEC.md` §8.4 | Legal/design constraint | Visual UI, Platform |
| CON-9 | Analytics behind an interface; credentials, private notes, workout payloads, and sensitive personal values excluded from production telemetry. | `CLAUDE.md`, `SPEC.md` §16 | Privacy mandate | Architecture, Security, Operations |
| CON-10 | MVP is single-user and personal; MVP scope is not expanded without an owned decision and human approval. | `CLAUDE.md` | Scope mandate | All phases |
| CON-11 | Persistent five-position bottom navigation (Today, Plan, Log(+), Progress, Library); Settings is not a primary tab. | `SPEC.md` §4 | Product IA decision (this phase) — interaction detail routed for validation | UX |

CON-11 is owned here only as product information architecture intent; the concrete navigation and interaction design is UX product design's to validate and may be revised with evidence.

## 11. Release intent

### 11.1 MVP release definition

MVP is complete only when a single user can: create an account and configure units; find/create exercises; build or copy a weekly plan; start today's planned workout, repeat a workout, or start empty; log weight/reps/time/distance sets offline with reliable recovery; finish a workout and see immutable historical values; view history, core PRs, and basic exercise/weekly trends; reuse workout templates and archive library items without historical coupling; synchronize across sessions/devices with visible failure recovery; export data and request account deletion.

The release must also pass: cross-account RLS isolation, offline recovery, database migration (fresh + upgrade), accessibility (WCAG AA on meaningful text/controls, screen-reader traversal), and core performance checks — on representative physical iOS and Android devices.

### 11.2 Delivery sequencing (product view; engineering owns the plan)

| Stage | Product outcome | Exit signal |
|---|---|---|
| Foundation | Authenticated user reaches the app shell; local and remote profile data isolated; token/font/theme foundations work on iOS and Android via the selected Expo Go SDK. | Auth + shell + isolation demonstrated |
| Logging vertical slice (**prove first**) | Offline create/log/force-close/resume/finish/reconnect with no confirmed set lost. | E2E scenario 2 passes |
| Weekly planning | A week can be copied, edited, started, and completed without mutating its source template or history. | E2E scenarios 3–4 pass |
| Data & progress | Every displayed metric traces to completed performed sets and survives edits/deletes. | E2E scenario 5 passes |
| Full library & data ownership | All four library entity types reusable without historical coupling; export/delete tests pass. | Library + export/delete tests pass |
| Production hardening | Dev-build migration, environment separation, accessibility/performance/security/privacy/store reviews, monitoring and recovery procedures. | Release candidate passes critical scenarios on physical devices |

The logging vertical slice must be proven before broad screen construction (`CLAUDE.md` guardrail).

### 11.3 Post-MVP (deferred by decision)

Provider/social login; alternative e1RM formulas; richer true-simultaneous multi-device conflict UX; exercise media/storage; advanced periodization; any item in §7.2.

## 12. Open questions (human decision required before the affected phase locks)

| ID | Question | Why it matters | Owner | Blocks | Affected phase |
|---|---|---|---|---|---|
| OQ-1 | Final product name, icon, and brand wordmark. | Store listing, app identity, visual system | Human | No (not scaffolding) | Visual UI, Platform |
| OQ-2 | Exact Aeonik files/weights + proof of mobile app distribution license. | Typography cannot be finalized or shipped without it | Human | No | Visual UI, Platform |
| OQ-3 | Ship guest mode? Only viable if guest-to-account migration is atomic and lossless (FR-AUTH-04). | Onboarding funnel vs. data-loss risk and build cost | Human + Product | No | Product, UX, Backend |
| OQ-4 | Exact seeded exercise catalog and its content license. | FR-LIB-03 cannot ship without a legally usable dataset | Human | No | Product, Backend |
| OQ-5 | Do bodyweight/assisted exercises include body mass in progress calculations? | Correctness of e1RM/volume/PRs for a large exercise class | Product + (Human input on intent) | No | Product, Backend |
| OQ-6 | Allow users to select alternative e1RM formulas after MVP? | Determines whether formula-id versioning must support user choice | Product | No | Product, Backend |
| OQ-7 | Sync conflict UX for true multi-device simultaneous editing. | MVP rule is last-accepted-write-wins + conflict telemetry; richer UX may be needed | UX + Architecture | No | UX, Architecture, Backend |
| OQ-8 | Is dark mode a launch requirement or post-MVP polish? | Tokens must support it from the start regardless; scope of state coverage differs | Product + Visual UI | No | Product, Visual UI, Client |
| OQ-9 | Analytics/crash provider and privacy consent requirements. | Consent flow, telemetry schema, store disclosures | Human + Security | No | Security, Operations, Platform |
| OQ-10 | Data retention period and completed-account-deletion server behavior (cascade vs. anonymize). | Legal/privacy posture; FR-SET-03 and NFR-PRIVACY completion | Human + Security | No | Security, Backend, Operations |

None of these block the start of downstream phases; each must be resolved before its affected phase locks its decisions.

## 13. Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| RISK-1 | Offline sync + snapshot-vs-reference integrity is the hardest part and is underestimated, threatening the core invariant. | Medium | High | Prove the logging vertical slice (incl. force-close/reconnect) before broad screen work; deterministic idempotent recompute; conflict telemetry. | Architecture, Backend |
| RISK-2 | No real user research; the user model and success targets are assumptions. | High | Medium | UX product design runs usability testing to establish baselines for SM-1…SM-7; revise targets with evidence. | UX, Quality |
| RISK-3 | Aeonik license/files unavailable at release (OQ-2). | Medium | Medium | Token system and `expo-font` loading path built to swap typeface; documented placeholder path; no synthesized weights. | Visual UI, Platform |
| RISK-4 | Seed exercise catalog licensing (OQ-4) delays or shrinks FR-LIB-03. | Medium | Medium | Identify a permissively licensed dataset early; design catalog so user-created exercises fully substitute if the seed must shrink. | Product, Backend |
| RISK-5 | Expo Go constraints force compromises that do not survive the dev-build migration. | Medium | Medium | Keep native integrations behind interfaces; run an Expo Go compatibility check in CI; plan the dev-build migration from the start. | Architecture, Platform |
| RISK-6 | Neumorphic visual direction weakens accessibility (state conveyed by elevation/color). | Medium | High | Invariant 10 + NFR-A11Y: redundant non-visual state cues mandatory; accessibility audit gate. | Visual UI, UX, Quality |
| RISK-7 | RLS misconfiguration exposes cross-account data. | Low | High | Adversarial two-user RLS tests per table/action before client exposure (SM-9, NFR-SEC); no table shipped without them. | Security, Backend, Quality |

## 14. Dependencies and external capabilities

| ID | Need | Type | Required by | Status | Next safe human action |
|---|---|---|---|---|---|
| DEP-1 | Supabase project (Auth + Postgres + RLS), local + hosted. | Infrastructure / service | Architecture, Backend | Not provisioned | Create a Supabase project; provide publishable/anon config only (never the service-role key). |
| DEP-2 | Aeonik font files + mobile app distribution license. | Licensed asset | Visual UI, Platform | Not available | Procure licensed files and record license proof (OQ-2). |
| DEP-3 | Legally usable seed exercise catalog + content license. | Licensed data | Backend (Library) | Not identified | Select and clear a dataset license (OQ-4). |
| DEP-4 | Analytics / crash-reporting provider. | Service / SDK (Expo Go-compatible) | Operations, Security | Not chosen | Choose provider and consent model (OQ-9). |
| DEP-5 | EAS build / distribution (dev build, app signing, store accounts). | Infrastructure / accounts | Platform | Not set up | Set up EAS and store accounts before production hardening. |

No credentials or secrets are recorded in this artifact or the roadmap.

## 15. Traceability

### 15.1 Needs → requirements

| Job / goal | Requirements |
|---|---|
| Job 1 — Log quickly & reliably | FR-LOG-01…14, FR-TODAY-02, FR-SYNC-01…05, NFR-OFFLINE, NFR-PERF, NFR-RELIABILITY |
| Job 2 — Plan by week | FR-PLAN-01…10, FR-TODAY-01/03/04, FR-LIB-01…08 |
| Job 3 — Understand training | FR-DATA-01…10, FR-TODAY-05/06, NFR-DATA-INTEGRITY |
| GOAL-1 one-tap start | FR-TODAY-02/03, FR-LOG-01, SM-1/SM-2 |
| GOAL-4 offline & recovery | FR-LOG-08, FR-SYNC-01…05, NFR-OFFLINE, SM-4/SM-5/SM-10 |
| GOAL-5 automatic insight | FR-DATA-03/04/05/10, NFR-DATA-INTEGRITY |
| Data ownership | FR-SET-02/03, FR-AUTH-05, NFR-SEC, NFR-PRIVACY |

### 15.2 Requirements → downstream consumers

- **UX product design:** all FR-* (flows/IA/interaction), CON-11, NFR-A11Y, NFR-INTL, SM-1…SM-7 baselines.
- **Visual UI design:** CON-7/8, NFR-A11Y, invariant 10, OQ-1/OQ-2/OQ-8.
- **Software architecture:** CON-1…6, FR-SYNC-*, NFR-OFFLINE/PERF/DATA-INTEGRITY/RELIABILITY/PORTABILITY, RISK-1/5.
- **Backend & data engineering:** FR-AUTH-05, FR-DATA-10, FR-LIB-03/06, FR-SET-02/03, CON-3/4/6, NFR-DATA-INTEGRITY, OQ-4/5/10.
- **Security & identity:** FR-AUTH-01…05, NFR-SEC, NFR-PRIVACY, CON-4/9, RISK-7, OQ-9/10.
- **Platform & release:** CON-2/8, NFR-PORTABILITY, DEP-2/4/5, §11.2.
- **Quality engineering:** SM-1…SM-10, §11.1 release checks, all P0 requirements, E2E scenarios (`SPEC.md` §17.4).
- **Production operations:** NFR-RELIABILITY, NFR-PRIVACY, CON-9, DEP-4.
- **Implementation orchestrator:** §11.2 sequencing, all invariants.

### 15.3 Existing-project classification

Greenfield. No application code, tests, or prior `docs/` artifacts exist (repository inspection, 2026-09-01). `SPEC.md` is a human-unratified draft and is classified `VALIDATE`; this artifact is `CREATE`.

## 16. Verification performed

| Check | Method | Result |
|---|---|---|
| Repository state | Listed root, `.claude/`, `tests/`; searched for `docs/` and source | Confirmed greenfield; no owned artifact to adopt |
| Requirement completeness | Cross-walked every `SPEC.md` §6 requirement ID into §8 with priority and source | All mapped; no `SPEC.md` functional requirement dropped |
| Solution-shaping review | Re-expressed technology-coupled requirements as outcomes; moved mandates to §10 constraints | FR set is outcome-shaped; technology recorded as constraints and routed |
| Testability | Each FR/NFR has an observable signal or a named downstream test | §6.2, §8.2, §15; gaps are the assumption baselines flagged in RISK-2 |
| Priority coverage | Every requirement carries P0–P3 | Complete |
| Contradiction check | Checked FR-AUTH-04 (guest mode), FR-PLAN-07 (drag-and-drop), dark mode against invariants and scope | No contradictions; open choices captured as OQ-3/OQ-8, decision-gated in place |
| Ownership boundary | Confirmed no visual styling or implementation architecture is decided here; CON-11 explicitly routed to UX | Within boundary |

No code, migrations, or tests were changed by this phase.

## 17. Status

**`PASS WITH CONDITIONS`.**

A defensible product objective, user model, scope, prioritized requirement set, success measures, constraints, risks, and release intent are established and traceable. The following conditions must be accepted by the human reviewer or explicitly deferred with a revisit trigger:

- **C-1:** The primary user, jobs, and success targets SM-1…SM-7 are assumptions without research (RISK-2). Accepted on the basis that UX product design will establish baselines and may revise targets with evidence.
- **C-2:** Open questions OQ-1…OQ-10 remain unresolved. None block downstream phase start; each must be resolved before its affected phase locks. Accepted as tracked open questions with named owners.
- **C-3:** FR-AUTH-04 (guest mode), FR-LIB-03 (seed catalog), FR-SET-03 (deletion server behavior), and NFR-PRIVACY (retention) are decision-gated within their requirements and depend on OQ-3/OQ-4/OQ-10/OQ-9.
- **C-4:** External capabilities DEP-1…DEP-5 are unprovisioned; two (Aeonik license DEP-2, exercise-catalog license DEP-3) are hard prerequisites for shipping their features.

### Next human decision required

Review `docs/product/product-strategy.md`. Then either:

- record `APPROVED — proceed to evidence-based-ui-ux` (optionally accepting conditions C-1…C-4, which will be reproduced in the human review log), or
- record `APPROVED WITH CONDITIONS` naming which conditions are accepted vs. which need resolution first, or
- request revisions.

The lifecycle will not advance and phase 2 stays `LOCKED` until an explicit human approval is recorded.
