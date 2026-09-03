# Design memory attachment

Use this attachment when continuing an established product, expanding a design system, reviewing consistency, or handing accepted visual decisions to implementation.

The canonical memory lives inside `docs/design/visual-ui-design.md`. Do not create `.interface-design/system.md`, `DESIGN.md`, or another competing source of truth. If the lifecycle adapter is unavailable, use the same single-artifact rule in the project's accepted visual-design document.

## Read and classify

For every existing memory item, classify it as:

- `ADOPT`: still supported by current artifacts and rendered evidence;
- `VALIDATE`: likely valid but needs inspection on the current surface or platform;
- `REVISE`: accepted intent remains valid but the recorded rule is incomplete or contradictory;
- `RETIRE`: superseded by an explicitly accepted decision.

Do not preserve a rule merely because it was recorded. Compare it with current product constraints, platform behavior, accessibility requirements, and implementation evidence.

## What earns persistence

Record only reusable decisions that should guide more than one surface:

- Design Read, experience qualities, and anti-qualities;
- platform system and declared compliance level;
- selected visual thesis, signature move, and restraint rule;
- semantic tokens and meaningful aliases;
- typography, density, spacing, surface, icon, imagery, and motion conventions;
- component anatomy, variants, states, and responsive/adaptive behavior;
- accessibility and localization constraints;
- deliberately rejected patterns and why;
- approved exceptions with scope and revisit trigger.

Do not persist exploratory candidates, inspiration links without decisions, arbitrary one-off values, or page-specific layout details that do not generalize.

## Change discipline

When a new request conflicts with accepted memory:

1. Identify the exact decision and affected surfaces.
2. Determine whether the request is an exception, an extension, or a superseding decision.
3. Preserve the accepted rule until the owner approves the change.
4. Record the rationale, evidence, migration effect, and affected components when superseding it.
5. Revalidate at least one representative existing surface and the new surface.

Use [../../templates/design-memory.md](../../templates/design-memory.md) for the section shape. Keep the memory concise enough to scan before design work.

## Provenance

This attachment adapts the durable-decision concept from [Interface Design](https://github.com/Dammyjay93/interface-design) to this system's existing lifecycle and artifact ownership. It intentionally does not reproduce Interface Design's broad trigger or separate state file.
