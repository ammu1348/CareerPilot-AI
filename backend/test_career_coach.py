"""Consent and data-minimization tests for the career-coach endpoint."""

import routes.resume as resume_routes
from app import app
from fastapi.testclient import TestClient
from services.gemini_service import answer_career_question

client = TestClient(app)


def test_career_coach_requires_explicit_consent():
    response = client.post(
        "/career-coach",
        json={
            "question": "What should I learn first?",
            "skills": ["Python"],
            "target_role": "Data Analyst",
        },
    )
    assert response.status_code == 403
    assert "opt in" in response.json()["detail"].lower()


def test_career_coach_has_honest_deterministic_fallback_without_gemini(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "")
    result = answer_career_question(
        "What should I learn first?", ["Python"], "Data Analyst"
    )
    assert result["ai_used"] is False
    assert "not configured" in result["answer"].lower()
    assert "SQL" in result["answer"] or "Excel" in result["answer"]


def test_career_coach_uses_only_question_and_canonical_skill_summary(monkeypatch):
    received = []

    def fake_coach(question, skills, target_role):
        received.append((question, skills, target_role))
        return {"answer": "Build one focused analytics project.", "ai_used": True}

    monkeypatch.setattr(resume_routes, "answer_career_question", fake_coach)
    response = client.post(
        "/career-coach",
        json={
            "question": "What should I learn first?",
            "skills": ["py", "SQL", "python", "Alex Doe alex@example.com"],
            "target_role": "Data Analyst",
            "consent": True,
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "answer": "Build one focused analytics project.",
        "ai_used": True,
    }
    question, skills, role = received[0]
    assert question == "What should I learn first?"
    assert "Python" in skills
    assert "SQL" in skills
    assert "alex@example.com" not in " ".join(skills)
    assert role == "Data Analyst"
