# Taste regression attachment

Use this attachment to evaluate whether a skill revision improves contextual design judgment rather than merely changing prose or producing a fashionable surface.

## Evaluation method

Run the same blind prompt through the baseline and candidate skill versions. Remove implementation identifiers from the outputs before review when practical. Compare the rendered artifacts and decision records on:

- contextual fit to user, task, environment, and platform;
- clarity of hierarchy, next action, state, and recovery;
- coherence among composition, type, color, spacing, components, and motion;
- product-specific character rather than generic template styling;
- restraint: one or a few earned distinctive moves instead of decoration everywhere;
- realistic content, complete states, and credible density;
- accessibility and native-platform integrity;
- implementation clarity and internal consistency.

Score each dimension `0` (material failure), `1` (weak), `2` (credible), or `3` (strong). A candidate must not improve expression by reducing task clarity, accessibility, platform integrity, or state completeness.

## Adversarial checks

Look specifically for:

- the same gradient, glass card, rounded container, or hero composition across unrelated products;
- generic adjectives standing in for a visual thesis;
- novelty concentrated in navigation or controls without a user benefit;
- inspiration references treated as proof;
- visual polish masking missing error, empty, loading, permission, or offline states;
- a design that cannot explain what it deliberately refused to do.

Use [../../tests/taste-regressions.md](../../tests/taste-regressions.md) as the stable prompt set. Record regressions and correct the skill before packaging.

## Provenance

This attachment turns ideas associated with [Taste Skill](https://github.com/Leonxlnx/taste-skill) into a bounded evaluation harness. Runtime design authority remains in this skill's context model, calibration, and critique workflow.
