---
notion_page_id: "3cfe6070-43bc-8046-b281-eb56b92335af"
notion_url: "https://app.notion.com/p/Fitney-3cfe607043bc8046b281eb56b92335af"
last_edited: "2026-09-03T15:00:00.000Z"
generated_at: "2026-09-04T15:54:58.478Z"
generator: "notion-project-memory-bridge@0.1.0"
---

# Fitney — Project Memory

Generated from the canonical Notion Shared Project Memory workspace. **Do not edit generated files by hand.**

## Snapshot

- **Status:** In progress
- **Stage:** Build
- **Current focus:** Phase 5 Client Engineering is UNLOCKED but NOT STARTED after human approval of the dev-only gate on 2026-09-03. Phases 6, 7, and 8 are Approved with Conditions; DEP-1 development gate and WORK-022 are complete. Next recommended action: resolve non-blocking ISS-28 by ratifying PostgreSQL 17, enable main branch protection requiring db-verify, then explicitly authorize Phase 5 and build the offline logging vertical slice. WORK-020 is a Phase 5 acceptance condition. Production Supabase and phases 9–11 remain deferred/locked.
- **GitHub:** https://github.com/DiegoDoug/fitney

## Decisions

- [DEC-54 — Approve Phase 5 increment-2 merge + increment-3 verification scope](./decisions/dec-54-approve-phase-5-increment-2-merge-increment-3-verification-scope.md) — **Approved**
- [DEC-53 — Approve CE-R5 v2 (sign-out policy + ADR-0009 update), CE-R6 (required checks), CE-R7 (RN/worklets pins) — bounded implementation](./decisions/dec-53-approve-ce-r5-v2-sign-out-policy-adr-0009-update-ce-r6-required-checks.md) — **Approved**
- [DEC-51 — Exercise catalogue access is authenticated-only](./decisions/dec-51-exercise-catalogue-access-is-authenticated-only.md) — **Approved**
- [DEC-50 — Dev-only platform gate approved; production infrastructure deferred](./decisions/dec-50-dev-only-platform-gate-approved-production-infrastructure-deferred.md) — **Approved**
- [DEC-52 — WORK-020 is a Phase 5 acceptance condition, not a client-unlock prerequisite](./decisions/dec-52-work-020-is-a-phase-5-acceptance-condition-not-a-client-unlock-prerequ.md) — **Approved**
- [DEC-43 — BD-DEC-04 — RLS baseline (enable + force, per-command policies)](./decisions/dec-43-bd-dec-04-rls-baseline-enable-force-per-command-policies.md) — **Superseded**
- [DEC-47 — SEC-DEC-03 — Derived-table write model: ENABLE (not FORCE) RLS, client DML revoked, definer recompute, hardened sync_apply](./decisions/dec-47-sec-dec-03-derived-table-write-model-enable-not-force-rls-client-dml-r.md) — **Approved**
- [DEC-45 — SEC-DEC-01 — Authorization boundary = RLS + SECURITY INVOKER functions + FK integrity, all server-side](./decisions/dec-45-sec-dec-01-authorization-boundary-rls-security-invoker-functions-fk-in.md) — **Approved**
- [DEC-48 — SEC-DEC-04 — Account deletion (OQ-10) = hard cascade + non-PII deletion_receipts outside the user graph](./decisions/dec-48-sec-dec-04-account-deletion-oq-10-hard-cascade-non-pii-deletion-receip.md) — **Approved**
- [DEC-40 — BD-DEC-01 — Server schema: SPEC §9 entities + sync columns; user_id denormalised; server-authoritative metadata](./decisions/dec-40-bd-dec-01-server-schema-spec-9-entities-sync-columns-user-id-denormali.md) — **Approved**
- [DEC-41 — BD-DEC-02 — sync_apply(...) RPC is the single push entry point (SECURITY INVOKER)](./decisions/dec-41-bd-dec-02-sync-apply-rpc-is-the-single-push-entry-point-security-invok.md) — **Approved**
- [DEC-46 — SEC-DEC-02 — Child→parent ownership integrity via composite FKs + soft-ref trigger](./decisions/dec-46-sec-dec-02-child-parent-ownership-integrity-via-composite-fks-soft-ref.md) — **Approved**
- [DEC-49 — SEC-DEC-05 — Global-seed exercises: accepted dual-tenancy exception to user_id NOT NULL, guarded by RLS + trigger](./decisions/dec-49-sec-dec-05-global-seed-exercises-accepted-dual-tenancy-exception-to-us.md) — **Approved**
- [DEC-44 — BD-DEC-05 — delete-account Edge Function skeleton](./decisions/dec-44-bd-dec-05-delete-account-edge-function-skeleton.md) — **Approved**
- [DEC-42 — BD-DEC-03 — Server recompute is trigger-driven, pure, deterministic, idempotent, formula-stamped](./decisions/dec-42-bd-dec-03-server-recompute-is-trigger-driven-pure-deterministic-idempo.md) — **Approved**
- [DEC-38 — AR-DEC-10 — Hot-write acknowledgement v2: ≤100 ms perceived persistence, "recorded" only after commit](./decisions/dec-38-ar-dec-10-hot-write-acknowledgement-v2-100-ms-perceived-persistence-re.md) — **Approved**
- [DEC-32 — AR-DEC-04 — Client-generated UUID PKs; UTC + IANA session tz + date-only plan dates; canonical kg/m/s](./decisions/dec-32-ar-dec-04-client-generated-uuid-pks-utc-iana-session-tz-date-only-plan.md) — **Approved**
- [DEC-36 — AR-DEC-08 — Runtime schema validation (Zod default) at the data/remote gateway and repository inputs](./decisions/dec-36-ar-dec-08-runtime-schema-validation-zod-default-at-the-data-remote-gat.md) — **Approved**
- [DEC-29 — AR-DEC-01 — Local-first: expo-sqlite is the on-device system of record + transactional outbox](./decisions/dec-29-ar-dec-01-local-first-expo-sqlite-is-the-on-device-system-of-record-tr.md) — **Approved**
- [DEC-33 — AR-DEC-05 — Derived data via deterministic idempotent recompute, materialized locally, formula-versioned](./decisions/dec-33-ar-dec-05-derived-data-via-deterministic-idempotent-recompute-material.md) — **Approved**
- [DEC-34 — AR-DEC-06 — Local SQLite schema mirrors Postgres + 3 local-only tables; forward-only migrations](./decisions/dec-34-ar-dec-06-local-sqlite-schema-mirrors-postgres-3-local-only-tables-for.md) — **Approved**
- [DEC-37 — AR-DEC-09 — Authorization is RLS-enforced server-side only; identity seams for deferred guest mode](./decisions/dec-37-ar-dec-09-authorization-is-rls-enforced-server-side-only-identity-seam.md) — **Approved**
- [DEC-30 — AR-DEC-02 — Enforced layered dependency rule with a failing CI boundary check](./decisions/dec-30-ar-dec-02-enforced-layered-dependency-rule-with-a-failing-ci-boundary-.md) — **Approved**
- [DEC-31 — AR-DEC-03 — Sync engine v4: transactional outbox + optimistic concurrency + hybrid pull](./decisions/dec-31-ar-dec-03-sync-engine-v4-transactional-outbox-optimistic-concurrency-h.md) — **Approved**
- [DEC-39 — AR-DEC-11 — Pull completeness guarantee = periodic full (id, version) reconciliation](./decisions/dec-39-ar-dec-11-pull-completeness-guarantee-periodic-full-id-version-reconci.md) — **Approved**
- [DEC-35 — AR-DEC-07 — Client state: Context for UI, one small Zustand store for ephemeral session UI only](./decisions/dec-35-ar-dec-07-client-state-context-for-ui-one-small-zustand-store-for-ephe.md) — **Approved**
- [DEC-24 — VIS-DEC-05 — Restraint rule: only live-session running elements get raised-2 + full blue](./decisions/dec-24-vis-dec-05-restraint-rule-only-live-session-running-elements-get-raise.md) — **Approved**
- [DEC-21 — VIS-DEC-02 — Design direction: Utilitarian primary; Data-dense + Premium-through-restraint](./decisions/dec-21-vis-dec-02-design-direction-utilitarian-primary-data-dense-premium-thr.md) — **Approved**
- [DEC-25 — VIS-DEC-06 — No meaning by hue or elevation alone: every state carries ≥2 cues](./decisions/dec-25-vis-dec-06-no-meaning-by-hue-or-elevation-alone-every-state-carries-2-.md) — **Approved**
- [DEC-22 — VIS-DEC-03 — Palette: single Persian-blue tonal scale on "white sand" ground; refines CON-7 to single-hue](./decisions/dec-22-vis-dec-03-palette-single-persian-blue-tonal-scale-on-white-sand-groun.md) — **Approved**
- [DEC-28 — VIS-DEC-09 — SyncIndicator is an ambient inline row with provenance wording](./decisions/dec-28-vis-dec-09-syncindicator-is-an-ambient-inline-row-with-provenance-word.md) — **Approved**
- [DEC-27 — VIS-DEC-08 — One outlined icon family from the locked Expo Go SDK; no SF Symbols; no imagery in MVP](./decisions/dec-27-vis-dec-08-one-outlined-icon-family-from-the-locked-expo-go-sdk-no-sf-.md) — **Approved**
- [DEC-23 — VIS-DEC-04 — Signature move: the Set Row](./decisions/dec-23-vis-dec-04-signature-move-the-set-row.md) — **Approved**
- [DEC-20 — VIS-DEC-01 — Platform system: custom cross-platform, iOS-adapted; not native-HIG compliant](./decisions/dec-20-vis-dec-01-platform-system-custom-cross-platform-ios-adapted-not-nativ.md) — **Approved**
- [DEC-26 — VIS-DEC-07 — Typeface: Aeonik via expo-font, gated on files/licence; documented fallback ships meanwhile](./decisions/dec-26-vis-dec-07-typeface-aeonik-via-expo-font-gated-on-files-licence-docume.md) — **Approved**
- [DEC-7 — DEC-003 — Offline-first reliability is a P0 product invariant](./decisions/dec-7-dec-003-offline-first-reliability-is-a-p0-product-invariant.md) — **Approved**
- [DEC-6 — DEC-002 — Three primary product jobs](./decisions/dec-6-dec-002-three-primary-product-jobs.md) — **Approved**
- [DEC-5 — DEC-001 — MVP is single-user and personal; broad feature classes out of scope](./decisions/dec-5-dec-001-mvp-is-single-user-and-personal-broad-feature-classes-out-of-s.md) — **Approved**
- [DEC-10 — DEC-006 — Product IA intent: persistent five-position bottom navigation](./decisions/dec-10-dec-006-product-ia-intent-persistent-five-position-bottom-navigation.md) — **Approved**
- [DEC-19 — UX-DEC-09 — Experience-intent handoff for visual design](./decisions/dec-19-ux-dec-09-experience-intent-handoff-for-visual-design.md) — **Approved**
- [DEC-13 — UX-DEC-03 — Active-workout layout = full scrollable session with sticky active-exercise context](./decisions/dec-13-ux-dec-03-active-workout-layout-full-scrollable-session-with-sticky-ac.md) — **Approved**
- [DEC-9 — DEC-005 — Prioritized product requirement set adopted (FR-*/NFR- with P0–P3)](./decisions/dec-9-dec-005-prioritized-product-requirement-set-adopted-fr-nfr-with-p0-p3.md) — **Approved**
- [DEC-15 — UX-DEC-05 — Plan tab = week strip + selected-day detail](./decisions/dec-15-ux-dec-05-plan-tab-week-strip-selected-day-detail.md) — **Approved**
- [DEC-16 — UX-DEC-06 — "Log a past workout": Log sheet primary + secondary action in Progress → History](./decisions/dec-16-ux-dec-06-log-a-past-workout-log-sheet-primary-secondary-action-in-pro.md) — **Approved**
- [DEC-14 — UX-DEC-04 — Naming: centre action, tabs, session-end, local-state wording](./decisions/dec-14-ux-dec-04-naming-centre-action-tabs-session-end-local-state-wording.md) — **Approved**
- [DEC-17 — UX-DEC-07 — Set completion = tap-to-complete with inline undo, no per-set dialog](./decisions/dec-17-ux-dec-07-set-completion-tap-to-complete-with-inline-undo-no-per-set-d.md) — **Approved**
- [DEC-12 — UX-DEC-02 — Settings behind a top-right avatar control on Today](./decisions/dec-12-ux-dec-02-settings-behind-a-top-right-avatar-control-on-today.md) — **Approved**
- [DEC-8 — DEC-004 — Weekly planning primary; performed sets are source of truth; snapshot-not-reference](./decisions/dec-8-dec-004-weekly-planning-primary-performed-sets-are-source-of-truth-sna.md) — **Approved**
- [DEC-18 — UX-DEC-08 — Back/recovery behaviour across the app](./decisions/dec-18-ux-dec-08-back-recovery-behaviour-across-the-app.md) — **Approved**
- [DEC-11 — UX-DEC-01 — Five-position bottom nav validated; Log is a raised action sheet, not a destination](./decisions/dec-11-ux-dec-01-five-position-bottom-nav-validated-log-is-a-raised-action-sh.md) — **Approved**
- [DEC-2 — Platform Release is the next lifecycle phase](./decisions/dec-2-platform-release-is-the-next-lifecycle-phase.md) — **Approved**
- [DEC-4 — 300-second re-auth heuristic is development-only](./decisions/dec-4-300-second-re-auth-heuristic-is-development-only.md) — **Approved**
- [DEC-3 — Phase 7 remains unapproved until verification executes](./decisions/dec-3-phase-7-remains-unapproved-until-verification-executes.md) — **Approved**
- [DEC-1 — Notion is the sole canonical governance source](./decisions/dec-1-notion-is-the-sole-canonical-governance-source.md) — **Approved**

## Architecture Decisions

- [ADR-6 — ADR-0003 — Sync engine: transactional outbox + optimistic concurrency + hybrid pull (incremental cursor + full reconciliation)](./adrs/adr-6-adr-0003-sync-engine-transactional-outbox-optimistic-concurrency-hybri.md) — **Accepted**
- [ADR-7 — ADR-0007 — Client state management and data access](./adrs/adr-7-adr-0007-client-state-management-and-data-access.md) — **Accepted**
- [ADR-8 — ADR-0008 — Schema validation at the API and repository boundaries](./adrs/adr-8-adr-0008-schema-validation-at-the-api-and-repository-boundaries.md) — **Accepted**
- [ADR-9 — ADR-0009 — Authorization is RLS-enforced; identity seams for deferred guest mode](./adrs/adr-9-adr-0009-authorization-is-rls-enforced-identity-seams-for-deferred-gue.md) — **Accepted**
- [ADR-2 — ADR-0002 — Enforced layered dependency rule](./adrs/adr-2-adr-0002-enforced-layered-dependency-rule.md) — **Accepted**
- [ADR-5 — ADR-0006 — Local schema mirrors Postgres; forward-only numbered migrations](./adrs/adr-5-adr-0006-local-schema-mirrors-postgres-forward-only-numbered-migration.md) — **Accepted**
- [ADR-4 — ADR-0005 — Derived data (PRs, aggregates): deterministic recompute, materialized, idempotent](./adrs/adr-4-adr-0005-derived-data-prs-aggregates-deterministic-recompute-materiali.md) — **Accepted**
- [ADR-1 — ADR-0001 — Local-first: SQLite is the system of record, with a transactional outbox](./adrs/adr-1-adr-0001-local-first-sqlite-is-the-system-of-record-with-a-transaction.md) — **Accepted**
- [ADR-3 — ADR-0004 — Identifiers and time model](./adrs/adr-3-adr-0004-identifiers-and-time-model.md) — **Accepted**

## Requirements

- [REQ-70 — NFR-INTL — Dates, decimals, first day of week, units localized; layouts tolerate longer labels and RTL](./requirements/req-70-nfr-intl-dates-decimals-first-day-of-week-units-localized-layouts-tole.md) — **Approved**
- [REQ-67 — NFR-PRIVACY — Sensitive values excluded from production telemetry; retention/deletion defined before beta](./requirements/req-67-nfr-privacy-sensitive-values-excluded-from-production-telemetry-retent.md) — **Approved**
- [REQ-64 — NFR-PERF — Today and active workout render from local data; set confirmation feedback same-frame, persists without blocking](./requirements/req-64-nfr-perf-today-and-active-workout-render-from-local-data-set-confirmat.md) — **Approved**
- [REQ-55 — FR-SET-02 — Export: user data as JSON, completed sets/sessions as CSV](./requirements/req-55-fr-set-02-export-user-data-as-json-completed-sets-sessions-as-csv.md) — **Approved**
- [REQ-57 — FR-SET-04 — Unit changes affect presentation only; stored canonical values stay kg/m/s](./requirements/req-57-fr-set-04-unit-changes-affect-presentation-only-stored-canonical-value.md) — **Approved**
- [REQ-56 — FR-SET-03 — Account deletion: re-auth, confirmation, server-side cascade/anonymization, completion receipt](./requirements/req-56-fr-set-03-account-deletion-re-auth-confirmation-server-side-cascade-an.md) — **Approved**
- [REQ-60 — FR-SYNC-03 — Sync runs after auth, on foreground, on connectivity restore, on manual retry, on debounced change; failed ops retained with backoff](./requirements/req-60-fr-sync-03-sync-runs-after-auth-on-foreground-on-connectivity-restore-.md) — **Approved**
- [REQ-65 — NFR-A11Y — WCAG AA contrast; screen-reader name/role/value/state; state never by colour/elevation alone; ≥48 dp targets](./requirements/req-65-nfr-a11y-wcag-aa-contrast-screen-reader-name-role-value-state-state-ne.md) — **Approved**
- [REQ-66 — NFR-SEC — Row-level isolation on every exposed user-owned table/view, per-command policies, adversarially tested before client exposure; no privileged key in client](./requirements/req-66-nfr-sec-row-level-isolation-on-every-exposed-user-owned-table-view-per.md) — **Approved**
- [REQ-58 — FR-SYNC-01 — Local store serves all normal reads/writes; network never on the critical path](./requirements/req-58-fr-sync-01-local-store-serves-all-normal-reads-writes-network-never-on.md) — **Approved**
- [REQ-63 — NFR-OFFLINE — Logging, completion, active-session recovery never depend on connectivity](./requirements/req-63-nfr-offline-logging-completion-active-session-recovery-never-depend-on.md) — **Approved**
- [REQ-62 — FR-SYNC-05 — If another device holds an active session, the user is shown a conflict choice; two active sessions never auto-merged](./requirements/req-62-fr-sync-05-if-another-device-holds-an-active-session-the-user-is-shown.md) — **Approved**
- [REQ-59 — FR-SYNC-02 — "Saved" means saved on this device; a distinct indicator exposes Saved/Syncing/Offline/Needs-attention](./requirements/req-59-fr-sync-02-saved-means-saved-on-this-device-a-distinct-indicator-expos.md) — **Approved**
- [REQ-54 — FR-SET-01 — Configurable: unit, week start, rest timer, haptics/sound, theme, plate increments](./requirements/req-54-fr-set-01-configurable-unit-week-start-rest-timer-haptics-sound-theme-.md) — **Approved**
- [REQ-68 — NFR-DATA-INTEGRITY — Performed sets are source of truth; PRs/aggregates deterministic idempotent; snapshots; kg/m/s; client UUIDs; forward-only migrations](./requirements/req-68-nfr-data-integrity-performed-sets-are-source-of-truth-prs-aggregates-d.md) — **Approved**
- [REQ-61 — FR-SYNC-04 — No unsynced mutation silently discarded; destructive overwrite of completed history needs explicit action + recoverable conflict copy](./requirements/req-61-fr-sync-04-no-unsynced-mutation-silently-discarded-destructive-overwri.md) — **Approved**
- [REQ-71 — NFR-PORTABILITY — Runs on iOS + Android phones via the selected Expo Go SDK; architected to move to a dev build before production](./requirements/req-71-nfr-portability-runs-on-ios-android-phones-via-the-selected-expo-go-sd.md) — **Approved**
- [REQ-69 — NFR-RELIABILITY — Non-critical analytics/sync failures never crash the active workout; recovery/replay/completion/recompute idempotent](./requirements/req-69-nfr-reliability-non-critical-analytics-sync-failures-never-crash-the-a.md) — **Approved**
- [REQ-48 — FR-LIB-03 — A small, legally usable exercise catalog is seeded; user-created exercises stay private](./requirements/req-48-fr-lib-03-a-small-legally-usable-exercise-catalog-is-seeded-user-creat.md) — **Approved**
- [REQ-50 — FR-LIB-05 — Supersets reference exercises + order but may override prescriptions when inserted](./requirements/req-50-fr-lib-05-supersets-reference-exercises-order-but-may-override-prescri.md) — **Approved**
- [REQ-44 — FR-DATA-09 — Charts expose exact values on selection and never rely on color alone](./requirements/req-44-fr-data-09-charts-expose-exact-values-on-selection-and-never-rely-on-c.md) — **Approved**
- [REQ-51 — FR-LIB-06 — Templates are versionable; completed sessions always keep a denormalized display snapshot](./requirements/req-51-fr-lib-06-templates-are-versionable-completed-sessions-always-keep-a-d.md) — **Approved**
- [REQ-52 — FR-LIB-07 — Archived entities leave default creation/search but stay visible in historical records](./requirements/req-52-fr-lib-07-archived-entities-leave-default-creation-search-but-stay-vis.md) — **Approved**
- [REQ-46 — FR-LIB-01 — Library holds Exercises, Supersets, Workout Templates, Week Templates](./requirements/req-46-fr-lib-01-library-holds-exercises-supersets-workout-templates-week-tem.md) — **Approved**
- [REQ-49 — FR-LIB-04 — Exercise fields: name, aliases, muscles, equipment, tracking mode, unilateral, instructions, archive](./requirements/req-49-fr-lib-04-exercise-fields-name-aliases-muscles-equipment-tracking-mode.md) — **Approved**
- [REQ-45 — FR-DATA-10 — Editing/deleting a completed session triggers deterministic idempotent recompute](./requirements/req-45-fr-data-10-editing-deleting-a-completed-session-triggers-deterministic.md) — **Approved**
- [REQ-43 — FR-DATA-08 — Trends cover weekly completed workouts, sets, volume, per-exercise e1RM](./requirements/req-43-fr-data-08-trends-cover-weekly-completed-workouts-sets-volume-per-exer.md) — **Approved**
- [REQ-47 — FR-LIB-02 — Each collection supports search, sort, recent, create, duplicate, edit, archive, insert/use](./requirements/req-47-fr-lib-02-each-collection-supports-search-sort-recent-create-duplicate.md) — **Approved**
- [REQ-41 — FR-DATA-06 — Estimated 1RM uses Epley for 2–10 reps; not computed for invalid inputs](./requirements/req-41-fr-data-06-estimated-1rm-uses-epley-for-2-10-reps-not-computed-for-inv.md) — **Approved**
- [REQ-53 — FR-LIB-08 — Deletion is blocked where it would break history; archive or soft-delete instead](./requirements/req-53-fr-lib-08-deletion-is-blocked-where-it-would-break-history-archive-or-.md) — **Approved**
- [REQ-40 — FR-DATA-05 — PR categories: max load, e1RM, rep PR at a load, session volume; each records its formula/category](./requirements/req-40-fr-data-05-pr-categories-max-load-e1rm-rep-pr-at-a-load-session-volume.md) — **Approved**
- [REQ-42 — FR-DATA-07 — Working volume for weight_reps = load_kg × reps; warmups excluded from the headline](./requirements/req-42-fr-data-07-working-volume-for-weight-reps-load-kg-reps-warmups-exclude.md) — **Approved**
- [REQ-32 — FR-PLAN-07 — Move/duplicate use explicit day actions; drag-and-drop is enhancement-only](./requirements/req-32-fr-plan-07-move-duplicate-use-explicit-day-actions-drag-and-drop-is-en.md) — **Approved**
- [REQ-28 — FR-PLAN-03 — A planned workout can be added, edited, duplicated, moved, archived, deleted](./requirements/req-28-fr-plan-03-a-planned-workout-can-be-added-edited-duplicated-moved-arch.md) — **Approved**
- [REQ-36 — FR-DATA-01 — Progress has four peer views: Overview, History, PRs, Trends](./requirements/req-36-fr-data-01-progress-has-four-peer-views-overview-history-prs-trends.md) — **Approved**
- [REQ-37 — FR-DATA-02 — History filters by date range, exercise, workout name, completion status](./requirements/req-37-fr-data-02-history-filters-by-date-range-exercise-workout-name-complet.md) — **Approved**
- [REQ-39 — FR-DATA-04 — Exercise detail: recent performances, max load, e1RM, best set by reps, volume, frequency](./requirements/req-39-fr-data-04-exercise-detail-recent-performances-max-load-e1rm-best-set-.md) — **Approved**
- [REQ-31 — FR-PLAN-06 — Planned exercises carry the full prescription set](./requirements/req-31-fr-plan-06-planned-exercises-carry-the-full-prescription-set.md) — **Approved**
- [REQ-30 — FR-PLAN-05 — A planned workout can be created from blank, template, or prior completed session](./requirements/req-30-fr-plan-05-a-planned-workout-can-be-created-from-blank-template-or-pri.md) — **Approved**
- [REQ-29 — FR-PLAN-04 — A week can be created from blank, previous week, or week template](./requirements/req-29-fr-plan-04-a-week-can-be-created-from-blank-previous-week-or-week-temp.md) — **Approved**
- [REQ-33 — FR-PLAN-08 — A plan records each session as unstarted, active, completed, skipped, or missed](./requirements/req-33-fr-plan-08-a-plan-records-each-session-as-unstarted-active-completed-s.md) — **Approved**
- [REQ-26 — FR-PLAN-01 — The week is the default and primary planning unit](./requirements/req-26-fr-plan-01-the-week-is-the-default-and-primary-planning-unit.md) — **Approved**
- [REQ-34 — FR-PLAN-09 — Starting a plan creates a session snapshot; later plan edits never mutate that session](./requirements/req-34-fr-plan-09-starting-a-plan-creates-a-session-snapshot-later-plan-edits.md) — **Approved**
- [REQ-35 — FR-PLAN-10 — Applying template updates to an existing future plan requires preview + explicit confirmation](./requirements/req-35-fr-plan-10-applying-template-updates-to-an-existing-future-plan-requir.md) — **Approved**
- [REQ-38 — FR-DATA-03 — Completed history shows the values performed, never current template values](./requirements/req-38-fr-data-03-completed-history-shows-the-values-performed-never-current-.md) — **Approved**
- [REQ-27 — FR-PLAN-02 — Navigate previous/next week and jump to current week](./requirements/req-27-fr-plan-02-navigate-previous-next-week-and-jump-to-current-week.md) — **Approved**
- [REQ-24 — FR-LOG-13 — Numeric entry: decimals, hardware keyboard, configurable plate increments](./requirements/req-24-fr-log-13-numeric-entry-decimals-hardware-keyboard-configurable-plate-.md) — **Approved**
- [REQ-13 — FR-LOG-02 — Session states: draft, active, completed, cancelled](./requirements/req-13-fr-log-02-session-states-draft-active-completed-cancelled.md) — **Approved**
- [REQ-23 — FR-LOG-12 — Exactly one active session per user](./requirements/req-23-fr-log-12-exactly-one-active-session-per-user.md) — **Approved**
- [REQ-15 — FR-LOG-04 — Default visible per-set fields: load, reps/metric, completion, previous](./requirements/req-15-fr-log-04-default-visible-per-set-fields-load-reps-metric-completion-p.md) — **Approved**
- [REQ-12 — FR-LOG-01 — Session can be created from plan, template, prior workout, or empty](./requirements/req-12-fr-log-01-session-can-be-created-from-plan-template-prior-workout-or-e.md) — **Approved**
- [REQ-14 — FR-LOG-03 — Set types: warmup, working, drop, failure, backoff](./requirements/req-14-fr-log-03-set-types-warmup-working-drop-failure-backoff.md) — **Approved**
- [REQ-20 — FR-LOG-09 — Rest timer: +15 s, skip, pause, silent/vibration preference](./requirements/req-20-fr-log-09-rest-timer-15-s-skip-pause-silent-vibration-preference.md) — **Approved**
- [REQ-18 — FR-LOG-07 — Exercises groupable into ordered supersets/circuits with a shared label](./requirements/req-18-fr-log-07-exercises-groupable-into-ordered-supersets-circuits-with-a-s.md) — **Approved**
- [REQ-21 — FR-LOG-10 — Accidental session loss is prevented; completed workouts recoverable](./requirements/req-21-fr-log-10-accidental-session-loss-is-prevented-completed-workouts-reco.md) — **Approved**
- [REQ-16 — FR-LOG-05 — Optional per-set/session fields hidden until requested](./requirements/req-16-fr-log-05-optional-per-set-session-fields-hidden-until-requested.md) — **Approved**
- [REQ-22 — FR-LOG-11 — Finish flow shows duration, exercises, working sets, volume, PRs, notes before confirmation](./requirements/req-22-fr-log-11-finish-flow-shows-duration-exercises-working-sets-volume-prs.md) — **Approved**
- [REQ-17 — FR-LOG-06 — In-session add/duplicate/reorder/skip/substitute/remove without leaving the session](./requirements/req-17-fr-log-06-in-session-add-duplicate-reorder-skip-substitute-remove-with.md) — **Approved**
- [REQ-19 — FR-LOG-08 — A completed set is persisted locally immediately and remains editable](./requirements/req-19-fr-log-08-a-completed-set-is-persisted-locally-immediately-and-remains.md) — **Approved**
- [REQ-25 — FR-LOG-14 — Tracking modes: weight_reps, reps, duration, distance; UI renders only relevant fields](./requirements/req-25-fr-log-14-tracking-modes-weight-reps-reps-duration-distance-ui-renders.md) — **Approved**
- [REQ-2 — FR-AUTH-02 — Secrets only in platform-secure storage; no privileged server credential in client](./requirements/req-2-fr-auth-02-secrets-only-in-platform-secure-storage-no-privileged-serve.md) — **Approved**
- [REQ-5 — FR-AUTH-05 — Per-owner isolation of every user-owned server record](./requirements/req-5-fr-auth-05-per-owner-isolation-of-every-user-owned-server-record.md) — **Approved**
- [REQ-4 — FR-AUTH-04 — Guest mode ships only if guest→account migration is atomic and lossless](./requirements/req-4-fr-auth-04-guest-mode-ships-only-if-guest-account-migration-is-atomic-.md) — **Approved**
- [REQ-1 — FR-AUTH-01 — Email/password auth with persisted session](./requirements/req-1-fr-auth-01-email-password-auth-with-persisted-session.md) — **Approved**
- [REQ-6 — FR-TODAY-01 — Today shows date, seven-day strip, selected-day state](./requirements/req-6-fr-today-01-today-shows-date-seven-day-strip-selected-day-state.md) — **Approved**
- [REQ-8 — FR-TODAY-03 — Planned workout for the day offers start, edit, move, overflow](./requirements/req-8-fr-today-03-planned-workout-for-the-day-offers-start-edit-move-overflo.md) — **Approved**
- [REQ-7 — FR-TODAY-02 — An active workout is surfaced above all other Today content](./requirements/req-7-fr-today-02-an-active-workout-is-surfaced-above-all-other-today-conten.md) — **Approved**
- [REQ-10 — FR-TODAY-05 — Today shows a compact weekly status](./requirements/req-10-fr-today-05-today-shows-a-compact-weekly-status.md) — **Approved**
- [REQ-11 — FR-TODAY-06 — Today links to the most recent completed workout, not a long feed](./requirements/req-11-fr-today-06-today-links-to-the-most-recent-completed-workout-not-a-lon.md) — **Approved**
- [REQ-9 — FR-TODAY-04 — With no plan, Today offers repeat-last, choose-template, start-empty](./requirements/req-9-fr-today-04-with-no-plan-today-offers-repeat-last-choose-template-star.md) — **Approved**
- [REQ-3 — FR-AUTH-03 — Onboarding collects only the minimal profile set](./requirements/req-3-fr-auth-03-onboarding-collects-only-the-minimal-profile-set.md) — **Approved**

## Open Issues

- [ISS-28 — ISS-28: hosted + local + CI are Postgres 17, not the Postgres 15 assumed by BD-DEC-01](./issues/iss-28-iss-28-hosted-local-ci-are-postgres-17-not-the-postgres-15-assumed-by-.md) — **Decision Needed**
- [ISS-19 — AR-OQ-1–4: Architecture open questions (UUIDv7, Zod vs valibot, recompute form, reactive query layer)](./issues/iss-19-ar-oq-1-4-architecture-open-questions-uuidv7-zod-vs-valibot-recompute-.md) — **Open**
- [ISS-20 — BD-OQ-3–4: Backend optimisation / retention questions (sync_apply batching; processed_operations pruning)](./issues/iss-20-bd-oq-3-4-backend-optimisation-retention-questions-sync-apply-batching.md) — **Open**
- [ISS-22 — Accessibility / visual-verification risk: monochrome + neumorphic system and unverified-on-device visual design](./issues/iss-22-accessibility-visual-verification-risk-monochrome-neumorphic-system-an.md) — **Open**
- [ISS-8 — OQ-1: Final product name, icon, and brand wordmark undecided](./issues/iss-8-oq-1-final-product-name-icon-and-brand-wordmark-undecided.md) — **Decision Needed**
- [ISS-15 — OQ-9 / DEP-4: Analytics / crash-reporting provider + privacy consent model not chosen](./issues/iss-15-oq-9-dep-4-analytics-crash-reporting-provider-privacy-consent-model-no.md) — **Decision Needed**
- [ISS-23 — Foundation risk: expo-sqlite guarantees, reactive query layer, boundary-lint wiring, and schema/snapshot drift](./issues/iss-23-foundation-risk-expo-sqlite-guarantees-reactive-query-layer-boundary-l.md) — **Open**
- [ISS-21 — Correctness risk: sync protocol + client/server recompute parity + unexecuted server controls](./issues/iss-21-correctness-risk-sync-protocol-client-server-recompute-parity-unexecut.md) — **Open**
- [ISS-11 — OQ-4 / DEP-3: Seeded exercise catalogue + content licence not identified](./issues/iss-11-oq-4-dep-3-seeded-exercise-catalogue-content-licence-not-identified.md) — **Decision Needed**
- [ISS-14 — OQ-8 / UX-OQ-5 / VIS-OQ-1: Dark mode at launch vs token-readiness only](./issues/iss-14-oq-8-ux-oq-5-vis-oq-1-dark-mode-at-launch-vs-token-readiness-only.md) — **Decision Needed**
- [ISS-9 — OQ-2 / DEP-2: Aeonik font files + mobile app distribution licence not available](./issues/iss-9-oq-2-dep-2-aeonik-font-files-mobile-app-distribution-licence-not-avail.md) — **Decision Needed**
- [ISS-12 — OQ-5 / OQ-6: Post-MVP progress-calc questions (bodyweight/assisted load; alternative e1RM formulas)](./issues/iss-12-oq-5-oq-6-post-mvp-progress-calc-questions-bodyweight-assisted-load-al.md) — **Decision Needed**
- [ISS-17 — UX-OQ-1–4: Usability baselines (SM-1…SM-7) and onboarding-depth questions unresolved](./issues/iss-17-ux-oq-1-4-usability-baselines-sm-1-sm-7-and-onboarding-depth-questions.md) — **Open**
- [ISS-10 — OQ-3: Ship guest mode? Only if guest→account migration is atomic and lossless](./issues/iss-10-oq-3-ship-guest-mode-only-if-guest-account-migration-is-atomic-and-los.md) — **Decision Needed**
- [ISS-18 — VIS-OQ-3–5: Visual-system on-device questions (icon family, amber tier, neumorphic depth)](./issues/iss-18-vis-oq-3-5-visual-system-on-device-questions-icon-family-amber-tier-ne.md) — **Open**
- [ISS-13 — OQ-7 / AR-OQ-5 / UX-OQ-6: Multi-device simultaneous-edit conflict review UX](./issues/iss-13-oq-7-ar-oq-5-ux-oq-6-multi-device-simultaneous-edit-conflict-review-ux.md) — **Open**
- [ISS-16 — DEP-5: EAS build / distribution, app signing, and store accounts not set up](./issues/iss-16-dep-5-eas-build-distribution-app-signing-and-store-accounts-not-set-up.md) — **Open**
- [ISS-6 — SEC-OQ-1: data-retention / backup / PITR policy for non-deleted data is unspecified](./issues/iss-6-sec-oq-1-data-retention-backup-pitr-policy-for-non-deleted-data-is-uns.md) — **Decision Needed**
- [ISS-4 — SEC-RESID-1: delete-account re-auth is a 300s freshness heuristic, not nonce-based reauthentication](./issues/iss-4-sec-resid-1-delete-account-re-auth-is-a-300s-freshness-heuristic-not-n.md) — **Open**
- [ISS-7 — BD-OQ-1: corrected weekly-aggregate bucketing needs backend validation against golden vectors](./issues/iss-7-bd-oq-1-corrected-weekly-aggregate-bucketing-needs-backend-validation-.md) — **Open**

## Roadmap

- [REL-16 — MVP release](./milestones/rel-16-mvp-release.md) — **Planned**
- [REL-12 — Gate — DEP-1 execution gate (migrations + pgTAP + lint green on a provisioned Supabase project)](./milestones/rel-12-gate-dep-1-execution-gate-migrations-pgtap-lint-green-on-a-provisioned.md) — **Approved**
- [REL-14 — Gate — Sync-protocol conformance suite (against real Supabase)](./milestones/rel-14-gate-sync-protocol-conformance-suite-against-real-supabase.md) — **Planned**
- [REL-13 — Gate — Dependency-boundary lint CI gate](./milestones/rel-13-gate-dependency-boundary-lint-ci-gate.md) — **Planned**
- [REL-15 — Gate — Pre-beta security gate](./milestones/rel-15-gate-pre-beta-security-gate.md) — **Planned**
- [REL-9 — Phase 9 — Quality engineering](./milestones/rel-9-phase-9-quality-engineering.md) — **Planned**
- [REL-7 — Phase 7 — Security and identity](./milestones/rel-7-phase-7-security-and-identity.md) — **Approved**
- [REL-1 — Phase 1 — Product strategy](./milestones/rel-1-phase-1-product-strategy.md) — **Approved**
- [REL-5 — Phase 5 — Client engineering](./milestones/rel-5-phase-5-client-engineering.md) — **Active**
- [REL-2 — Phase 2 — UX product design (evidence-based-ui-ux)](./milestones/rel-2-phase-2-ux-product-design-evidence-based-ui-ux.md) — **Approved**
- [REL-4 — Phase 4 — Software architecture](./milestones/rel-4-phase-4-software-architecture.md) — **Approved**
- [REL-3 — Phase 3 — Visual UI design](./milestones/rel-3-phase-3-visual-ui-design.md) — **Approved**
- [REL-6 — Phase 6 — Backend and data engineering](./milestones/rel-6-phase-6-backend-and-data-engineering.md) — **Approved**
- [REL-11 — Phase 11 — Integrated implementation (implementation-orchestrator)](./milestones/rel-11-phase-11-integrated-implementation-implementation-orchestrator.md) — **Planned**
- [REL-10 — Phase 10 — Production operations](./milestones/rel-10-phase-10-production-operations.md) — **Planned**
- [REL-8 — Phase 8 — Platform and release](./milestones/rel-8-phase-8-platform-and-release.md) — **Approved**

## Recent Handoffs

- [RUN-2 — Phase 8 — Platform Release execution handoff](./handoffs/run-2-phase-8-platform-release-execution-handoff.md) — **Started**
- [RUN-1 — Backend & Security implementation — lifecycle phases 6–7 (authored, unexecuted)](./handoffs/run-1-backend-security-implementation-lifecycle-phases-6-7-authored-unexecut.md) — **Completed**
