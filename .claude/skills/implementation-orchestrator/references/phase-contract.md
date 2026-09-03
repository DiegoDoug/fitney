# Implementation orchestrator phase contract

## Entry and inputs

All phases 1–10 must be `APPROVED` or `APPROVED WITH CONDITIONS`, with every accepted condition and waiver recorded. Required inputs are the roadmap, all registered artifacts, repository, and available runtime/test environments.

If an artifact is missing, stale, contradictory, or unapproved, return `BLOCKED` or route a bounded revision to its owner. Do not infer approval from file existence.

## Integrated execution

1. Audit artifact-to-repository traceability and identify complete, partial, missing, conflicting, and obsolete work.
2. Create `docs/implementation/implementation-plan.md` with dependency graph, vertical slices, owners, acceptance evidence, external capabilities, risk, and rollback/recovery considerations.
3. Inventory required connectors, MCP servers, plugins, APIs, accounts, infrastructure, packages, devices, and human actions. Reuse available capabilities. For each missing item, record purpose, minimum permission, setup owner, blocking scope, and fallback only when it preserves accepted requirements.
4. Sequence work to produce testable vertical slices and keep the repository in a valid state. Respect user authorization before external mutations or production changes.
5. Implement unresolved work directly or invoke the appropriate installed domain skill when specialization is required. Upstream accepted decisions remain binding.
6. Validate each slice at its responsible layer, then run end-to-end journeys across real boundaries available in the environment.
7. Verify failure, permission, offline/degraded, migration, rollback/roll-forward, security, and observability paths proportionate to risk.
8. Reconcile documentation and roadmap state with observable results.

## Output contract

`docs/implementation/verification-report.md` must include:

- approved baseline and waivers;
- implementation-plan completion and changed paths;
- external capability readiness and any user-provided setup still needed;
- requirement/design/architecture/control-to-evidence traceability;
- build, test, migration, deployment, security, and operational verification evidence;
- complete journey results and environment limits;
- unresolved defects, residual risks, deferred work, and owners;
- final readiness status and exact human decision requested.

`PASS` requires observable integrated evidence for the accepted scope. Passing isolated suites, successful deployment, or documentation completeness alone is insufficient.
