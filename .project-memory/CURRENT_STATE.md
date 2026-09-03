---
notion_page_id: "3cfe6070-43bc-8046-b281-eb56b92335af"
notion_url: "https://app.notion.com/p/Fitney-3cfe607043bc8046b281eb56b92335af"
last_edited: "2026-09-03T02:49:00.000Z"
generated_at: "2026-09-03T02:49:48.578Z"
---

# Current State

## Focus

Phase 8 (platform-release) AWAITING APPROVAL. WORK-022 lifecycle recovery COMPLETE 2026-09-02: first local execution of the authored data/security layer (local Supabase, Postgres 15.8) surfaced 12 defects (F-1..F-12; F-5 & F-9 High — both broke the recompute path at runtime; inspection had missed all of them). Human-authorised narrow recovery across security-identity (migration 0006: F-2/F-5/F-8/F-11) + backend-data-engineering (migration 0003: F-7/F-9) + pgTAP suites (F-1/F-3/F-4/F-6/F-10/F-12) fixed everything in place (migrations unshipped). Re-verified: supabase db reset x2 clean, supabase db lint clean (warning + error), supabase test db = PASS 68/68, runtime probes green. SEC-RESID-2 resolved; db-verify CI gate added. NEXT: (1) human authorises hosted DEP-1 (dev + prod Supabase projects) + git init/GitHub repo; (2) platform-release re-runs db reset/test db/db lint on the hosted project against the real role model + wires the CI gate green; (3) client-TS <-> server recompute golden-vector cross-run (WORK-020); (4) ISS-27 decision (anon read of seed catalogue). Phases 6 & 7 stay NOT approved (DEC-3: zero hosted-executed tests); client-engineering stays LOCKED.

## Unresolved Issues

- F-10 / ISS-27: should the anon key expose the global seed-exercise catalogue? — Decision Needed
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
- DEP-1: no Supabase project provisioned — blocks all backend/security execution & verification — Investigating
- SEC-RESID-1: delete-account re-auth is a 300s freshness heuristic, not nonce-based reauthentication — Open
- BD-OQ-1: corrected weekly-aggregate bucketing needs backend validation against golden vectors — Open

## Active Implementation

- WORK-022 — lifecycle recovery: fix the 12 defects surfaced by phase-8 first execution — Review — Claude Code
- Backend data layer — schema, migrations, sync_apply RPC, recompute, RLS baseline, delete-account, pgTAP — Review — Claude Code
- Validate corrected weekly-aggregate bucketing (week_start + session-local date) vs golden vectors — In Progress — Other Agent
- Hosted auth hardening + secret provisioning + Edge Function dependency pin — Backlog — Human
- Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate — In Progress — Claude Code
- Security hardening — child→parent ownership FKs, definer recompute, sync_apply hardening, deletion cascade + non-PII receipt, adversarial suite — Review — Claude Code

## Reviews Requiring Attention

- Phase 8 — Platform & Release execution — Pass with Conditions
- Phase 1 — Product strategy approval — Pass with Conditions
- Phase 4 — Software architecture approval (v4, after three revision rounds on sync correctness) — Pass with Conditions
- Phase 2 — UX product design approval — Pass with Conditions
- Phase 3 — Visual UI design approval — Pass with Conditions
- Phase 6 — Backend & Data implementation verification — Pass with Conditions
- Phase 7 — Security & Identity review — Pass with Conditions
