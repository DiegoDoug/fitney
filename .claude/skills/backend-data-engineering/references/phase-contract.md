# Backend and data engineering phase contract

## Inputs

Required: approved product, design, and architecture artifacts; repository and schema evidence; roadmap. Optional: production-like data characteristics, API consumers, retention rules, integration sandboxes, performance targets, and migration windows.

## Execution

- Inventory domain services, APIs/events, schemas, migrations, jobs, storage, caches, and integrations.
- Trace accepted requirements to handlers, domain logic, data changes, and observable outcomes.
- Define request/response and failure contracts, validation, concurrency behavior, authorization integration points, and idempotency where retries are possible.
- Design schema changes with forward and rollback/roll-forward behavior, compatibility window, backfill strategy, and data validation.
- Bound queries and work; measure critical paths when performance matters.
- Isolate external services behind explicit contracts, timeouts, retries, and reconciliation behavior justified by their semantics.
- Add tests at the narrowest reliable layer plus integration or migration evidence for material boundaries.

## Output and review

`docs/engineering/backend-data-implementation.md` records requirement coverage, contracts, schema/migration changes, integration dependencies, paths changed, tests and commands, evidence, limitations, data risks, and downstream security/platform/quality needs.

Block on incompatible architecture contracts, unknown destructive migration scope, missing authority for material data mutation, or unavailable required systems. Never label a migration safe without evidence covering existing data and failure recovery.
