# Platform and release phase contract

## Inputs

Required: approved architecture, implementation/build evidence, security requirements, target distribution or hosting context, roadmap. Optional: provider access, domains, certificates, budgets, release windows, store policies, compliance controls, and existing telemetry.

## Execution

- Inventory build commands, artifacts, environments, config sources, infrastructure, secrets boundaries, database migration ordering, delivery workflows, and rollback mechanisms.
- Make builds deterministic enough to reproduce and identify artifact provenance.
- Separate development, preview/staging, and production behavior where risk requires it.
- Define least-privilege service identities and secret injection without committing secret values.
- Sequence application, schema, data, and infrastructure changes compatibly.
- Add health/readiness checks and release gates needed for safe traffic or distribution.
- Verify deployment/distribution with observable evidence; verify rollback or roll-forward mechanics without destructive live testing unless authorized.
- Document manual steps that cannot be automated and their owner.

## Output and review

`docs/platform/platform-release.md` records topology, environments, build/release procedure, configuration contract, external dependencies, migration sequence, release gates, rollback/roll-forward, changed paths, commands and evidence, and unresolved conditions.

Block when target environment or distribution is undecided, required access is unavailable, a release would violate an unresolved security condition, or rollback/recovery is undefined for a material irreversible change.
