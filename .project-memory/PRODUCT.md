# Product

## FR-SET-02 — Export: user data as JSON, completed sets/sessions as CSV

Export: user data as JSON and completed sets/sessions as CSV.

**Acceptance criteria:** Export covers local + remote data (NFR-SEC). Library + export/delete tests (§11.2).

## FR-SET-04 — Unit changes affect presentation only; stored canonical values stay kg/m/s

Unit changes affect presentation only; stored canonical values stay kg/m/s.

**Acceptance criteria:** Product invariant #7. Conversion only in presentation selectors (ADR-0004).

## FR-SET-03 — Account deletion: re-auth, confirmation, server-side cascade/anonymization, completion receipt

Account deletion requires re-authentication, explicit confirmation, appropriate server-side cascade/anonymization, and a completion receipt.

**Acceptance criteria:** OQ-10 resolved: hard cascade + non-PII deletion_receipts (SEC-DEC-04). Re-auth heuristic is dev-only; server-verifiable re-auth before beta (governing decision D / SEC-RESID-1). delete-account Edge Function authored, unexecuted.

## FR-SYNC-03 — Sync runs after auth, on foreground, on connectivity restore, on manual retry, on debounced change; failed ops retained with backoff

Sync runs after auth, on foreground, on connectivity restore, on manual retry, and on debounced local change; failed operations are retained with backoff until resolved or explicitly discarded.

**Acceptance criteria:** ADR-0003 triggers + durable dispatched state. WORK-013 conformance suite.

## FR-SYNC-01 — Local store serves all normal reads/writes; network never on the critical path

The local store serves all normal reads and writes; the network is never on the critical path for logging, completion, or recovery.

**Acceptance criteria:** Product invariant #3. ADR-0001. E2E scenario 2.

## FR-SYNC-05 — If another device holds an active session, the user is shown a conflict choice; two active sessions never auto-merged

If another device holds an active session, the user is shown a conflict choice; two active sessions are never merged automatically.

**Acceptance criteria:** ADR-0003 step 5. Conflict UX copy = UX-OQ-6 / OQ-7.

## FR-SYNC-02 — "Saved" means saved on this device; a distinct indicator exposes Saved/Syncing/Offline/Needs-attention

"Saved" in the UI means saved on this device; a distinct indicator exposes Saved, Syncing, Offline, and Needs-attention states without blocking the workout.

**Acceptance criteria:** VIS-DEC-09 SyncIndicator; UX-DEC-04 "Saved on device" ≠ "synced". UX-RISK-4.

## FR-SET-01 — Configurable: unit, week start, rest timer, haptics/sound, theme, plate increments

Configurable: weight unit, week start, rest timer, haptics/sound, theme, plate increments.

**Acceptance criteria:** profiles.week_start feeds weekly bucketing (BD-OQ-1). Theme relates to OQ-8.

## FR-SYNC-04 — No unsynced mutation silently discarded; destructive overwrite of completed history needs explicit action + recoverable conflict copy

No unsynced mutation is silently discarded during sign-out, conflict resolution, or migration; destructive overwrite of a completed session always needs an explicit local action and preserves a recoverable conflict copy.

**Acceptance criteria:** ADR-0003: rejected local change preserved in sync_conflicts; completed-session conflicts parked for explicit user choice.

## FR-LIB-03 — A small, legally usable exercise catalog is seeded; user-created exercises stay private

A small, legally usable exercise catalog is seeded; user-created exercises stay private.

**Acceptance criteria:** Content decision-gated on OQ-4 (dataset licence). Dual-tenancy model = SEC-DEC-05. seed.sql is a non-shippable placeholder (BD-RISK-6).

## FR-LIB-05 — Supersets reference exercises + order but may override prescriptions when inserted

Supersets reference exercises and order but may override prescriptions when inserted into a workout.

**Acceptance criteria:** superset_template_items with prescription overrides.

## FR-DATA-09 — Charts expose exact values on selection and never rely on color alone

Charts expose exact values on selection and never rely on color alone to distinguish series.

**Acceptance criteria:** NFR-A11Y; VIS-DEC-06 (≥2 non-colour cues). Text/table alternative.

## FR-LIB-06 — Templates are versionable; completed sessions always keep a denormalized display snapshot

Templates are versionable; completed sessions always keep a denormalized display snapshot.

**Acceptance criteria:** Product invariant #5/#6. content_version on templates (BD-C5 rename). Snapshot columns on session rows.

## FR-LIB-07 — Archived entities leave default creation/search but stay visible in historical records

Archived entities leave default creation/search but remain visible in historical records.

**Acceptance criteria:** deleted_at / archive flag; history joins unaffected.

## FR-LIB-01 — Library holds Exercises, Supersets, Workout Templates, Week Templates

Library holds Exercises, Supersets, Workout Templates, and Week Templates.

**Acceptance criteria:** Four peer collections. IA stays understandable as the library grows (GOAL-6).

## FR-LIB-04 — Exercise fields: name, aliases, muscles, equipment, tracking mode, unilateral, instructions, archive

Exercise fields: name, aliases, primary muscles, secondary muscles, equipment, tracking mode, unilateral flag, instructions, archive state.

**Acceptance criteria:** exercises table (BD-DEC-01).

## FR-DATA-10 — Editing/deleting a completed session triggers deterministic idempotent recompute

Editing or deleting a completed session triggers deterministic, idempotent recomputation of affected PRs and aggregates.

**Acceptance criteria:** AR-DEC-05 / BD-DEC-03. E2E scenario 5. Server triggers authored (supabase/migrations/...03), NOT executed (DEP-1).

## FR-DATA-08 — Trends cover weekly completed workouts, sets, volume, per-exercise e1RM

Trends cover weekly completed workouts, working sets, volume, and per-exercise e1RM.

**Acceptance criteria:** weekly_aggregates bucketed by user week_start + session-local date (BD-OQ-1 / SEC-F-9; WORK-020).

## FR-LIB-02 — Each collection supports search, sort, recent, create, duplicate, edit, archive, insert/use

Each collection supports search, sort, recent items, create, duplicate, edit, archive, and insert/use.

**Acceptance criteria:** SM-7 (results visible ≤300 ms locally).

## FR-DATA-06 — Estimated 1RM uses Epley for 2–10 reps; not computed for invalid inputs

Estimated 1RM uses Epley for 2–10 reps; not computed for zero reps, invalid loads, or unsupported modes.

**Acceptance criteria:** Epley e1RM = load × (1 + reps/30). Golden vectors (WORK-012) in supabase/tests/03 — unrun (DEP-1). Alternative formulas post-MVP (OQ-6).

## FR-LIB-08 — Deletion is blocked where it would break history; archive or soft-delete instead

Deletion is blocked where it would break history; archive or soft-delete instead.

**Acceptance criteria:** Product invariant #8. FK RESTRICT for history-referenced rows (ADR-0006). Blocked at repository/domain layer.

## FR-DATA-05 — PR categories: max load, e1RM, rep PR at a load, session volume; each records its formula/category

PR categories: max load, estimated 1RM, rep PR at a given load, session volume; each PR records its formula/category.

**Acceptance criteria:** personal_records with formula_id/formula_version (AR-DEC-05). Enum pr_category.

## FR-DATA-07 — Working volume for weight_reps = load_kg × reps; warmups excluded from the headline

Working volume for weight_reps is load_kg × reps per completed set; warmups excluded from the headline but still queryable.

**Acceptance criteria:** Golden vector: session_volume 1430 for the reference session (supabase/tests/03).

## FR-PLAN-07 — Move/duplicate use explicit day actions; drag-and-drop is enhancement-only

Move/duplicate use explicit day actions; drag-and-drop is enhancement-only and never the sole interaction.

**Acceptance criteria:** Accessibility: no action reachable only by drag.

## FR-PLAN-03 — A planned workout can be added, edited, duplicated, moved, archived, deleted

A planned workout can be added, edited, duplicated, moved, archived, and deleted.

**Acceptance criteria:** Explicit day actions (FR-PLAN-07); drag-and-drop enhancement-only.

## FR-DATA-01 — Progress has four peer views: Overview, History, PRs, Trends

Progress has four peer views: Overview, History, PRs, Trends.

**Acceptance criteria:** Data & Progress increment (§11.2).

## FR-DATA-02 — History filters by date range, exercise, workout name, completion status

History filters by date range, exercise, workout name, and completion status.

**Acceptance criteria:** Indexed local fields (NFR-PERF).

## FR-DATA-04 — Exercise detail: recent performances, max load, e1RM, best set by reps, volume, frequency

Exercise detail shows recent performances, max load, estimated 1RM, best set by rep count, total volume, and frequency.

**Acceptance criteria:** Derived via ADR-0005 recompute; exercise_weekly_rollups.

## FR-PLAN-06 — Planned exercises carry the full prescription set

Planned exercises carry order, superset group, target sets, rep range, load target, RPE/RIR target, rest duration, tempo, and notes.

**Acceptance criteria:** set_prescriptions + planned_workout_items in the schema.

## FR-PLAN-05 — A planned workout can be created from blank, template, or prior completed session

A planned workout can be created from blank, from a workout template, or from a prior completed session.

**Acceptance criteria:** Snapshot semantics on start (FR-PLAN-09).

## FR-PLAN-04 — A week can be created from blank, previous week, or week template

A week can be created from blank, from the previous week, or from a week template.

**Acceptance criteria:** SM-6 (≤3 primary actions to create next week). week_templates in the schema.

## FR-PLAN-08 — A plan records each session as unstarted, active, completed, skipped, or missed

A plan records each session as unstarted, active, completed, skipped, or missed.

**Acceptance criteria:** Enum planned_status in the schema.

## FR-PLAN-01 — The week is the default and primary planning unit

The week is the default and primary planning unit.

**Acceptance criteria:** Product invariant #9. DEC-004.

## FR-PLAN-09 — Starting a plan creates a session snapshot; later plan edits never mutate that session

Starting a plan creates a session snapshot; later plan edits never mutate that session.

**Acceptance criteria:** Product invariant #5. E2E scenarios 3–4. Snapshot-not-reference (AR-RISK-5).

## FR-PLAN-10 — Applying template updates to an existing future plan requires preview + explicit confirmation

Applying template updates to an existing future plan requires a preview and explicit confirmation.

**Acceptance criteria:** No silent rewrite of planned content.

## FR-DATA-03 — Completed history shows the values performed, never current template values

Completed history shows the values performed, never current template values.

**Acceptance criteria:** Product invariant #6. Denormalized display snapshot (FR-LIB-06). E2E scenario 5.

## FR-PLAN-02 — Navigate previous/next week and jump to current week

The user can navigate to the previous/next week and jump to the current week.

**Acceptance criteria:** UX-DEC-05 week strip.

## FR-LOG-13 — Numeric entry: decimals, hardware keyboard, configurable plate increments

Numeric entry supports decimal loads, hardware-keyboard entry, and configurable plate increments without forcing a calculator.

**Acceptance criteria:** Plate increments configurable (FR-SET-01).

## FR-LOG-02 — Session states: draft, active, completed, cancelled

Sessions have states: draft, active, completed, cancelled.

**Acceptance criteria:** Enum session_status in the schema (BD-DEC-01).

## FR-LOG-12 — Exactly one active session per user

Exactly one active session per user; starting another forces resume, finish, or explicit discard.

**Acceptance criteria:** Partial unique index (user_id) where status='active' and deleted_at is null. Product invariant #4.

## FR-LOG-04 — Default visible per-set fields: load, reps/metric, completion, previous

Default visible per-set fields: load, reps/metric, completion, and previous performance.

**Acceptance criteria:** The Set Row (VIS-DEC-04). SM-3 (≤5 s to log/update a set after focus).

## FR-LOG-01 — Session can be created from plan, template, prior workout, or empty

A session can be created from a planned workout, a template, a prior workout, or an empty start.

**Acceptance criteria:** SM-1/SM-2. Logging vertical slice (§11.2).

## FR-LOG-03 — Set types: warmup, working, drop, failure, backoff

Set types supported: warmup, working, drop, failure, backoff.

**Acceptance criteria:** Enum set_type in the schema. Warmups excluded from headline volume (FR-DATA-07).

## FR-LOG-09 — Rest timer: +15 s, skip, pause, silent/vibration preference

Rest timer starts from the exercise or user default and supports +15 s, skip, pause, and silent/vibration preference.

**Acceptance criteria:** Persisted as an absolute anchor timestamp (ADR-0004), recovery-safe.

## FR-LOG-07 — Exercises groupable into ordered supersets/circuits with a shared label

Exercises can be grouped into ordered supersets/circuits with a shared group label.

**Acceptance criteria:** superset_templates(+_items) in the schema.

## FR-LOG-10 — Accidental session loss is prevented; completed workouts recoverable

Accidental session loss is prevented: cancel requires confirmation; completed workouts are recoverable via edit history or soft deletion.

**Acceptance criteria:** Product invariant #8 (destructive actions preserve recoverability).

## FR-LOG-05 — Optional per-set/session fields hidden until requested

Optional per-set/session fields: RPE, RIR, tempo, set note, session note — hidden until requested.

**Acceptance criteria:** Progressive disclosure; not on the default Set Row.

## FR-LOG-11 — Finish flow shows duration, exercises, working sets, volume, PRs, notes before confirmation

The finish flow shows duration, exercises, working sets, total volume, PRs, and notes before confirmation.

**Acceptance criteria:** UX-DEC-04 wording: "Finish" → summary → "Confirm".

## FR-LOG-06 — In-session add/duplicate/reorder/skip/substitute/remove without leaving the session

During a session the user can add, duplicate, reorder, skip, substitute, or remove exercises and sets without leaving the session.

**Acceptance criteria:** Product invariant #2. Supports UX-DEC-03 (full scrollable session).

## FR-LOG-08 — A completed set is persisted locally immediately and remains editable

A completed set is persisted locally immediately and remains editable afterward.

**Acceptance criteria:** SM-4 (≤100 ms perceived; no network dependency). AR-DEC-10 hot-write acknowledgement. Airplane-mode test.

## FR-LOG-14 — Tracking modes: weight_reps, reps, duration, distance; UI renders only relevant fields

Exercise tracking modes: weight_reps, reps, duration, distance; the UI renders only the relevant fields.

**Acceptance criteria:** Enum tracking_mode in the schema. e1RM not computed for unsupported modes (FR-DATA-06).

## FR-AUTH-02 — Secrets only in platform-secure storage; no privileged server credential in client

Authentication secrets are held only in platform-secure storage; no privileged server credential ever ships in the client.

**Acceptance criteria:** Tokens in expo-secure-store; service-role key never shipped/requested (CON-4). Adversarial + code review.

## FR-AUTH-05 — Per-owner isolation of every user-owned server record

Every user-owned server record is isolated to its owner; a user can never read or mutate another user's data through the client API.

**Acceptance criteria:** SM-9: second account cannot read/mutate any first-account object via the API. Adversarial two-user RLS tests before any table is exposed (supabase/tests/01, 04 — unrun, DEP-1).

## FR-AUTH-04 — Guest mode ships only if guest→account migration is atomic and lossless

Guest mode ships only if guest-to-account migration is atomic and lossless; otherwise authentication is required and no disposable pseudo-account is shipped.

**Acceptance criteria:** Decision-gated on OQ-3. Migration correctness test if pursued.

## FR-AUTH-01 — Email/password auth with persisted session

Email/password sign-up, sign-in, sign-out, password reset, and a persisted session across launches.

**Acceptance criteria:** Traces to SM-* via product-strategy §15; verified by auth + shell Foundation exit signal (§11.2).

## FR-TODAY-01 — Today shows date, seven-day strip, selected-day state

Today shows the selected date, a seven-day strip, and the selected-day state.

**Acceptance criteria:** Usability session; renders from local data with no network wait (NFR-PERF).

## FR-TODAY-03 — Planned workout for the day offers start, edit, move, overflow

A planned workout for the day offers start, edit, move, and overflow actions.

**Acceptance criteria:** SM-1 (one primary tap to start today's planned workout).

## FR-TODAY-02 — An active workout is surfaced above all other Today content

An active workout is surfaced above all other Today content.

**Acceptance criteria:** Product invariant #1 (Today makes the next workout action obvious). Usability session.

## FR-TODAY-05 — Today shows a compact weekly status

Today shows a compact weekly status: completed vs planned sessions and total completed working sets or volume.

**Acceptance criteria:** Ambiguity with sparse data tracked as UX-RISK-5.

## FR-TODAY-06 — Today links to the most recent completed workout, not a long feed

Today links to the most recent completed workout without becoming a long activity feed.

**Acceptance criteria:** UX anti-quality: Today is not an activity feed.

## FR-TODAY-04 — With no plan, Today offers repeat-last, choose-template, start-empty

With no plan for the day, Today offers repeat-last, choose-template, and start-empty.

**Acceptance criteria:** SM-2 (2–3 taps to start empty/repeated/template workout).

## FR-AUTH-03 — Onboarding collects only the minimal profile set

Onboarding collects only: display name, preferred unit (lb/kg), week start day, default rest timer, optional training goal.

**Acceptance criteria:** Onboarding depth tracked as UX-OQ-4. Usability session.
