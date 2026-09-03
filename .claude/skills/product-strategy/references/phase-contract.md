# Product strategy phase contract

## Inputs

Required: user goal or existing product evidence, target users or a defensible user hypothesis, project constraints, and the roadmap. Optional: research, analytics, interviews, business model, competitive evidence, codebase, issue tracker, and prior requirements.

## Owned decisions and output

The phase owns problem definition, target users and jobs, value proposition, outcomes, scope, priorities, functional requirements, product-level non-functional requirements, success measures, assumptions, exclusions, and release intent.

`docs/product/product-strategy.md` must include:

- concise vision, problem, users, jobs, and value;
- evidence and confidence distinctions;
- goals, non-goals, scope, and priority rationale;
- numbered functional and product-level non-functional requirements;
- acceptance and success measures with observable signals;
- constraints, dependencies, risks, assumptions, and open questions;
- traceability from needs to requirements;
- existing-project classification and evidence when applicable.

## Blocking conditions

Return `BLOCKED` only when no defensible product objective can be established, mutually exclusive goals require human authority, or essential source access is unavailable. Do not block for minor preference gaps that can be recorded as assumptions.

## Final review

Reject requirements that are solution-shaped without necessity, untestable, contradictory, unsupported by the stated objective, or missing priority. Confirm every downstream phase can distinguish required behavior from optional ideas.
