# Visual UI Design — Weight

## 1. Phase identity

- Lifecycle role: Visual UI design (`visual-ui-design`, phase 3 of 11)
- Execution date: 2026-09-02
- Roadmap state at execution: `IN PROGRESS` → `AWAITING APPROVAL`
- Upstream approvals: `product-strategy` APPROVED 2026-09-01; `evidence-based-ui-ux` APPROVED 2026-09-02
- Classification: **CREATE** (no prior `docs/design/visual-ui-design.md`, no Design Memory, no UI code)
- Reported result: `PASS WITH CONDITIONS`
- Rendered reference: [`docs/design/renders/weight-visual-system-v1.html`](renders/weight-visual-system-v1.html) (v2 content — disposable HTML/CSS prototype, not production code)

## 2. Sources inspected

| Source | Use |
|---|---|
| `docs/product/ux-product-design.md` (APPROVED) | Experience Read, principles UX-P1…P5, anti-qualities, attention orders (§7.3/§7.4), 12-surface state matrix (§10), §16 handoff package, §13 experience constraints |
| `docs/product/product-strategy.md` (APPROVED) | Invariants (esp. #10), NFR-A11Y/INTL, CON-7/CON-8, success measures |
| `development-roadmap.md` | CON-7 (refined 2026-09-02), CON-8, review log, OQ-8 (dark mode) |
| `SPEC.md` §8 (visual design system), §8.4 (typography), §8.5 (color tokens), §8.6 (spacing/shape/elevation), §8.8 (components), §10.1–10.2 (Expo Go boundary), §13 (accessibility/platform) | `VALIDATE` input for tokens, component list, neumorphism rules; adopted with revisions below |
| Human instruction 2026-09-02 | "white sand" warm ground + "Persian blue" tonal scale — refines CON-7's strict-greyscale reading (recorded in roadmap; VIS-DEC-03) |
| 6 MyFitnessPal screenshots (provided phase 2) | Deconstructed for *interaction primitives* only (day strip, grouped rows + per-row action, centre "+" sheet, search-with-recents, non-blocking confirm). Not imitated. One rejection carried from UX §2.1: MFP's separate-screen entry edit → Weight edits set values inline. |
| `.claude/skills/visual-ui-design/**` (principles, taste-and-calibration, decision-model, accessibility-and-validation, design-directions, components-and-patterns, anti-patterns, platforms/ios-ipados, platforms/android, critique-and-iteration, artifact-modes, templates, capabilities/design-memory, capabilities/apple-hig-adapter) | Method |
| `.claude/skill-system/{lifecycle,decision-ownership,artifact-standard,design-adapters,capability-attachments}.md` | Lifecycle gate, ownership boundary, artifact shape |
| Repository tree | Confirmed greenfield — no UI code, no design tokens, no fonts committed |

## 3. Ownership boundary

This phase owns visual direction, tokens, typography, color, spacing, layout system, components, visual states, and platform presentation conventions. It does **not** change the approved information architecture, journeys, chosen interaction concepts, or interaction behaviours (UX phase). Where a visual decision implied a behavioural change, it is flagged and routed, not applied (none required in this pass). Native-platform API/symbol/dimension specifics are verification targets for `client-engineering`, not compliance claims here.

## 4. Context and Design Read

### 4.1 Design Read (honours the upstream Experience Read verbatim)

> Reading this as a **personal weight-training logger and planner** for a **committed lifter working one-handed in a noisy gym with unreliable network**, where the interface should feel **immediate, unambiguous, and trustworthy** — a set is recorded the instant it is tapped and nothing is lost — so that attention stays on training and the history can be trusted, while avoiding **fragile, modal, chatty, or "data-entry"** feelings.

Planning surfaces additionally should feel **fast to assemble from existing pieces** and **safe** (editing a plan never disturbs history). Review surfaces should feel like **a straight answer to "am I progressing?"**

### 4.2 Calibrated dials

| Dial | Setting | Why |
|---|---|---|
| Familiarity | **Middle** — established grammar + one distinctive move | Bottom tabs, day strip, sheets, search-with-recents are conventions the target user knows (MFP reference confirms). The one distinctive move is the **Set Row**. |
| Density | **Middle → high on data surfaces** | Today and empty states stay selective; active logging, history, and Progress use compact, comparison-rich tabular rhythm. |
| Expression | **Low–middle** — quiet, utilitarian, minimal decoration; just enough brand to be recognisable | Gym readability and "unambiguous" outrank art direction. Brand = warm sand ground + one Persian-blue scale + Aeonik. |
| Motion | **Low** — still, immediate feedback only, plus purposeful sheet/nav transitions | Speed and interruption pressure; no motion between sets; no celebratory PR animation. |

### 4.3 Pressure → response

| Pressure | Level | Visual response |
|---|---|---|
| Speed / repetition | High | Fixed set-row geometry; one-tap complete; no motion or confirmation between sets; stable control placement |
| Touch ergonomics (one hand, sweat, gloves) | High | Primary actions in the lower half; ≥48 dp targets; 52–56 dp primary CTA; 40 dp numeric wells inside a 56–60 dp row |
| Environmental readability (glare, low gym light) | High | Body text ≥ ~12:1 on ground; explicit 1 px `border-strong` on inputs/rows/charts despite soft surfaces; neumorphic shadow softened and never load-bearing for meaning |
| Data comparison (loads, reps, volume, e1RM) | High | Tabular numerals, right-aligned numeric columns, list/table rhythm, dividers over cards; the "Ledger" thesis |
| Accessibility / text scaling | High | Semantic roles; every state carries ≥2 non-hue, non-elevation cues (glyph + weight + border-style + shape); set rows reflow label-over-input beyond ~130% scale |
| Consequence (lost set/session erodes trust) | High | Explicit `SyncIndicator` states with provenance wording ("Saved on device"); destructive confirms name the object; recorded vs prescribed is a visible state change |
| Discoverability | Medium | Labels on all primary actions; icon+label in nav; progressive disclosure for RPE/RIR/tempo/notes |
| Brand expression | Medium–low | One Persian-blue scale, one warm-sand scale, Aeonik; restraint rule protects it |
| Platform familiarity | Medium | iOS-adapted interaction + Android back/edge-to-edge; custom cross-platform, **not** a native-HIG claim |
| Immersion | Low | Persistent nav and visible state beat edge-to-edge canvas |
| Feasibility (Expo Go) | Constraint | RN `shadow*`/`elevation`, tonal fills, borders, optional `expo-linear-gradient`; no native neumorphism lib; Aeonik via `expo-font` |

## 5. Direction and platform

| Decision | Value |
|---|---|
| **VIS-DEC-01 · Platform system** | Custom cross-platform, **iOS-adapted interaction logic + Android back/inset compliance**. Compliance level: *iOS-inspired / cross-platform custom* — **not** native-HIG compliant. All focus, gesture, safe-area, back, and semantic behaviour is re-specified for React Native and handed to `client-engineering` for platform verification. |
| **VIS-DEC-02 · Design direction** | Primary: **Utilitarian**. Supporting (≤2): **Data-dense**, **Premium-through-restraint** (precision and craft, not decoration). |
| **VIS-DEC-03 · Palette identity** | Single **Persian-blue** tonal scale (accent at `blue-600 #1C39BB`) on a **white-sand** warm neutral ground (`sand-50 #F4F1EA`). Dark mode = "night sand" warm charcoal with the blue lightened for contrast. Refines CON-7: the system is *single-hue*, not strict greyscale. |
| **VIS-DEC-04 · Signature move** | **The Set Row.** One horizontal row carrying, in aligned tabular-numeral columns: set-type marker · *previous* (ghosted) · *target* (from plan, quiet, struck through once recorded) · *actual* load · *actual* reps · completion control. It renders identically in active logging, past-workout logging (no timer), the planned editor (target only), and history (actual only, locked). The one choreographed micro-moment is the 140 ms transition **prescribed → active → recorded**: left marker fills to `accent`, completion glyph changes ○→✓, well borders drop, numeral weight steps 500→600, a 1 px inset appears. |
| **VIS-DEC-05 · Restraint rule** | Only the **live session's running elements** — the currently-focused set row, the running rest timer, the Resume pill — may use `elevation.raised-2` **and** full-strength `blue-600`. Everywhere else: `flat` or `raised-1`, borders, and `blue` used thinly (markers, focus ring, selected wash, links). At most **one** `raised-2` element per view. Neumorphic shadow is **never** the sole cue for interactivity, selection, completion, focus, error, or disabled. |

### 5.1 Candidate theses (direction was open on composition / color-architecture)

**Thesis A — "Ledger" (SELECTED).** The app is a training ledger. Near-flat surfaces; strong 1 px rules and dividers instead of cards; tabular columns; blue as a thin structural accent (left markers, focus, selected day, links). Neumorphic elevation reserved for the Log button, the active set row, the running timer, the Resume pill. Attention order: date/day-state → next workout action → this-week ledger → last workout. Signature: the ruled Set Row. Deliberate omission: no filled stat-card grid — `StatTile`s are divider-separated columns on the canvas.

**Thesis B — "Soft Panel" (rejected).** Leans fully into SPEC's neumorphism: most content on gently raised sand panels; blue a richer presence (blue-wash selected day, blue-tinted PR chips). Warmer, more "designed." Rejected because nested raised panels fight the *explicit-boundaries / gym-readability* pressure and the "border + shadow + tint + radius on one element" anti-pattern; softness undercuts the *unambiguous, not-fragile* Design Read.

**Decisive tradeoff:** the Design Read demands *unambiguous, immediate, trustworthy* over *warm, designed*. A's ruled tabular clarity and reserved elevation serve gym readability and the anti-qualities better; B's warmth is recovered through the sand ground and Aeonik without losing contrast. **One borrowing from B:** today's planned card and the selected day get a quiet `accent-quiet` tint wash so the primary action reads at a glance.

**Reversal condition:** if the rendered "Ledger" reads as cold/austere or unfinished in later critique or usability work, reintroduce B's raised `WorkoutCard` on Today only (scoped exception, not a system change).

### 5.2 Generic treatments explicitly avoided (anti-pattern registry)

Card grid for training data; sidebar + header + interchangeable stat cards; blue glow/gradient as identity (blue is flat structural fill, no glow); pill/chip overload (set-type is a 4 px marker + accessible label, not a chip); border+shadow+tint+radius stacked on one element (each raised element gets exactly one treatment); identical radius on every nested object (role-based geometry, optical step-down); one spacing value everywhere (tight/normal/section rhythm); font as the entire personality (voice built from type *relationships* + tabular alignment + sand ground); fake/round data in the render (real values: 102.5 kg × 8, 22,140 kg, est. 1RM 132 kg); motion on every reveal; glass/blur for "premium"; mobile-as-scaled-desktop.

## 6. Foundations

### 6.1 Color

Token names are semantic. Raw values are the reference ramp; `client-engineering` may nudge ±one step for measured contrast, not change roles.

**Sand ramp (warm neutral):** `sand-0 #FBF9F4` · `sand-50 #F4F1EA` · `sand-100 #ECE8DE` · `sand-150 #E4DFD0` · `sand-200 #D6CFBC` · `sand-300 #BCB39B` · `sand-600 #6B6455` · `sand-800 #33302A` · `sand-900 #201E19`

**Persian-blue ramp:** `blue-50 #EEF1FB` · `blue-100 #DEE4F6` · `blue-200 #B9C4EC` · `blue-300 #8B9EE0` · `blue-400 #5B73D2` · `blue-500 #3450C4` · `blue-600 #1C39BB` · `blue-700 #182F94` · `blue-900 #0E1A4F`

**Night-sand ramp (dark):** `ink-900 #14130F` · `ink-850 #1B1A15` · `ink-800 #211F19` · `ink-700 #2B2820` · `ink-600 #37332A` · `ink-400 #6A6454` · `ink-200 #C9C4B6` · `ink-50 #F2EFE6`

| Semantic token | Role | Light | Dark |
|---|---|---|---|
| `color.canvas` | App background | `sand-50` | `ink-900` |
| `color.surface` | Primary surface / flat card | `sand-100` | `ink-850` |
| `color.surfaceRaised` | Raised control / card | `sand-0` | `ink-800` |
| `color.surfaceSunken` | Input well, timer track, chart plot area | `sand-150` | `ink-700` |
| `color.text` | Primary text | `sand-900` | `ink-50` |
| `color.textSecondary` | Section labels, field labels | `sand-800` | `ink-200` |
| `color.textMuted` | Previous values, metadata, kickers | `sand-600` | `ink-400` |
| `color.border` | Grouping hairlines, dividers | `sand-200` | `ink-600` |
| `color.borderStrong` | Input outline, set-row rule, chart axis | `sand-300` | `ink-400` |
| `color.accent` | Primary interactive, selection, focus, active markers, links | `blue-600` | `blue-300` |
| `color.accentPressed` | Pressed primary | `blue-700` | `blue-200` |
| `color.accentQuiet` | Selected-day wash, today's-plan card tint, subtle fills | `blue-50` | `rgba(139,158,224,.16)` |
| `color.onAccent` | Content on accent fills | `#FFFFFF` | `ink-900` |
| `color.focusRing` | 2 px focus ring, + offset — never the only selection cue | `blue-500` | `blue-300` |
| `color.danger` | Destructive / error **exception only**, always paired with icon + text | `#9B2C2C` | `#F2B8B5` |
| `color.nmHighlight` / `color.nmShadow` | Neumorphic pair (upper-left light / lower-right shadow) | `rgba(255,255,255,.6)` / `rgba(150,140,110,.35)` | `rgba(255,255,255,.04)` / `rgba(0,0,0,.55)` |

**Contrast behaviour**
- Body/label text on `canvas`/`surface` targets ≈ 12:1+ (sand-900 on sand-50); `textMuted` ≥ 4.5:1.
- `onAccent` white on `blue-600` ≈ 8.5:1 → pass for text and glyphs.
- `borderStrong` vs its surface ≥ 3:1 so inputs and set-row rules stay visible in glare.
- Dark mode: `accent` becomes `blue-300` for text/links/markers (lightness for contrast); accent **fills** in dark use `blue-400`/`blue-500` with `onAccent = ink-900`.
- **VIS-DEC-06 · No meaning by hue or elevation alone.** Completion = filled marker + ✓ glyph + numeral-weight step (not color). PR = ▲/trophy glyph + label + value (never green). Missed day = short bar (shape). Selected day = tint wash + ring (not hue). Today = blue numeral **+** heavier border ring. Error = `danger` color **+** icon **+** text.

**Charts** (custom RN + SVG): plot area `surfaceSunken`; gridlines `border` at low opacity; series differentiated by **stroke weight → dash pattern → marker shape → direct label** before any hue; if two series must use color, `blue-600` solid vs `blue-300` dashed. Every chart ships with an exact-value callout on selection and a downstream list/table representation (NFR-A11Y, FR-DATA-09).

### 6.2 Typography

**VIS-DEC-07 · Typeface.** Aeonik, loaded via `expo-font`, **only once the exact files, weights, and mobile app-distribution licence are confirmed** (CON-8, DEP-2). Until then the documented fallback stack is `"Inter", "SF Pro Text", -apple-system, "Segoe UI", Roboto, system-ui, sans-serif`. Do **not** synthesize missing Aeonik weights — map every token weight to a shipped file. The system is designed so the typeface can be swapped without layout change.

| Token | Size / line-height (dp) | Weight | Use |
|---|---|---|---|
| `type.display` | 32 / 38 | Bold | Onboarding statement, single hero metric |
| `type.title1` | 28 / 34 | Bold | Screen titles (Today, Plan, Progress) |
| `type.title2` | 22 / 28 | Semibold | Workout / section titles |
| `type.heading` | 18 / 24 | Medium | Exercise names, card titles |
| `type.body` | 16 / 22 | Regular | Primary content and controls |
| `type.label` | 14 / 18 | Medium | Buttons, field labels, tabs |
| `type.caption` | 12 / 16 | Regular/Medium | Previous values, metadata, kickers |
| `type.metric` | 20 / 24 (28 variant) | Medium | Set-row actual value, rest timer, headline stat — **always** tabular |

**Numeral rule:** all loads, reps, durations, dates, timers, axis values, and ledger figures use `fontVariant: ['tabular-nums']` and right-align in comparison columns. **Scaling:** honour OS text scaling; beyond ~130% the set row reflows to label-above-input (row height 56 → 64+); titles truncate tail-first; exercise names wrap to 2 lines then ellipsis. Metrics never clip.

### 6.3 Spacing, sizing, radius, border, elevation

- **Base** 4 dp. **Scale** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40. Rhythm has three levels: tight (4–8, within a control), normal (12–16, between rows/fields), section (24–32, between regions).
- **Screen padding** 16 (compact phones) / 20 (wide phones).
- **Sizing:** min control height 48; primary CTA 52–56; set-row 56 (64+ reflowed); numeric well 40; nav bar 56 + safe-area inset; sheet handle 36×4.
- **Radius (role-based, optical step-down):** field 12 · set-row 12 · list card 16 · primary card 20 · sheet 24 (top corners only) · pill 999. Nesting rule: an inner grouping inside a 20-radius card uses dividers or a tonal shift, **not** a nested 20-radius card; an unavoidable nested surface steps to 12.
- **Border:** 1 px `border` for dividers/grouping; 1 px `borderStrong` for input/well/set-row rules and chart axes; 1.5 px `accent` for the active set row and running timer only.
- **Elevation roles:** `flat` (border only) · `raised-1` (one soft neumorphic pair — cards, week strip, segmented selection) · `raised-2` (stronger pair — active set row, Log button, running timer, Resume pill **only**) · `overlay` (sheets/menus — scrim + single top shadow). One surface = one highlight/shadow pair (upper-left / lower-right). Pressed = reduce offset + deepen fill **and** change border/glyph.

### 6.4 Layout and responsive

Single-column mobile, safe-area aware. Persistent bottom navigation (5 positions; centre is a raised action, not a destination — UX-DEC-01). Content regions stack by priority (UX §7.3 attention orders are authoritative). Compact vs wide phone differs only in horizontal padding and whether the week strip cells show a weekday letter above the date. Landscape is not a target for MVP phone use; the active workout must still not break if rotated (set rows reflow, sticky context persists). Tablet is out of scope (product-strategy §7.2).

### 6.5 Iconography, imagery, data viz

- **VIS-DEC-08 · Icon family:** one outlined family available in the Expo Go stack (candidate: `lucide-react-native` or `@expo/vector-icons` Ionicons-outline — final choice is a `client-engineering` dependency decision). Stroke 1.75–2 px to survive glare; nominal size 20–24 dp; icon-only controls get an accessible label and a 48 dp hit area. Semantic glyphs: `check` (set complete), `triangle-up`/`trophy` (PR), `ring`/`dot`/`bar` (day markers), `cloud`/`cloud-off`/`alert` (sync).
- **Imagery:** none in MVP. No exercise media, no illustration, no hero photography. Empty states use type + actions, not spot art.
- **Data viz:** covered in §6.1. Custom primitives only; no heavy chart dependency until requirements exceed them (SPEC §10.1).

### 6.6 Motion

| Role | Duration | Behaviour | Reduced Motion |
|---|---|---|---|
| Press / state feedback | 120–180 ms | Opacity + 1 px inset; no scale bounce | Instant state swap |
| Set-row complete | 140 ms | Marker fill, glyph ○→✓, weight step, inset | Instant |
| Sheet / nav transition | 220–300 ms | Slide-up / push | Cross-fade, no slide |
| Rest timer | 1 s tick | Numeral change only, no animation | Same |
| PR achieved | — | Persistent trophy + line in the finish summary; **no burst, no celebration animation** | Same |

Haptics: set completion, timer completion, destructive confirmation only; honour user setting (SPEC §8.7).

## 7. Components

Each entry: semantics · anatomy · variants · key states · tokens · a11y/touch. Full per-surface state coverage is the UX §10 matrix; this section gives the visual treatment.

### 7.1 `AppSurface`
Base container. Variants: `flat` (border) · `raised-1` · `raised-2` · `overlay`. Enforces the one-treatment rule and role radius. Dark/light/increased-contrast safe (borders remain when shadows are suppressed).

### 7.2 `PrimaryButton` / `SecondaryButton` / `IconButton`
- **Primary:** `accent` fill, `onAccent` text, `raised-1` (or `raised-2` only when it is the Log action), height 52. States: default · pressed (`accentPressed` + inset) · loading (spinner replaces label, width held) · disabled (`surface` fill, `textMuted`, no shadow) · destructive (`danger` fill, icon + label).
- **Secondary:** `surfaceRaised` fill, `text`, `borderStrong`, `raised-1`.
- **Ghost:** transparent, `borderStrong`, no shadow — tertiary/utility actions.
- **IconButton:** 48 dp hit area, visible affordance, always an accessible label; never the sole carrier of a primary action (pair with text where primary).

### 7.3 `WeekStrip` + `DayMarker`
Seven cells, `raised-1`, radius 12. `DayMarker` states, each shape-distinct: **planned** = hollow ring (`accent`); **completed** = filled dot (`accent`); **missed** = short 2 px bar (`borderStrong`); **today** = `accent` numeral **+** 1.5 px `accent` border ring; **selected** = `accentQuiet` wash **+** `accent` border; **disabled/out-of-range** = `textMuted` numeral, no marker. Today+selected compose. Touch target ≥ 44×56.

### 7.4 `WorkoutCard`
Planned / active / completed / skipped. Default = `flat` on the ledger; **today's planned** card = `accentQuiet` tint + `accent` hairline + primary CTA (the one place tint is used on Today). Anatomy: muted kicker · `type.title2` name · meta row (exercise count · set count · est. duration) · primary action · overflow. Active variant shows elapsed time and a Resume affordance. No nested cards inside.

### 7.5 `SetRow` — signature (VIS-DEC-04)
- **Grid:** `[marker 4] [previous] [target] [kg well] [reps well] [complete]`, numerals right-aligned, `type.metric` for the actual value.
- **States:** `prescribed` (dashed well borders, `textMuted`, ○) → `active` (`raised-2`, 1.5 px `accent` frame, radius 12, lifts 6 dp from the rule rhythm, ○ in `accent`) → `recorded` (marker fills `accent`, wells lose border, numeral weight 600, ✓ in filled `accent` square, target struck through) → `error` (well border `danger` + inline message below the row) → `disabled/locked` (history view: no wells, plain aligned text, no complete control).
- **Set-type marker:** `warmup` = `borderStrong`; `working` = `textMuted`; `drop`/`failure`/`backoff` = `textMuted` with a 1-char accessible label (`W`/`D`/`F`/`B`) — not a colored chip.
- **Reflow:** beyond ~130% text scale, stack `label → well` per field; row grows to 64+; complete control moves full-width below.
- **a11y:** row is one focus stop with a composed label ("Working set 3, previous 100 by 5, target 102.5 by 8, actual 102.5 kilograms by 8 reps, not completed"); the complete control is a nested action.

### 7.6 `NumericField` (well)
`surfaceSunken` fill, `borderStrong`, radius 10, `type.metric`. Unit suffix in `caption`/`textMuted`. Decimal loads allowed; zero load allowed (bodyweight); negatives rejected inline. Focused = `focusRing` + `accent` border. Opening the keypad must not cover the active row (client requirement, UX-AX-04). Configurable plate increment shown as ± affordance, no forced calculator.

### 7.7 `ExerciseSection`
Collapsed (default in planned editor and for non-active exercises): name · set count · rep range · load target · rest, in one aligned line, with a `▾`. Expanded: header + `SetRow` list + section menu. Superset/circuit = a shared group label bar spanning the grouped exercises with a 2 px `accent` left rule (the only place a left rule is `accent` outside a recorded set marker — scoped exception, VIS-DEC-05).

### 7.8 `SearchField`
`surface`, `borderStrong`, radius 12, leading search glyph, clear affordance. States: empty (recents/frequent list below) · typing · results · no-results ("nothing matches" ≠ "nothing yet") · offline-local (results labelled "on this device"). Debounced; queries the local index (SM-7).

### 7.9 `SegmentedControl`
Peer views only (Overview/History/PRs/Trends). Track `surfaceSunken`, selected segment `surfaceRaised` + `borderStrong` + `raised-1` — selection is **not** shadow-only (also carries fill + border + `text` vs `textMuted`).

### 7.10 `StatTile` / Ledger columns
No card. Divider-separated columns on the canvas: `caption` label · `type.metric` value · optional comparison line · "not enough data yet" state with the specific requirement (e.g. "complete 2 sessions"). Unavailable/loading = per-column, never all-or-nothing.

### 7.11 `TrendChart`
Per §6.1/§6.5. States: normal · selected point (8 dp `accent` dot + exact tabular callout) · empty · insufficient-data (explicit, with what is needed) · per-section error (isolated, does not blank the screen). Accessible summary + list representation required downstream.

### 7.12 `BottomSheet`
`overlay`: scrim + `surfaceRaised` panel, radius 24 top only, drag handle. Dismiss by drag / scrim / back with no side effect. Keyboard-safe. Destructive actions inside get the `danger` treatment and name the object. The Log sheet shows ≤5 actions before scrolling; impossible actions are hidden, not disabled (FR §4.1).

### 7.13 `SyncIndicator` (VIS-DEC-09)
Ambient inline row, never a banner or modal. States: **Saved on device** (`textMuted` dot + text) · **Syncing…** (`accent` ring) · **Offline — will sync when online** (`textMuted`) · **Needs attention** (`danger` dot + text, tappable). Wording carries provenance ("on device" ≠ "synced") per UX-P4. On Today it may badge the top-right avatar instead of taking a content row.

### 7.14 `ResumePill`
Persistent above the nav when a session is minimised. `raised-2`, 1.5 px `accent`, pill radius. Shows workout name · elapsed · current exercise/set · a `Resume` action. One of the few `raised-2` elements (VIS-DEC-05).

### 7.15 `RestTimer`
Running: `raised-2` pill, 1.5 px `accent`, `type.metric` in `accent`, with `+15s` / `skip` / `pause` affordances reachable without scrolling. Idle/absent: not shown. Anchored to timestamps, not a decrementing counter (behavioural, client-owned).

### 7.16 `Toast`
Non-blocking, bottom, auto-dismiss, single line, no action required (e.g. "Workout saved"). **Never** used on the set-completion path (anti-quality "chatty"). Not used for errors that need a decision — those are inline.

## 8. Screen application

Applied to the approved structures (UX §7–§8). Attention orders below are from UX §7.3/§7.4 and are authoritative; this phase assigns the visual weight.

| Screen | Focal point | Visual notes | States rendered / specified |
|---|---|---|---|
| **Today — planned** | "Start workout" CTA in the `accentQuiet` planned card | Date `title1` + chevron; week strip; planned card is the only tinted element; "This week" = ledger columns; last workout = one divider-bounded row; `SyncIndicator` ambient | Rendered: planned, empty (nothing planned), needs-attention sync. Specified: active-session (Resume pill), loading skeleton, offline |
| **Active workout** | The `active` set row (only `raised-2` in view) | "‹ Minimise" (muted) · elapsed (`metric`) · "Finish" (`accent` text). Sticky context bar (`surface`, flat) with exercise + set count + running timer pill. Set rows on continuous `borderStrong` rules; active row lifts. Footer ghost "+ Add exercise". | Rendered: warmup-recorded, working-recorded, active, prescribed, collapsed next exercise, offline sync. Specified: validation error on a row, cancel-session confirm, persist-failure ("not saved — retrying", Finish blocked) |
| **Plan — week** | Selected-day planned `WorkoutCard` | Week range `title1`; strip with all `DayMarker` states incl. missed; day label; card with Edit/Move/Duplicate (secondary/ghost); "+ Add workout to <day>" ghost; week ledger; labelled "Week actions" group | Rendered: populated week, missed day. Specified: empty week (Copy previous week / Use template / Add workout), clear-future confirm, template-update preview+confirm |
| **Planned workout editor** | "Add exercise / superset" | Collapsed `ExerciseSection`s (set count · rep range · target · rest); expand to edit per-set. Superset group bar with `accent` left rule. Autosave (no unsaved-changes modal — UX-DEC-08) | Specified: new (empty prompt), partial prescriptions allowed, min>max validation inline, save-failure retains edits |
| **Progress — Overview** | The consistency line + weekly-volume bars (the "am I progressing?" answer) | `SegmentedControl` peer views; consistency as `type.metric` + context; bar chart with dashed target line and per-bar tabular labels; PRs as trophy + name + value + formula line; "Most trained" as plain aligned text | Rendered: populated. Specified: "not enough data yet" per tile, per-section error, "as of last sync" annotation on server-derived values |
| **Exercise search** | The search field + recents | `SearchField` states; recents/frequent before browse; "create new" always reachable | Specified: empty (recents), typing, results, no-results, offline-local (labelled) |
| **History — completed session** | The session's performed values (locked `SetRow`s) | Immutable snapshot; explicit "Edit" action that warns PRs/aggregates recompute; delete names the session + warns recompute + recoverable | Specified: normal, missing-snapshot recovery, edit-warns-recompute, delete-confirm |
| **Log Action Sheet + Resume pill** | "Resume workout" when a session is active | `BottomSheet` with ≤5 actions; Resume pill above the sheet; impossible actions hidden | Rendered: active-session variant |

## 9. Accessibility and platform review

**Not a compliance claim.** Targets and verification items for `client-engineering` and `quality-engineering`:

| ID | Target | Verify |
|---|---|---|
| VIS-AX-01 | WCAG AA for meaningful text/controls; body ≈ 12:1, muted ≥ 4.5:1, `onAccent` ≥ 4.5:1, `borderStrong` ≥ 3:1 vs surface | Contrast audit, light + dark + increased-contrast |
| VIS-AX-02 | No state by hue or elevation alone (VIS-DEC-06) — every state has ≥2 of {glyph, weight, border-style, shape, text} | Screen-reader pass + greyscale screenshot pass |
| VIS-AX-03 | Set rows and ledger reflow (label-over-value) at max OS text scale without clipping metrics | Device test at largest Dynamic Type / font scale |
| VIS-AX-04 | VoiceOver/TalkBack: composed `SetRow` label + nested complete action; traversal order per UX-AX-03 | Both platforms |
| VIS-AX-05 | Focus ring visible on every interactive element; `focusRing` never the only selection cue | Keyboard/switch-control pass |
| VIS-AX-06 | Reduce Motion → instant/opacity per §6.6; reduced transparency → borders carry containment when shadows suppressed | Settings toggled on device |
| VIS-AX-07 | Safe areas (iOS) and edge-to-edge insets + system back (Android) preserved; nav bar respects bottom inset | Both platforms |
| VIS-AX-08 | Localised dates/decimal separators/first-day-of-week/units; layout tolerates +30–40% label length and RTL mirroring (numeric columns stay LTR) | Pseudo-localisation + RTL pass |
| VIS-AX-09 | Aeonik weights each map to a shipped file; fallback stack renders the same layout | Font-load test with and without Aeonik |
| VIS-AX-10 | Icon family exists in the locked Expo Go SDK; every icon-only control has an accessible name + 48 dp hit area | Dependency + audit |

## 10. Validation and handoff

### 10.1 Rendered artifact

[`docs/design/renders/weight-visual-system-v1.html`](renders/weight-visual-system-v1.html) — disposable HTML/CSS prototype approximating the RN surfaces. Contains: Today (planned, light + dark), Active workout (set-row state ladder, light + dark, offline), Plan week, Progress Overview, Today empty state, Log sheet + Resume pill, and a component board (both ramps, Set Row state ladder, buttons, day markers, sync indicator). The token system is expressed as CSS custom properties = the reference for §6.

### 10.2 Critique-and-correction summary (one pass minimum; performed)

Fast Read of v1 found the intended focal point and reading order correct on every screen and **no hierarchy or state-information defect**. Corrections applied in v2 (craft-level):

| ID | Observation (v1) | Effect | Correction (v2) |
|---|---|---|---|
| F1 | Active-workout back labelled "‹ min" | Minimise affordance unreadable | "‹ Minimise", `textMuted` |
| F2 | "PREV TARGET" headers cramped together | Prev vs target ambiguous | Separated to sit above their own columns; recorded target struck through |
| F3 | Ledger unit "kg" wrapped to a second line at narrow width | Broken figure | `white-space:nowrap`, unit as inline `small` |
| F4 | Timer pill "1:30 +15s · skip" cramped | Hard to parse under load | Pill = "1:30" + "rest · +15s"; skip/pause specified in `RestTimer`, not crammed into the pill |
| F5 | Today's planned card used blue tint + blue kicker + blue CTA | 3 blue elements — restraint rule strained | Kicker muted → only tint + CTA carry blue |
| F6 | "Saved on device" crowded the last-workout row on Today | Grouping unclear | Divider + 14 dp gap before the `SyncIndicator` |
| F7 | Three equal full-width week-action buttons | Flat emphasis | Labelled "Week actions" group; Copy = secondary, others ghost |
| F8 | Nav icons were bare outlined squares | Read as unfinished | Schematic per-tab glyphs (corner-dot / grid / bars / lines) |
| F9 | "Romanian Deadlift  3 sets ·  ▾" double space | Sloppy craft | "3 sets · collapsed ▾" |

Re-render confirmed F1, F3, F5, F6, F8, F9 on the Today surface and the corrected header/timer on Active workout. The second render is stronger; no material defect remains that the available prototype tooling can resolve. Remaining verification (true device rendering, Dynamic Type reflow, VoiceOver order, RTL) is listed in §9 for `client-engineering`/`quality-engineering`.

### 10.3 Generic-pattern review

Ran the anti-pattern review questions (§5.2). The interface is **not** swappable into an unrelated product by changing the accent: the Set Row (prescribed/target/actual/recorded in one ruled line) and the "Ledger" stat columns are training-specific compositions, and the warm-sand ground + single Persian-blue scale is a deliberate identity, not a default. Every visual treatment maps to a §4.3 pressure or an approved requirement. Deliberately omitted: stat-card grids, spot illustration, imagery, celebratory motion, chips-as-labels.

### 10.4 Consistency review

One spacing scale, one radius system with role-based step-down, one elevation vocabulary with a single highlight/shadow pair, one icon family, semantic-only color tokens. The Set Row treatment is identical across active/past/editor/history (varying only which columns are live). `raised-2` appears on exactly four elements system-wide (active set row, Log button, running timer, Resume pill), enforced by VIS-DEC-05.

### 10.5 Known limitations

- Prototype is HTML/CSS, not RN; shadow rendering, font metrics, and Dynamic Type reflow will differ on device.
- Aeonik not available — all type shown in the fallback stack (CON-8, DEP-2).
- Dark mode shown for Today and Active workout only; other screens specified by token swap, not rendered.
- No motion is demonstrated (static render); §6.6 is specification only.
- Contrast ratios are computed from the reference ramp, not measured on device.

### 10.6 Implementation notes for `client-engineering`

Build tokens as a single theme object (light/dark) consumed through a theme provider; do not inline raw hex. `SetRow` is the highest-value component — build it first, with its four states and the reflow, and validate it under Dynamic Type and VoiceOver before broad screen work (aligns with the "prove the logging slice first" guardrail). Neumorphic pairs: use `shadowColor/shadowOffset/shadowOpacity/shadowRadius` (iOS) + `elevation` (Android) with the `nmHighlight`/`nmShadow` tokens; accept that Android cannot render a dual highlight/shadow pair natively — fall back to border + single elevation there (borders already carry containment per VIS-DEC-05, so this is safe). Icon family choice is a locked-version `expo install` decision (VIS-DEC-08). Confirm SF-Symbol-free (custom/vector icons only) to keep parity across platforms.

### 10.7 Acceptance checks

1. Every §6 token has a semantic name and a light + dark value. ✅
2. Every §7 component lists semantics, variants, states, tokens, and a11y. ✅
3. Screen application (§8) covers the UX §10 state matrix by reference and renders the highest-risk states. ✅ (renders: 8 screens/states; remainder specified)
4. No state relies on hue or elevation alone (VIS-DEC-06). ✅ by design; VIS-AX-02 verifies.
5. Signature move and restraint rule are product-specific and bounded. ✅ (Set Row; four `raised-2` elements).
6. Upstream IA/flows/interaction unchanged. ✅ (no behavioural change; none routed).
7. Platform claims match the compliance level (iOS-inspired / custom, not native). ✅
8. Critique-and-correction evidence present. ✅ (§10.2)

## 11. Design Memory (canonical — do not create a competing file)

### Status
- Version / date: v1 · 2026-09-02
- Owner: `visual-ui-design`
- Evidence inspected: approved product-strategy + ux-product-design, SPEC §8/§13, human color directive, rendered prototype v1→v2
- Classification: `CREATE`

### Experience and visual intent
- **Design Read:** §4.1 (personal gym logger; immediate / unambiguous / trustworthy; not fragile / modal / chatty / data-entry).
- **Experience qualities:** immediate, unambiguous, trustworthy; planning = fast-to-assemble + safe; review = a straight answer.
- **Anti-qualities:** fragile, modal/nested, chatty, ambiguous-state, configuration-first, feed-like.
- **Platform system / compliance:** custom cross-platform, iOS-adapted interaction + Android back/insets; **not** native-HIG compliant (VIS-DEC-01).
- **Selected thesis:** "Ledger" (§5.1) — flat surfaces, ruled tabular rows, blue as thin structural accent; one borrowing from "Soft Panel" (tinted today/selected).
- **Signature move:** the Set Row (VIS-DEC-04).
- **Restraint rule:** only live-session running elements use `raised-2` + full-strength blue; ≤1 `raised-2` per view; shadow never the sole state cue (VIS-DEC-05).

### Reusable system decisions
- **Semantic tokens:** §6.1 color table (sand / Persian-blue / night-sand ramps; canvas/surface/raised/sunken/text/textSecondary/textMuted/border/borderStrong/accent/accentPressed/accentQuiet/onAccent/focusRing/danger/nm*).
- **Typography and density:** Aeonik + documented fallback (VIS-DEC-07); 8 type tokens incl. `type.metric`; tabular numerals on all figures; density middle, high on data surfaces.
- **Layout and spacing:** 4 dp base; 4–40 scale; three-level rhythm (tight/normal/section); screen padding 16/20; single-column, safe-area aware.
- **Surfaces and color roles:** four elevation roles (flat / raised-1 / raised-2 / overlay); one highlight/shadow pair per surface; role-based radius with optical step-down (12/16/20/24/999); `accentQuiet` tint only on today's plan card + selected day.
- **Iconography / imagery:** one outlined Expo-compatible family, 1.75–2 px stroke (VIS-DEC-08); no imagery/illustration in MVP.
- **Motion:** §6.6 — 120–180 ms feedback, 220–300 ms sheets; no motion between sets; no PR celebration; Reduce Motion → instant/opacity.
- **Component anatomy / variants / states:** §7 (16 components; `SetRow` is primary).
- **Required states:** UX §10 matrix is the checklist; visual treatment per §7–§8.
- **Responsive / adaptive rules:** §6.4; set-row and ledger reflow at ~130%+ text scale; landscape must not break the active session; no tablet.
- **Accessibility / localization constraints:** §9 (VIS-AX-01…10); no meaning by hue/elevation alone (VIS-DEC-06); RTL mirrors layout, numeric columns stay LTR.

### Rejections and exceptions
| Decision | Scope | Rationale | Revisit trigger |
|---|---|---|---|
| "Soft Panel" thesis rejected | Whole system | Panel softness undercuts the unambiguous/not-fragile Design Read; nested raised panels fail gym-readability + anti-pattern | If "Ledger" reads cold/unfinished in usability work |
| `accent` left rule allowed on superset group bar | `ExerciseSection` only | Groups need a strong structural cue; bounded to one component | If it dilutes the recorded-set marker's meaning |
| Android dual neumorphic pair → border + single elevation | Android only | Platform cannot render two shadows; borders already carry containment | If a future dev build adds a capable shadow lib |
| Tinted `WorkoutCard` (from Thesis B) | Today's planned card + selected day only | Makes the primary action read at a glance without adopting panel softness system-wide | If tint spreads or stops reading as "the next thing" |

### Change record
| Date | Decision added | Evidence | Affected surfaces | Approval |
|---|---|---|---|---|
| 2026-09-02 | Initial visual system v1 (VIS-DEC-01…09, VIS-AX-01…10) | this artifact + render v1→v2 | all | AWAITING APPROVAL |

## 12. Traceability

### 12.1 Upstream → visual decision

| Upstream | Visual response |
|---|---|
| UX Experience Read + UX-P1…P5 | §4.1 Design Read (preserved verbatim); VIS-DEC-04/05; §6.6 motion; `SyncIndicator` wording |
| UX anti-qualities | §5.2 avoided patterns; `Toast` never on set path; no celebration motion; tinted card bounded |
| UX §7.3/§7.4 attention orders | §8 focal points and visual weight |
| UX §10 state matrix | §7 component states; §8 states rendered/specified |
| UX-AX-01…10 | VIS-AX-01…10 |
| Invariant #10 (neumorphism = hierarchy only) | VIS-DEC-05, VIS-DEC-06 |
| CON-7 (refined) + human "white sand / Persian blue" | VIS-DEC-03; §6.1 ramps |
| CON-8 (Aeonik licence) | VIS-DEC-07; fallback stack; VIS-AX-09; DEP-2 |
| CON-2 (Expo Go) | §6 feasibility notes; §10.6; VIS-DEC-08; Android shadow fallback |
| NFR-A11Y / NFR-INTL | §9 |
| Product invariant "canonical kg/m/s, convert for presentation" | `NumericField` unit suffix; tabular numerals |

### 12.2 Visual output → downstream consumer

| Consumer | Consumes |
|---|---|
| `software-architecture` | Theme-object shape (§10.6); no new behavioural constraints |
| `client-engineering` | §6 tokens, §7 components (build `SetRow` first), §8 screen application, §9 verification targets, §10.6 implementation notes, VIS-DEC-08 icon dependency |
| `backend-data-engineering` | Chart data must support exact-value callouts + list representation (§6.1); "not enough data yet" needs the specific gating condition per metric |
| `security-identity` | `SyncIndicator` "Saved on device" vs "synced" provenance wording must not overclaim |
| `quality-engineering` | §9 VIS-AX targets, §10.7 acceptance checks, §10.2 as a visual-regression baseline, render as the reference |
| `platform-release` | CON-8/DEP-2 (Aeonik files + licence) gates typography; icon-family version lock |

## 13. Open questions

| ID | Question | Owner | Blocking? | Routed / depends on |
|---|---|---|---|---|
| VIS-OQ-1 | Dark mode at launch vs. token-readiness only. This phase delivers full light + full dark tokens and renders dark for the two hardest screens; a launch dark mode needs dark renders/QA for all surfaces. | Product + `visual-ui-design` | No | Roadmap OQ-8 / UX-OQ-5 |
| VIS-OQ-2 | Exact Aeonik files, weights, and mobile app-distribution licence. Type scale assumes Regular / Medium / Semibold / Bold. | Human | No (fallback ships) | DEP-2, CON-8 |
| VIS-OQ-3 | Final outlined icon family available in the locked Expo Go SDK (Lucide vs Ionicons-outline vs other). | `client-engineering` | No | VIS-DEC-08 |
| VIS-OQ-4 | Is `#9B2C2C` `danger` the only sanctioned non-blue hue, or may chart/warning states use an amber tier? Current system says blue-only + danger; charts differentiate without hue. | `visual-ui-design` | No | Revisit if trend charts prove unreadable mono in usability testing (UX-RISK-3) |
| VIS-OQ-5 | Neumorphic depth on device: will the softened pairs read in real gym light, or should elevation be dropped further toward pure "Ledger" flat + border? | `visual-ui-design` + `quality-engineering` | No | On-device check in the UX §14 study |

## 14. Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| VIS-RISK-1 | Persian blue at `#1C39BB` is dark/saturated; on the warm sand ground large blue fills (CTA, Log button) may feel heavy or vibrate against the beige. | Medium | Medium | Restraint rule limits blue fills to ~1–2 per view; `accentQuiet` for washes; on-device check (VIS-OQ-5); `blue-500` available as a lighter fill if needed. | `visual-ui-design` |
| VIS-RISK-2 | Monochrome + neumorphic system makes completion/PR/selection/error hard to tell apart (carried from UX-RISK-3). | Medium | High | VIS-DEC-06 mandates ≥2 non-hue/non-elevation cues per state; VIS-AX-02 greyscale + screen-reader verification; visual QA gate. | `visual-ui-design`, `quality-engineering` |
| VIS-RISK-3 | "Ledger" flatness reads as austere/unfinished to some users. | Medium | Medium | Reversal condition in §5.1 (reintroduce raised `WorkoutCard` on Today); warmth held by sand ground + Aeonik; revisit after usability. | `visual-ui-design` |
| VIS-RISK-4 | Android cannot render the dual neumorphic pair; the two platforms diverge visually. | High | Low | Documented fallback (border + single elevation) is within the system; borders already carry containment. | `client-engineering` |
| VIS-RISK-5 | Aeonik never licensed; the fallback stack changes perceived character. | Medium | Medium | Layout is typeface-independent by design; `type.metric` tabular behaviour is the load-bearing choice, not the face. | `platform-release`, `visual-ui-design` |
| VIS-RISK-6 | Prototype validated in a browser, not on device; Dynamic Type reflow / VoiceOver order / RTL unverified. | High | Medium | §9 lists them as explicit verification targets for client + quality; not claimed as done. | `client-engineering`, `quality-engineering` |

## 15. Verification performed

| Check | Method | Result |
|---|---|---|
| Lifecycle gate | Read roadmap; phase 2 APPROVED, phase 3 IN PROGRESS | Entry permitted |
| Upstream preservation | Cross-checked every VIS-DEC against UX IA/flows/concepts | No behavioural change; nothing routed back |
| Token completeness | Every semantic token has a role + light + dark value | §6.1 complete |
| Component completeness | 16 components × {semantics, variants, states, tokens, a11y} | §7 complete; `SetRow` fully specified |
| Rendered evidence | HTML prototype built; opened in preview; screenshots inspected at ~470 and ~800 CSS px | Today (light) fully verified post-correction; Set Row ladder, Plan, Progress verified in v1 wide capture; dark verified on thumbnail; preview tooling limited full-page capture — logged as VIS-RISK-6 |
| Critique-and-correction | Fast Read + system inspection of v1; 9 findings; corrections applied; re-render | §10.2; second render stronger; no material defect remains resolvable in-tool |
| Generic-pattern review | Anti-pattern registry + review questions | §10.3 — passes; product-specific moves identified |
| Accessibility frame | Applied §9 checklist as targets (not compliance) | VIS-AX-01…10 recorded for downstream verification |
| Ownership boundary | Confirmed no IA/flow/interaction change; visual-only | Within boundary |

No application code, tokens, fonts, or tests were committed by this phase (render is a disposable prototype under `docs/design/renders/`).

## 16. Status

**`PASS WITH CONDITIONS`.**

A complete visual system is delivered: direction, calibrated dials, selected thesis with a bounded signature move and restraint rule, a full semantic token set (light + dark) built on the "white sand / Persian blue" directive, 16 specified components with states, screen application against the approved structures, a rendered prototype with one documented critique-and-correction pass, a canonical Design Memory, and downstream traceability.

Conditions for the reviewer to accept or defer:

- **VIS-C1:** Rendered validation is a browser prototype, not on-device RN. Dynamic Type reflow, VoiceOver/TalkBack order, RTL, real neumorphic rendering, and measured contrast are **verification targets** (§9) for `client-engineering` / `quality-engineering`, not completed here (VIS-RISK-6).
- **VIS-C2:** Typography assumes Aeonik (Regular/Medium/Semibold/Bold); until DEP-2 (files + licence) lands, the documented fallback stack ships and the system is built typeface-independent (VIS-OQ-2, VIS-RISK-5).
- **VIS-C3:** Dark mode tokens are complete and two hardest screens are rendered dark; a **launch** dark mode still needs dark renders + QA for all surfaces — a Product decision (VIS-OQ-1 / roadmap OQ-8).
- **VIS-C4:** Open items VIS-OQ-3 (icon family), VIS-OQ-4 (amber tier?), VIS-OQ-5 (on-device neumorphic depth) remain; none block architecture.
- **VIS-C5:** Colour direction "white sand / Persian blue" refines CON-7's strict-greyscale reading; recorded in the roadmap (VIS-DEC-03, CON-7 note). If the human intended a *literally* monochrome (greyscale) system with blue only as a single accent, say so and the ramp collapses accordingly.

### Next human decision required

Review `docs/design/visual-ui-design.md` and the render at `docs/design/renders/weight-visual-system-v1.html`. Then record one of:

- `APPROVED — proceed to software-architecture` (optionally accepting VIS-C1…VIS-C5, reproduced in the human review log), or
- `APPROVED WITH CONDITIONS` naming which are accepted vs. must resolve first, or
- revision requests (e.g. palette weight, flat-vs-neumorphic balance, dark-mode scope).

Phase 4 (`software-architecture`) stays `LOCKED` until an explicit human approval is recorded. The lifecycle will not advance automatically.
