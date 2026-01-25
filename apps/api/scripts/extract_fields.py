from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List

import pikepdf


def deref(obj):
    return obj.get_object() if hasattr(obj, "get_object") else obj


def list_fields(pdf_file: Path) -> List[Dict[str, str]]:
    pdf = pikepdf.Pdf.open(str(pdf_file))
    acro = pdf.Root.get("/AcroForm", None)
    if not acro:
        return []
    fields = acro.get("/Fields", [])
    results: List[Dict[str, str]] = []

    def walk(arr, prefix: str = ""):
        for f in arr:
            obj = deref(f)
            name = obj.get("/T", "")
            field_type = obj.get("/FT", "")
            kids = obj.get("/Kids", None)
            full = f"{prefix}{name}" if name else prefix
            if kids:
                walk(kids, prefix=full + ".")
            else:
                results.append({"name": full, "type": str(field_type)})

    walk(fields)
    return results


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    pdf_file = root / "Forms" / "i-130.pdf"
    out_dir = root / "apps" / "api" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    fields = list_fields(pdf_file)

    json_path = out_dir / "i-130.fields.json"
    csv_path = out_dir / "i-130.fields.csv"

    json_path.write_text(json.dumps({"fields": fields}, indent=2))

    with csv_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "type"])
        writer.writeheader()
        writer.writerows(fields)


if __name__ == "__main__":
    main()
