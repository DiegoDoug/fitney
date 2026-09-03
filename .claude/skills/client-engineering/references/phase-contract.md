# Client engineering phase contract

## Inputs

Required: approved product, UX, visual, and architecture artifacts; repository/client runtime; roadmap. Optional: device/browser matrix, analytics contract, localization content, API mocks or schemas, and performance budgets.

## Execution

1. Inventory clients, entrypoints, navigation, state, rendering, styling, data access, tests, and build constraints.
2. Map approved requirements and design states to implementation units.
3. Classify existing units as `ADOPT`, `VALIDATE`, `REVISE`, or `CREATE`.
4. Implement complete states: loading, empty, partial, success, validation, failure, permission, offline, and recovery where relevant.
5. Preserve accessibility semantics, keyboard/focus behavior, touch targets, responsive/adaptive behavior, localization readiness, and platform conventions required by the artifacts.
6. Verify API boundaries, cancellation/race behavior, persistence, telemetry, error handling, and performance against the architecture.
7. Add focused automated tests and perform available runtime or device verification.

## Output and review

`docs/engineering/client-implementation.md` records implemented requirements, paths changed, state coverage, API dependencies, tests and commands, observed evidence, limitations, deferred work, and downstream needs.

Do not claim visual parity without visual evidence or device coverage without testing it. Block when a required upstream interaction or contract is contradictory, or when essential implementation access is unavailable.
