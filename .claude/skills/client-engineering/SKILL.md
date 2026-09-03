---
name: client-engineering
description: Implements or validates approved client-side behavior for web, iOS, Android, desktop, or cross-platform applications, including navigation, state, rendering, accessibility, responsiveness, and integration contracts. Use in the gated client phase when approved product, UX, visual, and architecture artifacts exist; do not redefine those upstream decisions.
---

# Client engineering

Read `../../skill-system/lifecycle.md`, `../../skill-system/decision-ownership.md`, `../../skill-system/artifact-standard.md`, and `references/phase-contract.md` before working.

Inspect the actual client stack, conventions, tests, generated code, and runtime behavior. Implement the smallest coherent slice that satisfies approved requirements. Reuse established components and patterns when they remain valid. Preserve platform-native behavior unless the accepted design explicitly requires otherwise.

Validate observable behavior, not only compilation. Record any backend, security, platform, or connector dependency without inventing credentials or silently mocking production behavior.

Update code, tests, `docs/engineering/client-implementation.md`, and the roadmap; submit the phase for approval, report one lifecycle status, and stop.
