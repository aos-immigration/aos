from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from typing import Any

import pikepdf
import pytest

ROOT = Path(__file__).resolve().parents[3]
FORMS = ROOT / "Forms"
MANIFEST = FORMS / "editions.json"
STAGED = Path(__file__).resolve().parents[1] / "forms"
SOURCE = "https://www.uscis.gov/sites/default/files/document/forms/{slug}.pdf"
FOOTER = re.compile(r"Form\s+([A-Z]-\d+[A-Z]?)\s+Edition\s+(\d{2}/\d{2}/\d{2})")


def _page_text(page: pikepdf.Page) -> str:
    contents = page.get("/Contents")
    if contents is None:
        return ""
    if isinstance(contents, pikepdf.Array):
        array: Any = contents
        data = b"".join(array[index].read_bytes() for index in range(len(array)))
    else:
        data = contents.read_bytes()
    return data.decode("latin1", errors="ignore")


def printed_edition(pdf_path: Path) -> list[tuple[str, str] | None]:
    pdf = pikepdf.Pdf.open(pdf_path)
    found: list[tuple[str, str] | None] = []
    for page in pdf.pages:
        hits = {(form_id, edition) for form_id, edition in FOOTER.findall(_page_text(page))}
        found.append(next(iter(hits)) if len(hits) == 1 else None)
    return found


def load_manifest(path: Path) -> list[dict[str, str]]:
    payload = json.loads(path.read_text())
    forms = payload["forms"]
    if not isinstance(forms, list):
        raise AssertionError("editions.json forms is not a list")
    return forms


def edition_errors(directory: Path, forms: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    slugs: list[str] = []
    for entry in forms:
        slug = entry["slug"]
        edition = entry["edition"]
        source = entry["source"]
        checked = entry["checked"]
        slugs.append(slug)
        date.fromisoformat(checked)
        if source != SOURCE.format(slug=slug):
            errors.append(f"{slug} source is {source}")
        pdf_path = directory / f"{slug}.pdf"
        if not pdf_path.is_file():
            errors.append(f"{slug}.pdf is listed in the manifest but missing")
            continue
        form_id = slug.upper()
        for index, printed in enumerate(printed_edition(pdf_path), start=1):
            expected = (form_id, edition)
            if printed != expected:
                errors.append(
                    f"{slug}.pdf page {index} prints {printed}, manifest expects {expected}"
                )
    listed = set(slugs)
    if len(listed) != len(slugs):
        errors.append("manifest lists a slug more than once")
    for pdf_path in sorted(directory.glob("*.pdf")):
        if pdf_path.stem not in listed:
            errors.append(f"{pdf_path.name} is not in the manifest")
    return errors


def test_checkout_templates_match_the_manifest() -> None:
    assert edition_errors(FORMS, load_manifest(MANIFEST)) == []


def test_deploy_copy_matches_the_manifest(tmp_path: Path) -> None:
    from scripts.stage_forms import stage_forms

    dest = tmp_path / "forms"
    copied = stage_forms(FORMS, dest)
    assert copied == len(list(FORMS.glob("*.pdf")))
    assert edition_errors(dest, load_manifest(MANIFEST)) == []


def test_existing_staged_directory_matches_the_manifest() -> None:
    if not STAGED.is_dir() or not any(STAGED.glob("*.pdf")):
        pytest.skip("apps/api/forms is not staged in this checkout")
    assert edition_errors(STAGED, load_manifest(MANIFEST)) == []


def _write_pdf(path: Path, footer: str, pages: int = 1) -> None:
    pdf = pikepdf.Pdf.new()
    for _ in range(pages):
        page = pdf.add_blank_page(page_size=(612, 792))
        raw = f"BT ( {footer} ) Tj ET".encode("latin1")
        page.Contents = pikepdf.Stream(pdf, raw)
    pdf.save(path)


def test_wrong_edition_fails(tmp_path: Path) -> None:
    _write_pdf(tmp_path / "i-485.pdf", "Form I-485   Edition   01/20/25")
    forms = [
        {
            "slug": "i-485",
            "edition": "09/18/26",
            "source": SOURCE.format(slug="i-485"),
            "checked": "2026-10-06",
        }
    ]
    assert edition_errors(tmp_path, forms) == [
        "i-485.pdf page 1 prints ('I-485', '01/20/25'), manifest expects ('I-485', '09/18/26')"
    ]


def test_missing_pdf_and_extra_pdf_fail(tmp_path: Path) -> None:
    _write_pdf(tmp_path / "i-765.pdf", "Form I-765   Edition   09/15/26")
    forms = [
        {
            "slug": "i-485",
            "edition": "09/18/26",
            "source": SOURCE.format(slug="i-485"),
            "checked": "2026-10-06",
        }
    ]
    assert edition_errors(tmp_path, forms) == [
        "i-485.pdf is listed in the manifest but missing",
        "i-765.pdf is not in the manifest",
    ]


def test_page_without_a_footer_fails(tmp_path: Path) -> None:
    pdf = pikepdf.Pdf.new()
    pdf.add_blank_page(page_size=(612, 792))
    pdf.save(tmp_path / "i-131.pdf")
    forms = [
        {
            "slug": "i-131",
            "edition": "01/20/25",
            "source": SOURCE.format(slug="i-131"),
            "checked": "2026-10-06",
        }
    ]
    assert edition_errors(tmp_path, forms) == [
        "i-131.pdf page 1 prints None, manifest expects ('I-131', '01/20/25')"
    ]
