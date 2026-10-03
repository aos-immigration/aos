"""Origin and slug policy. These functions sit in front of CORS and Forms/."""

from pathlib import Path

from app.http_policy import (
    form_pdf,
    parse_allowed_origins,
    validation_errors_for_client,
)

FORMS = Path(__file__).resolve().parents[3] / "Forms"


def test_unset_origins_default_to_local_web() -> None:
    assert parse_allowed_origins(None) == ["http://localhost:3000"]


def test_star_origin_is_dropped() -> None:
    assert parse_allowed_origins("*") == []
    assert parse_allowed_origins(" https://app.example , * ") == ["https://app.example"]


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