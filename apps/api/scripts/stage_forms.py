from __future__ import annotations

import shutil
from pathlib import Path


def stage_forms(source: Path, dest: Path) -> int:
    if not source.is_dir():
        raise FileNotFoundError(f"missing templates: {source}")
    dest.mkdir(parents=True, exist_ok=True)
    count = 0
    for pdf in sorted(source.glob("*.pdf")):
        shutil.copy2(pdf, dest / pdf.name)
        count += 1
    return count


def main() -> None:
    source = Path(__file__).resolve().parents[3] / "Forms"
    dest = Path(__file__).resolve().parents[1] / "forms"
    count = stage_forms(source, dest)
    if count == 0:
        raise SystemExit(f"no templates in {source}")
    print(f"staged {count} templates into {dest}")


if __name__ == "__main__":
    main()
