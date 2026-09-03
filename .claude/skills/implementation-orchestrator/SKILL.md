---
name: implementation-orchestrator
description: Integrates all approved full-stack lifecycle outputs into an executable cross-domain plan, discovers required connectors/MCPs/plugins/services, coordinates implementation, tests complete user journeys, and produces final verification evidence. Use only after phases 1–10 are approved or explicitly waived; do not use to bypass gates or silently change upstream decisions.
---

# Implementation orchestrator

Read `../../skill-system/lifecycle.md`, `../../skill-system/decision-ownership.md`, `../../skill-system/artifact-standard.md`, `../../skill-system/system-manifest.yaml`, and `references/phase-contract.md`. Read `development-roadmap.md` and all approved artifacts before planning work.

Reconcile the approved system against the actual repository. Build a dependency-ordered implementation plan, identify missing capabilities and permissions, execute authorized work, and verify the complete story from user entrypoint through client, API, data, external services, deployment behavior, security controls, and observability.

The orchestrator owns sequencing and integration, not domain decisions. Route contradictions to the owning phase and stop affected work. Request connectors, MCPs, plugins, provider access, credentials, or human actions only when required, state why and the minimum scope, and never fabricate availability.

Update the implementation plan, repository, tests, verification report, and roadmap; report one lifecycle status and stop for final human acceptance.
