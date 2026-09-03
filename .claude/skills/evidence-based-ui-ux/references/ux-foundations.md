# UX Foundations

Read this reference when designing or reviewing an interface, flow, information architecture, or feature set.

## Scenario Before Screen

Represent the interface as part of human activity, not as an isolated collection of screens. A useful scenario records:

- user and relevant capabilities;
- goal and reason it matters;
- initiating event;
- physical, social, and technical context;
- information available at each decision;
- normal path, interruption, error, recovery, and completion;
- effects on other people or connected systems.

Scenarios are concrete enough to expose consequences but flexible enough to compare alternatives. Use them to connect design choices to work rather than to decorate a predetermined layout.

Evidence basis: Carroll's scenario-based design analysis and Baxter and Sommerville's socio-technical framing.

## Context Is a Design Input

Do not reduce context to screen size. Determine which of these conditions can change the interaction:

- device, orientation, input method, posture, reach, and whether one or both hands are available;
- lighting, noise, weather, movement, protective equipment, and social setting;
- interruptions, attention switching, session duration, and urgency;
- number of users, records, items, or repeated actions;
- connectivity, latency, persistence, synchronization, and recovery guarantees;
- roles, permissions, handoffs, collaboration, and downstream recipients;
- safety, regulatory, financial, or data-loss consequences;
- whether the team can change behavior and information architecture or only visual presentation.

Classify each material context claim as supplied, observed, inferred, or assumed. If no artifact exists, describe implementation-dependent concerns as risks to verify rather than defects already observed.

## Separate Three Dimensions of UX

### Pragmatic usability

Evaluate whether users can understand the current state, choose an appropriate action, complete the task, detect errors, recover, and confirm the result. Use task performance evidence where possible.

### Affect and experience quality

Evaluate how the interaction supports confidence, autonomy, competence, relatedness, stimulation, security, and meaning. Treat these as possible experience mechanisms, not a mandatory checklist for every product.

### User value

Evaluate whether successful use produces an outcome the user actually values. A technically usable flow can still be irrelevant, intrusive, or poorly matched to the user's environment.

Evidence basis: Park et al.'s usability–affect–value model; Hassenzahl, Diefenbach, and Göritz's study of need fulfilment and affect; van Schaik and Ling's model of pragmatic and hedonic quality.

## Aesthetics and Perceived Usability

Visual attractiveness can influence perceived usability before and after interaction. Use this finding to justify coherent hierarchy, spacing, typography, and visual quality as part of the experience.

Do not infer that attractiveness improves actual task performance. Review perceived usability and observed performance separately. When they diverge, report the divergence rather than averaging it away.

Evidence basis: Tractinsky, Katz, and Ikar; van Schaik and Ling.

## Complexity, Features, and Documentation

Every visible option adds recognition, comparison, explanation, and maintenance cost. Preserve a feature when it supports an important scenario strongly enough to justify that cost.

Prefer:

- essential capability visible at the point of need;
- progressive disclosure for advanced or infrequent controls;
- labels and feedback that reduce dependence on manuals;
- defaults that serve the common safe case while preserving necessary control;
- contextual help for concepts users cannot reasonably infer.

Do not interpret “users do not read manuals” as a ban on documentation. Safety-critical, technical, and infrequent complex work may require durable instructions. The interface should not depend on documentation to explain routine behavior that can be made self-evident.

Evidence basis: Blackler et al.'s longitudinal and questionnaire studies of excess features and documentation.

## Engagement Is Multidimensional

Engagement may involve perceived usability, aesthetics, focused attention, felt involvement, novelty, and endurability. These dimensions interact, but they are not interchangeable.

Do not optimize attention or novelty when the task benefits from rapid completion, low interruption, calmness, or safe disengagement. Define which form of engagement serves the user's goal before recommending it.

Evidence basis: O'Brien and Toms's User Engagement Scale research.

## Operational Review Questions

- Which scenario and task does this element support?
- What does the user need to perceive, know, decide, or remember here?
- Is the system state visible and the next action understandable?
- What happens when the user is interrupted or wrong?
- Does the visual hierarchy support the task or merely add attractiveness?
- Which advanced features can be deferred without hiding essential capability?
- What user value remains after the interaction is successfully completed?
- Which conclusions depend on an unseen screen, unmeasured behavior, or an assumed environment?
- What product data or field evidence could change the task priorities?
