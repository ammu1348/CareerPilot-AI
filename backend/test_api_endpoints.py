"""API contract and upload-safety tests."""

import pytest
import routes.resume as resume_routes
from app import app, create_app
from fastapi.testclient import TestClient
from testing_utils import build_text_pdf

client = TestClient(app)


def test_health_and_exact_configured_origin_cors(monkeypatch):
    assert client.get("/health").json() == {"status": "ok"}
    preview_origin = "https://5173-preview-sandbox.e2b.app"
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", preview_origin)
    cors_client = TestClient(create_app())
    response = cors_client.options(
        "/admin/auth/login",
        headers={
            "Origin": preview_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == preview_origin
    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_rejects_wildcard_origins(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "*")
    with pytest.raises(ValueError, match="exact origins"):
        create_app()


def test_roles_endpoint_returns_supported_requirements():
    response = client.get("/roles")
    assert response.status_code == 200
    body = response.json()
    assert len(body["roles"]) >= 10
    assert "Data Analyst" in body["roles"]
    assert body["requirements"]["Data Analyst"] == [
        "Python",
        "SQL",
        "Excel",
        "Power BI",
        "Statistics",
        "Data Analytics",
    ]


def test_skill_gap_endpoint_is_deterministic():
    response = client.post(
        "/skill-gap",
        json={
            "skills": ["Python", "SQL", "Data Analytics"],
            "target_role": "Data Analyst",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["match_percentage"] == 50
    assert body["matched_skills"] == ["Python", "SQL", "Data Analytics"]
    assert body["missing_skills"] == ["Excel", "Power BI", "Statistics"]


def test_valid_upload_returns_summary_without_resume_text():
    resume = (
        "Alex Doe alex@example.com\nSummary\nData analyst with Python and SQL.\n"
        "Skills\nPython, SQL, Excel, Power BI, statistics, data analytics\n"
        "Experience\nIncreased reporting speed by 30%.\nEducation\nProjects\n"
    )
    response = client.post(
        "/upload",
        files={
            "file": (
                "../../private_resume.pdf",
                build_text_pdf(resume),
                "application/pdf",
            )
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["filename"] == "private_resume.pdf"
    assert body["score"] > 0
    assert "Python" in body["skills"]
    assert body["skill_gap"]["target_role"] in body["available_roles"]
    assert body["ai_enabled"] is False
    assert "text" not in body
    assert "alex@example.com" not in response.text
    assert "not requested" in body["ai_analysis"].lower()


def test_invalid_extension_and_invalid_pdf_are_handled_cleanly():
    wrong_extension = client.post(
        "/upload",
        files={"file": ("resume.docx", b"not a pdf", "application/octet-stream")},
    )
    assert wrong_extension.status_code == 200
    assert wrong_extension.json()["status"] == "error"
    assert "pdf" in wrong_extension.json()["message"].lower()

    fake_pdf = client.post(
        "/upload",
        files={
            "file": (
                "resume.pdf",
                b"plain text pretending to be a pdf",
                "application/pdf",
            )
        },
    )
    assert fake_pdf.status_code == 200
    assert fake_pdf.json()["status"] == "error"
    assert "valid pdf" in fake_pdf.json()["message"].lower()


def test_scanned_or_empty_pdf_returns_actionable_message():
    response = client.post(
        "/upload",
        files={"file": ("scan.pdf", build_text_pdf("   "), "application/pdf")},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "error"
    assert "text-based pdf" in response.json()["message"].lower()


def test_upload_limit_is_enforced(monkeypatch):
    monkeypatch.setattr(resume_routes, "MAX_UPLOAD_BYTES", 32)
    response = client.post(
        "/upload",
        files={"file": ("large.pdf", b"%PDF-" + b"x" * 40, "application/pdf")},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "error"
    assert "10 mb" in response.json()["message"].lower()


def test_gemini_is_only_called_after_explicit_opt_in(monkeypatch):
    calls = []

    def fake_gemini(text):
        calls.append(text)
        return "Optional insight"

    monkeypatch.setattr(resume_routes, "analyze_with_gemini", fake_gemini)
    pdf = build_text_pdf(
        "Python SQL React resume with enough selectable text for analysis."
    )
    response = client.post(
        "/upload",
        data={"include_ai": "true"},
        files={"file": ("resume.pdf", pdf, "application/pdf")},
    )
    assert response.status_code == 200
    assert response.json()["ai_analysis"] == "Optional insight"
    assert response.json()["ai_enabled"] is True
    assert len(calls) == 1
    assert "resume" in calls[0].lower()
