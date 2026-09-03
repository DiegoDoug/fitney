# Design knowledge retrieval attachment

Use local retrieval to narrow the reference set before loading large guidance or conducting live research.

Run:

```bash
python3 scripts/search_design_knowledge.py QUERY [--domain DOMAIN] [--platform PLATFORM] [--limit N]
```

Examples:

```bash
python3 scripts/search_design_knowledge.py "dense workout history" --domain patterns --platform ios
python3 scripts/search_design_knowledge.py typography --domain visual --limit 8
python3 scripts/search_design_knowledge.py "error recovery" --domain accessibility
```

The script searches this skill's maintained Markdown and YAML knowledge, ranks exact phrase, token, platform, and domain matches, and returns paths with compact excerpts. It has no third-party runtime dependency and makes no network requests.

## Retrieval discipline

1. Search with the product pressure or decision, not a desired style name alone.
2. Inspect the highest-relevance local references.
3. Use the source registry to find the right authority tier.
4. Research live only when current, official, or missing information matters.
5. Record the source and inference; do not treat retrieval rank as evidence quality.

The search result proposes where to look. It does not select the design direction, prove usability, or override official platform/accessibility guidance.

## Provenance

This capability adapts the searchable-reference idea from [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) to the references already maintained by this skill. It does not vendor that project's databases or broad all-in-one trigger.
