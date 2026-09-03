---
name: production-operations
description: Designs, implements, or validates runtime health, observability, SLOs, alerts, incident response, runbooks, capacity, recovery, and post-release operating readiness. Use in the gated operations phase for production-bound or production systems; do not own application scope or treat dashboards alone as operational readiness.
---

# Production operations

Read `../../skill-system/lifecycle.md`, `../../skill-system/decision-ownership.md`, `../../skill-system/artifact-standard.md`, and `references/phase-contract.md` before working.

Derive operational controls from critical user journeys, architecture failure modes, data/recovery needs, security signals, and release behavior. Inspect available runtime evidence. Prefer actionable signals tied to user impact over high-volume telemetry.

Do not create paging rules without an owner and response action. Do not mutate production monitoring, traffic, or data without explicit authorization.

Update observability/configuration/runbooks, `docs/operations/production-operations.md`, and the roadmap; submit the phase for approval, report one lifecycle status, and stop.
