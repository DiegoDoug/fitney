# Production operations phase contract

## Inputs

Required: accepted product criticality, architecture, implementation, security, platform, and quality evidence; target runtime; roadmap. Optional: historical traffic/incidents, provider telemetry, support model, staffing, business hours, cost limits, and contractual availability targets.

## Execution

- Identify critical journeys, dependencies, saturation points, failure modes, data-loss boundaries, and security-relevant events.
- Define service indicators and objectives that reflect user-visible outcomes; distinguish objectives from aspirational targets.
- Instrument structured logs, metrics, traces, audit events, and correlation identifiers proportionate to diagnosis needs and privacy constraints.
- Define actionable alerts with threshold rationale, evaluation window, severity, owner, response, and noise control.
- Establish health/readiness semantics, capacity signals, backup/restore verification, data recovery objectives, and dependency degradation behavior.
- Create runbooks for likely high-impact incidents, release rollback/roll-forward, credential or key incidents, and data recovery where relevant.
- Define post-release checks, escalation, incident learning, telemetry retention, and cost review.

## Output and review

`docs/operations/production-operations.md` records operational model, SLI/SLO definitions, telemetry map, alerts, dashboards, runbooks, recovery evidence, ownership, post-release plan, cost/privacy constraints, and gaps.

Block when no operator can own critical alerts, recovery requirements are unknown for material data, production behavior cannot be observed sufficiently, or release-critical operational gaps remain unresolved.
