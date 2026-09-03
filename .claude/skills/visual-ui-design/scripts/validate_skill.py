#!/usr/bin/env python3
"""Validate package links and the source registry with only the standard library."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

required = [
    "SKILL.md",
    "references/source-registry.yaml",
    "references/source-policy.md",
    "references/taste-and-calibration.md",
    "references/anti-patterns.md",
    "references/critique-and-iteration.md",
    "references/artifact-modes.md",
    "references/capabilities/design-memory.md",
    "references/capabilities/apple-hig-adapter.md",
    "references/capabilities/design-knowledge-retrieval.md",
    "references/capabilities/taste-regression.md",
    "templates/design-context-profile.yaml",
    "templates/design-memory.md",
    "scripts/search_design_knowledge.py",
    "tests/simulations.md",
    "tests/simulation-report.md",
    "tests/taste-regressions.md",
]
for relative in required:
    if not (ROOT / relative).is_file():
        errors.append(f"missing required file: {relative}")

for md in ROOT.rglob("*.md"):
    text = md.read_text(encoding="utf-8")
    for target in re.findall(r"\[[^\]]+\]\((?!https?://|#)([^)]+)\)", text):
        path = (md.parent / target).resolve()
        if not path.exists():
            errors.append(f"broken link in {md.relative_to(ROOT)}: {target}")

registry = ROOT / "references/source-registry.yaml"
if registry.exists():
    text = registry.read_text(encoding="utf-8")
    ids = re.findall(r"\{id:\s*([^,]+),", text)
    urls = re.findall(r'url:\s*"(https?://[^\"]+)"', text)
    if len(ids) < 80:
        errors.append(f"source registry too small: {len(ids)} entries")
    if len(ids) != len(set(ids)):
        errors.append("duplicate source id")
    if len(urls) != len(set(urls)):
        errors.append("duplicate source URL")

if errors:
    print("FAIL")
    print("\n".join(f"- {item}" for item in errors))
    sys.exit(1)

print(f"PASS: Claude Code skill has {len(list(ROOT.rglob('*')))} package entries; {len(ids)} sources")
