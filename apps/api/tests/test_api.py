"""HTTP contract for the PDF service. Fill accuracy lives in eval_fill.py."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_ok() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_unknown_form_is_not_found() -> None:
    response = client.get("/fields/not-a-form")
    assert response.status_code == 404
    assert response.json()["detail"] == "PDF not found"


def test_debug_field_requires_a_name() -> None:
    response = client.get("/debug/field/i-130")
    assert response.status_code == 422


def test_fill_unknown_form_is_not_found() -> None:
    response = client.post("/fill/not-a-form", json={"fields": {}, "checkboxes": {}})
    assert response.status_code == 404
    assert response.json()["detail"] == "PDF not found"
