"""
Visual verification for PDF fills — renders filled fields as PNG crops.

Fills a form from a fixture (same JSON format as eval_fill.py), renders the
pages with pdfium (form drawing enabled), and saves one tightly-cropped PNG
per filled field plus optional full-page renders. A human or agent can then
confirm each value actually appears in the right box — catching bugs that
/V readback misses (wrong appearance states, overflowing text, wrong widget).

Usage:
    uv run python scripts/render_fields.py fixtures/basic_petitioner.json
    uv run python scripts/render_fields.py fixtures/basic_petitioner.json --out /tmp/renders --pages
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, cast

import pikepdf

try:
    import pypdfium2 as pdfium
except ImportError:
    sys.exit("pypdfium2 not installed — run `uv sync` (it is a dev dependency)")

SCRIPT_DIR = Path(__file__).resolve().parent
API_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(API_DIR))

from app.main import _deref  # noqa: E402
from eval_fill import _fill_direct, _load_fixture  # noqa: E402

sys.path.insert(0, str(SCRIPT_DIR))

DPI = 150
SCALE = DPI / 72
PAD_PTS = 6


def _widget_locations(pdf_bytes: bytes) -> Dict[str, Tuple[int, List[float]]]:
    """Map full dotted field name -> (page_index, /Rect) for every widget annotation."""
    from io import BytesIO

    pdf = pikepdf.Pdf.open(BytesIO(pdf_bytes))
    locations: Dict[str, Tuple[int, List[float]]] = {}
    for page_idx, page in enumerate(pdf.pages):
        annots = page.get("/Annots")
        if annots is None:
            continue
        for annot in cast(Any, annots):
            annot = _deref(annot)
            parts: List[str] = []
            node = annot
            while node is not None:
                t = node.get("/T")
                if t is not None:
                    parts.append(str(t))
                parent = node.get("/Parent")
                node = _deref(parent) if parent is not None else None
            if not parts:
                continue
            full = ".".join(reversed(parts))
            rect = annot.get("/Rect")
            if rect is not None:
                locations[full] = (page_idx, [float(x) for x in rect])
    return locations


def _safe_name(field: str) -> str:
    short = field.split(".")[-1].replace("[", "_").replace("]", "")
    return short.strip("_")


def render_fixture(fixture_path: Path, out_dir: Path, full_pages: bool = False) -> int:
    data = _load_fixture(fixture_path)
    slug = data["slug"]
    fields: Dict[str, str] = data["fields"]
    checkboxes: Dict[str, bool] = data["checkboxes"]

    pdf_bytes = _fill_direct(slug, fields, checkboxes)
    filled_pdf = out_dir / f"{slug}-filled.pdf"
    out_dir.mkdir(parents=True, exist_ok=True)
    filled_pdf.write_bytes(pdf_bytes)

    locations = _widget_locations(pdf_bytes)

    doc = pdfium.PdfDocument(str(filled_pdf))
    try:
        doc.init_forms()
    except Exception as exc:  # XFA-hybrid forms warn; AcroForm layer still renders
        print(f"note: init_forms: {exc}", file=sys.stderr)

    page_cache: Dict[int, tuple[Any, Any]] = {}

    def rendered_page(idx: int) -> tuple[Any, Any]:
        if idx not in page_cache:
            page = doc[idx]
            bitmap = cast(Any, page).render(scale=SCALE, may_draw_forms=True)
            page_cache[idx] = (page, bitmap.to_pil())
        return page_cache[idx]

    targets = {name for name in list(fields) + list(checkboxes)}
    # Skip fields intentionally left blank
    targets = {
        name
        for name in targets
        if (name in checkboxes) or (fields.get(name, "") != "")
    }

    count = 0
    missing: List[str] = []
    for name in sorted(targets):
        loc: Optional[Tuple[int, List[float]]] = locations.get(name)
        if loc is None:
            missing.append(name)
            continue
        page_idx, (x0, y0, x1, y1) = loc
        page, img = rendered_page(page_idx)
        page_h = page.get_height()
        box = (
            max(0, int((x0 - PAD_PTS) * SCALE)),
            max(0, int((page_h - y1 - PAD_PTS) * SCALE)),
            min(img.width, int((x1 + PAD_PTS) * SCALE)),
            min(img.height, int((page_h - y0 + PAD_PTS) * SCALE)),
        )
        crop = img.crop(box)
        out_file = out_dir / f"p{page_idx + 1}_{_safe_name(name)}.png"
        crop.save(out_file)
        expected = checkboxes.get(name) if name in checkboxes else fields.get(name)
        print(f"  {out_file.name:55s} expect: {expected!r}")
        count += 1

    if full_pages:
        for idx in sorted(page_cache):
            _, img = rendered_page(idx)
            img.save(out_dir / f"page_{idx + 1}.png")

    if missing:
        print(f"\nWARNING: no widget found for {len(missing)} field(s):", file=sys.stderr)
        for name in missing:
            print(f"  {name}", file=sys.stderr)

    print(f"\n{count} field crop(s) written to {out_dir}")
    return 0 if not missing else 1


def main() -> None:
    parser = argparse.ArgumentParser(description="Render filled PDF fields to PNG crops")
    parser.add_argument("fixture", type=Path, help="Fixture JSON (eval_fill format)")
    parser.add_argument("--out", type=Path, default=None,
                        help="Output directory (default: /tmp/render_fields/<fixture-stem>)")
    parser.add_argument("--pages", action="store_true", help="Also save full-page renders")
    args = parser.parse_args()

    out_dir = args.out or Path("/tmp/render_fields") / args.fixture.stem
    sys.exit(render_fixture(args.fixture, out_dir, full_pages=args.pages))


if __name__ == "__main__":
    main()
