---
notion_page_id: "3cfe6070-43bc-8046-b281-eb56b92335af"
notion_url: "https://app.notion.com/p/Fitney-3cfe607043bc8046b281eb56b92335af"
last_edited: "2026-09-03T04:29:00.000Z"
generated_at: "2026-09-03T04:29:27.706Z"
---

# Current State

## Focus

Phase 8 (platform-release) AWAITING APPROVAL — execution-evidence gate now SATISFIED. Human 2026-09-03: 'APPROVED - dev-only gate'; ISS-27 resolved to authenticated-only catalogue; git + one hosted fitney-dev project authorised; production deferred; WORK-020 -> phase 5 acceptance condition. Done this pass: git initialised -> github.com/DiegoDoug/fitney (private); db-verify GitHub Actions gate GREEN on main (68/68); hosted fitney-dev (Supabase, Postgres 17, MetaTrack org, $0/mo) provisioned + migrations applied + db lint --linked clean + Supabase security advisor clean (bar 1 intentional INFO) + 31 hosted behavioural checks 31/0 on the real authenticated/anon/service_role roles. 15 defects surfaced across phase-8 execution (F-1..F-14 + ISS-27) all fixed in place under WORK-022 while migrations were unshipped. Local supabase test db = 68/68. NEXT: human approval of phase 8 (and phase 7) -> then client-engineering unlocks. Deferred human steps: production Supabase project, hosted auth hardening (SEC-C2), supabase secrets set + Edge Function deploy, branch protection requiring db-verify. Open: ISS-28 (PG17 vs BD-DEC-01 PG15 — backend to ratify).

## Unresolved Issues

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

- WORK-022 — lifecycle recovery: fix the 15 defects surfaced by phase-8 execution (local + hosted) — Review — Claude Code
- Backend data layer — schema, migrations, sync_apply RPC, recompute, RLS baseline, delete-account, pgTAP — Review — Claude Code
- Validate corrected weekly-aggregate bucketing (week_start + session-local date) vs golden vectors — In Progress — Other Agent
- Hosted auth hardening + secret provisioning + Edge Function dependency pin — Backlog — Human
- Provision DEP-1 (Supabase project) + execute migrations & pgTAP as a CI merge gate — Review — Claude Code
- Security hardening — child→parent ownership FKs, definer recompute, sync_apply hardening, deletion cascade + non-PII receipt, adversarial suite — Review — Claude Code

## Reviews Requiring Attention

- Phase 8 — Platform & Release execution — Pass with Conditions
- Phase 1 — Product strategy approval — Pass with Conditions
- Phase 4 — Software architecture approval (v4, after three revision rounds on sync correctness) — Pass with Conditions
- Phase 2 — UX product design approval — Pass with Conditions
- Phase 3 — Visual UI design approval — Pass with Conditions
- Phase 6 — Backend & Data implementation verification — Pass with Conditions
- Phase 7 — Security & Identity review — Pass with Conditions
