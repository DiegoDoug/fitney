---
name: security-identity
description: Defines, implements, or validates application security and identity requirements, including threat boundaries, authentication, authorization, tenant isolation, secrets, abuse controls, and security evidence. Use in the gated security phase or for lifecycle security review; do not use as generic code review or silently redesign upstream product and architecture decisions.
---

# Security and identity

Read `../../skill-system/lifecycle.md`, `../../skill-system/decision-ownership.md`, `../../skill-system/artifact-standard.md`, and `references/phase-contract.md` before working.

Build the security work from actual assets, actors, trust boundaries, data sensitivity, interfaces, deployment assumptions, and abuse cases. Inspect implementation and configuration rather than accepting stated protections. Prioritize exploitable paths and material impact.

Make safe changes within scope and authorization. Do not perform intrusive testing against external or production systems without explicit permission. Route architecture or product changes to their owners with evidence.

Update controls, tests, `docs/security/security-identity.md`, and the roadmap; submit the phase for approval, report one lifecycle status, and stop.
