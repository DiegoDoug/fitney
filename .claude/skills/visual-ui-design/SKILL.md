---
name: visual-ui-design
description: Transform established product, UX, interaction, wireframe, screenshot, or codebase context into a context-appropriate visual UI system, rendered design, and high-fidelity specification with deliberate visual judgment. Use for visual direction, UI redesign, design-system decisions, tokens, typography, color, spacing, component treatment, visual critique, or platform-native styling. Do not use as the primary skill for user research, information architecture, user flows, low-fidelity wireframes, usability studies, or production frontend implementation alone.
---

# Visual UI Design

Create a visual system that follows the product's needs and feels authored rather than generated. Visual taste means contextual appropriateness, coherent choices, purposeful distinction, restraint, and craft. It is not a fixed house style, automatic minimalism, trend avoidance, or permission to treat an inspiration gallery as evidence.

## Establish the input path

Inspect supplied artifacts before asking questions. Accept outputs from other skills, PRDs, flows, wireframes, screenshots, design files, codebases, brand guides, or a user description.

When `docs/design/visual-ui-design.md` already exists, treat its accepted Design Memory as the continuity source. Use [references/capabilities/design-memory.md](references/capabilities/design-memory.md) to adopt, validate, or explicitly revise established decisions. Do not create a competing hidden design-system file.

- If the input is sufficient, normalize it using [references/input-and-artifact-contract.md](references/input-and-artifact-contract.md).
- If essential fields are missing, ask only for the missing visual-design inputs. Use [prompts/visual-design-intake.md](prompts/visual-design-intake.md) as a question bank, not a mandatory questionnaire.
- Preserve authoritative upstream decisions. Flag a conflict instead of silently redesigning information architecture, flow, or interaction behavior.

Required before committing to a direction: product purpose, primary users and tasks, target platform/form factor, key content, supplied structure, environmental or accessibility constraints, and brand constraints if any. Infer defensible values from evidence and label consequential assumptions.

## Read the room and calibrate taste

Before selecting a visual language, produce a one-line **Design Read**:

> Reading this as [product/surface] for [audience and task], where the interface should feel [qualities] so that [outcome], while avoiding [anti-qualities].

Honor an upstream Experience Read when one exists. Translate the context into four calibrated dials rather than using the same defaults on every project:

- **Familiarity:** conventional and immediately recognizable -> distinctive and unconventional;
- **Density:** spacious and selective -> compact and information-rich;
- **Expression:** restrained and quiet -> art-directed and expressive;
- **Motion:** still and direct -> kinetic and choreographed.

Use named anchors from [references/taste-and-calibration.md](references/taste-and-calibration.md), not fake mathematical precision. The dials are contextual settings, not quality scores.

When the direction is genuinely open, form at least two coherent candidate theses and compare them against the design pressures before selecting one. Do not randomize the choice or blend incompatible directions into a vague compromise.

Give the selected direction one memorable, repeatable **signature move** and a clear restraint rule. Spend distinction where it reinforces the product; keep the rest familiar enough that the signature can register.

## Derive rather than decorate

Use [references/decision-model.md](references/decision-model.md): `context -> pressures -> principles -> platform system -> design direction -> visual system -> component treatment -> validation`.

Keep these axes separate:

- **Platform system:** iOS native, iOS adapted, iOS inspired, Material/Android, web native, desktop native, or custom cross-platform.
- **Design direction:** utilitarian, data-dense, content-first, editorial, immersive, playful, enterprise, brand-forward, premium, or a justified hybrid.
- **Visual techniques:** blur, glass, gradients, flat surfaces, borders, rounding, monochrome, saturation, and similar treatments. Techniques are subordinate to needs.

Challenge aesthetic choices that materially conflict with task performance, accessibility, platform conventions, or content density. Explain the conflict and preserve the intended quality through a safer interpretation when possible.

## Load only relevant knowledge

- Always use [references/principles.md](references/principles.md), [references/taste-and-calibration.md](references/taste-and-calibration.md), and [references/accessibility-and-validation.md](references/accessibility-and-validation.md).
- For components or screen patterns, use [references/components-and-patterns.md](references/components-and-patterns.md).
- Load only the relevant platform file from [references/platforms/](references/platforms/).
- For native or adapted Apple interfaces, also load [references/capabilities/apple-hig-adapter.md](references/capabilities/apple-hig-adapter.md). Official Apple guidance outranks the adapter when they differ.
- For direction selection, use [references/design-directions.md](references/design-directions.md).
- For new UI, redesigns, or output that still feels generic, use [references/anti-patterns.md](references/anti-patterns.md).
- When a visual artifact exists or will be created, use [references/critique-and-iteration.md](references/critique-and-iteration.md).
- Select the actual deliverable with [references/artifact-modes.md](references/artifact-modes.md).
- Before broad live research, use [scripts/search_design_knowledge.py](scripts/search_design_knowledge.py) as described in [references/capabilities/design-knowledge-retrieval.md](references/capabilities/design-knowledge-retrieval.md) to retrieve only relevant local guidance.
- For live research, follow [references/source-policy.md](references/source-policy.md) and select from [references/source-registry.yaml](references/source-registry.yaml). Verify time-sensitive platform guidance against current official documentation.

## Produce the design

1. Summarize the normalized Design Context Profile and Design Read.
2. Rank design pressures as high, medium, or low and connect each high pressure to a design response.
3. Select the platform system and compliance level. Never claim native compliance for an inspired treatment.
4. Compare coherent candidate theses when the direction is open; select one primary direction and at most two supporting qualities.
5. Record the four dials, the signature move, the restraint rule, and the generic treatments this product should avoid.
6. Define composition, hierarchy, density, typography, color roles, spacing, surfaces, iconography, imagery, motion, responsive behavior, and states as one system.
7. Map decisions to supplied screens and components without inventing missing product architecture.
8. State tokens with semantic names; avoid arbitrary one-off values unless required.
9. Include relevant empty, loading, error, success, disabled, focus, selected, destructive, and permission states using realistic content and data.
10. Inspect the rendered result, correct the most consequential hierarchy, rhythm, contrast, clipping, consistency, and generic-template defects, then render again.
11. Update the Design Memory section only for decisions accepted as reusable system rules; keep experiments and page-specific exceptions out of canonical memory.

Use the smallest adequate deliverable: [templates/design-direction.md](templates/design-direction.md), [templates/ui-spec.md](templates/ui-spec.md), [templates/visual-design-brief.md](templates/visual-design-brief.md), or [templates/design-context-profile.yaml](templates/design-context-profile.yaml).

When the user asks to **design** a screen, component set, mockup, high-fidelity UI, or visual redesign, a Markdown specification alone is not a finished deliverable. Produce a rendered artifact using the available design surface or a minimal renderable prototype, plus only the specification needed to explain and implement it. The prototype may be disposable and must not be presented as production implementation. If no rendering tool is available, state that limitation and provide a render-ready specification rather than claiming the design was visually validated.

## Validate before delivery

Ensure every major choice traces to a need, constraint, platform rule, or deliberate brand choice; upstream UX is preserved; the output matches the Design Read; the signature move is product-specific and restrained; hierarchy and density support primary tasks; component semantics and states are clear; accessibility, localization, and responsive behavior are handled; platform claims match the compliance level; source authority fits the claim; and the system is consistent and implementable.

Reject first-draft completion. For rendered work, perform at least one critique-and-correction pass. A technically valid artifact that still has no clear focal point, spatial rhythm, product character, or content realism is not complete.

For substantial skill regressions or comparative evaluation, use [references/capabilities/taste-regression.md](references/capabilities/taste-regression.md) and [tests/taste-regressions.md](tests/taste-regressions.md). These are evaluation resources, not a second runtime design methodology.

If required context remains unavailable, deliver a provisional direction with explicit assumptions and unresolved decisions rather than fabricating certainty.
