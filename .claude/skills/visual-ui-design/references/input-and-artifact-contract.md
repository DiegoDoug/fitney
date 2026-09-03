# Input and artifact contract

Normalize any source into a Design Context Profile. Do not require upstream tools to emit a particular format.

## Evidence precedence

1. Explicit current user requirements
2. Approved artifacts and product constraints
3. Observable behavior in an existing product or codebase
4. Brand and platform documentation
5. Reasonable inference, labeled when consequential

When sources conflict, surface the conflict instead of silently merging incompatible decisions.

## Minimum fields

| Field | Why it matters | Evidence examples |
|---|---|---|
| Product purpose | Sets hierarchy and tone | PRD, brief, statement |
| Primary users | Determines familiarity/support | research, personas |
| Primary tasks | Determines emphasis/density | flows, analytics |
| Platform/form factor | Selects conventions/ergonomics | targets, screenshots |
| Content types | Shapes layout and type | sample data, schemas |
| Existing structure | Preserves UX boundaries | IA, flows, wireframes |
| Environment | Affects contrast and reach | usage scenario |
| Accessibility | Establishes constraints | policy, audience |
| Brand constraints | Bounds expression | guide, assets |
| Technical constraints | Keeps it implementable | framework, OS support |

Approved research, strategy, IA, flows, interaction models, wireframes, and prototypes are authoritative within their scope. Visual UI may interpret hierarchy, select treatment, identify missing states, or propose a labeled UX change. It may not silently change routes, task order, object relationships, labels, or interaction architecture for appearance.

Proceed without questions when remaining ambiguity can be expressed as an assumption. Ask when a missing answer would change platform choice, core density, component semantics, brand direction, safety, or success criteria.
