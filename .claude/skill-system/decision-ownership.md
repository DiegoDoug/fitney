# Decision ownership

| Lifecycle role | Owns | May recommend, but does not own |
|---|---|---|
| Product strategy | Problem, users, value, scope, priorities, success criteria, product-level requirements | Interaction details, visual language, technical solution |
| UX product design | Research synthesis, information architecture, journeys, flows, interaction behavior, usability structure | Product scope changes, visual styling, technical implementation |
| Visual UI design | Visual direction, typography, color, spacing, layout system, components, visual states, platform presentation conventions | Product scope, behavioral flow, implementation architecture |
| Software architecture | System boundaries, domain/module decomposition, data/API architecture, technology decisions, architectural qualities and ADRs | Product priority, visual design, implementation acceptance evidence |
| Client engineering | Client implementation, navigation/state/rendering integration, platform client behavior | Product, UX, visual, backend, or security requirements |
| Backend and data engineering | Server behavior, data implementation, APIs, integrations, persistence, migrations | Product scope, client interaction design, security acceptance policy |
| Security and identity | Threat requirements, authentication, authorization, isolation, secrets, security controls and verification requirements | Product scope, general architecture except necessary security constraints |
| Platform and release | Build, environments, infrastructure, delivery, deployment, distribution, rollback mechanics | Product scope, application behavior, release-quality acceptance |
| Quality engineering | Test strategy, traceability, release evidence, defect classification, acceptance recommendation | Upstream requirements or implementation decisions |
| Production operations | Observability, runtime health, SLOs, alerts, incident readiness, operational runbooks | Product priorities, release approval, architecture except operability constraints |
| Implementation orchestrator | Cross-domain sequencing, integrated execution plan, dependency readiness, end-to-end assembly and final verification synthesis | Every upstream domain decision |

An owner may revise its own accepted decision only through an explicit superseding record. Another phase may challenge a decision with evidence but cannot silently change it.
