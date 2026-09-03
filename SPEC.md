# Weight — Product and Full-Stack Development Specification

**Status:** Draft v1, ready for implementation planning  
**Product type:** Mobile weight-training planner and tracker  
**Client:** Expo / React Native, initially compatible with Expo Go  
**Platforms:** iOS and Android phones  
**Working title:** Weight (replace when the product name is chosen)

---

## 1. Product definition

Weight is a personal workout planner and tracker built around three jobs:

1. **Log a workout quickly** during or after training.
2. **Plan training by week**, with reusable exercises, supersets, workouts, and weeks.
3. **Understand training data** through history, personal records, exercise progress, and workload trends.

The product should feel calm, focused, and fast. Its visual language is monochromatic and softly neumorphic, using Aeonik as the brand typeface. The supplied MyFitnessPal screens are structural inspiration: a Today dashboard, horizontal week strip, grouped list cards, central creation action, clear search, and focused edit screens. The product must not copy MyFitnessPal branding, wording, icons, or exact layouts.

### 1.1 Product promise

> Open the app, know what to train, record a set in seconds, and see whether training is progressing.

### 1.2 Primary user

An individual lifter who trains several times per week and wants more structure than a notes app without the setup cost or visual noise of a complex coaching platform.

### 1.3 Assumptions

- MVP is single-user and personal; coaches, teams, and social features are out of scope.
- The phone is used in a gym, often one-handed, with intermittent connectivity.
- Weekly planning is more important than long-range periodization in MVP.
- Users may plan first, start an unplanned workout, repeat a previous workout, or log a completed workout retrospectively.
- Aeonik font files and the required app-distribution license will be provided before release.
- Both kilograms and pounds are supported; weight is stored canonically in kilograms.
- The visual system is cross-platform and iOS-adapted, not a claim of fully native iOS UI.

---

## 2. Goals, success measures, and non-goals

### 2.1 Goals

- Make the most common path—starting today’s planned workout—possible in one primary tap from Today.
- Make each working-set entry possible without leaving the workout screen.
- Make a useful week plan in under two minutes by duplicating or reusing existing items.
- Preserve all logging and active-workout functionality offline.
- Turn completed sessions into useful history and progress data without additional user work.
- Keep the information architecture understandable as the library grows.

### 2.2 Initial success measures

| Measure | Target |
| --- | --- |
| Open app → start today’s planned workout | 1 primary tap |
| Open app → start empty/repeated/template workout | 2–3 taps |
| Log or update a set after fields are focused | ≤ 5 seconds for a familiar user |
| Local persistence after a set edit | ≤ 100 ms perceived response; no network dependency |
| Recover active workout after force-close | No confirmed set lost |
| Create next week from current/previous week | ≤ 3 primary actions |
| Find an existing exercise | Search results visible within 300 ms locally |
| Core touch targets | Minimum 48 × 48 dp |

These are product acceptance targets, not analytics claims. Baselines should be measured during usability testing.

### 2.3 Non-goals for MVP

- Coach/team programming and shared plans
- Social feed, followers, comments, leaderboards, or public profiles
- Nutrition, meal, sleep, or wearable integrations
- AI-generated programming
- Video exercise analysis
- Marketplace or paid trainer content
- Advanced periodization beyond week templates and planned weeks
- Web/desktop authoring UI
- Apple Health, Health Connect, watch apps, or live activities
- Custom native modules while Expo Go compatibility is required

---

## 3. Product principles

1. **The next action is obvious.** Today answers “What am I doing now?”
2. **Recording beats configuring.** Defaults come from the plan, template, or last performance.
3. **Local first, synchronized second.** A poor gym connection never blocks a workout.
4. **Reuse without coupling.** Plans and templates seed sessions; later edits do not rewrite history.
5. **Progressive disclosure.** Weight, reps, and completion stay visible; RPE, RIR, tempo, notes, and substitutions stay optional.
6. **Data earns its space.** Every card must help the user train, plan, compare, or decide.
7. **Soft surfaces, hard clarity.** Neumorphism creates hierarchy, never the only indication of selection, input, status, or interactivity.

---

## 4. Information architecture and navigation

Use a persistent five-position bottom navigation inspired by the reference screenshot:

| Position | Destination/action | Purpose |
| --- | --- | --- |
| 1 | **Today** | Today’s plan, active workout, quick summary, recent activity |
| 2 | **Plan** | Week-first calendar and workout planning |
| 3 | **Log (+)** | Raised action button opening the Log Action Sheet; not a persistent destination |
| 4 | **Progress** | Overview, history, PRs, and trends |
| 5 | **Library** | Exercises, supersets, workout templates, and week templates |

Profile, preferences, units, export, and account actions live behind an avatar/settings button in the top-right of Today. Do not spend a primary tab on Settings.

### 4.1 Log Action Sheet

The center action opens a bottom sheet with context-aware choices:

1. **Start today’s workout** — first when a planned workout exists and has not been completed.
2. **Resume workout** — first and visually dominant when a session is active.
3. **Repeat last workout**
4. **Choose a workout template**
5. **Start empty workout**
6. **Log a past workout**

The sheet may show no more than five visible actions before scrolling. Hide impossible/redundant actions; do not disable them without explanation.

### 4.2 Route map

```text
app/
  (auth)/
    welcome
    sign-in
    sign-up
    onboarding
  (tabs)/
    today
    plan
    progress
    library
  workout/
    active/[sessionId]
    summary/[sessionId]
    history/[sessionId]
  plan/
    workout/[plannedWorkoutId]
    week/[weekId]
  exercise/
    search
    [exerciseId]
    progress/[exerciseId]
  library/
    exercises
    supersets
    workouts
    weeks
    editor/[entityType]/[id]
  settings/
    index
    account
    preferences
    data
```

Expo Router route groups and filenames may evolve, but the user-visible destinations and back behavior are authoritative.

---

## 5. Core user journeys

### 5.1 Start and complete today’s planned workout

1. User opens Today.
2. Today shows the selected date and planned workout card.
3. User taps **Start workout**.
4. The app creates a workout session by snapshotting the planned workout and prescriptions.
5. The active screen focuses the first incomplete exercise/set.
6. User enters load and reps, optionally RPE/RIR or notes, then marks the set complete.
7. The app immediately writes the change to local SQLite and starts the rest timer if enabled.
8. User completes, skips, substitutes, reorders, or adds exercises without leaving the session.
9. User taps **Finish**, reviews a compact summary, and confirms.
10. The app finalizes the session, updates derived stats/PR candidates, and syncs when online.

**Acceptance:** Network loss at any step does not prevent logging or completion. Relaunch restores the active session and timer state.

### 5.2 Start an unplanned workout

1. User taps the center Log action.
2. User chooses repeat last, template, or empty workout.
3. The app creates a draft/active session locally.
4. For an empty workout, exercise search opens immediately.
5. Selecting an exercise uses the most recent completed performance as suggested values, clearly labeled as suggestions.

### 5.3 Log a past workout

1. User taps Log → **Log a past workout**.
2. User selects date/time and optionally a template or previous workout.
3. User records exercises and sets without rest timers or active-session urgency.
4. Saving creates a completed session and triggers the same statistics pipeline as a live workout.

### 5.4 Plan a week

1. User opens Plan on the current week.
2. A horizontal week strip and seven-day layout show planned workouts.
3. Empty state offers **Copy previous week**, **Use week template**, or **Add workout**.
4. User adds a workout from a template, repeats a prior session as a plan, or creates one.
5. User edits exercise order, supersets, set prescriptions, targets, and notes.
6. User moves a workout to another day or duplicates it.
7. Changes save locally immediately and sync in the background.

### 5.5 Review progress

1. User opens Progress.
2. Overview shows training consistency, recent workload, recent PRs, and frequently trained movements.
3. User switches to History, PRs, or Trends.
4. Selecting an exercise opens its detail page with recent sessions, bests, and an evolution chart.
5. Selecting a history item opens the immutable completed-session snapshot with an explicit Edit action.

### 5.6 Build and reuse library items

1. User opens Library.
2. User chooses Exercises, Supersets, Workouts, or Weeks.
3. Search and recents appear before category browsing.
4. User creates, duplicates, edits, archives, or inserts an item into a plan/session.
5. Editing a template affects future uses only; existing planned snapshots and completed sessions remain unchanged unless the user explicitly applies updates.

---

## 6. Functional requirements

### 6.1 Authentication and onboarding

- **AUTH-01:** Support email/password sign-up, sign-in, sign-out, password reset, and persisted session.
- **AUTH-02:** Store authentication secrets using the platform-secure Expo storage adapter; never store service-role credentials in the client.
- **AUTH-03:** Onboarding asks only for display name, preferred unit (lb/kg), week start day, default rest timer, and optional training goal.
- **AUTH-04:** Users can try a local guest mode only if guest-to-account migration is implemented atomically. Otherwise require authentication and do not ship a disposable pseudo-account.
- **AUTH-05:** Every server-side user-owned table enforces Row Level Security by `user_id = auth.uid()`.

### 6.2 Today

- **TODAY-01:** Show date title, seven-day strip, and selected-day state.
- **TODAY-02:** Show active workout above all other content.
- **TODAY-03:** Show planned workout with start, edit, move, and overflow actions.
- **TODAY-04:** If no plan exists, show repeat last, choose template, and start empty actions.
- **TODAY-05:** Show a compact weekly status: completed/planned sessions and total completed sets or volume.
- **TODAY-06:** Show the latest completed workout with a route to history; avoid a long dashboard feed.

### 6.3 Workout logging

- **LOG-01:** Create a session from a planned workout, template, prior workout, or empty state.
- **LOG-02:** Support session states `draft`, `active`, `completed`, `cancelled`.
- **LOG-03:** Support set types `warmup`, `working`, `drop`, `failure`, and `backoff`.
- **LOG-04:** Default visible fields are load, reps/metric, completion, and previous performance.
- **LOG-05:** Optional fields include RPE, RIR, tempo, set note, and session note.
- **LOG-06:** Add, duplicate, reorder, skip, substitute, or remove exercises and sets during a session.
- **LOG-07:** Group exercises into ordered supersets/circuits with a shared group label.
- **LOG-08:** A completed set is saved locally immediately. Editing it remains possible.
- **LOG-09:** Rest timer starts from the exercise or user default and supports +15 sec, skip, pause, and silent/vibration preferences.
- **LOG-10:** Prevent accidental session loss. Cancel requires confirmation; completed workouts are recoverable through edit history or soft deletion.
- **LOG-11:** Finish flow displays duration, exercises, working sets, total volume, PRs, and notes before confirmation.
- **LOG-12:** Only one active session is supported per user in MVP. Starting another requires resume, finish, or discard with confirmation.
- **LOG-13:** Numeric inputs support decimal loads, hardware keyboard entry, and configurable plate increments without forcing a calculator.
- **LOG-14:** Exercise tracking modes support `weight_reps`, `reps`, `duration`, and `distance`. The UI renders only relevant fields.

### 6.4 Weekly planning

- **PLAN-01:** Week is the default and primary planning unit.
- **PLAN-02:** Navigate previous/next week and jump to current week.
- **PLAN-03:** Add, edit, duplicate, move, archive, and delete a planned workout.
- **PLAN-04:** Create a week from blank, previous week, or week template.
- **PLAN-05:** Create a planned workout from blank, workout template, or prior completed session.
- **PLAN-06:** Planned exercises support order, superset group, target sets, rep range, load target, RPE/RIR target, rest duration, tempo, and notes.
- **PLAN-07:** Moving/duplicating uses explicit day actions in MVP; drag-and-drop is enhancement-only and must not be the sole interaction.
- **PLAN-08:** A plan records whether a session is unstarted, active, completed, skipped, or missed.
- **PLAN-09:** Starting a plan creates a session snapshot. Later plan edits do not mutate that session.
- **PLAN-10:** Applying template updates to an existing future plan requires a preview and explicit confirmation.

### 6.5 Progress, history, and PRs

- **DATA-01:** Progress has four peer views: Overview, History, PRs, Trends.
- **DATA-02:** History filters by date range, exercise, workout name, and completion status.
- **DATA-03:** Completed history shows performed values, not current template values.
- **DATA-04:** Exercise detail shows recent performances, max load, estimated 1RM, best set by rep count, total volume, and frequency.
- **DATA-05:** PR categories are max load, estimated 1RM, rep PR at a given load, and session volume. Mark the formula/category.
- **DATA-06:** Default estimated 1RM formula is Epley for 2–10 reps. Do not calculate e1RM for zero reps, invalid loads, or unsupported exercise modes.
- **DATA-07:** Volume for `weight_reps` is `load_kg × reps` per completed set. Warmups are excluded from headline working volume by default but remain queryable.
- **DATA-08:** Trends support weekly completed workouts, working sets, volume, and exercise-specific e1RM.
- **DATA-09:** Charts show exact values on selection and never rely on color alone to distinguish series.
- **DATA-10:** Editing/deleting a completed session triggers deterministic recomputation of affected PRs and aggregates.

### 6.6 Library

- **LIB-01:** Library contains Exercises, Supersets, Workout Templates, and Week Templates.
- **LIB-02:** Each collection supports search, sort, recent items, create, duplicate, edit, archive, and insert/use.
- **LIB-03:** Seed a small, legally usable exercise catalog; user-created exercises remain private.
- **LIB-04:** Exercise fields include name, aliases, primary muscles, secondary muscles, equipment, tracking mode, unilateral flag, instructions, and archive state.
- **LIB-05:** Supersets reference exercises and order but may override prescriptions when inserted into a workout.
- **LIB-06:** Templates are versionable. Completed sessions always retain a denormalized display snapshot for historical integrity.
- **LIB-07:** Archived entities disappear from default creation/search but remain visible in historical records.
- **LIB-08:** Deletion is blocked when it would break history; archive or soft-delete instead.

### 6.7 Settings and data ownership

- **SET-01:** Configure weight unit, week start, rest timer, haptics/sound, theme, and plate increments.
- **SET-02:** Export user data in JSON and completed sets/sessions in CSV.
- **SET-03:** Account deletion requires re-authentication, explicit confirmation, server-side cascade/anonymization as appropriate, and a completion receipt.
- **SET-04:** Unit changes affect presentation only; canonical stored values remain kilograms/meters/seconds.

---

## 7. Screen specification

### 7.1 Today

**Hierarchy:** date/menu → week strip → active/planned workout → weekly summary → recent workout.  
**Primary action:** Resume or Start workout.  
**Empty state:** “Nothing planned for today” with Repeat last, Choose workout, and Start empty.  
**Offline state:** retain full content with a small “Changes saved on device” sync indicator; no blocking banner.

### 7.2 Active workout

**Header:** back/minimize, elapsed time, workout name, Finish.  
**Sticky area:** active exercise name, superset context, rest timer when running.  
**Body:** ordered exercise sections containing previous values and editable set rows.  
**Footer:** Add exercise; contextual sheet for session notes and settings.  
**Interaction:** opening a numeric field must not hide the active row; Next moves through load → reps → optional metric → completion.  
**Recovery:** minimizing returns to the prior tab with a persistent Resume pill above navigation.

### 7.3 Plan

**Header:** week range, Today shortcut, overflow.  
**Week control:** seven selectable days with completion/planned markers.  
**Body:** selected-day workouts, then week summary.  
**Primary action:** Add workout.  
**Week actions:** Copy previous week, Use template, Save as template, Clear future plans with confirmation.

### 7.4 Planned workout editor

**Header:** Cancel/back, workout name, Save.  
**Body:** exercise/superset sections with prescriptions.  
**Default density:** collapsed exercise cards show set count, rep range, target, and rest; expand to edit set-by-set differences.  
**Primary action:** Add exercise or superset.

### 7.5 Progress

**Top:** Overview / History / PRs / Trends segmented control.  
**Overview:** consistency, weekly volume trend, latest PRs, top exercises.  
**History:** chronological list grouped by week/month.  
**PRs:** category filters and exercise search.  
**Trends:** metric and date-range selectors followed by one primary chart and a data list.

### 7.6 Library

**Top:** search field.  
**Collections:** Exercises, Supersets, Workouts, Weeks as list rows with counts and recent item previews—not a decorative card grid.  
**Collection screen:** recent/frequent items first, filter/sort sheet, alphabetical or chronological list.  
**Context-aware use:** when opened from an editor, selecting an item inserts it and returns; when opened from the tab, selecting opens detail.

---

## 8. Visual design system

### 8.1 Design context and pressure response

| Pressure | Level | Design response |
| --- | --- | --- |
| Speed and repetition | High | Stable set rows, defaults, inline completion, minimal modal navigation |
| Touch ergonomics | High | 48 dp targets, bottom-reachable actions, generous row spacing |
| Environmental readability | High | Strong text contrast and explicit borders despite soft surfaces |
| Data comparison | High | Aligned numbers, tabular figures, list/table rhythm over card grids |
| Accessibility/text scaling | High | Semantic roles, scalable text, redundant state indicators |
| Discoverability | Medium | Labels on primary actions, progressive disclosure for advanced fields |
| Brand expression | Medium | Aeonik, monochrome palette, restrained neumorphic surfaces |
| Immersion | Low | Persistent navigation and visible state are more important |

### 8.2 Direction

- **Platform system:** Custom cross-platform with iOS-adapted interaction logic and Android back/inset compliance.
- **Primary direction:** Utilitarian.
- **Supporting qualities:** Data-dense and premium through precision/restraint.
- **Visual techniques:** Monochrome, shallow neumorphic elevation, rounded geometry, sparse motion.

### 8.3 Neumorphism rules

- Use raised neumorphic treatment for large actionable cards, the center Log button, and selected high-level controls.
- Use a clear 1 px boundary for text inputs, set rows, charts, and dense list items.
- Never use shadow alone to indicate pressability, focus, selection, completion, error, or disabled state.
- Avoid nested raised cards. Use spacing, dividers, or tonal shifts inside a surface.
- Pressed state may reduce elevation and darken the fill; it must also change boundary/icon/text treatment.
- Keep shadows subtle enough that content remains legible in bright gym lighting.

### 8.4 Typography

Use licensed Aeonik files loaded through `expo-font`.

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `type.display` | 32 / 38 | Bold | Key workout metric or onboarding statement |
| `type.title1` | 28 / 34 | Bold | Today, Plan, screen titles |
| `type.title2` | 22 / 28 | Medium/Bold | Workout and section titles |
| `type.heading` | 18 / 24 | Medium | Exercise names, card titles |
| `type.body` | 16 / 22 | Regular | Primary content and controls |
| `type.label` | 14 / 18 | Medium | Buttons, fields, tabs |
| `type.caption` | 12 / 16 | Regular/Medium | Previous values, metadata |

- Use `fontVariant: ['tabular-nums']` for timers, loads, reps, dates, and chart values when supported.
- Do not synthesize font weights. Map each declared weight to an included font file.
- Support OS text scaling. At larger sizes, set rows may stack labels above inputs instead of clipping.

### 8.5 Color tokens

Core UI is monochromatic. Semantic exceptions must be sparse, accessible, and paired with icon/text.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `color.canvas` | `#ECEFF2` | `#151719` | App background |
| `color.surface` | `#F1F3F5` | `#1B1E21` | Primary surfaces |
| `color.surfaceRaised` | `#F5F6F7` | `#202428` | Raised controls/cards |
| `color.text` | `#111315` | `#F5F6F7` | Primary text |
| `color.textMuted` | `#5F666E` | `#AAB0B6` | Secondary text |
| `color.border` | `#CDD2D7` | `#343A40` | Explicit boundaries |
| `color.highlight` | `#FFFFFF` | `#2A2E33` | Light shadow/highlight |
| `color.shadow` | `#C5CBD1` | `#0B0C0D` | Dark shadow |
| `color.inverse` | `#111315` | `#F5F6F7` | Primary filled actions |
| `color.onInverse` | `#FFFFFF` | `#111315` | Content on filled actions |
| `color.danger` | `#9B2C2C` | `#FFB4AB` | Destructive/error exception |

Completion and PR status must include a check/trophy icon and text, not green alone. Charts use solid/dashed lines, markers, weights, and labels before adding hue.

### 8.6 Spacing, shape, and elevation

- Base spacing unit: 4 dp.
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40.
- Screen horizontal padding: 16 dp compact phones; 20–24 dp wide phones.
- Minimum control height: 48 dp; primary CTA: 52–56 dp.
- Radius: 12 dp inputs, 16 dp list cards, 20 dp primary cards, 24–28 dp sheets.
- Elevation levels: `flat`, `raised-1`, `raised-2`, `overlay`; no arbitrary per-screen shadows.
- One surface should generally have one shadow pair: upper-left highlight and lower-right shadow.

### 8.7 Iconography and motion

- Use one consistent outlined icon family available in the Expo-compatible stack.
- Icons are 20–24 dp; icon-only actions require accessibility labels and 48 dp hit areas.
- Motion durations: 120–180 ms for press/state feedback, 220–300 ms for sheets/navigation.
- Use haptics only for set completion, timer completion, and destructive confirmations; honor user settings.
- Reduced Motion removes spring/scale effects and uses opacity/instant state changes.

### 8.8 Core components

| Component | Role and required states |
| --- | --- |
| `AppSurface` | Flat/raised/overlay variants; light/dark/high-contrast-safe |
| `PrimaryButton` | Default, pressed, loading, disabled, destructive |
| `IconButton` | Visible affordance, label for assistive tech, 48 dp target |
| `WeekStrip` | Today, selected, planned, completed, missed, disabled dates |
| `WorkoutCard` | Planned, active, completed, skipped; primary and overflow actions |
| `SetRow` | Previous, target, actual inputs, type, complete state, error state |
| `NumericField` | Unit suffix, decimal rules, focused/error/disabled states |
| `ExerciseSection` | Collapsed/expanded, superset label, progress, menu |
| `SearchField` | Empty, typing, results, no results, offline-local results |
| `SegmentedControl` | Peer views only; selected state not shadow-only |
| `StatTile` | Label, exact value, comparison, unavailable/loading states |
| `TrendChart` | Accessible summary, selected point, empty/insufficient-data states |
| `BottomSheet` | Drag/close, escape/back, keyboard-safe, destructive confirmation |
| `SyncIndicator` | Saved, syncing, offline, retry/error without blocking the workout |

---

## 9. Domain model

### 9.1 Core distinction

Keep these concepts separate:

- **Exercise:** reusable movement definition.
- **Superset template:** reusable ordered grouping of exercises.
- **Workout template:** reusable workout definition.
- **Week template:** reusable seven-day arrangement of workout definitions.
- **Planned workout:** scheduled instance for a date.
- **Workout session:** actual performed instance.
- **Performed set:** source-of-truth training record.

Templates and plans are copied/snapshotted into sessions. Completed sessions never read mutable template content for historical display.

### 9.2 Entity summary

| Entity | Important fields |
| --- | --- |
| `profiles` | `id/user_id`, display name, units, week start, timer settings, timestamps |
| `exercises` | `id`, owner nullable for seed items, name, aliases, muscles, equipment, tracking mode, archived |
| `superset_templates` | `id`, user_id, name, description, archived, version |
| `superset_template_items` | superset_id, exercise_id, order, default prescription JSON |
| `workout_templates` | `id`, user_id, name, description, tags, archived, version |
| `workout_template_items` | template_id, exercise_id, order, group_id, notes, default rest |
| `set_prescriptions` | parent item, order, set type, reps min/max, load target kg, RPE/RIR, duration/distance |
| `week_templates` | `id`, user_id, name, description, archived, version |
| `week_template_days` | week_template_id, day offset 0–6, workout template/reference or snapshot, order |
| `plan_weeks` | `id`, user_id, week_start_date, title, notes, source template, timestamps |
| `planned_workouts` | `id`, plan_week_id, scheduled date/order, name snapshot, status, source IDs |
| `planned_workout_items` | planned_workout_id, exercise snapshot/reference, order, group, prescriptions |
| `workout_sessions` | `id`, user_id, planned_workout_id nullable, name snapshot, start/end, status, notes, timezone |
| `session_exercises` | session_id, exercise_id, name snapshot, order, group, substitution metadata, notes |
| `performed_sets` | session exercise, order, type, load kg, reps, duration, distance, RPE/RIR, completed, timestamps |
| `personal_records` | user/exercise/category, value, unit, performed_set/session source, achieved_at, formula/version |
| `sync_outbox` | local-only operation id, entity, entity id, operation, payload/version, attempt metadata |

### 9.3 Data rules

- IDs are client-generated UUIDs so offline creation never waits for the server.
- All user-owned server rows include `user_id`, `created_at`, `updated_at`, and nullable `deleted_at` where soft deletion is required.
- Use UTC timestamps for instants and store the session timezone separately. Use date-only values for plan dates.
- Canonical measures: kilograms, meters, seconds. Convert only at the presentation boundary.
- Numeric validation: no negative load/reps/duration/distance; allow zero load for bodyweight/unloaded work.
- `performed_sets` are included in analytics only when `completed = true` and the parent session is completed, unless a specific view says otherwise.
- Historical exercise/workout names are snapshotted to survive rename/archive operations.
- PR and aggregate calculations are derived and reproducible; the performed set remains the source of truth.

### 9.4 Suggested relational constraints and indexes

- Unique `plan_weeks(user_id, week_start_date)`.
- Partial unique active session per user where status = `active`.
- Unique order within each parent where practical; use sortable integer positions with gaps.
- Index sessions on `(user_id, started_at desc)` and `(user_id, status)`.
- Index performed sets on `(session_exercise_id, position)`.
- Index planned workouts on `(user_id, scheduled_date)` through denormalized user_id or join-optimized indexes.
- Case-insensitive/trigram search index for exercise and template names on the server; local normalized-name index for SQLite search.
- Foreign keys use restricted deletion for historical records and cascading deletion only for uncommitted child structures.

---

## 10. Technical architecture

### 10.1 Client stack

- React Native with Expo and strict TypeScript.
- Expo Router for file-based navigation and deep-linkable routes.
- Expo Go-compatible libraries only during the Expo Go phase.
- `expo-sqlite` as the local operational database and offline source of truth.
- `expo-font` for runtime loading of Aeonik while using Expo Go; embed fonts in production builds later.
- Supabase JavaScript client for Auth, Postgres Data API, and synchronization.
- Lightweight client state for ephemeral UI only; persisted domain data stays in repositories/SQLite.
- Schema validation at API and repository boundaries.
- React Native primitives and Expo-compatible SVG for simple charts; avoid a heavy chart dependency until requirements exceed the custom primitives.

Package versions must be selected with `expo install` for the chosen SDK and locked. Do not put moving “latest” version numbers in this specification.

### 10.2 Expo Go boundary

Expo Go is appropriate for rapid prototype and early MVP iteration, but the project must be architected to move to an Expo development build before production release. During the Expo Go phase:

- Use only modules explicitly included in the installed Expo Go SDK.
- Avoid custom native code, native-only neumorphism libraries, and production assumptions tied to the Expo Go container.
- Implement neumorphism with standard React Native shadows/elevation, tonal surfaces, borders, and optional Expo-compatible gradients.
- Keep native integrations behind interfaces so future Health, widgets, or notifications do not leak into core domain code.

### 10.3 Backend

Use Supabase:

- **Auth:** email/password for MVP; provider login is post-MVP.
- **Postgres:** canonical synchronized datastore.
- **RLS:** mandatory isolation on every user-owned table and derived view.
- **Database functions/triggers:** deterministic timestamps, safe aggregate/PR recomputation hooks where appropriate.
- **Edge Functions:** only for operations that require server secrets or orchestration; ordinary CRUD remains direct through RLS-protected APIs.
- **Storage:** not needed for MVP unless exercise media is added later.

Never ship the Supabase service-role key. Only publishable/anonymous client configuration may be bundled.

### 10.4 Application layers

```text
Routes/Screens
  → feature controllers/hooks
    → domain services (planning, session, PR, units)
      → repository interfaces
        → local SQLite repositories
        → sync engine
          → Supabase gateway
```

UI components must not call Supabase directly. This preserves offline behavior and makes domain logic testable.

### 10.5 Suggested project structure

```text
app/                    # Expo Router routes
src/
  components/           # shared semantic UI components
  design-system/        # tokens, themes, typography, elevation
  features/
    auth/
    today/
    logging/
    planning/
    progress/
    library/
    settings/
  domain/               # entities, calculations, policies
  data/
    local/               # SQLite schema, migrations, repositories
    remote/              # Supabase gateway and generated types
    sync/                # outbox, pull cursor, conflict policy
  services/              # clock, IDs, units, analytics, haptics
  test/
supabase/
  migrations/
  seed.sql
  tests/                 # RLS and database tests
assets/
  fonts/
```

---

## 11. Offline and synchronization model

### 11.1 Required behavior

- SQLite serves all normal reads and writes.
- Every local mutation is committed transactionally with an outbox item.
- Sync runs after authentication, app foreground, connectivity restoration, manual retry, and debounced local changes.
- UI success means “saved on this device,” not “server acknowledged.”
- The sync indicator exposes Saved, Syncing, Offline, and Needs attention states.

### 11.2 Sync rules

1. Push outbox mutations in dependency order.
2. Pull server changes using a durable cursor/watermark.
3. Use tombstones for synchronized deletions.
4. Treat performed sets as independently addressable rows to reduce conflicts.
5. MVP conflict rule for the same field/row is last accepted write wins, with conflict telemetry and no silent session deletion.
6. A completed-session deletion or destructive overwrite always requires an explicit local action; a remote tombstone must not erase an unsynced local edit without preserving a recoverable conflict copy.
7. Sync retries use exponential backoff and retain failed operations until resolved or explicitly discarded.

### 11.3 Active session safety

- Persist each confirmed set edit immediately in a SQLite transaction.
- Persist session timer anchors as timestamps, not decrementing counters.
- Restore the last active session on launch.
- If another device creates an active session, show a conflict choice; do not merge two active sessions automatically.
- Finish operation is idempotent.

---

## 12. Calculations

### 12.1 Volume

```text
set_volume_kg = load_kg × reps
session_volume_kg = sum(completed working/backoff/drop/failure set volume)
```

Warmup volume is stored and may be shown separately, but is excluded from the default headline.

### 12.2 Estimated one-repetition maximum

For eligible completed sets of 2–10 reps:

```text
e1RM_kg = load_kg × (1 + reps / 30)
```

This is the Epley estimate. Store the formula identifier/version with any materialized PR so future formula changes do not silently rewrite historical claims.

### 12.3 PR evaluation

- Evaluate PR candidates when a session completes or is edited.
- Compare canonical values before unit conversion.
- Ties do not create a new PR unless the product later adds an “equaled PR” distinction.
- Recompute affected exercise PRs after set/session changes or deletion.
- Bodyweight-only, assisted, and machine exercises may require exercise-specific load semantics; until configured, show performance bests but avoid misleading cross-mode e1RM.

---

## 13. Accessibility and platform behavior

- Meet WCAG AA contrast for meaningful text and controls despite the soft visual direction.
- Support VoiceOver and TalkBack names, roles, values, state, and logical traversal.
- Do not communicate completion, PRs, error, missed workouts, or selection by color/elevation alone.
- Respect OS text scaling without hiding actions; reflow dense set rows when required.
- Respect Reduce Motion and reduced transparency preferences.
- Preserve iOS safe areas and expected sheet/back gestures.
- Preserve Android system back behavior, edge-to-edge insets, and TalkBack order.
- Keep the keyboard from covering the active numeric field and provide an explicit dismiss path.
- Provide accessibility summaries for charts and a list/table representation of plotted points.
- All destructive actions name the affected object and provide undo when technically safe.
- Localize dates, decimal separators, first day of week, and units; layouts tolerate longer translated labels and RTL.

---

## 14. Security and privacy

- Enable RLS on all exposed user-owned tables before client integration.
- Policies cover select, insert, update, and delete independently.
- Generate database types from migrations and review API exposure.
- Store tokens in secure platform storage; clear local user databases on verified sign-out/account deletion according to the selected privacy policy.
- Use parameterized SQLite queries/prepared statements for user input.
- Validate all IDs, enum values, measures, date ranges, and ownership server-side.
- Do not log tokens, credentials, private notes, or complete workout payloads to production telemetry.
- Define retention and deletion behavior before beta.
- Export and delete flows must be tested against both local and remote data.

---

## 15. Performance and reliability requirements

- Today and an active workout render from local data without waiting for the network.
- Confirming a set provides visual feedback in the same frame and persists asynchronously/transactionally without blocking input.
- Use virtualized lists for long history/exercise collections.
- Debounce search and query indexed local fields; do not fetch the entire exercise catalog on every keystroke.
- Avoid rendering all collapsed workout exercises/sets when not visible.
- Database migrations are forward-only, transactional where supported, and covered by upgrade tests.
- App errors in noncritical analytics/sync paths never crash the active workout.
- Crash recovery and outbox replay are idempotent.

---

## 16. Analytics and observability

Define events behind an analytics interface; the provider can be chosen later.

### 16.1 Product events

- `workout_started` with source: planned/template/repeat/empty/past
- `set_completed`, sampled or aggregated to avoid noisy/costly telemetry
- `workout_completed`
- `workout_abandoned`
- `week_created` with source: blank/copy/template
- `planned_workout_created`
- `template_used`
- `history_viewed`
- `exercise_progress_viewed`
- `pr_achieved`
- `sync_failed` with sanitized reason/category

Do not send load, body weight, free-text notes, exercise notes, email, or other sensitive payloads unless explicitly justified and consented.

### 16.2 Operational signals

- SQLite migration failure
- Active-session restore failure
- Outbox depth/oldest age
- Sync retry count and terminal errors
- RLS/API authorization failures
- Crash-free sessions and workout-completion flow errors

---

## 17. Testing strategy

### 17.1 Unit tests

- Unit conversion and display rounding
- Volume and e1RM calculations
- PR selection/tie rules
- Week start/date boundaries and timezone behavior
- Template → plan → session snapshot behavior
- Set validation and exercise tracking modes
- Sync merge/conflict policies

### 17.2 Database and integration tests

- Fresh SQLite creation and every migration upgrade path
- Transaction rollback and outbox atomicity
- Offline create/edit/delete followed by reconnect
- Duplicate/idempotent sync calls
- Supabase RLS attempts across two users for every table/action
- Completed-session edit/delete and PR recomputation
- Account deletion/export completeness

### 17.3 Component and flow tests

- Today states: planned, active, complete, empty, offline, sync error
- Numeric keyboard progression through a set row
- Resume after app restart
- Add/reorder/substitute exercise
- Copy previous week and edit without changing the source
- Search empty/loading/no-results/archived cases
- Text scaling, dark theme, reduced motion, and screen-reader labels

### 17.4 End-to-end acceptance scenarios

1. New user signs up, sets pounds, plans a three-day week, completes day one, and sees it in History.
2. User starts a workout online, loses connectivity, logs all sets, force-closes, resumes, finishes, reconnects, and sees identical remote history.
3. User repeats last workout, changes one exercise, and confirms the prior workout remains unchanged.
4. User copies last week, moves one workout, and starts it from Today.
5. User achieves a PR, edits the source set, and sees deterministic PR recomputation.
6. A second account cannot read or mutate any first-account object through the API.

---

## 18. Delivery plan

### Phase 0 — Foundation

- Expo Router TypeScript project and design tokens
- Aeonik runtime font loading with licensed placeholder path/documentation
- Supabase local project, migrations, generated types, and RLS tests
- SQLite schema/migrations and repository interfaces
- Auth, onboarding, app shell, theme, and bottom navigation
- Expo Go compatibility check in CI/documentation

**Exit gate:** Authenticated user reaches the shell; local and remote profile data are isolated; token/font/theme foundations work on iOS and Android through the selected Expo Go SDK.

### Phase 1 — Logging vertical slice

- Exercise seed/search
- Empty and repeated workout creation
- Active workout, set rows, local persistence, timer, recovery
- Completion summary and basic history
- Outbox sync for exercises, sessions, and sets

**Exit gate:** Offline/relaunch acceptance scenario passes with no confirmed set loss.

### Phase 2 — Weekly planning

- Plan tab, week navigation, planned workout editor
- Workout templates, copy previous week, template-to-plan snapshot
- Today planned-workout start path
- Plan/session state linkage

**Exit gate:** A complete week can be copied, edited, started, and completed without mutating its source template/history.

### Phase 3 — Data and progress

- Progress Overview, History, PRs, Trends
- Exercise detail and charts
- Deterministic aggregates and recomputation
- Filters and date ranges

**Exit gate:** All displayed metrics trace to completed performed sets and survive edits/deletes correctly.

### Phase 4 — Complete library and data ownership

- Superset and week templates
- Archive/version behavior
- Export, account deletion, preferences
- Advanced optional logging fields

**Exit gate:** All four library entity types are reusable without historical coupling; export/delete tests pass.

### Phase 5 — Production hardening

- Move from Expo Go to an Expo development build
- EAS build profiles, app signing, environment separation
- Automated E2E on release candidates
- Accessibility, performance, security, privacy, and store-readiness reviews
- Monitoring, backups, incident/recovery procedures

**Exit gate:** Release candidate passes critical acceptance scenarios on representative physical iOS and Android devices.

---

## 19. MVP release definition

MVP is complete only when a user can:

- Create an account and configure units.
- Find/create exercises.
- Build or copy a weekly plan.
- Start today’s planned workout, repeat a workout, or start empty.
- Log weighted/reps/time/distance sets offline with reliable recovery.
- Finish a workout and see immutable historical values.
- View history, core PRs, and basic exercise/weekly trends.
- Reuse workout templates and archive library items safely.
- Synchronize across sessions/devices with visible failure recovery.
- Export data and request account deletion.

The release must also pass RLS isolation, offline recovery, migration, accessibility, and core performance checks.

---

## 20. Open decisions before implementation locks

These do not block initial scaffolding, but each must be resolved before its affected phase:

1. Final product name, icon, and brand wordmark.
2. Exact Aeonik files/weights and proof of mobile app distribution license.
3. Whether guest mode is worth the guest-to-account migration cost.
4. Exact seeded exercise catalog and its content license.
5. Whether bodyweight/assisted exercise load includes body mass in progress calculations.
6. Whether users can select alternative e1RM formulas after MVP.
7. Sync conflict UX for true multi-device simultaneous editing.
8. Dark mode launch requirement versus post-MVP polish; tokens should support it from Phase 0.
9. Analytics/crash provider and privacy consent requirements.
10. Product data retention period and completed-account-deletion behavior.

---

## 21. Implementation guardrails

- Do not build all screens before proving the offline logging vertical slice.
- Do not let UI components read/write Supabase directly.
- Do not model a completed workout as a reference to a mutable template.
- Do not use neumorphic shadow as the only affordance or state cue.
- Do not add a native dependency without documenting whether it works in Expo Go and the development-build migration.
- Do not materialize PRs or aggregates without a deterministic recomputation path.
- Do not ship a table through Supabase’s client API until its RLS policies have adversarial tests.
- Do not silently discard unsynced mutations during sign-out, conflict resolution, or migration.

---

## 22. Reference documentation

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo development environment and Expo Go boundary](https://docs.expo.dev/get-started/set-up-your-environment/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo Font](https://docs.expo.dev/versions/latest/sdk/font/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Supabase Expo React Native tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [Supabase Auth and Row Level Security](https://supabase.com/docs/guides/auth)
- [Supabase local development](https://supabase.com/docs/guides/local-development)

