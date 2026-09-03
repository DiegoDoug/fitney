---
name: platform-release
description: Implements or validates application build, environments, infrastructure, deployment, distribution, configuration, release, rollback, and migration delivery. Use in the gated platform/release phase after architecture and implementation inputs exist; do not own product requirements, application behavior, or final quality acceptance.
---

# Platform and release

Read `../../skill-system/lifecycle.md`, `../../skill-system/decision-ownership.md`, `../../skill-system/artifact-standard.md`, and `references/phase-contract.md` before working.

Inspect the real build and delivery path, environment configuration, infrastructure definitions, provider state available within authorization, and release constraints. Prefer reproducible, least-privilege, reversible changes. Treat deployment success and application correctness as separate claims.

Never expose secrets or mutate a live environment without the user's authorization. Record required connectors, plugins, MCPs, accounts, or credentials as dependencies and request only the minimum user action when blocked.

Update delivery code/configuration, `docs/platform/platform-release.md`, and the roadmap; submit the phase for approval, report one lifecycle status, and stop.
