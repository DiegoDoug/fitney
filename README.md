# Notion → `.project-memory/` Bridge

A small TypeScript CLI that mirrors one project's canonical knowledge from the **Shared Project Memory** Notion system into a repository-local `.project-memory/` directory.

## Generated scaffold

```text
.project-memory/
├── README.md
├── PROJECT.md
├── PRODUCT.md
├── ARCHITECTURE.md
├── UX.md
├── ROADMAP.md
├── CURRENT_STATE.md
├── manifest.json
├── decisions/
├── adrs/
├── requirements/
├── issues/
├── milestones/
├── tasks/
├── reviews/
└── handoffs/
```

The bridge is intentionally **one-way**: Notion → repository. Generated files are disposable projections, not another source of truth.

## Source mapping

The supplied `.env.example` is already mapped to the current Shared Project Memory data-source IDs:

- Projects Knowledge
- Decisions
- Architecture Decisions
- Requirements
- Issues & Open Questions
- Implementation Tasks
- Milestones & Releases
- Reviews & Verification
- Agent Runs & Handoffs

Every child database is scoped by its `Project` relation to the selected Projects Knowledge record.

## Install

Requires **Node.js 20+** and has **zero runtime dependencies**.

```bash
cp .env.example .env
```

Load `.env` into your shell (or set the variables through your secrets manager). The bridge intentionally does not auto-read `.env`, so credentials never need to be parsed by application code.

At minimum set:

```bash
NOTION_TOKEN=secret_...
NOTION_PROJECT_PAGE_ID=<Projects Knowledge page id>
```

You can use `NOTION_PROJECT_NAME` instead of `NOTION_PROJECT_PAGE_ID`.

The Notion integration must have read access to all nine databases.

## Run locally

```bash
npm run sync
npm run check
```

Or select a project explicitly:

```bash
npm run sync -- --project-name "StrideLab"
```

## What is canonical vs generated

**Canonical:** Notion Shared Project Memory.

**Generated mirror:** `.project-memory/**`.

**Implementation reality:** verified code/tests. If verified code disagrees with Notion, the bridge does not decide which intent is correct; the discrepancy should be logged and Notion updated through the governance flow.

## Filtering rules

- All records are fetched from their database and then matched by the `Project` relation.
- `PRODUCT.md` includes approved/in-build/verified `Product` and `Functional` requirements.
- `UX.md` includes approved/in-build/verified `UX` requirements.
- `ARCHITECTURE.md` summarizes accepted ADRs.
- `CURRENT_STATE.md` surfaces unresolved issues, active implementation tasks, and reviews still requiring attention.
- Full source records are rendered individually under their respective directories with Notion IDs/URLs in YAML front matter.

## Idempotency

By default `.project-memory/` is fully regenerated on each sync. This prevents stale files when a Notion record is renamed, superseded, or removed.

## GitHub automation

Copy `.github/workflows/sync-project-memory.yml` into the target repo. Configure:

**Repository secret**
- `NOTION_TOKEN`

**Repository variables**
- `NOTION_PROJECT_PAGE_ID` (recommended) or `NOTION_PROJECT_NAME`
- the nine `NOTION_*_DATA_SOURCE_ID` variables from `.env.example`

The workflow runs daily and can also be run manually. It commits only when `.project-memory/` actually changes.

If you prefer PR-only updates, replace the final commit/push step with your preferred PR action.

## Claude Code

Append `CLAUDE.memory-snippet.md` to the repository's `CLAUDE.md`. This makes the generated mirror required pre-implementation context while preserving Notion as the authority.

## API compatibility

The bridge targets Notion's data-source query endpoint and falls back to the legacy database query endpoint when needed. `NOTION_VERSION` can be overridden if your workspace integration requires a specific API version.

## Troubleshooting: `invalid_request_url`

This bridge targets Notion API `2025-09-03` and queries data sources through:

`POST /v1/data_sources/{data_source_id}/query`

The bridge intentionally does **not** fall back to the legacy
`/v1/databases/{id}/query` endpoint, because doing so can hide the original
Notion error when the configured ID is a data source ID.

If a query fails now, the CLI will show the actual Notion error (for example:
`object_not_found`, `unauthorized`, or `validation_error`).

## v2 fix: canonical UUID URLs

Notion's current data-source query endpoint is:

`POST /v1/data_sources/{data_source_id}/query`

The bridge now canonicalizes every Notion ID to dashed UUID form before putting it
in an API URL. This avoids `invalid_request_url` responses from path parsing.

The CLI error now includes the HTTP method and path that failed, while never
printing the bearer token.
