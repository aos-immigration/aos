import pytest
from fastapi.testclient import TestClient

from app.main import _allowed_origins, _fill_hits, _send_dd_log, app

SECRET = "test-secret"


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("PDF_FILL_SECRET", SECRET)
    return TestClient(app)


def test_fill_rejects_missing_secret(client: TestClient) -> None:
    response = client.post("/fill/i-130", json={"fields": {}, "checkboxes": {}})
    assert response.status_code == 401


def test_fill_rejects_wrong_secret(client: TestClient) -> None:
    response = client.post(
        "/fill/i-130",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": "wrong"},
    )
    assert response.status_code == 401


def test_fill_rejects_when_server_secret_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("PDF_FILL_SECRET", raising=False)
    monkeypatch.setenv("PDF_SERVICE_ENV", "production")
    response = TestClient(app).post(
        "/fill/i-130",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": SECRET},
    )
    assert response.status_code == 401


def test_unauthorized_invalid_json_is_401(client: TestClient) -> None:
    response = client.post(
        "/fill/i-130",
        content=b"not-json",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 401


def test_fill_rejects_slug_escape(client: TestClient) -> None:
    response = client.post(
        "/fill/..",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": SECRET},
    )
    assert response.status_code == 404


def test_fill_accepts_matching_secret(client: TestClient) -> None:
    response = client.post(
        "/fill/i-130",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": SECRET},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content.startswith(b"%PDF")


def test_fill_accepts_the_dev_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("PDF_FILL_SECRET", raising=False)
    monkeypatch.setenv("PDF_SERVICE_ENV", "development")
    response = TestClient(app).post(
        "/fill/i-130",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": "dev-only-fill-secret"},
    )
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")


def test_health_stays_open(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_allowed_origins_drop_a_wildcard(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PDF_ALLOWED_ORIGINS", "*,https://app.example")
    assert _allowed_origins() == ["https://app.example"]


def test_cors_allowlists_the_configured_origin(client: TestClient) -> None:
    allowed = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:3000"
    blocked = client.options(
        "/health",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert blocked.headers.get("access-control-allow-origin") is None


def test_catalog_and_debug_are_hidden_in_production(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("PDF_SERVICE_ENV", "production")
    assert client.get("/fields/i-130").status_code == 404
    assert client.get("/debug/field/i-130", params={"name": "x"}).status_code == 404


def test_fill_rejects_an_oversized_body(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PDF_MAX_BODY_BYTES", "8")
    response = client.post(
        "/fill/i-130",
        content=b'{"fields":{},"checkboxes":{}}',
        headers={"X-Fill-Secret": SECRET, "Content-Type": "application/json"},
    )
    assert response.status_code == 413


def test_fill_rate_limits_by_caller_and_ignores_forwarded_for(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("PDF_RATE_LIMIT", "1")
    _fill_hits.clear()
    alice = {"X-Fill-Secret": SECRET, "X-Fill-Caller": "user_alice", "X-Forwarded-For": "203.0.113.50"}
    first = client.post("/fill/not-a-form", json={"fields": {}, "checkboxes": {}}, headers=alice)
    rotated = client.post(
        "/fill/not-a-form",
        json={"fields": {}, "checkboxes": {}},
        headers={**alice, "X-Forwarded-For": "198.51.100.20"},
    )
    bob = client.post(
        "/fill/not-a-form",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": SECRET, "X-Fill-Caller": "user_bob", "X-Forwarded-For": "203.0.113.50"},
    )
    missing_a = client.post(
        "/fill/not-a-form",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": SECRET, "X-Forwarded-For": "192.0.2.10"},
    )
    missing_b = client.post(
        "/fill/not-a-form",
        json={"fields": {}, "checkboxes": {}},
        headers={"X-Fill-Secret": SECRET, "X-Forwarded-For": "192.0.2.11"},
    )
    assert first.status_code == 404
    assert rotated.status_code == 429
    assert bob.status_code == 404
    assert missing_a.status_code == 404
    assert missing_b.status_code == 429


def test_request_log_keeps_the_path_only(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict = {}

    def capture(message: str, status: str = "info", extra: dict | None = None) -> None:
        captured["message"] = message
        captured["extra"] = extra

    monkeypatch.setattr("app.main._send_dd_log", capture)
    client.get("/health", params={"ssn": "123-45-6789"})
    extra = captured["extra"]
    assert "http.url" not in extra
    assert extra["http.path"] == "/health"
    assert "123-45-6789" not in captured["message"]
    assert "123-45-6789" not in str(extra)
