# Existing design-skill adapters

These adapters integrate the already-created design skills without replacing their methodology.

## `evidence-based-ui-ux`

- Lifecycle role: `ux-product-design`.
- Entry: phase 1 must be approved unless an explicit roadmap waiver exists.
- Required inputs: roadmap, product strategy artifact, accepted constraints, available user/research evidence, and existing UX artifacts or implementation.
- Owned output: `docs/product/ux-product-design.md` plus any necessary research synthesis, flows, wireframes, or prototype references.
- Preserve: the skill's evidence grading, research logic, UX analysis, and adaptive methodology.
- Add: lifecycle gate, `ADOPT | VALIDATE | REVISE | CREATE` classification, ownership boundary, artifact standard, final review, roadmap update, status, and stop.
- Do not absorb visual styling decisions. Route visual recommendations to `visual-ui-design`.

## `visual-ui-design`

- Lifecycle role: `visual-ui-design`.
- Entry: UX product design must be approved unless an explicit roadmap waiver exists.
- Required inputs: roadmap, product strategy, approved UX structure, target platforms, brand evidence, accessibility constraints, and existing design/implementation.
- Owned output: `docs/design/visual-ui-design.md` plus necessary tokens, component specifications, state matrices, responsive rules, and visual references.
- Preserve: the skill's adaptive selection among iOS HIG, Material, web, desktop, custom, or hybrid design principles and its reference knowledge base.
- Capability attachments: use the canonical Design Memory for continuity, the Apple HIG adapter only for Apple targets, local design-knowledge retrieval before broad research, and the taste regression harness only for skill evaluation. These modules extend the skill; they are not peer design authorities.
- Add: lifecycle gate, `ADOPT | VALIDATE | REVISE | CREATE` classification, ownership boundary, artifact standard, final review, roadmap update, status, and stop.
- Do not silently alter approved information architecture or flows. Return conflicts to `evidence-based-ui-ux`.

For both skills, the shared files `lifecycle.md`, `decision-ownership.md`, and `artifact-standard.md` are binding additions. If an existing instruction conflicts, preserve the domain methodology but apply the stricter lifecycle and human-approval boundary.

For UI-changing releases, `quality-engineering` owns the attached visual quality gate. Its browser evidence and deterministic detectors may challenge an implementation or accepted design with evidence, but they do not transfer visual-design ownership to quality engineering.
