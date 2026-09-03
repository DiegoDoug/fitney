# UX Product Design — Weight

## 1. Phase identity

- Lifecycle role: UX product design (`evidence-based-ui-ux`, phase 2 of 11)
- Execution date: 2026-09-01
- Roadmap state at execution: `IN PROGRESS` → `AWAITING APPROVAL`
- Upstream approval: `product-strategy` APPROVED 2026-09-01 (PASS WITH CONDITIONS, C-1…C-4 accepted as tracked)
- Mode: **Design** (primary), with **Simplify** and a **Research** plan for baseline validation
- Reported result: `PASS WITH CONDITIONS`

## 2. Sources inspected

| Source | Type | Use |
|---|---|---|
| `docs/product/product-strategy.md` | Approved upstream artifact | Requirements (FR-*/NFR-*), invariants, priorities, CON-11 nav intent to validate, success measures |
| `SPEC.md` §4 (IA/navigation), §4.1 (Log Action Sheet), §4.2 (route map), §5 (journeys), §7 (screen spec), §13 (accessibility/platform behavior) | Human-unratified draft | `VALIDATE` input for IA, flows, interaction behavior |
| `development-roadmap.md` | Lifecycle state | Constraints, open questions, dependencies, review log |
| `.claude/skills/evidence-based-ui-ux/SKILL.md` + `references/ux-foundations.md`, `references/design-judgment.md` | Method | Evidence model, scenario method, concept comparison, handoff contract |
| `.claude/skill-system/design-adapters.md`, `lifecycle.md`, `decision-ownership.md`, `artifact-standard.md` | Lifecycle contract | Gate, ownership boundary, artifact shape |
| Human message 2026-09-01 + 6 attached MyFitnessPal screenshots | Reference / direction | Structural inspiration (analogical); experience directive: "reduce friction for logging, planning and viewing data"; visual direction (monochromatic, neumorphic, Aeonik) — routed to `visual-ui-design` |
| Repository tree | Runtime evidence | Confirmed: no Weight UI, wireframes, prototype, or code exists |

### 2.1 Evidence status of the MyFitnessPal screenshots

The six screenshots are **Observed artifacts of a different product in a different domain** (food logging). They are used as **analogical** evidence for interaction *primitives* only (date strip, grouped list rows with per-row action, centre "+" sheet, search-first item picker with recents, inline quick-add, non-blocking confirmation toast, focused edit screen with explicit confirm). No claim about Weight's placement, reachability, contrast, latency, or gesture behaviour is drawn from them. Where MFP's structure conflicts with Weight's invariants (e.g. MFP edits an entry on a separate screen; Weight must edit a set inline in the active session), the MFP pattern is explicitly rejected in §7.

## 3. Execution mode classification

| Item | Classification | Basis |
|---|---|---|
| `docs/product/ux-product-design.md` | **CREATE** | No prior owned UX artifact exists |
| `SPEC.md` IA / navigation (§4) | **VALIDATE → ADOPT with one revision** | Five-position nav is sound; adopted with the Log entry defined as an action, not a destination (§6.2), and Library retained as a peer tab (rationale §6.3) |
| `SPEC.md` core journeys (§5) | **VALIDATE → ADOPT** | Journeys are coherent and match the requirements; formalised as scenarios with interruption/error/recovery paths in §8 |
| `SPEC.md` screen spec (§7) | **VALIDATE → REVISE** | Adopted as structural intent; friction-reduction and state-coverage revisions applied (§7, §10, §11); one open structural choice resolved by concept comparison (§9) |

**This is a description-based design.** No Weight interface exists. Every statement about control placement, thumb reach, latency, keyboard behaviour, gesture handling, or contrast is an **inferred risk or a verification target**, not an observed fact. Verification targets are collected in §12 and §14.

## 4. Accepted inputs and consequential assumptions

### 4.1 Accepted inputs (from approved artifacts / human instruction)

- The three product jobs, product invariants 1–10, and the P0–P3 priority tiers in `product-strategy.md`.
- Offline-first: connectivity never on the critical path for logging, completion, or recovery (FR-SYNC-01, NFR-OFFLINE).
- One active session per user (FR-LOG-12).
- Snapshot-not-reference: completed sessions never re-read mutable templates (FR-PLAN-09, FR-LIB-06, FR-DATA-03).
- Canonical kg/m/s; unit is presentation only (FR-SET-04).
- Weekly planning is the primary planning model (FR-PLAN-01).
- Human experience directive: minimise friction in logging, planning, and viewing data.
- Visual direction (monochromatic, softly neumorphic, Aeonik) is owned by `visual-ui-design` (CON-7, CON-8); this phase only constrains it via experience principles and anti-qualities (§13, §16).

### 4.2 Consequential assumptions (recorded, not blocking)

| ID | Assumption | If wrong |
|---|---|---|
| UX-A1 | The dominant logging context is standing, one-handed, phone in the working hand's opposite hand, 5–60 s windows between sets, ambient noise, frequent visual interruruption. | Reachability and glanceability priorities shift; re-weight §5 task table. |
| UX-A2 | Most sessions are run from a plan or a repeat, so the common set-entry action is *confirm a suggested value*, not *type from blank*. | The "one-tap confirm" optimisation in §7 loses value; typing ergonomics become primary. |
| UX-A3 | The user trains 3–6×/week and reviews Progress weekly or less. | Progress can favour a weekly digest over real-time detail; if daily, raise Progress in the nav priority. |
| UX-A4 | A single user per account; no device is shared. | Account-switching and per-device state need first-class UX. |
| UX-A5 | Task frequency/consequence rankings in §5 are estimates; no product analytics exist. | §5 priorities and the SM targets must be re-derived from the §14 usability study (condition C-1). |

## 5. Users and task model

### 5.1 User profile (from `product-strategy.md`; no primary research — Assumed)

One committed individual lifter, trains several times per week, wants a repeatable weekly structure and evidence of progress, does not want coaching/social/nutrition features. Comfortable with mainstream mobile app conventions (the MFP reference implies familiarity with diary/nav/search patterns). Range to expect: novice-to-app but experienced-in-training through experienced-in-both; accessibility needs include text scaling, screen readers, reduced motion, and readability in poor gym light.

### 5.2 Context of use (Inferred from `product-strategy.md` §4.3 + UX-A1)

| Dimension | Condition | Design consequence |
|---|---|---|
| Posture / input | Standing, one hand, thumb reach; sweat/chalk on hands; possible gloves | Primary actions in the bottom third; ≥48 dp targets; no precision drag on the hot path |
| Attention | Interrupted every set; context-switch to equipment, people, form | State must be re-readable in <2 s on return; no timed dismissals on critical info |
| Connectivity | Intermittent to none | "Saved" = on device; sync status ambient, never blocking |
| Session length | 20–90 min active session; planning ~weekly; review ~weekly | Active session is the design centre; planning/review tolerate more steps |
| Consequence of failure | Lost set / lost session erodes trust in the whole history | Persistence and recovery outrank speed when they conflict |

### 5.3 Task priority (estimated — Assumed, pending §14 study; condition C-1)

| Task | Importance | Frequency | Failure consequence | User difficulty | Tier |
|---|---|---|---|---|---|
| Record a working set during an active session | Critical | Very high (dozens/session) | High (lost record; trust) | Low once learned | P0 |
| Start today's planned workout from Today | Critical | High (per training day) | Medium | Low | P0 |
| Resume an active session after interruption / force-close | Critical | Medium | High (lost session) | Low | P0 |
| Finish & confirm a session | Critical | High | Medium | Low | P0 |
| Start an unplanned workout (repeat / template / empty) | High | Medium | Low | Low | P1 |
| Create / copy a week plan | High | Low (weekly) | Low (recoverable) | Medium | P1 |
| Edit a planned workout | Medium | Low–Medium | Low | Medium | P1 |
| Add / substitute / reorder an exercise mid-session | High | Medium | Medium | Medium | P1 |
| Review "am I progressing?" (Progress Overview) | Medium | Low–Medium | Low | Low | P1 |
| Inspect exercise history / PRs / trend detail | Medium | Low–Medium | Low | Low | P1 |
| Find/create an exercise | Medium | Medium | Low | Medium | P1 |
| Log a past workout | Medium | Low | Low | Medium | P2 |
| Build a superset / workout / week template | Medium | Low | Low | Medium | P2 |
| Export data / delete account | Low frequency | Very low | High (data/privacy) | Medium | P1 for correctness |

## 6. Experience intent

### 6.1 Experience Read

> For a committed lifter mid-workout in a noisy gym — one hand on the phone, connectivity dropping, interrupted between every set — the experience should feel **immediate, unambiguous, and trustworthy**: a set is recorded the instant they tap, the next action is always visible and reachable, and nothing is ever lost. So that they keep their attention on training and can rely on the history afterwards. It should **not** feel fragile, modal, chatty, or like data entry.

For planning: it should feel **fast to assemble from things that already exist** and safe (editing a plan never disturbs past workouts). For reviewing: it should feel **like a straight answer to "am I progressing?"**, not a data-mining exercise.

### 6.2 Experience principles (downstream visual design must preserve these as observable behaviour)

| ID | Principle | Observable condition |
|---|---|---|
| UX-P1 | **The next action is on screen and thumb-reachable.** | On Today, the active/next-workout action is visible without scrolling and sits in the lower half. In an active session, the set row being entered and its complete control are never covered by the keyboard or pushed off-screen. |
| UX-P2 | **Recording is one tap and is instantly, visibly persisted; confirmation never blocks the next input.** | Completing a set requires a single tap when suggested values are accepted. Visual feedback is same-frame. No dialog, no blocking toast on set completion. Persistence to the local store is not gated on the network. |
| UX-P3 | **The common case is confirm, not type.** | When a session is seeded from a plan/template/last performance, every set row is pre-filled with editable, clearly-labelled suggestions. The user edits only deltas. |
| UX-P4 | **State is stated plainly and non-intrusively.** | The user can always tell: what is saved, whether it is only on this device or synced, and what needs attention — shown ambiently (a small persistent indicator), never as a banner that interrupts logging. |
| UX-P5 | **History-changing and destructive actions name the object, preview the effect, and are recoverable.** | Cancelling a session, deleting a planned workout, applying a template update to a future plan, editing a completed session, and deleting an account each state exactly what is affected, show the consequence before commit, and offer undo or a recoverable copy where technically possible. |

### 6.3 Anti-qualities (explicit failure states the design must avoid)

- **Fragile** — any path where rotation, backgrounding, force-close, low memory, or a connectivity change can lose a confirmed set or the active session.
- **Modal / nested** — editing a set, or advancing through its fields, that opens a new screen or hides the active row (this is the MFP "Edit Entry" pattern; rejected for Weight's hot path).
- **Chatty** — confirmation dialogs, success toasts, or sync banners on the logging path; celebratory interruptions between sets.
- **Ambiguous state** — completion, PR, selection, focus, error, or "missed workout" conveyed only by colour or elevation (also NFR-A11Y, invariant 10).
- **Configuration-first** — forcing unit/goal/template decisions before the user can log anything.
- **Feed-like** — Today or Progress Overview becoming an unbounded scroll that buries the next action or the headline answer.

## 7. Information architecture

### 7.1 Navigation model — validated (UX-DEC-01)

**Decision:** Adopt a persistent five-position bottom navigation. Positions 1/2/4/5 are destinations; position 3 (Log) is a raised action that opens a sheet and is **not** a navigable destination or a back-stack entry.

| Pos | Label | Type | Owns |
|---|---|---|---|
| 1 | Today | Destination | The current day: day-state strip, active or planned workout, compact weekly status, last completed workout, entry to Settings (top-right avatar) |
| 2 | Plan | Destination | Week-first planning: week navigation, selected-day workouts, week actions, planned-workout editor |
| 3 | Log (+) | Action (sheet) | Context-aware session entry (start planned / resume / repeat / template / empty / log past) |
| 4 | Progress | Destination | Overview / History / PRs / Trends as peer views; exercise detail |
| 5 | Library | Destination | Exercises / Supersets / Workout templates / Week templates; search-first |

**Alternatives considered:**

- *4 tabs, Library merged under Plan and Progress.* Rejected: the "build & reuse library items" scenario (J6) is a distinct job in `product-strategy.md`; burying it behind planning raises friction for template creation/reuse and makes "insert from library" during editing less discoverable.
- *3 tabs + floating action button, Progress and Library behind a "More" menu (the MFP pattern — MFP puts Progress/More in the last two slots).* Rejected: it demotes "understand training", which is one of the three co-equal jobs. Weight has fewer top-level areas than MFP and can afford to show all three jobs plus reference.
- *Log as a sixth persistent destination.* Rejected: SPEC and reachability both favour a transient sheet; a logging *screen* would add a navigation hop and a back-stack surface to the most frequent entry point.

**Novelty budget:** spend **zero** on navigation. Bottom tabs + centre action + horizontal day strip + search-first pickers are conventions the target user already knows (the MFP reference confirms familiarity). Distinctiveness is spent on the set row and session-recovery behaviour instead (§7.4, §11).

### 7.2 Settings placement — validated (UX-DEC-02)

Settings, preferences, units, export, and account actions live behind an avatar/settings control in the top-right of Today. Not a primary tab. Rationale: infrequent (UX-A3), and a tab spent on Settings is a tab not spent on a job. Account-level warnings (e.g. sync "needs attention", export ready, deletion in progress) surface as a badge on the avatar, not as a Today feed item.

### 7.3 Content inventory per destination (structural intent; `visual-ui-design` owns treatment)

**Today** (attention order): date + day-state strip → *active session resume* **or** *today's planned workout start* **or** *no-plan quick starts* → compact weekly status (completed/planned sessions, completed working sets or volume) → most recent completed workout (one row, routes to History). No further feed.

**Plan** (attention order): week range + "Today" shortcut → seven-day strip with per-day markers (planned / completed / missed / today / selected) → selected-day workout list → week summary → week actions (Copy previous week, Use week template, Save as template, Clear future plans). Primary action: Add workout.

**Planned workout editor**: header (Cancel/back, name, Save) → ordered exercise/superset sections (collapsed by default: set count, rep range, load target, rest) → Add exercise/superset. Expand a section only to edit per-set differences.

**Progress**: segmented control (Overview / History / PRs / Trends) as peer views. Overview answers "am I progressing?" above the fold: consistency, recent workload trend, latest PRs, most-trained movements. History: reverse-chronological, grouped by week/month, filterable (date range, exercise, workout name, completion status). PRs: category filter + exercise search. Trends: metric + date-range selector → one primary chart → data list.

**Library**: search field → four collection rows (Exercises, Supersets, Workouts, Weeks) with counts and recent-item previews — list rows, not a decorative card grid. Collection screen: recent/frequent first → filter/sort sheet → full list. Context-aware: opened from an editor, selecting an item inserts it and returns; opened from the tab, selecting opens detail.

**Active workout**: see §7.4.

### 7.4 Active workout structure — resolved by concept comparison (see §9, UX-DEC-03)

Header (back/minimise, elapsed time, workout name, Finish) → sticky context (active exercise name, superset label, running rest timer) → scrollable ordered exercise sections, each with a "previous" reference column and editable set rows → footer Add exercise + session-notes/settings sheet.

### 7.5 Route map

Adopt `SPEC.md` §4.2 as the reference route map for `client-engineering` and `software-architecture`. **User-visible destinations and back behaviour are authoritative; Expo Router group/file names are not.** Back-behaviour requirements are specified in §10.6.

### 7.6 Naming decisions (UX-DEC-04)

| Element | Chosen label | Rejected | Why |
|---|---|---|---|
| Centre action | Icon + accessible label "Start or log a workout" | bare "+" with no label | Icon-only primary actions fail discoverability and screen-reader clarity (NFR-A11Y) |
| Tab 4 | "Progress" | "Stats", "Insights" | Matches the job "understand training"; "Stats" undersells trends/history |
| Tab 5 | "Library" | "Templates" | Library also holds exercises and supersets, not only templates |
| Tab 2 | "Plan" | "Calendar", "Schedule" | Planning is active assembly, not date-viewing |
| Session end | "Finish" then a summary then "Confirm" | "Save", "Done" | "Finish" signals a state transition (active → completed) that triggers the stats pipeline |
| Device-saved state | "Saved on device" | "Saved", "Synced" | Distinguishes local durability from server acknowledgement (FR-SYNC-02, UX-P4) |

## 8. Primary journeys (scenario format)

Each journey: **actor · goal · trigger · context · normal path · likely interruption · error/recovery · completion**. Friction notes tie to the human directive. Basis of each path step is Adopted from `SPEC.md` §5 unless marked.

### 8.1 UX-J1 — Start and complete today's planned workout (P0)

- **Actor/goal:** Lifter wants to train today's planned session and have it recorded.
- **Trigger:** Arrives at the gym, opens the app.
- **Context:** Standing, one hand, connectivity variable.
- **Normal path:** Today opens on the current day → planned-workout card is the visually dominant action → **one tap "Start workout"** → app snapshots the planned workout + prescriptions into a new active session (FR-PLAN-09) → active screen focuses the first incomplete set, pre-filled with prescribed values as suggestions (UX-P3) → user confirms or edits load/reps, optionally RPE/RIR/note, taps the row complete control (one tap when accepting suggestions, UX-P2) → set persists to local store same-frame; rest timer auto-starts if enabled → user proceeds set by set; may add/skip/substitute/reorder without leaving the session (FR-LOG-06) → taps **Finish** → one compact summary (duration, exercises, working sets, volume, PRs, notes) → **Confirm** → session finalises, stats/PR pipeline runs, sync attempts when online.
- **Likely interruption:** Someone takes the rack; user backgrounds or force-closes the app mid-session.
- **Error/recovery:** On relaunch, the app restores the active session and timer anchors (FR-SYNC-01, §10.5); no confirmed set is lost (SM-5). If the user taps Start when a session is already active, they are offered Resume / Finish / Discard — never a silent second session (FR-LOG-12).
- **Completion:** Session appears in History with the values performed (FR-DATA-03); Today's planned card shows "completed".
- **Friction reducers:** one-tap start; confirm-not-type set rows; no confirmation on set complete; single-screen finish. **Friction risks (verify §14):** keyboard covering the active row; "Start" ambiguity when a stale draft exists; summary screen length.

### 8.2 UX-J2 — Start an unplanned workout (P1)

- **Actor/goal:** Lifter wants to train now without a plan (improvised, repeat of last, or from a template).
- **Trigger:** Taps the centre Log action.
- **Normal path:** Log sheet opens with context-ordered actions (§10.2). User picks **Repeat last workout**, **Choose a workout template**, or **Start empty workout** → local draft/active session created immediately → for empty, exercise search opens at once (FR-LOG-01) → selecting an exercise pre-fills suggested values from the most recent completed performance, labelled as suggestions (FR-LOG-04, UX-P3) → logging proceeds as in J1.
- **Interruption / recovery:** Same as J1.
- **Completion:** Same as J1; History records source (repeat/template/empty).
- **Friction reducers:** search opens without an extra tap; last-performance suggestions; the sheet hides impossible actions rather than disabling them (FR §4.1).

### 8.3 UX-J3 — Log a past workout (P2)

- **Actor/goal:** Lifter trained earlier (or elsewhere) and wants it in the record.
- **Trigger:** Log sheet → **Log a past workout**; secondary entry from Progress → History → "Add past workout".
- **Context:** Not time-pressured; no rest timers, no active-session urgency.
- **Normal path:** Pick date/time → optionally seed from a template or a previous workout → record exercises and sets → Save → creates a **completed** session and runs the same stats pipeline as a live session (FR-DATA-10).
- **Error/recovery:** Date in the future is rejected with an inline explanation; a past date that collides with an existing session is allowed (multiple sessions per day permitted) but flagged for the user to confirm.
- **Completion:** Appears in History in date order; PRs/aggregates recomputed deterministically.
- **Friction reducers:** no timer chrome; template/previous-workout seeding; same set-row interaction as live logging (one mental model).

### 8.4 UX-J4 — Plan a week (P1)

- **Actor/goal:** Lifter wants next week's training laid out.
- **Trigger:** Opens Plan; or Today's weekly status → "Plan next week".
- **Normal path:** Plan opens on the current week → empty week shows **Copy previous week / Use week template / Add workout** as the first actions → user copies the previous week (one action; **the source week/template is never mutated** — stated in the UI, FR-PLAN-09) → adjusts: reorder exercises, group supersets, set prescriptions, targets, notes → moves or duplicates a workout to another day via explicit day actions (drag is enhancement-only, FR-PLAN-07) → every change saves locally immediately and syncs in the background.
- **Interruption/recovery:** Partial edits persist; no "unsaved changes" trap. Leaving the editor keeps the plan in its last-saved state.
- **Error/recovery:** Applying a template update to an already-planned future week requires a **preview + explicit confirm** showing what changes (FR-PLAN-10, UX-P5). Deleting a planned workout that has been started is blocked or converted to "detach from plan" (history preserved, FR-LIB-08).
- **Completion:** Week shows per-day markers; the planned workout is startable from Today on its date.
- **Friction reducers:** three concrete first actions on the empty state; copy-then-edit; collapsed exercise cards; explicit non-mutation messaging. **Verify §14:** whether "≤3 primary actions / <2 min" (SM-6) holds for copy+adjust.

### 8.5 UX-J5 — Review progress (P1)

- **Actor/goal:** Lifter wants to know whether training is progressing.
- **Trigger:** Opens Progress.
- **Normal path:** Overview answers the question above the fold: consistency (sessions completed vs planned), recent workload trend (weekly volume/sets), latest PRs, most-trained movements → user optionally switches to History, PRs, or Trends (peer segmented control, not nested) → selecting an exercise opens its detail (recent sessions, max load, estimated 1RM, best set by reps, total volume, frequency) with an evolution chart → selecting a history item opens the **immutable** completed-session snapshot with an explicit **Edit** action.
- **Error/recovery:** Insufficient data → each stat tile and chart shows an explicit "not enough data yet" state with what is needed, never a misleading zero or empty axis (§10). Editing a completed session triggers visible, deterministic PR/aggregate recomputation (FR-DATA-10); the user is shown that recomputation happened.
- **Completion:** User leaves with a clear read; no drill-down was required for the headline.
- **Friction reducers:** headline-first Overview; peer views; charts expose exact values on tap and always have a table/text alternative (FR-DATA-09, NFR-A11Y).

### 8.6 UX-J6 — Build and reuse library items (P2)

- **Actor/goal:** Lifter wants a reusable exercise, superset, workout, or week.
- **Trigger:** Opens Library; or "Save as template" from a session/plan; or "Insert from library" from an editor.
- **Normal path:** Library → choose collection → search/recents first → create / duplicate / edit / archive / insert → editing a template affects **future uses only**; existing planned snapshots and completed sessions are unchanged unless the user explicitly applies the update with a preview (FR-LIB-06, FR-PLAN-10).
- **Error/recovery:** Deleting an item referenced by history is blocked; the user is offered **Archive** instead (leaves default search, stays in historical records — FR-LIB-07/08, UX-P5).
- **Completion:** Item is reusable from planning and logging without coupling history to it.
- **Friction reducers:** search + recents before browse; duplicate-then-edit; context-aware "insert and return" vs "open detail".

## 9. Concept comparisons (where structure was genuinely open)

Per method: at least two coherent concepts, compared on scenario fit / attention / learning / consequence / adaptability / experience intent / product specificity; ranked, decisive tradeoff named, reversal condition stated.

### 9.1 Active-workout layout (resolved → UX-DEC-03)

| | **Concept A — single-exercise focus** (one exercise on screen, swipe/next to advance) | **Concept B — full scrollable session with sticky active context** (chosen) |
|---|---|---|
| Scenario fit | Strong for pure set-by-set entry; weak for add/skip/substitute/reorder mid-session (J1 step) and superset awareness | Strong across all of J1: entry, jumping between exercises, supersets, reordering, adding |
| Attention | Very focused, but hides upcoming/!done work; easy to lose place after interruption | Active row is emphasised via sticky context; surrounding structure stays visible for re-orientation in <2 s (UX-A1) |
| Learning | New advance gesture to learn | Standard vertical list; no new model |
| Consequence | Reordering/substitution needs a mode switch — more chances to mis-tap under fatigue | Structural edits are in place |
| Adaptability | Struggles with supersets/circuits and long sessions | Handles supersets, long sessions, and text-scaling reflow (stack label-over-input) |
| Experience intent | "Focused" but risks "fragile / lose my place" | "Immediate + unambiguous"; re-readable after interruption |
| Product specificity | Gesture novelty is not a real advantage here | Distinctiveness spent on the **set row** and **sticky active context**, which is where it pays off |

**Decision: Concept B.** Decisive tradeoff: Weight requires frictionless *in-session structural edits* and *fast re-orientation after interruption*; A optimises uninterrupted linear entry, which is not the real context (UX-A1). **Reversal condition:** if §14 shows users never reorder/substitute mid-session and consistently lose their place in the long list, revisit a hybrid (collapse completed exercises by default).

### 9.2 Plan tab layout (resolved → UX-DEC-05)

- **Concept A — week strip + selected-day detail** (chosen): horizontal seven-day strip with markers; tapping a day shows that day's workouts; week summary and actions below.
- **Concept B — full seven-day agenda** (all days stacked and scrollable on one screen).

**Decision: Concept A.** A keeps the primary action ("Add workout" for the selected day) reachable and the screen shallow; it matches the Today day-strip model, so the two tabs share one mental model (learning economy). B shows more at once but pushes actions below the fold and makes one-handed reach worse on tall content. **Reversal condition:** if users report they plan "the whole week at once" and find per-day tapping tedious in §14, add an expand-all agenda view as a secondary mode.

### 9.3 "Log a past workout" entry point (resolved → UX-DEC-06)

- **Concept A — only in the Log sheet** (SPEC default).
- **Concept B — Log sheet + a secondary "Add past workout" in Progress → History** (chosen).

**Decision: Concept B.** The mental trigger for logging a past workout is often "I'm looking at my history and something's missing." A single entry point in the Log sheet is correct as the primary, but a secondary affordance where the need arises removes a navigation hop. Low added complexity (one list-header action). **Reversal condition:** if History becomes cluttered or the secondary entry is never used, drop it.

### 9.4 Set completion confirmation (resolved → UX-DEC-07)

- **Concept A — explicit "save" per set.**
- **Concept B — tap-to-complete with inline undo, no confirmation** (chosen).

**Decision: Concept B**, consistent with UX-P2 and the "not chatty" anti-quality. Every confirmed set is persisted immediately and remains editable (FR-LOG-08); the row offers undo. A adds a tap per set (dozens per session) for a reversible action. **Reversal condition:** if §14 shows frequent accidental completions that undo does not adequately catch, add a short in-place "hold to confirm" only for `failure`/`drop` set types.

## 10. Required states (coverage matrix)

For each key surface: **empty · loading · success/populated · partial · validation · error · offline/unavailable · destructive-confirm**. "n/a" = state cannot occur here. This is the checklist `visual-ui-design` and `client-engineering` must satisfy.

| Surface | Empty | Loading | Partial | Validation | Error | Offline | Destructive-confirm |
|---|---|---|---|---|---|---|---|
| **Today** | "Nothing planned for today" + Repeat last / Choose workout / Start empty (FR-TODAY-04) | Skeleton for cards; day strip immediate from local data | Planned workout exists but week status still computing → show card, defer status | n/a | Local read failure → retry affordance, never a blank screen | Full content retained; small "Saved on device" indicator, no banner (FR-TODAY offline state) | n/a |
| **Log Action Sheet** | Never fully empty; minimum = Start empty + Log past | Instant (local context only) | Some actions hidden because impossible (no plan → no "Start today's") | n/a | n/a | All actions available offline | n/a |
| **Active workout** | New session: first set focused with suggestions; empty session: search open | Session restore in progress → brief spinner then focus | Some sets done, some not → next incomplete set is the focus | Inline: negative load/reps rejected; zero load allowed for bodyweight (FR §9.3) | Persist failure → retain input, visible "not saved — retrying", block Finish until resolved (UX-P4) | No effect on logging; sync indicator = Offline | Cancel session: names the session, states sets will be discarded, requires confirm; completed sets recoverable (FR-LOG-10) |
| **Finish summary** | n/a | Aggregating (brief) | n/a | If a set has open validation, surface it here before Confirm | Finalise failure → session stays active, error explained, safe to retry (idempotent Finish) | Finalises locally; syncs later | Confirm is the commit; no separate destructive path |
| **Plan (week)** | Empty week → Copy previous week / Use week template / Add workout | Week loads from local store | Some days planned, some empty → per-day markers | n/a | Load failure → retry | Full edit offline; background sync | Clear future plans: names the range, previews count, confirm; Delete started planned workout → offer "detach from plan" instead (FR-LIB-08) |
| **Planned workout editor** | New workout → Add exercise/superset prompt | n/a (local) | Exercises added, prescriptions incomplete → allowed; targets optional | Rep-range min>max, negative targets rejected inline | Save failure → keep edits, retry | Saves locally | Remove exercise with logged history elsewhere → n/a (planned only); removing from plan is non-destructive to history |
| **Progress Overview** | "Not enough data yet" per tile + what's needed (e.g. "complete 2 sessions to see consistency") | Tiles load independently; no all-or-nothing spinner | Some tiles ready, some not → show ready ones | n/a | Per-tile error, isolated (NFR-RELIABILITY) | Computes from local data; may note "as of last sync" for any server-derived value | n/a |
| **History list** | "No workouts yet" + link to start one | Virtualised list; page-in on scroll | Filters applied, few results → "no workouts match" distinct from "no workouts" | Invalid date range corrected inline | Load failure → retry, keep filters | Local history always available | n/a |
| **History detail (completed session)** | n/a | Loads snapshot | n/a | n/a | Missing snapshot → explain, offer to reopen list | Available offline | Edit → warns that PRs/aggregates recompute; Delete → names session, warns recompute, recoverable via soft-delete (FR-DATA-10, LOG-10) |
| **Exercise detail** | "No completed sets for this exercise yet" | Chart + list load | Some metrics available (e.g. max load) others not (e1RM needs 2–10 rep set) → show available, explain gaps (FR-DATA-06) | n/a | Per-section error isolated | Local | n/a |
| **Exercise search** | Recents/frequent + "create new" | Debounced; local index (SM-7) | Typing → interim results | Empty query → recents, not an error | Search index error → fallback to full list, note degraded | Local-only results, labelled (`SearchField` offline-local state) | n/a |
| **Settings / data** | n/a | n/a | n/a | Unit/increment inputs validated | Export/delete failure → explicit, retryable | Export runs on local data; server-side deletion queued with status | Account deletion: re-auth + explicit confirm + receipt (FR-SET-03, UX-P5) |

### 10.6 Back-behaviour and recovery requirements (UX-DEC-08)

- **Android system back** and **iOS swipe-back** are honoured on every screen; on the active workout, back **minimises** the session (does not discard it) and returns to the prior tab with a persistent **Resume pill** above the navigation (SPEC §7.2).
- Minimising, backgrounding, or force-closing during an active session must restore: current session, per-set values, which set was focused, and timer anchors as timestamps (not decrementing counters) (FR-SYNC-01, §11.3 of SPEC).
- The Log sheet is dismissed by back/scrim/drag with no side effect.
- Leaving an editor (planned workout, template) keeps the last-saved state; there is no unsaved-changes modal on the planning path (edits autosave locally).
- "Finish" is idempotent: repeating it after a failure does not double-finalise.

## 11. Friction-reduction decisions (against the human directive)

### 11.1 Logging (UX-INT-01 … 08)

| ID | Decision | Removes |
|---|---|---|
| UX-INT-01 | Session is seeded with all planned exercises and sets, values pre-filled as editable suggestions; the user confirms rather than creates. | Re-entering the plan by hand |
| UX-INT-02 | One-tap set completion when suggestions are accepted; edit only deltas; inline undo; no confirmation dialog. | A tap + a dialog per set |
| UX-INT-03 | Numeric keypad never covers the active row; a "Next" affordance advances load → reps → optional metric → complete; "Done" collapses the keypad. | Scrolling to find the row; losing place |
| UX-INT-04 | "Previous" reference value is always visible on each set row. | Navigating to history to recall last time |
| UX-INT-05 | "Add exercise" opens search immediately, ordered recents / plan-adjacent / frequent first. | An extra tap to reach search; scrolling a long catalog |
| UX-INT-06 | Rest timer auto-starts on set completion (if enabled); +15 s / skip / pause are reachable without scrolling. | Manual timer start; hunting for timer controls |
| UX-INT-07 | Finish is a single summary screen with one Confirm. | Multi-step wizard at the tired end of a session |
| UX-INT-08 | Suggested values are visually marked as suggestions (not yet recorded) and become "recorded" on completion — a state change that is **not** colour-only. | Ambiguity about what is logged vs prescribed |

### 11.2 Planning (UX-INT-09 … 12)

| ID | Decision | Removes |
|---|---|---|
| UX-INT-09 | Empty week's first three actions are Copy previous week / Use week template / Add workout. | Deciding how to start from a blank screen |
| UX-INT-10 | Copy-then-edit; the source is never mutated and the UI says so. | Fear of breaking a template; defensive duplication |
| UX-INT-11 | Create a planned workout directly from a prior completed session. | Rebuilding a session that already happened |
| UX-INT-12 | Exercise cards collapsed by default (set count · rep range · target · rest); expand only for per-set differences. | Scrolling past fully-expanded prescriptions |

### 11.3 Viewing data (UX-INT-13 … 16)

| ID | Decision | Removes |
|---|---|---|
| UX-INT-13 | Progress Overview answers "am I progressing?" above the fold; no drill-down for the headline. | Building the answer from sub-screens |
| UX-INT-14 | Overview / History / PRs / Trends are peer views on one segmented control, not a menu. | Menu diving |
| UX-INT-15 | Exercise detail is reachable from a set row in history and from Library, not only from a Progress sub-tab. | Backtracking to a specific entry point |
| UX-INT-16 | Every chart: tap a point for the exact value; a table/text representation is always available. | Guessing values off an axis; excludes screen-reader users |

## 12. Accessibility and platform behaviour (UX-level; compliance deferred)

This phase does **not** assert WCAG or platform compliance (SKILL constraint; NFR-A11Y is owned jointly with `visual-ui-design`, `client-engineering`, `quality-engineering`). It specifies **UX-level requirements and verification targets**:

| ID | Requirement | Verification target |
|---|---|---|
| UX-AX-01 | Completion, PR, selection, focus, error, and "missed workout" each have a non-colour, non-elevation indicator (icon + text/shape). | Visual design review + screen-reader pass |
| UX-AX-02 | Set rows reflow (stack label above input) at large OS text sizes instead of clipping or truncating values. | Device test at max Dynamic Type / largest font scale |
| UX-AX-03 | Screen-reader traversal order on the active workout: elapsed/Finish → active exercise → current set row (previous, target, inputs, complete) → next set → add exercise. | VoiceOver + TalkBack walkthrough |
| UX-AX-04 | Keyboard never occludes the active numeric field; an explicit dismiss path exists. | Device test, both platforms |
| UX-AX-05 | Android back and edge-to-edge insets behave per §10.6; iOS safe areas and sheet/back gestures preserved. | Device test, both platforms |
| UX-AX-06 | Reduce Motion removes spring/scale transitions; state changes remain legible without animation. | Setting toggled on device |
| UX-AX-07 | All destructive actions name the affected object and offer undo/recovery where technically possible (UX-P5). | Flow review against §10 |
| UX-AX-08 | Charts have an accessibility summary and a list/table of plotted points (FR-DATA-09). | Screen-reader pass |
| UX-AX-09 | Core touch targets ≥ 48×48 dp; icon-only actions have accessible labels and 48 dp hit areas. | Automated layout check + audit |
| UX-AX-10 | Dates, decimal separators, first day of week, units localise; layouts tolerate longer labels and RTL (NFR-INTL). | Pseudo-localisation pass |

## 13. Constraint on visual design (experience-level, not styling)

`visual-ui-design` owns the monochromatic palette, neumorphic surface treatment, Aeonik typography, spacing, radii, and elevation. This phase constrains that work only as follows:

- Neumorphic elevation and monochrome hue may **not** be the sole carrier of any of: interactivity, selection, completion, focus, error, disabled, "missed" (invariant 10, UX-AX-01).
- The set row and dense training lists must remain **tabular and aligned** (aligned numerals) and must survive text scaling by reflowing, not clipping (UX-AX-02).
- Training data uses **list/table rhythm**, not decorative card grids (also `product-strategy.md` and SPEC §8.1).
- Motion on the logging path is minimal and interruptible; no celebratory animation between sets ("not chatty").
- The "saved on device" / "syncing" / "offline" / "needs attention" indicator is **ambient and non-blocking** — it must never occupy a modal or a full-width banner over the logging area (UX-P4).

## 14. Validation intent (Research plan to set the SM baselines — condition C-1)

**Purpose:** establish measured baselines for SM-1…SM-7 and verify the P0 journeys before they are treated as acceptance criteria. Owned jointly with `quality-engineering` for release gating.

**Research questions:**

1. Can a first-time user start today's planned workout in **one** primary tap from Today (SM-1)?
2. After field focus, can a familiar user record/update a set in **≤5 s** (SM-3), and does one-tap-complete cause accidental completions?
3. After a force-close mid-session, is any **confirmed set lost**, and does the user trust the recovered state (SM-5)?
4. Can a user copy last week and adjust it in **≤3 primary actions / <2 min** (SM-6)?
5. Can a user find an existing exercise fast enough to feel instant (SM-7)?
6. Does anyone mistake "saved on device" for "synced" in a way that causes worry or risky behaviour (UX-P4)?
7. Is the Progress Overview read as a direct answer to "am I progressing?" without drill-down (UX-INT-13)?

**Tasks (8, mapped to journeys):** J1 start+log 3 sets+finish; J1 with a scripted interruption (tester force-closes) then resume; J2 repeat last + substitute one exercise (verifies prior session unchanged, E2E scenario 3); J4 copy previous week + move one workout + start it from Today; J5 "tell me if you're progressing on squat"; J6 create a workout template from a completed session; add a past workout from History; change units and confirm historical values are unchanged.

**Participants:** people who resistance-train ≥3×/week; mix of app-savvy and not. **Do not** apply a fixed "5 users" rule — run formative rounds of ~5–8, iterate, and **stop when a round on the P0 journeys surfaces no new severe issue**. At least one session must be **moderated on a real device in a gym-like setting** (standing, noise, one hand, network toggled off).

**Measures (reported separately):** behavioural — task completion, error count, time-on-task after field focus, taps-to-start; perceived — SEQ per task and a short post-test (e.g. UMUX-Lite). Recovery task scored as a binary "confirmed set lost? Y/N" plus a verbal trust probe. **Do not** average behavioural and perceived results; report divergence.

**Decision rules:** any P0 journey below 100% completion, **or any confirmed-set loss**, or a systematic device-vs-synced misunderstanding that leads to data-risk behaviour, **blocks release** regardless of satisfaction scores. SM targets are revised to the measured values with rationale if the study shows them unrealistic.

## 15. Traceability

### 15.1 Product need → UX decision / journey

| Upstream (`product-strategy.md`) | UX response |
|---|---|
| Job 1 "log quickly & reliably"; FR-LOG-01…14; NFR-OFFLINE | UX-J1, UX-J2, UX-J3; UX-DEC-03/07; UX-INT-01…08; §10 active-workout + finish states; §10.6 recovery |
| Job 2 "plan by week"; FR-PLAN-01…10; FR-LIB-* | UX-J4, UX-J6; UX-DEC-05; UX-INT-09…12; §10 Plan/editor states |
| Job 3 "understand training"; FR-DATA-01…10 | UX-J5; UX-DEC-06; UX-INT-13…16; §10 Progress/History/Exercise states |
| Invariant 1 "next action obvious" | UX-P1; §7.3 attention orders; Today content inventory |
| Invariant 2 "record without leaving the session" | UX-DEC-03 (Concept B); rejection of the MFP modal-edit pattern (§2.1, §6.3) |
| Invariant 3 "network never blocks" | UX-P2, UX-P4; §10 offline column; UX-INT-06/08 |
| Invariant 5 "edits never rewrite history" | UX-J4/J6; UX-P5; §10 destructive-confirm column; UX-INT-10 |
| Invariant 10 "neumorphism = hierarchy only" | §13; UX-AX-01; UX-INT-08 |
| CON-11 (nav intent, to validate) | UX-DEC-01 (validated + one revision), UX-DEC-02, UX-DEC-04 |
| Success measures SM-1…SM-7 | §14 research plan; per-journey friction-risk notes |
| NFR-A11Y / NFR-INTL | §12 (UX-AX-01…10) |
| Human directive "reduce friction" | §11 (all UX-INT), §6, §9 |

### 15.2 UX output → downstream consumer

| Consumer | Consumes |
|---|---|
| `visual-ui-design` | §6 Experience Read + principles + anti-qualities; §7.3 attention orders + content inventory; §10 state matrix; §13 experience constraints; §16 handoff package |
| `software-architecture` | §7.5 route map + user-visible destinations; §10.6 recovery/back requirements; UX-DEC-03/07 (session model implications); offline/idempotency expectations |
| `client-engineering` | §7 IA; §8 journeys; §9 chosen concepts; §10 full state matrix; §10.6 back/recovery; §11 interaction behaviours; §12 verification targets |
| `backend-data-engineering` | Non-mutation guarantees surfaced in UX-J4/J6; recompute-visibility expectation (UX-J5); "log past workout runs the same pipeline" (UX-J3) |
| `security-identity` | Account-deletion flow expectations (§10 Settings row, UX-P5); "saved on device vs synced" disclosure (UX-P4) |
| `quality-engineering` | §14 research plan + decision rules; §10 states as test charter; §12 verification targets; per-journey acceptance |
| `production-operations` | UX signal that sync "needs attention" must be user-visible without alarm (UX-P4) — informs alerting tone |

## 16. Handoff package to `visual-ui-design`

1. **Experience Read** — §6.1.
2. **Experience principles (5)** — UX-P1…UX-P5, stated as observable behaviour.
3. **Anti-qualities (6)** — §6.3.
4. **Intended attention order** per key screen — §7.3 (Today, Plan, planned-workout editor, Progress, Library) and §7.4 (active workout).
5. **Density / retention constraints** — tabular aligned set rows; list/table rhythm over card grids; Today ≤ ~4 stacked blocks, no feed; collapsed-by-default exercise cards; §13.
6. **Moments and their intended feel** — *quiet:* the ambient save/sync indicator; *decisive:* one-tap set complete, one-tap Start; *reassuring:* session resume after force-close, "source not changed" messaging on copy; *efficient:* keypad field progression; *a small moment of closure:* the finish summary. No expressive/celebratory moment on the logging path.
7. **Required content and states** — the §10 matrix (all eight state types per surface) and §12 accessibility requirements.
8. **Conventions to keep familiar** — bottom tab bar, centre action sheet, horizontal day strip, search-with-recents, segmented peer views, platform back/swipe.
9. **Product-specific opportunities for visual distinction** — the **set row** (suggestion → recorded state change; previous/target/actual alignment), the **sticky active-exercise context**, the **Resume pill**, and the **"Saved on device" indicator**. Spend the monochrome/neumorphic system's distinctiveness here, not on navigation.
10. **Do not change** the approved IA (§7), journeys (§8), chosen concepts (§9), or interaction behaviours (§11) without returning the conflict to this phase (`evidence-based-ui-ux`).

## 17. Open questions

| ID | Question | Owner | Blocking? | Routed / depends on |
|---|---|---|---|---|
| UX-OQ-1 | Measured baselines for SM-1…SM-7 (tap counts, times) and whether the targets are realistic. | `evidence-based-ui-ux` + `quality-engineering` | No (does not block visual design); blocks treating SM-* as release gates | §14 study; condition C-1; WORK-002 |
| UX-OQ-2 | Should completed exercises in a long active session collapse by default? (Concept B reversal condition, §9.1) | `evidence-based-ui-ux` | No | §14 task 1–2 |
| UX-OQ-3 | Does "copy + adjust a week" meet SM-6 (≤3 actions / <2 min) with the §11.2 design, or is an "expand-all agenda" mode needed? | `evidence-based-ui-ux` | No | §14 task 4; UX-DEC-05 reversal |
| UX-OQ-4 | Onboarding depth: is the SPEC §6.1 minimal set (name, unit, week start, rest timer, optional goal) low-friction enough, or should unit be the only blocking question with the rest deferred to first use? | `evidence-based-ui-ux` + Product | No | Interacts with OQ-3 (guest mode); revisit after §14 |
| UX-OQ-5 | Dark mode: is a full dark experience needed at launch, or is the token-level readiness sufficient? (UX view: gym lighting varies; dark is likely valued — recommend launch, but this is Product's call.) | Product + `visual-ui-design` | No | Roadmap OQ-8 |
| UX-OQ-6 | Multi-device active-session conflict: the UX shows a "conflict choice" (FR-SYNC-05) — the exact copy and options need design once the sync model is decided. | `evidence-based-ui-ux` + `software-architecture` | No | Roadmap OQ-7 |

Routed visual questions (not owned here): exact neumorphic treatment of the suggestion→recorded set-row state change; whether `color.danger` is the only permitted non-monochrome hue; chart series differentiation without hue — all to `visual-ui-design`.

## 18. Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| UX-RISK-1 | The whole UX is validated only by description + an analogical reference; a real device in a real gym may invalidate reachability/keyboard/interruption assumptions (UX-A1). | High | Medium | §14 study includes a moderated on-device gym-context session before release gating. | `evidence-based-ui-ux`, `quality-engineering` |
| UX-RISK-2 | One-tap set completion without a confirmation dialog (UX-DEC-07) produces accidental completions that undo doesn't fully catch. | Medium | Medium | §14 measures accidental completions; reversal condition defined (hold-to-confirm for `failure`/`drop`). | `evidence-based-ui-ux` |
| UX-RISK-3 | Monochrome + neumorphic direction makes state (completion/PR/selection/error) hard to distinguish, degrading the logging read. | Medium | High | §13 + UX-AX-01 mandate redundant non-colour/non-elevation cues; visual QA gate. | `visual-ui-design`, `quality-engineering` |
| UX-RISK-4 | "Saved on device" vs "synced" is misunderstood; users think data is backed up when it isn't, or worry unnecessarily. | Medium | Medium | §14 question 6; UX-P4 ambient-but-explicit indicator; copy testing. | `evidence-based-ui-ux` |
| UX-RISK-5 | Progress Overview tries to answer "am I progressing?" but the headline metrics are ambiguous or misleading with sparse data. | Medium | Medium | §10 "not enough data yet" states with explicit requirements; FR-DATA-06 gaps explained, not hidden. | `evidence-based-ui-ux`, `backend-data-engineering` |
| UX-RISK-6 | Description-based state matrix (§10) misses a real state that only emerges in implementation (e.g. partial sync of a session). | Medium | Medium | `client-engineering` and `quality-engineering` treat §10 as a checklist to extend, not a closed set. | `client-engineering`, `quality-engineering` |

## 19. Verification performed

| Check | Method | Result |
|---|---|---|
| Repository / artifact state | Listed tree; searched for UX artifacts, wireframes, prototype, UI code | None exist — confirmed description-based; classified CREATE |
| Upstream gate | Read roadmap lifecycle state + review log | Phase 1 APPROVED; phase 2 IN PROGRESS — entry permitted |
| Requirement coverage | Walked every FR group and invariant in `product-strategy.md` into a journey, interaction decision, or state (§15.1) | All P0/P1 covered; P2 (past workout, library build) covered by UX-J3/J6 |
| Reference use discipline | Classified the MFP screenshots as analogical; recorded one explicit rejection (modal set edit) | §2.1, §6.3, §9.1 |
| Concept openness | Identified four genuinely open structural choices; compared ≥2 coherent concepts each; named decisive tradeoff + reversal condition | §9.1–9.4 |
| State completeness | Applied the 8-state checklist to 12 surfaces | §10; gaps are deliberate "n/a", flagged for extension (UX-RISK-6) |
| Ownership boundary | Confirmed no colour/type/spacing/shadow token decided here; visual questions routed | §13, §16, §17 |
| Description-based honesty | Marked all placement/reach/latency/keyboard/contrast statements as inferred risks or verification targets | §3, §12, §18 |
| Evidence discipline | No study cited as direct validation; task priorities and SM realism marked Assumed pending §14 | §4.2, §5.3, §14, condition C-1 |

No code, tests, or migrations were changed by this phase.

## 20. Status

**`PASS WITH CONDITIONS`.**

A validated information architecture, six formalised primary journeys with interruption/error/recovery paths, four resolved structural concept comparisons, sixteen friction-reduction interaction decisions tied to the human directive, a twelve-surface state matrix, UX-level accessibility requirements, and a complete experience-intent handoff to `visual-ui-design` are delivered and traced to approved requirements.

Conditions for the reviewer to accept or defer:

- **UX-C1:** The entire artifact is **description-based**, validated only against requirements and an analogical reference (MyFitnessPal). Reachability, keyboard behaviour, interruption handling, and glanceability are **inferred**, not observed. Accepted on the basis that the §14 study (including one moderated on-device gym-context session) runs before SM-1…SM-7 are treated as release gates. Inherits condition C-1 from phase 1.
- **UX-C2:** Task frequency/consequence rankings (§5.3) and the realism of the success targets are **assumptions** (no product analytics). To be reconciled with the §14 results; §9 reversal conditions and §17 open questions may reopen specific decisions.
- **UX-C3:** UX-DEC-07 (no per-set confirmation) carries UX-RISK-2; the mitigation is a defined reversal path pending §14 evidence.
- **UX-C4:** Open questions UX-OQ-1…6 remain. None block `visual-ui-design`; UX-OQ-1 blocks using SM-* as acceptance gates; UX-OQ-5 (dark mode at launch) and UX-OQ-4 (onboarding depth) are Product decisions.

### Next human decision required

Review `docs/product/ux-product-design.md`. Then either:

- record `APPROVED — proceed to visual-ui-design` (optionally accepting conditions UX-C1…UX-C4, which will be reproduced in the human review log), or
- record `APPROVED WITH CONDITIONS` naming which are accepted vs. must resolve first, or
- request revisions.

Phase 3 (`visual-ui-design`) stays `LOCKED` until an explicit human approval is recorded. The lifecycle will not advance automatically.
