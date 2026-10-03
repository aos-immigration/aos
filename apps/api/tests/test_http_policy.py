"""Origin and slug policy. These functions sit in front of CORS and Forms/."""

from pathlib import Path

from app.http_policy import (
    form_pdf,
    forms_dir,
    parse_allowed_origins,
    validation_errors_for_client,
)

FORMS = Path(__file__).resolve().parents[3] / "Forms"


def test_unset_origins_default_to_local_web() -> None:
    assert parse_allowed_origins(None) == ["http://localhost:3000"]


def test_star_origin_is_dropped() -> None:
    assert parse_allowed_origins("*") == []
    assert parse_allowed_origins(" https://app.example , * ") == ["https://app.example"]


def test_forms_dir_finds_the_checkout_templates() -> None:
    found = forms_dir()
    assert (found / "i-130.pdf").is_file()


def test_forms_dir_honors_an_explicit_directory(tmp_path: Path, monkeypatch) -> None:
    target = tmp_path / "forms"
    target.mkdir()
    (target / "i-130.pdf").write_bytes(b"%PDF")
    monkeypatch.setenv("FORMS_DIR", str(target))
    assert forms_dir() == target


def test_stage_forms_copies_pdfs_only(tmp_path: Path) -> None:
    from scripts.stage_forms import stage_forms

    source = tmp_path / "Forms"
    source.mkdir()
    (source / "i-130.pdf").write_bytes(b"%PDF-1.4")
    (source / "notes.txt").write_text("skip")
    dest = tmp_path / "forms"
    assert stage_forms(source, dest) == 1
    assert (dest / "i-130.pdf").read_bytes() == b"%PDF-1.4"
    assert not (dest / "notes.txt").exists()


def test_known_slug_stays_inside_forms() -> None:
    path = form_pdf("i-130", FORMS)
    assert path == (FORMS / "i-130.pdf").resolve()


def test_slug_outside_the_allowlist_is_rejected() -> None:
    assert form_pdf("not-a-form", FORMS) is None
    assert form_pdf("../i-130", FORMS) is None
    assert form_pdf("i-130.pdf", FORMS) is None


def test_validation_errors_drop_the_submitted_value() -> None:
    cleaned = validation_errors_for_client(
        [
            {
                "type": "string_type",
                "loc": ["body", "fields"],
                "msg": "Input should be a valid dictionary",
                "input": "123-45-6789",
            }
        ]
    )
    assert cleaned == [
        {
            "type": "string_type",
            "loc": ["body", "fields"],
            "msg": "Input should be a valid dictionary",
        }
    ]