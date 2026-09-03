#!/usr/bin/env python3
"""Validate the static structure and core invariants of the skill system."""

from __future__ import annotations

import re
import sys
from pathlib import Path


INCLUDED = [
    "product-strategy",
    "software-architecture",
    "client-engineering",
    "backend-data-engineering",
    "security-identity",
    "platform-release",
    "quality-engineering",
    "production-operations",
    "implementation-orchestrator",
]

ATTACHED = [
    "evidence-based-ui-ux",
    "visual-ui-design",
]

PHASE_ORDER = [
    "product-strategy",
    "evidence-based-ui-ux",
    "visual-ui-design",
    "software-architecture",
    "client-engineering",
    "backend-data-engineering",
    "security-identity",
    "platform-release",
    "quality-engineering",
    "production-operations",
    "implementation-orchestrator",
]

REQUIRED_SHARED = [
    "lifecycle.md",
    "decision-ownership.md",
    "artifact-standard.md",
    "design-adapters.md",
    "capability-attachments.md",
    "system-manifest.yaml",
    "templates/phase-artifact.md",
]


def frontmatter(text: str, path: Path) -> dict[str, str]:
    if not text.startswith("---\n"):
        raise ValueError(f"{path}: opening frontmatter delimiter is not first line")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError(f"{path}: missing closing frontmatter delimiter")
    values: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"{path}: invalid frontmatter line: {line}")
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def validate() -> list[str]:
    root = Path(__file__).resolve().parents[2]
    errors: list[str] = []
    skill_root = root / ".claude" / "skills"
    shared_root = root / ".claude" / "skill-system"

    for path in [root / "CLAUDE.md", root / "development-roadmap.md", root / "INSTALL.md"]:
        if not path.is_file():
            errors.append(f"missing required root file: {path.relative_to(root)}")

    for relative in REQUIRED_SHARED:
        if not (shared_root / relative).is_file():
            errors.append(f"missing shared resource: .claude/skill-system/{relative}")

    actual = sorted(p.name for p in skill_root.iterdir() if p.is_dir()) if skill_root.exists() else []
    expected = sorted(INCLUDED + ATTACHED)
    if actual != expected:
        errors.append(f"installed skill set differs: expected {expected}, found {actual}")
    missing_included = sorted(set(INCLUDED) - set(actual))
    if missing_included:
        errors.append(f"missing included skills: {missing_included}")

    # The two existing design skills are bundled as attached capabilities. Only
    # the obsolete lifecycle alias would duplicate the UX capability.
    if (skill_root / "ux-product-design").exists():
        errors.append(
            "duplicate UX skill found: use evidence-based-ui-ux and remove ux-product-design"
        )

    for name in INCLUDED:
        path = skill_root / name / "SKILL.md"
        contract = skill_root / name / "references" / "phase-contract.md"
        if not path.is_file():
            errors.append(f"missing SKILL.md for {name}")
            continue
        if not contract.is_file():
            errors.append(f"missing phase contract for {name}")
        try:
            text = path.read_text(encoding="utf-8")
            metadata = frontmatter(text, path)
            if metadata.get("name") != name:
                errors.append(f"{path.relative_to(root)}: name must equal folder name")
            description = metadata.get("description", "")
            if len(description) < 40:
                errors.append(f"{path.relative_to(root)}: description is missing or non-discriminating")
            if not re.fullmatch(r"[a-z0-9-]{1,64}", name):
                errors.append(f"{name}: invalid portable skill name")
            for reference in [
                "../../skill-system/lifecycle.md",
                "../../skill-system/decision-ownership.md",
                "../../skill-system/artifact-standard.md",
                "references/phase-contract.md",
            ]:
                if reference not in text:
                    errors.append(f"{path.relative_to(root)}: missing discoverable reference {reference}")
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(str(exc))

    for name in ATTACHED:
        path = skill_root / name / "SKILL.md"
        if not path.is_file():
            errors.append(f"missing attached skill: {name}/SKILL.md")
            continue
        try:
            metadata = frontmatter(path.read_text(encoding="utf-8"), path)
            if metadata.get("name") != name:
                errors.append(f"{path.relative_to(root)}: name must equal folder name")
        except (OSError, UnicodeError, ValueError) as exc:
            errors.append(str(exc))

    visual_root = skill_root / "visual-ui-design"
    for relative in [
        "references/capabilities/design-memory.md",
        "references/capabilities/apple-hig-adapter.md",
        "references/capabilities/design-knowledge-retrieval.md",
        "references/capabilities/taste-regression.md",
        "scripts/search_design_knowledge.py",
        "templates/design-memory.md",
        "tests/taste-regressions.md",
    ]:
        if not (visual_root / relative).is_file():
            errors.append(f"missing visual capability attachment: {relative}")

    quality_gate = skill_root / "quality-engineering" / "references" / "visual-quality-gate.md"
    if not quality_gate.is_file():
        errors.append("missing quality capability attachment: references/visual-quality-gate.md")
    quality_skill = skill_root / "quality-engineering" / "SKILL.md"
    if quality_skill.is_file() and "references/visual-quality-gate.md" not in quality_skill.read_text(encoding="utf-8"):
        errors.append("quality-engineering does not route to the visual quality gate")

    roadmap = (root / "development-roadmap.md").read_text(encoding="utf-8")
    positions = [roadmap.find(f"`{name}`") for name in PHASE_ORDER]
    if any(position < 0 for position in positions):
        errors.append("roadmap does not name every lifecycle skill")
    elif positions != sorted(positions):
        errors.append("roadmap lifecycle order is incorrect")

    claude_md = (root / "CLAUDE.md").read_text(encoding="utf-8")
    for required in ["human-gated", "evidence-based-ui-ux", "visual-ui-design", "implementation-orchestrator"]:
        if required not in claude_md:
            errors.append(f"CLAUDE.md missing lifecycle invariant: {required}")

    adapters = (shared_root / "design-adapters.md").read_text(encoding="utf-8")
    for required in ["evidence-based-ui-ux", "visual-ui-design", "ux-product-design", "Design Memory", "visual quality gate"]:
        if required not in adapters:
            errors.append(f"design adapter missing mapping: {required}")

    attachments = (shared_root / "capability-attachments.md").read_text(encoding="utf-8")
    for required in ["Interface Design", "iOS HIG Design", "UI UX Pro Max", "Taste Skill", "Impeccable"]:
        if required not in attachments:
            errors.append(f"capability attachment map missing source: {required}")

    return errors


if __name__ == "__main__":
    failures = validate()
    if failures:
        print("FAIL")
        for failure in failures:
            print(f"- {failure}")
        sys.exit(1)
    print("PASS: full-stack development skill system structure and invariants validated")
