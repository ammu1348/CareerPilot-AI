"""Security and response tests for the environment-configured admin console."""

from app import app
from fastapi.testclient import TestClient
from services.admin_auth import (
    AdminSettings,
    create_password_hash,
    create_session_token,
    verify_password,
    verify_session_token,
)

ADMIN_PASSWORD = "A-long-admin-password!42"


def test_password_hashing_and_expiring_session_tokens():
    password_hash = create_password_hash(ADMIN_PASSWORD, salt=b"0123456789abcdef")
    assert verify_password(ADMIN_PASSWORD, password_hash)
    assert not verify_password("incorrect password", password_hash)
    assert not verify_password(ADMIN_PASSWORD, "not-a-real-hash")

    settings = AdminSettings(
        email="admin@example.com",
        password_hash=password_hash,
        session_secret="s" * 48,
        session_ttl_seconds=3600,
        cookie_secure=False,
        cookie_same_site="strict",
    )
    token = create_session_token(settings.email, settings, now=1_700_000_000)
    assert verify_session_token(token, settings, now=1_700_000_100) == settings.email
    assert verify_session_token(token, settings, now=1_700_004_000) is None
    assert verify_session_token(token + "tampered", settings, now=1_700_000_100) is None


def test_admin_console_requires_login_and_returns_live_safe_overview(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", create_password_hash(ADMIN_PASSWORD))
    monkeypatch.setenv("ADMIN_SESSION_SECRET", "test-only-session-secret-" * 3)
    monkeypatch.setenv("ADMIN_COOKIE_SECURE", "false")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    client = TestClient(app)
    assert client.get("/admin/overview").status_code == 401

    login = client.post(
        "/admin/auth/login",
        json={"email": "ADMIN@example.com", "password": ADMIN_PASSWORD},
    )
    assert login.status_code == 200
    assert login.json() == {"authenticated": True, "email": "admin@example.com"}
    cookie = login.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "samesite=strict" in cookie
    assert "; secure" not in cookie

    identity = client.get("/admin/auth/me")
    assert identity.status_code == 200
    assert identity.json() == {"authenticated": True, "email": "admin@example.com"}

    overview = client.get("/admin/overview")
    assert overview.status_code == 200
    data = overview.json()
    assert data["system"]["status"] == "operational"
    assert data["system"]["upload_limit_mb"] == 10
    assert data["system"]["resume_storage"].startswith("ephemeral")
    assert data["ai"]["configured"] is False
    assert data["ai"]["provider"] == "Google Gemini"
    assert len(data["roles"]) == 10
    assert "resume_text" not in overview.text
    assert overview.headers["cache-control"] == "no-store"

    logout = client.post("/admin/auth/logout")
    assert logout.status_code == 200
    assert client.get("/admin/overview").status_code == 401


def test_cross_site_cookie_requires_secure_transport(monkeypatch):
    from services.admin_auth import get_admin_settings

    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", create_password_hash(ADMIN_PASSWORD))
    monkeypatch.setenv("ADMIN_SESSION_SECRET", "test-only-session-secret-" * 3)
    monkeypatch.setenv("ADMIN_COOKIE_SECURE", "false")
    monkeypatch.setenv("ADMIN_COOKIE_SAMESITE", "none")
    assert get_admin_settings().configured is False


def test_admin_routes_are_disabled_until_secrets_are_configured(monkeypatch):
    for setting in ("ADMIN_EMAIL", "ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET"):
        monkeypatch.delenv(setting, raising=False)

    client = TestClient(app)
    response = client.post(
        "/admin/auth/login",
        json={"email": "admin@example.com", "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"].lower()
