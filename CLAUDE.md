# Weight — Claude Code project instructions

## Project

Build **Weight**, a greenfield Expo/React Native mobile workout planner and tracker for iOS and Android phones.

The product has three primary jobs:

1. Log a workout quickly and reliably.
2. Plan training by week using reusable exercises, supersets, workouts, and weeks.
3. Understand training through history, personal records, exercise progress, and workload trends.

Read `SPEC.md` before project work. It is the primary supplied product specification, but its current status is Draft v1: phases must validate and formalize its decisions rather than treating the document as human approval of every lifecycle artifact.

## Human-gated lifecycle

This repository uses a human-gated development lifecycle.

The **Notion Shared Project Memory is the sole canonical source of durable project governance** (lifecycle decisions, ADRs, requirements, phases/gates, risks, reviews) — see governing decision DEC-1 (migration completed 2026-09-02). `.project-memory/` is its generated read-only mirror. `development-roadmap.md` and `docs/` are working/reference material and must not override canonical Notion records; keep the roadmap's lifecycle-state table consistent with Notion but resolve any conflict in Notion's favour.

1. `product-strategy`
2. `evidence-based-ui-ux` — lifecycle role: UX product design
3. `visual-ui-design`
4. `software-architecture`
5. `client-engineering`
6. `backend-data-engineering`
7. `security-identity`
8. `platform-release`
9. `quality-engineering`
10. `production-operations`
11. `implementation-orchestrator`

Before phase work, read:

- `development-roadmap.md`;
- `.claude/skill-system/lifecycle.md`;
- `.claude/skill-system/decision-ownership.md`;
- `.claude/skill-system/artifact-standard.md`;
- the invoked skill's `SKILL.md` and phase contract;
- accepted upstream artifacts relevant to that phase.


## Shared Project Memory

Before planning or implementing project work:

1. Read `.project-memory/README.md`.
2. Read `.project-memory/CURRENT_STATE.md`.
3. Read the relevant approved requirements and accepted ADRs referenced by those files.
4. Treat `.project-memory/` as a generated mirror of canonical Notion knowledge; do not hand-edit it.
5. If code/tests conflict with the mirror, report the discrepancy instead of silently rewriting project intent.
6. If a product/architecture decision is missing or ambiguous, stop at the decision boundary and request a decision.
7. After implementation, report commits/PRs, verification evidence, discovered issues, and any required Notion updates.

For either design phase, also read `.claude/skill-system/design-adapters.md`. Load `.claude/skill-system/capability-attachments.md` only when routing its bounded capabilities.

Execute a phase only when its roadmap state is `UNLOCKED` or `IN PROGRESS`, or when the human explicitly authorizes lifecycle recovery or audit work. A locked phase returns `BLOCKED` without performing domain work.

Classify existing work as `ADOPT`, `VALIDATE`, `REVISE`, or `CREATE`. Complete the owned phase, review it, update its artifact and roadmap entries, set it to `AWAITING APPROVAL`, report exactly one of `PASS`, `PASS WITH CONDITIONS`, `FAIL`, or `BLOCKED`, and stop. Never unlock or start the next phase automatically.

Only an explicit human approval can advance the lifecycle. `implementation-orchestrator` remains locked until phases 1–10 are approved or the human records a specific waiver.

## Authority and conflict order

Use this order when information conflicts:

1. Current human instructions and recorded human approvals.
2. Accepted decisions and approved phase artifacts in the canonical Notion Shared Project Memory (mirrored to `.project-memory/`; `development-roadmap.md` and `docs/` are working/reference).
3. `SPEC.md` requirements and constraints.
4. Observable repository, test, and runtime evidence.
5. Current official platform and dependency documentation.
6. Inferences, defaults, and third-party examples.

Observable implementation may prove that documentation is inaccurate, but it does not silently supersede an accepted decision. Record the conflict and route it to the owning phase.

Do not reinterpret a requirement to make implementation easier. Do not expand MVP scope without an owned decision and human approval.

## Product boundaries

The MVP is single-user and personal. Coaching, teams, social features, nutrition, AI programming, video analysis, wearables, web/desktop authoring, marketplace content, and advanced periodization are out of scope unless the roadmap explicitly changes.

The central experience is a reliable local-first workout session. Prove the offline logging vertical slice before broad screen construction.

Preserve these product invariants:

- Today makes the next workout action obvious.
- A user can record a working set without leaving the active workout.
- Network availability never blocks logging, completion, or active-session recovery.
- Only one active session per user is supported in MVP.
- Templates and plans seed snapshots; later edits never rewrite completed history.
- Performed sets are the source of truth for historical values, PRs, and aggregates.
- Canonical measures are kilograms, meters, and seconds; convert only for presentation.
- Destructive actions preserve recoverability where technically possible.
- Weekly planning is the primary planning model for MVP.

## Technical invariants

- Use React Native, Expo Router, and strict TypeScript.
- Maintain Expo Go compatibility during the prototype/MVP phase. Select compatible package versions with `expo install` and lock them.
- Do not add custom native modules until an approved development-build migration.
- Use `expo-sqlite` as the local operational database and normal read/write source.
- Persist domain mutations transactionally with an outbox entry.
- UI components must not call Supabase directly. Use feature logic, domain services, repository interfaces, local repositories, sync, and the Supabase gateway.
- Use Supabase for authentication and the synchronized Postgres datastore.
- Enable and adversarially test Row Level Security before exposing a user-owned table through the client API.
- Never ship or request a Supabase service-role key in client code or project artifacts.
- Use client-generated UUIDs for offline creation.
- Store instants in UTC, session timezone separately, and plan dates as date-only values.
- Keep migrations forward-only and test fresh creation plus every supported upgrade path.
- Make session completion, outbox replay, synchronization retries, and aggregate recomputation deterministic and idempotent.
- Keep analytics behind an interface and exclude credentials, private notes, workout payloads, and sensitive personal values from production telemetry.

When framework, Expo SDK, Supabase, Apple, Android, accessibility, or store behavior is version-sensitive, verify current official documentation before locking an implementation decision.

## UX and visual invariants

`evidence-based-ui-ux` owns information architecture, flows, interaction behavior, usability structure, and validation intent. `visual-ui-design` owns visual direction, design memory, tokens, typography, color, spacing, components, states, and platform presentation. Neither silently changes the other's accepted decisions.

The visual system is monochromatic, softly neumorphic, utilitarian, data-aware, and restrained. It is custom cross-platform with iOS-adapted interaction logic, not a claim of fully native iOS compliance.

- Treat neumorphism as hierarchy, never as the only signal for interactivity, selection, completion, focus, error, or disabled state.
- Preserve explicit boundaries, strong contrast, realistic gym-light readability, and at least 48 × 48 dp core touch targets.
- Support text scaling, VoiceOver, TalkBack, Reduce Motion, dark/high-contrast behavior, keyboard avoidance, localization, longer labels, and RTL-sensitive layouts.
- Use Aeonik only after the exact files, weights, and mobile distribution license are available. Do not synthesize missing weights.
- Keep numeric content aligned and scannable; prefer list/table rhythm over decorative card grids for dense training data.
- Use rendered artifacts and at least one critique-and-correction pass for high-fidelity design work. Markdown alone is not a completed visual design.
- Preserve iOS safe areas and expected presentations, plus Android back behavior and edge-to-edge insets.

## Engineering and verification behavior

Inspect actual code, configuration, migrations, tests, and runtime behavior before describing an existing implementation. Reuse established patterns when valid; do not rebuild work for conformity alone.

For every implementation change:

- trace it to an accepted requirement or recorded decision;
- implement complete relevant states, including loading, empty, partial, success, validation, failure, permission, offline, and recovery;
- add focused tests at the narrowest reliable layer;
- run the relevant validation commands;
- record changed paths, commands, evidence, limitations, and deferred work in the owning phase artifact;
- avoid claiming visual parity, device coverage, accessibility compliance, or production readiness without representative evidence.

Do not weaken acceptance criteria to obtain a passing test. Route product ambiguity, design conflict, security requirements, and implementation defects to their owners.

## Files and sensitive information

Keep canonical phase artifacts under the paths registered in `development-roadmap.md`. Use repository-relative evidence links rather than duplicating large logs or reports.

Never store credentials, tokens, service-role keys, private user data, or complete sensitive workout payloads in source files, roadmap entries, prompts, logs, screenshots, or test fixtures. Record only the external capability needed, its authorization status, and the minimum safe human action.

If `CLAUDE.md`, `SPEC.md`, an approved artifact, and the implementation disagree materially, stop the affected work, preserve the evidence, and request the smallest decision needed from the correct owner.
