# Visual quality gate attachment

Use this attachment when a release changes rendered UI, design tokens, components, responsive/adaptive behavior, or visible interaction states. Skip it for changes with no credible visual or interaction impact.

## Required inputs

- accepted UX and visual artifacts, including the current Design Memory;
- implemented routes, states, components, and target environment matrix;
- representative realistic data, long content, empty content, and error cases;
- baseline evidence when the change is expected to preserve appearance;
- accessibility and platform acceptance criteria.

If accepted visual requirements are missing or contradictory, route the gap upstream. Quality engineering may describe the defect but must not invent a new design direction.

## Evidence loop

1. Select risk-ranked representative screens, viewports/devices, appearances, input modes, and states.
2. Render the actual implementation in a browser, simulator, device, or component environment.
3. Capture screenshots and observable runtime evidence with build/version identifiers.
4. Run deterministic checks available in the project: console/runtime errors, accessibility scans, overflow/clipping, broken assets, responsive thresholds, focus order/visibility, semantic roles/names, token violations, contrast, and visual regression.
5. Perform a human visual read for hierarchy, density, rhythm, state clarity, realistic content, platform integrity, and consistency with the accepted signature/restraint decisions.
6. Classify findings by user impact and release relevance. Separate detected facts from reviewer judgment.
7. Route implementation defects to `client-engineering`; route accepted-design conflicts to `visual-ui-design`; keep test/tooling defects in this phase.
8. Reproduce the original issue after correction and refresh the evidence.

Do not claim visual parity from DOM snapshots, compilation, or unit tests alone. Do not claim device coverage from a responsive browser viewport when native device behavior matters.

## Optional Impeccable integration

If [Impeccable](https://github.com/pbakaus/impeccable) is already installed and compatible with the active agent environment, its audit, deterministic detectors, and live browser iteration may supply additional evidence.

- Use audit/detector behavior as an input to this gate, not as independent design authority.
- Do not run initialization that creates competing `PRODUCT.md` or `DESIGN.md` files; the lifecycle artifacts remain canonical.
- Do not automatically apply commands that make the design bolder, quieter, more animated, or differently styled. Such changes belong to the accepted visual direction or require upstream review.
- Inspect hooks, scripts, dependencies, and generated changes before adoption.
- Record the version, command, environment, findings, false positives, and rerun result.

The gate remains executable without Impeccable through the project's existing browser, accessibility, screenshot, and test tooling.

## Release-quality record

Add a concise section to `docs/quality/release-quality.md` containing:

- scope and environment matrix;
- accepted visual requirements traced to evidence;
- screenshots or visual-regression artifact paths;
- automated and manual checks performed;
- defects, severity, owner, and resolution status;
- untested devices/states and resulting release condition;
- final visual-quality recommendation.

## Completion rule

Pass only when release-critical UI requirements have representative rendered evidence, severe defects are resolved or explicitly accepted, and the evidence distinguishes automated detection from human design judgment.
