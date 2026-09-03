---
name: quality-engineering
description: Builds and evaluates requirement-traceable test strategy and release-quality evidence across application layers, including functional, integration, end-to-end, accessibility, performance, compatibility, and regression risks. Use in the gated quality phase; do not redefine accepted requirements or treat passing tests as sufficient without coverage evidence.
---

# Quality engineering

Read `../../skill-system/lifecycle.md`, `../../skill-system/decision-ownership.md`, `../../skill-system/artifact-standard.md`, and `references/phase-contract.md` before working.

Construct verification from accepted requirements, risks, architecture boundaries, implementation changes, security conditions, and target environments. Inspect existing tests and actual behavior. Choose the cheapest reliable evidence for each risk and avoid duplicative test layers.

When the release changes user-interface structure, styling, components, responsive behavior, or interaction states, read `references/visual-quality-gate.md`. Treat visual fidelity and design-system consistency as requirement-traceable release evidence, not subjective polish. Do not use the quality phase to redefine accepted UX or visual direction.

Fix test defects and phase-owned quality infrastructure. Route product ambiguity or implementation defects to the owner; do not weaken acceptance criteria to obtain a pass.

Update tests and quality tooling, `docs/quality/release-quality.md`, and the roadmap; submit the phase for approval, report one lifecycle status, and stop.
