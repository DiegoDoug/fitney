# Artifact standard

Every phase artifact must be independently consumable and contain:

1. phase identity and execution date;
2. source artifacts and repository evidence inspected;
3. `ADOPT`, `VALIDATE`, `REVISE`, or `CREATE` classification;
4. accepted inputs and consequential assumptions;
5. owned decisions with stable identifiers;
6. requirements, work, or findings produced by the phase;
7. traceability to upstream requirements and downstream consumers;
8. unresolved questions, risks, dependencies, and external capability needs;
9. verification performed and evidence paths;
10. final status and conditions.

Use repository-relative paths. Do not embed credentials, access tokens, personal data, or unverifiable completion claims. Link to code, tests, ADRs, diagrams, screenshots, logs, or deployment evidence rather than duplicating large outputs.

When implementation changes occur, record the affected paths and validation commands. When no change is needed, record the evidence supporting adoption.
