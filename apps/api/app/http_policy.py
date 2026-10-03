from __future__ import annotations

import os
from collections.abc import Sequence
from pathlib import Path
from typing import Any

DEFAULT_WEB_ORIGIN = "http://localhost:3000"
ALLOWED_FORM_SLUGS = frozenset({"i-130", "i-130a", "i-131", "i-485", "i-765"})


def forms_dir() -> Path:
    override = os.environ.get("FORMS_DIR", "").strip()
    if override:
        return Path(override)
    here = Path(__file__).resolve()
    candidates: list[Path] = []
    if len(here.parents) > 3:
        candidates.append(here.parents[3] / "Forms")
    if len(here.parents) > 1:
        candidates.append(here.parents[1] / "forms")
    candidates.append(Path.cwd() / "forms")
    candidates.append(Path.cwd() / "Forms")
    for candidate in candidates:
        if candidate.is_dir() and any(candidate.glob("*.pdf")):
            return candidate
    return candidates[0]


def parse_allowed_origins(raw: str | None) -> list[str]:
    if raw is None:
        return [DEFAULT_WEB_ORIGIN]
    origins: list[str] = []
    seen: set[str] = set()
    for part in raw.split(","):
        origin = part.strip().rstrip("/")
        if not origin or origin == "*":
            continue
        if origin in seen:
            continue
        seen.add(origin)
        origins.append(origin)
    return origins


def form_pdf(slug: str, forms_dir: Path) -> Path | None:
    if slug not in ALLOWED_FORM_SLUGS:
        return None
    root = forms_dir.resolve()
    candidate = (root / f"{slug}.pdf").resolve()
    if candidate.parent != root or not candidate.is_file():
        return None
    return candidate


def validation_errors_for_client(errors: Sequence[Any]) -> list[dict[str, Any]]:
    cleaned: list[dict[str, Any]] = []
    for error in errors:
        cleaned.append({key: value for key, value in error.items() if key != "input"})
    return cleaned
