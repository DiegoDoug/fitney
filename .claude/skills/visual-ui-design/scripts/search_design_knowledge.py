#!/usr/bin/env python3
"""Search the skill's maintained design knowledge without external dependencies."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SEARCH_ROOTS = (ROOT / "references", ROOT / "templates", ROOT / "examples")
DOMAIN_HINTS = {
    "accessibility": ("accessibility", "contrast", "focus", "voiceover", "dynamic type"),
    "platform": ("platform", "native", "ios", "android", "web", "desktop"),
    "patterns": ("component", "pattern", "navigation", "state", "layout"),
    "research": ("evidence", "source", "research", "authority", "validation"),
    "visual": ("typography", "color", "spacing", "surface", "imagery", "motion"),
}


def terms(value: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", value.lower())


def excerpt(text: str, query_terms: list[str], width: int = 220) -> str:
    lowered = text.lower()
    positions = [lowered.find(term) for term in query_terms if lowered.find(term) >= 0]
    start = max(0, (min(positions) if positions else 0) - 60)
    compact = re.sub(r"\s+", " ", text[start : start + width]).strip()
    return compact


def score(path: Path, text: str, phrase: str, query_terms: list[str], filters: list[str]) -> int:
    haystack = f"{path.relative_to(ROOT)}\n{text}".lower()
    value = 0
    if phrase and phrase in haystack:
        value += 20
    for term in query_terms:
        count = haystack.count(term)
        value += min(count, 8) * 2
        if term in path.name.lower():
            value += 4
    for item in filters:
        if item in haystack:
            value += 3
        else:
            value -= 2
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("query", help="decision, product pressure, component, or visual concern")
    parser.add_argument("--domain", choices=sorted(DOMAIN_HINTS))
    parser.add_argument("--platform", choices=("ios", "android", "web", "desktop", "cross-platform"))
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()

    query_terms = terms(args.query)
    if not query_terms:
        parser.error("query must contain at least one letter or number")
    if args.limit < 1 or args.limit > 50:
        parser.error("--limit must be between 1 and 50")

    filters: list[str] = []
    if args.domain:
        filters.extend(DOMAIN_HINTS[args.domain])
    if args.platform:
        filters.append(args.platform)

    results: list[tuple[int, Path, str]] = []
    for directory in SEARCH_ROOTS:
        for path in directory.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".md", ".yaml", ".yml"}:
                continue
            text = path.read_text(encoding="utf-8", errors="replace")
            rank = score(path, text, args.query.lower(), query_terms, filters)
            if rank > 0:
                results.append((rank, path, excerpt(text, query_terms)))

    results.sort(key=lambda item: (-item[0], str(item[1])))
    for rank, path, snippet in results[: args.limit]:
        print(f"{rank:>3}  {path.relative_to(ROOT)}")
        print(f"     {snippet}")

    if not results:
        print("No local matches. Use the source registry and current authoritative research when needed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
