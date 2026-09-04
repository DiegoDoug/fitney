---
notion_page_id: "3cfe6070-43bc-8046-b281-eb56b92335af"
notion_url: "https://app.notion.com/p/Fitney-3cfe607043bc8046b281eb56b92335af"
last_edited: "2026-09-03T15:00:00.000Z"
generated_at: "2026-09-04T16:34:53.942Z"
---

# Current State

## Focus

Phase 5 Client Engineering is UNLOCKED but NOT STARTED after human approval of the dev-only gate on 2026-09-03. Phases 6, 7, and 8 are Approved with Conditions; DEP-1 development gate and WORK-022 are complete. Next recommended action: resolve non-blocking ISS-28 by ratifying PostgreSQL 17, enable main branch protection requiring db-verify, then explicitly authorize Phase 5 and build the offline logging vertical slice. WORK-020 is a Phase 5 acceptance condition. Production Supabase and phases 9–11 remain deferred/locked.

## Unresolved Issues

- sync_apply optimistic-concurrency check is a TOCTOU race under true concurrent writers -- can silently drop a conflicting edit — Open
- ISS-28: hosted + local + CI are Postgres 17, not the Postgres 15 assumed by BD-DEC-01 — Decision Needed
- AR-OQ-1–4: Architecture open questions (UUIDv7, Zod vs valibot, recompute form, reactive query layer) — Open
- BD-OQ-3–4: Backend optimisation / retention questions (sync_apply batching; processed_operations pruning) — Open
- Accessibility / visual-verification risk: monochrome + neumorphic system and unverified-on-device visual design — Open
- OQ-1: Final product name, icon, and brand wordmark undecided — Decision Needed
- OQ-9 / DEP-4: Analytics / crash-reporting provider + privacy consent model not chosen — Decision Needed
- Foundation risk: expo-sqlite guarantees, reactive query layer, boundary-lint wiring, and schema/snapshot drift — Open
- Correctness risk: sync protocol + client/server recompute parity + unexecuted server controls — Open
- OQ-4 / DEP-3: Seeded exercise catalogue + content licence not identified — Decision Needed
- OQ-8 / UX-OQ-5 / VIS-OQ-1: Dark mode at launch vs token-readiness only — Decision Needed
- OQ-2 / DEP-2: Aeonik font files + mobile app distribution licence not available — Decision Needed
- OQ-5 / OQ-6: Post-MVP progress-calc questions (bodyweight/assisted load; alternative e1RM formulas) — Decision Needed
- UX-OQ-1–4: Usability baselines (SM-1…SM-7) and onboarding-depth questions unresolved — Open
- OQ-3: Ship guest mode? Only if guest→account migration is atomic and lossless — Decision Needed
- VIS-OQ-3–5: Visual-system on-device questions (icon family, amber tier, neumorphic depth) — Open
- OQ-7 / AR-OQ-5 / UX-OQ-6: Multi-device simultaneous-edit conflict review UX — Open
- DEP-5: EAS build / distribution, app signing, and store accounts not set up — Open
- SEC-OQ-1: data-retention / backup / PITR policy for non-deleted data is unspecified — Decision Needed
- SEC-RESID-1: delete-account re-auth is a 300s freshness heuristic, not nonce-based reauthentication — Open
- BD-OQ-1: corrected weekly-aggregate bucketing needs backend validation against golden vectors — Open

## Active Implementation

- Backend data layer — schema, migrations, sync_apply RPC, recompute, RLS baseline, delete-account, pgTAP — Review — Claude Code
- Validate corrected weekly-aggregate bucketing (week_start + session-local date) vs golden vectors — Ready — Claude Code
- Hosted auth hardening + secret provisioning + Edge Function dependency pin — Backlog — Human
- Security hardening — child→parent ownership FKs, definer recompute, sync_apply hardening, deletion cascade + non-PII receipt, adversarial suite — Review — Claude Code

## Reviews Requiring Attention

- Phase 5 — Client engineering: increment 2 (auth → per-user SQLite isolation → onboarding) — ready for review — In Review
- Phase 5 — Client engineering: increment 1 (Foundation + logic layers) — in review, revisions requested — In Review
- Phase 8 — Platform & Release human approval (dev-only gate) — Pass with Conditions
- Phase 7 — Security & Identity human approval after hosted verification — Pass with Conditions
- Phase 8 — Platform & Release execution — Pass with Conditions
- Phase 1 — Product strategy approval — Pass with Conditions
- Phase 4 — Software architecture approval (v4, after three revision rounds on sync correctness) — Pass with Conditions
- Phase 2 — UX product design approval — Pass with Conditions
- Phase 3 — Visual UI design approval — Pass with Conditions
- Phase 6 — Backend & Data implementation verification — Pass with Conditions
- Phase 7 — Security & Identity review — Pass with Conditions
