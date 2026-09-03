# Software architecture phase contract

## Inputs

Required: approved product strategy, approved UX and visual artifacts or recorded waivers, roadmap constraints, and repository evidence for an existing project. Optional: traffic/data estimates, compliance needs, deployment constraints, integrations, cost targets, and prior ADRs.

## Owned decisions and outputs

Primary output: `docs/architecture/system-architecture.md`. Consequential decisions belong in `docs/architecture/adrs/ADR-NNNN-<slug>.md`.

Cover only what the application needs:

- context, trust boundaries, and external systems;
- domain, module, service, and client boundaries;
- key runtime and data flows;
- API/event/integration contracts and ownership;
- data lifecycle, storage, consistency, migration, and recovery constraints;
- quality attributes with measurable architectural implications;
- technology choices, rejected alternatives, tradeoffs, and reversibility;
- deployment topology assumptions without taking platform-release ownership;
- security, operability, and testability implications routed downstream;
- requirement-to-component traceability.

Use diagrams only when they reduce ambiguity. Do not design distributed systems, queues, caches, or abstractions without an evidenced need.

## Blocking and review

Block on unapproved requirements that change fundamental boundaries, incompatible accepted decisions, or missing access to an existing system whose behavior must be preserved. Review every architecture element for a supporting requirement, owner, failure behavior, and verification path.
