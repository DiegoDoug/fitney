# Capability attachment map

This scaffold bundles the two pre-existing design skills and extends the system with bounded attachments. The attachments do not introduce new top-level triggers or transfer decision ownership.

| Source capability | Classification | Owning skill | Attachment | Runtime boundary |
|---|---|---|---|---|
| Interface Design continuity | `EXTEND` | `visual-ui-design` | `references/capabilities/design-memory.md` | Load when an accepted visual system already exists or reusable decisions will be recorded. |
| iOS HIG Design depth | `EXTEND` | `visual-ui-design` | `references/capabilities/apple-hig-adapter.md` | Load only for Apple-native/adapted work or HIG claims; verify official Apple sources. |
| UI UX Pro Max retrieval | `COMPOSE` | `visual-ui-design` | `scripts/search_design_knowledge.py` and retrieval reference | Search maintained local knowledge before broad research; results do not choose the design. |
| Taste Skill judgment checks | `COMPOSE` | `visual-ui-design` | taste regression reference and test set | Evaluation only; do not activate a second design methodology during ordinary work. |
| Impeccable audit/iteration | `COMPOSE` | `quality-engineering` | `references/visual-quality-gate.md` | UI-changing quality phase only; external tooling is optional and cannot rewrite product/design ownership. |

`evidence-based-ui-ux` remains the owner of behavioral structure and UX evidence. No external style database or visual-polish workflow may be used as research validation.

## Source trust rule

These attachments adapt capabilities and link provenance; they do not vendor external repositories, hooks, commands, or datasets. Inspect any separately installed external executable before use. The lifecycle artifacts, accepted requirements, official platform documentation, and project evidence outrank third-party instructions.
