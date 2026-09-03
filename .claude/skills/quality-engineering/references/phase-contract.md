# Quality engineering phase contract

## Inputs

Required: accepted requirements and designs, architecture, implementation deltas, security/release conditions, supported environments, roadmap. Optional: production incidents, analytics, device/browser matrix, performance budgets, accessibility target, and test data facilities.

## Execution

1. Build a risk-ranked traceability matrix from requirements and failure modes to evidence.
2. Inventory and evaluate current unit, component, integration, contract, migration, end-to-end, manual, accessibility, performance, resilience, and compatibility coverage.
3. Detect false-positive tests, unstable fixtures, inappropriate mocks, nondeterminism, and missing negative/recovery paths.
4. Add or revise tests at the narrowest layer that proves the behavior; reserve end-to-end tests for essential cross-boundary journeys.
5. Run relevant suites in clean or representative environments and retain commands, versions, and results.
6. Perform exploratory verification for behaviors automation does not reliably prove.
7. Classify defects by impact and release relevance; rerun the original reproduction after fixes.

## Output and review

`docs/quality/release-quality.md` contains scope, traceability matrix, environment, evidence, defects, flaky or unverified areas, non-functional results, security/release condition status, and a release recommendation with rationale.

`PASS` means evidence supports the accepted quality bar, not that every conceivable test exists. Block when critical requirements are untestable, representative environments are unavailable for release-critical behavior, or unresolved severe defects invalidate the evidence.
