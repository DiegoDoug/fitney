# Critique and Iteration

Use this reference whenever a screenshot, prototype, design file, or rendered implementation exists. Critique the artifact, not the intention alone.

## Run the Fast Read

Inspect the unannotated view first.

1. **One-second focal point:** What wins attention first? Is that correct?
2. **Ten-second scan:** Can the primary content, state, and action be understood without reading every label?
3. **Squint test:** Which masses and colors dominate? Do they match the intended hierarchy?
4. **Type-only test:** Without imagery or color, does typography still communicate structure?
5. **Container test:** Which borders, cards, fills, or shadows can be removed without losing meaning?

## Inspect the System

Review:

- composition and reading path;
- local grouping and page-level rhythm;
- type roles, line length, wrapping, and hierarchy;
- color roles, saturation, contrast, and semantic redundancy;
- optical alignment, icon weight, radii, borders, and elevation;
- realistic content, long values, empty data, errors, and edge cases;
- hover, focus, pressed, selected, disabled, loading, success, error, permission, and destructive states as applicable;
- reflow, priority, overflow, text scaling, localization, and input-mode changes;
- whether motion clarifies state and orientation or merely delays the interface;
- whether the result still matches the Design Read, dials, signature move, and restraint rule.

## Prioritize Findings

Record each material finding as:

- **Observation:** what is visible;
- **Effect:** what it does to attention, comprehension, confidence, or task performance;
- **Cause:** the system decision or missing rule behind it;
- **Correction:** the smallest coherent change;
- **Verification:** what to inspect after correction.

Fix in this order unless context demands otherwise:

1. wrong hierarchy or missing task/state information;
2. accessibility, clipping, overflow, or interaction-state failure;
3. composition and responsive structure;
4. typography and spatial rhythm;
5. color and surface coherence;
6. craft details and distinctive expression.

Do not spend the first iteration polishing icons while the composition is wrong.

## Compare and Re-render

For a major uncertainty, create a controlled alternative that changes one consequential decision: composition, density, type voice, or color architecture. Compare it against the same Design Read and pressures. Do not make many unrelated changes and then guess which helped.

Apply the strongest corrections, render again at representative sizes and states, and repeat the fast read. One critique pass is the minimum for generated visual work; continue while a material defect remains and the available tools can resolve it.

## Completion Standard

The artifact is ready when:

- the intended focal point and reading order are obvious;
- content relationships are visible without excessive containers;
- real content and edge cases do not break the system;
- the design has a recognizable product-specific move without visual noise;
- platform, accessibility, and responsive claims are honest;
- the second render is materially stronger than the first.
