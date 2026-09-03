# Shared lifecycle contract

Apply this contract to every phase skill.

## Entry gate

1. Locate and read `development-roadmap.md` from the project root.
2. Confirm the invoked skill's lifecycle role and state.
3. If the phase is `LOCKED`, return `BLOCKED` with the missing approval or prerequisite. Do not perform phase work.
4. If the roadmap is absent, create it from the installed template only when the user asked to initialize the system. Otherwise return `BLOCKED` and name the missing file.
5. Read accepted artifacts, decisions, constraints, unresolved questions, risks, and prior approval conditions relevant to the phase.
6. Inspect the actual repository and runtime evidence where the phase concerns an existing implementation. Do not trust documentation over observable implementation.

## Execution modes

Classify each owned artifact:

- `ADOPT`: valid existing artifact or implementation already satisfies the phase contract.
- `VALIDATE`: likely valid, but evidence must be gathered before adoption.
- `REVISE`: useful existing work requires a bounded correction.
- `CREATE`: no adequate owned artifact exists.

Record the classification and evidence in the phase artifact. Do not rebuild valid work for conformity.

## Decision and conflict handling

- Make decisions only within the phase's ownership boundary.
- A recommendation outside the boundary must be labeled and routed to its owner.
- When an accepted upstream decision conflicts with evidence, preserve both, stop the affected portion, and record a decision-change request. Do not silently reinterpret or overwrite the decision.
- Retrieve known information from project artifacts before asking the human.
- Ask one or more minimal, targeted questions only when the unresolved choice is blocking and materially changes the result.

## Completion sequence

1. Complete the owned analysis, implementation, or artifact work.
2. Review completeness, consistency, requirements alignment, evidence, assumptions, downstream effects, risks, unresolved issues, and roadmap impact.
3. Fix issues inside the phase's authority.
4. Update the owned artifact and all directly affected registry/work/risk/dependency entries in `development-roadmap.md`.
5. Set the phase to `AWAITING APPROVAL`; do not change the next phase.
6. Report exactly one status:
   - `PASS`: complete with no material unresolved condition.
   - `PASS WITH CONDITIONS`: usable if named conditions are explicitly accepted.
   - `FAIL`: material correctness or reliability requirements are unmet.
   - `BLOCKED`: a prerequisite, authority, tool, or decision prevents safe completion.
7. Present produced artifacts, evidence, open conditions, and the exact next human decision needed.
8. Stop. Never invoke the next phase automatically.

## Human transition

Only a human instruction such as `APPROVED — proceed to <next-skill>` can record approval and unlock the next phase. Acceptance of `PASS WITH CONDITIONS` must reproduce the accepted conditions in the human review log. A waiver must identify the risk, owner, and revisit trigger.
