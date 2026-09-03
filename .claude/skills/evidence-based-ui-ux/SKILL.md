---
name: evidence-based-ui-ux
description: Design, review, simplify, compare, or evaluate user interfaces and user flows using research-backed UX reasoning and context-sensitive product judgment. Use for websites, apps, dashboards, mobile layouts, wireframes, screenshots, prototypes, usability reviews, interaction flows, concept selection, UX research plans, and UX measurement. Do not use for pure visual styling, branding, illustration, backend-only work, frontend implementation that requires no UX judgment, or as the sole basis for a formal accessibility compliance audit.
---

# Evidence-Based UI/UX

Produce interfaces and recommendations grounded in user goals, task context, observable evidence, and explicit tradeoffs. Treat research findings as conditional evidence rather than universal laws.

This skill owns behavioral structure and experience intent. It may diagnose visual hierarchy when that hierarchy affects comprehension or task performance, but it does not own typography, color, spacing tokens, surface treatment, or a visual design system. Route those decisions to `visual-ui-design`.

## Select the Mode

- **Design:** Turn user goals and constraints into flows, information architecture, interaction behavior, and interface requirements.
- **Review:** Inspect an existing screenshot, mockup, prototype, specification, or implementation and diagnose concrete problems.
- **Simplify:** Reduce unnecessary features, steps, choices, documentation dependence, or cognitive burden while preserving essential capability.
- **Research:** Define scenarios, tasks, participants, methods, and success measures for usability or UX evaluation.
- **Measure:** Choose appropriate behavioral and subjective measures without confusing perceived usability, engagement, satisfaction, and task performance.
- **Compare:** Rank plausible concepts or flows against user, task, context, and evidence instead of choosing the most familiar or fashionable option.

If the request combines modes, use the smallest combination needed to produce the requested outcome.

## Gather the Necessary Context

Determine, from supplied material or the repository:

- primary users and relevant differences between them;
- important tasks and intended outcomes;
- device, orientation, input method, posture, and reach constraints;
- physical environment, interruption patterns, session duration, and connectivity;
- user and data scale, collaboration model, roles, and permissions;
- persistence, offline, synchronization, latency, and recovery behavior;
- business, technical, safety, regulatory, and content constraints;
- whether information architecture and behavior may change or only presentation may change;
- current interface state and available evidence;
- what success means for this request;
- the basis for task frequency, consequence, and priority claims: supplied facts, product data, prior research, or assumptions.

Inspect the actual artifact when one exists. Do not infer an implemented interface from a description when screenshots, code, or a prototype are available.

When no visual or interactive artifact exists, explicitly call the result a **description-based review**. Do not claim to have observed control placement, reachability, contrast, latency, gesture behavior, or other implementation details. Frame them as inferred risks or verification targets.

Ask a focused question only when missing information would materially change the design. Otherwise state the consequential assumption and proceed.

## Apply the Evidence Model

Evaluate the interface across three distinct layers:

1. **Pragmatic usability:** Can users complete important tasks accurately, efficiently, and with recoverable errors?
2. **Experience quality:** What emotions, attention, confidence, autonomy, competence, and perceived attractiveness does the interaction support?
3. **User value and context:** Does the interface help the intended user achieve a worthwhile outcome in the actual environment of use?

Do not allow strength in one layer to conceal failure in another. Visual attractiveness can improve perceived usability, but it does not establish actual task performance. Engagement does not automatically establish usefulness, safety, or satisfaction.

Read [references/ux-foundations.md](references/ux-foundations.md) when designing or reviewing an interface, user flow, information architecture, or feature set.

## Exercise Design Judgment

Taste here means making a coherent choice for this product and these users, not applying a preferred style.

Before selecting or recommending a concept, write an internal **Experience Read**:

> For [user] doing [task] in [context], the experience should feel [two or three qualities] so that [valuable outcome]. It should not feel [specific failure qualities].

Use it to evaluate whether a decision is:

- **appropriate:** fitted to the actual user, task, consequence, and environment;
- **coherent:** reinforcing the same interaction model and experience intent;
- **clear:** making state, priority, next action, and recovery understandable;
- **restrained:** adding only complexity, novelty, or explanation that earns its cost;
- **distinctive where useful:** memorable because of a product-specific decision, not novelty for its own sake;
- **credible:** supported by realistic content, complete states, and honest system behavior.

Keep preference, trend, convention, evidence, and product constraint separate. A familiar pattern is not automatically correct; an unconventional pattern is not automatically innovative. Spend novelty only where it materially improves the product and preserve conventions where familiarity reduces risk or learning cost.

When two or more materially different structures are plausible, sketch at least two concepts at the level needed to expose the tradeoff. Compare them against scenarios, task priority, error cost, learning burden, adaptability, and experience intent. Do not randomize the selection or average incompatible concepts together.

Read [references/design-judgment.md](references/design-judgment.md) when comparing concepts, responding to vague experience language such as “premium” or “simple,” reviewing whether an experience feels intentional, or preparing a handoff to visual design.

## Design or Review the Interface

1. Express each important use case as a concrete scenario containing the user, goal, trigger, context, normal path, likely interruption, error or recovery path, and completion state.
2. Prioritize tasks by importance, frequency, consequence of failure, and user difficulty. Mark estimated rankings as assumptions when product evidence is unavailable.
3. Check whether navigation, hierarchy, labels, controls, feedback, and recovery behavior make those tasks understandable without excessive recall or documentation.
4. Classify the basis of each material claim as **Observed**, **Supplied**, **Inferred**, or **Assumed**. Separate observed defects from inferred risks and personal preferences.
5. Preserve useful conventions unless departing from them solves a demonstrated problem.
6. Remove or defer features that add choice and explanation cost without supporting an important scenario.
7. Use visual hierarchy and coherence to support trust and comprehension, never to disguise weak behavior.
8. Check major states, including empty, loading, success, partial completion, validation, error, offline or unavailable, and destructive-action confirmation when applicable.
9. Define the experience principles and anti-qualities that downstream visual design must preserve. Express them as observable behavior or user perception, not styling instructions.

For an audit, report each material finding with:

- **Evidence:** What is visible, measurable, or supplied by the user.
- **Impact:** Which user and task are affected, and how.
- **Recommendation:** The smallest coherent change that addresses the issue.
- **Rationale:** The relevant research-backed principle and its transfer distance: direct, adjacent, or analogical.
- **Validation:** How to verify that the change improved the intended outcome.

Rank findings by user impact and task consequence, not visual preference. Avoid manufacturing long issue lists from minor stylistic differences.

## Plan or Evaluate UX Research

Start with research questions and representative tasks. Do not begin by choosing a participant count or questionnaire.

- Cover the important task space; participant count alone does not compensate for weak task coverage.
- Do not apply a universal “five users” or “10 ± 2 users” rule. Choose sample size in relation to study purpose, participant diversity, risk, iteration stage, and required confidence.
- Define pilot, iteration, or analysis stopping criteria. Any starting sample figure is provisional until justified by observed variability, coverage, and decision needs.
- Use behavioral measures for actual performance and subjective measures for perception. Do not treat one as a substitute for the other.
- Use longitudinal methods when adoption, learning, loyalty, or changing experience over time matters.
- Combine methods only when each answers a distinct research question.
- When a role or context is thinly specified, recommend targeted discovery for it instead of presenting invented scenarios as validated requirements.
- When available, reconcile proposed priorities with analytics, support tickets, field observations, and prior research; preserve disagreements instead of forcing convergence.

Read [references/evaluation-methods.md](references/evaluation-methods.md) when planning usability tests, heuristic reviews, longitudinal studies, surveys, metrics, or validation.

## Use Research Responsibly

Read [references/evidence-register.md](references/evidence-register.md) when citing a study, making a consequential research claim, or checking whether a finding applies to the present interface.

- Preserve the difference between a study's measured result and the design inference drawn from it.
- State important population, domain, method, and sample limitations.
- Compare the study's population, product type, device, input, environment, task, and consequence with the present case. Treat distant matches as analogical evidence, not validation.
- Prefer direct inspection and task evidence over generalized preference claims.
- Do not turn correlations, perceptions, small studies, or domain-specific findings into unconditional design laws.
- Use heuristics as prompts for inspection. The weight of a finding comes from the user, task, evidence, and consequence, not from naming a heuristic.
- If recommendations depend on current touch-target, contrast, gesture, accessibility, platform, legal, safety, or design-system requirements, verify the current authoritative source before giving implementation specifications. If that verification is outside the task, mark it as an unresolved implementation dependency.
- Do not claim accessibility or platform compliance from this skill's research collection alone.

## Output Contract

Match the deliverable to the request. Provide one or more of:

- a design brief with scenarios, task priorities, flows, interface requirements, and validation criteria;
- a prioritized UI/UX review with evidence, impact, recommendations, rationale, and validation;
- a simplified information architecture or interaction flow;
- a concept comparison and selection rationale grounded in scenarios and consequences;
- an experience-intent handoff containing experience principles, attention and density constraints, required content/states, and anti-qualities for `visual-ui-design`;
- a research plan with questions, tasks, participants, methods, measures, and decision rules;
- a measurement recommendation that distinguishes behavioral and subjective outcomes.

Before completion, verify that:

- recommendations trace to real users, tasks, or supplied evidence;
- usability, experience quality, and user value were not conflated;
- aesthetics were not used as a proxy for task success;
- critical states and recovery paths were considered;
- research methods and measures answer the stated questions;
- study limitations and consequential assumptions are visible;
- description-based risks are not presented as observed defects;
- analogical research is not presented as direct validation;
- preference, trend, convention, evidence, and product constraints were not conflated;
- a selected concept was compared with a materially different alternative when the decision was genuinely open;
- visual-system decisions were routed to `visual-ui-design` rather than smuggled into UX recommendations;
- current platform or accessibility claims were verified or clearly deferred;
- the result contains actionable priorities rather than generic “best practices.”
