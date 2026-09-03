# Design-Judgment Simulation Suite

| Scenario | Activate? | Expected judgment path | Boundary |
| --- | ---: | --- | --- |
| “Compare two onboarding flows for first-time coaches” | Yes | Experience Read, scenarios, concept comparison, ranked rationale | Do not choose by visual novelty |
| “Make this checkout feel premium” with no further meaning | Yes, focused clarification or translation | Convert “premium” into behavioral hypotheses before changing flow | Route styling to `visual-ui-design` |
| “Pick a font and color palette for this approved flow” | No | `visual-ui-design` owns the decision | Do not output styling tokens |
| “Make the dashboard simpler” where experts compare 30 metrics | Yes | Preserve required comparison, move complexity rather than delete it | Minimal does not mean empty |
| “Invent an unconventional navigation just to stand out” | Yes | Challenge novelty cost, preserve convention unless product value justifies departure | Distinctive is not automatically better |
| Screenshot-only review with no interaction evidence | Yes | Report observations and inferred risks separately | Do not claim behavior was observed |
| Two concepts are plausible but evidence is thin | Yes | Compare tradeoffs, name assumptions, identify evidence that could reverse selection | Do not average incompatible concepts |
| “Make this iPad screen look native” | No or compose | Visual/platform direction belongs to `visual-ui-design` | UX skill may supply behavior constraints only |

Expected production status: PASS when the core workflow produces context-specific experience intent, compares real alternatives when needed, and preserves the ownership boundary with `visual-ui-design`.
