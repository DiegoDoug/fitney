# Lifecycle simulation assessment

These scenarios exercise activation, gating, incomplete context, ambiguity, conflict, failure, and existing-project behavior. They validate the package design; they do not claim validation of a particular application.

| Scenario | Expected activation/path | Expected result | Design control |
|---|---|---|---|
| User asks to define a new app's users, value, scope, and success criteria | `product-strategy`; initialize from unlocked roadmap | Phase artifact, roadmap update, `AWAITING APPROVAL`, then stop | Product contract and lifecycle gate |
| User asks for a button color while product strategy is active | No client or visual phase activation; route as non-blocking future input | No phase transition | Trigger and ownership boundaries |
| User explicitly invokes `/software-architecture` while it is locked | Read roadmap only; perform no architecture work | `BLOCKED` naming missing approvals | Entry gate |
| Existing product has reliable requirements and flows but no formal phase files | Owning phases inspect evidence and use `ADOPT` or `VALIDATE` | Preserve valid work; create traceability artifacts only as needed | Existing-project modes |
| UX output requests a flow change during `visual-ui-design` | Preserve approved flow and record conflict for `evidence-based-ui-ux` | `BLOCKED` or `PASS WITH CONDITIONS` for affected portion | Design adapters and ownership |
| Existing product adds a surface after several approved visual phases | `visual-ui-design` reads canonical Design Memory and classifies affected decisions | Reuses accepted system or records an explicit superseding decision; no parallel state file | Interface continuity attachment |
| Native iPad request claims HIG compliance | Load Apple attachment, identify OS/device/input matrix, verify official guidance | Platform-specific design evidence with an honest compliance level | Apple adapter and source precedence |
| Designer asks for a style or component reference | Run local retrieval, inspect relevant references, then research only unresolved current claims | Focused evidence; retrieval rank does not become a design decision | Design-knowledge retrieval |
| A candidate skill revision looks polished but produces the same design across unrelated products | Run stable comparative taste regressions against baseline | Reject or revise the candidate despite surface polish | Taste regression attachment |
| Backend phase finds an accepted architecture incompatible with existing data constraints | Capture evidence and issue decision-change request to architecture | No silent schema/architecture rewrite | Conflict handling |
| Platform phase needs a hosting account and deployment credentials | Record minimum external capability and exact human action | `BLOCKED`; no fabricated access or secret capture | Dependency and authority boundary |
| Quality suites pass but a critical journey has no representative integration environment | Assess risk and missing evidence, not suite count | `PASS WITH CONDITIONS` or `BLOCKED` | Evidence-based quality bar |
| UI-changing release has green unit tests but no rendered state evidence | Load visual quality gate; capture representative screens/states and run available detectors | No visual-parity claim until rendered evidence exists | Impeccable-style quality attachment |
| Impeccable is unavailable in the environment | Continue with project browser, accessibility, screenshot, and regression tooling | Gate remains usable; disclose only missing evidence that affects confidence | Optional-tool boundary |
| Operations phase has no accountable alert responder | Define gap and required ownership; do not create meaningless paging | `BLOCKED` for production readiness | Actionable alert invariant |
| Orchestrator is invoked after only nine core approvals | Check all phase states before reading implementation plan | `BLOCKED` naming unapproved phase | Orchestrator entry contract |
| Orchestrator discovers a required payment connector that prior phases identified but is not installed | Reuse roadmap dependency; request minimum connector/setup action | Pause only affected tasks; preserve remaining plan | Capability discovery |
| Orchestrator sees deployed application and green unit tests but end-to-end persistence fails | Reproduce through full boundary and record defect owner | `FAIL`; deployment and isolated tests are insufficient | Complete-story verification |

## Corrections incorporated during simulation

- Existing design skills are bundled as attached authoritative packages, not recreated peer skills.
- Interface Design, iOS HIG Design, UI UX Pro Max, Taste Skill, and Impeccable contribute bounded capabilities without broad competing triggers.
- Locked direct invocation terminates before domain work.
- `PASS WITH CONDITIONS` never unlocks a successor until conditions are explicitly accepted.
- Existing implementations can be adopted or validated without rebuilding.
- The orchestrator coordinates integrated execution but cannot acquire upstream decision ownership.
- External capability discovery records minimum permissions and user action without requesting secret values in project artifacts.

## Remaining environmental conditions

- Official platform guidance and external tools remain time- and environment-dependent and must be verified when used.
- Impeccable is optional; its live browser behavior and detector rules were not vendored or executed by this scaffold.
- Comparative taste confidence remains conditional until the regression prompts are run against real rendered outputs in the target design environment.
