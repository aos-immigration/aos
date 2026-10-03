from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path
from typing import Any

DEFAULT_WEB_ORIGIN = "http://localhost:3000"
ALLOWED_FORM_SLUGS = frozenset({"i-130", "i-130a", "i-131", "i-485", "i-765"})
FORMS_DIR = Path(__file__).resolve().parents[3] / "Forms"


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
