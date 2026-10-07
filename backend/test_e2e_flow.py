"""End-to-end service flow using an in-memory PDF fixture."""

from app import app
from fastapi.testclient import TestClient
from services.role_skills import calculate_skill_gap
from testing_utils import build_text_pdf

client = TestClient(app)


def test_upload_to_role_gap_flow():
    resume_text = (
        "Jordan Lee\nSummary\nData analyst and Python developer.\n"
        "Skills\nPython, SQL, Data Analytics, Git\n"
        "Experience\nAutomated monthly reporting and saved 20 hours.\n"
        "Projects\nBuilt analytics dashboard.\nEducation\nBachelor of Science\n"
    )
    response = client.post(
        "/upload",
        files={"file": ("resume.pdf", build_text_pdf(resume_text), "application/pdf")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["score"] > 0
    assert data["recommended_jobs"]
    assert (
        data["skill_gap"]["match_percentage"]
        == calculate_skill_gap(data["skills"], data["skill_gap"]["target_role"])[
            "match_percentage"
        ]
    )

    selected_gap = calculate_skill_gap(data["skills"], "Data Analyst")
    assert selected_gap["match_percentage"] == 50
    assert selected_gap["missing_skills"] == ["Excel", "Power BI", "Statistics"]
