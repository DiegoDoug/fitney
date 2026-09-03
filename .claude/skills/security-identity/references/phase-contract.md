# Security and identity phase contract

## Inputs

Required: approved product/architecture and implemented boundary evidence, identity and data flows, roadmap. Optional: compliance obligations, provider documentation, prior findings, infrastructure configuration, incident history, and test environment authorization.

## Execution

1. Inventory assets, identities, roles, tenants, entrypoints, trust boundaries, sensitive data, secrets, dependencies, and administrative paths.
2. Define threat scenarios and abuse cases tied to the application's actual behavior.
3. Verify authentication lifecycle, session/token handling, recovery, enrollment, and privileged actions.
4. Verify authorization at every server-enforced resource boundary, including tenant/organization isolation and indirect object access.
5. Review input/output handling, uploads, SSRF-like fetches, injection boundaries, cryptography usage, secret storage, logging privacy, dependency exposure, and abuse/rate controls as relevant.
6. Implement or specify risk-proportionate controls and regression tests.
7. Record residual risk, accepted risk owner, and required monitoring.

## Output and review

`docs/security/security-identity.md` contains scope, system/threat model, security requirements, findings with severity and evidence, control implementation, verification, residual risks, and release conditions. Distinguish verified, inferred, and untested claims.

Block when authorization is absent for the needed test, identity boundaries cannot be determined, or a critical unresolved finding makes further rollout unsafe. A scan result alone is not proof of exploitability or remediation.
