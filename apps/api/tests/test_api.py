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


def test_cors_echoes_the_configured_web_origin() -> None:
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert response.headers.get("access-control-allow-credentials") != "true"


def test_cors_does_not_allow_an_unlisted_origin() -> None:
    response = client.get("/health", headers={"Origin": "https://evil.example"})
    assert response.headers.get("access-control-allow-origin") is None


def test_cors_preflight_allows_the_configured_web_origin() -> None:
    response = client.options(
        "/fill/i-130",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"].lower()
    response = client.options(
        "/fill/i-130",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None


def test_fill_validation_does_not_echo_the_submitted_value() -> None:
    secret = "123-45-6789"
    response = client.post("/fill/i-130", json={"fields": secret, "checkboxes": {}})
    assert response.status_code == 422
    assert secret not in response.text


def test_fill_i_130_returns_a_pdf_without_a_shared_cache() -> None:
    response = client.post("/fill/i-130", json={"fields": {}, "checkboxes": {}})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content.startswith(b"%PDF")
    assert response.headers["cache-control"] == "no-store"
