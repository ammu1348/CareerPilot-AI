"""Unit tests for skill extraction, normalization, and gap scoring."""

from services.analyzer import analyze_resume
from services.role_skills import (
    JOB_ROLE_REQUIREMENTS,
    calculate_skill_gap,
    normalize_skill,
    normalize_skill_list,
)
from services.skill_extractor import extract_skills


def test_normalization_handles_aliases_and_ignores_non_strings():
    cases = {
        "ML": "Machine Learning",
        "js": "JavaScript",
        "React.js": "React",
        "PowerBI": "Power BI",
        "node": "Node.js",
        "dsa": "Data Structures",
        "C++": "C++",
        "C#": "C#",
        "  python   3  ": "Python",
    }
    for raw, expected in cases.items():
        assert normalize_skill(raw) == expected

    skills = normalize_skill_list(
        ["ML", "Machine Learning", "SQL", None, 7, "DSA", "C++"]
    )
    assert skills.count("Machine Learning") == 1
    assert {"SQL", "Database", "Algorithms", "Data Structures", "Programming"}.issubset(
        skills
    )
    assert normalize_skill_list(None) == []
    assert normalize_skill_list("python") == ["Programming", "Python"]


def test_data_analyst_gap_matches_expected_math():
    result = calculate_skill_gap(["Python", "SQL", "Data Analytics"], "Data Analyst")
    assert result["required_skills"] == JOB_ROLE_REQUIREMENTS["Data Analyst"]
    assert result["matched_skills"] == ["Python", "SQL", "Data Analytics"]
    assert result["missing_skills"] == ["Excel", "Power BI", "Statistics"]
    assert result["match_percentage"] == 50
    assert len(result["recommendations"]) == len(result["missing_skills"])


def test_unknown_role_falls_back_consistently():
    result = calculate_skill_gap(["Python"], "Not a supported role")
    assert result["target_role"] == "Data Analyst"
    assert result["required_skills"] == JOB_ROLE_REQUIREMENTS["Data Analyst"]


def test_extractor_uses_boundaries_and_handles_punctuation():
    text = "JavaScript, React.js, Node.js, C++, SQL, RESTful APIs and machine-learning."
    skills = extract_skills(text)
    assert {
        "JavaScript",
        "React",
        "Node.js",
        "C++",
        "SQL",
        "REST API",
        "Machine Learning",
    }.issubset(skills)
    assert "Java" not in skills
    assert "REST API" not in extract_skills("I need to rest after a long day.")
    assert {"Data Structures", "Algorithms"}.issubset(extract_skills("DSA"))
    assert extract_skills("") == []


def test_resume_score_is_bounded_and_explainable():
    analysis = analyze_resume(
        "Alex Doe alex@example.com\nSummary\nSkills\nPython SQL React\n"
        "Experience\nImproved workflow by 25%\nEducation\nProjects\n"
        + "Built useful software with clear documentation. "
        * 60
    )
    assert 0 < analysis["score"] <= 100
    assert set(analysis["score_breakdown"]) == {
        "technical_skills",
        "resume_sections",
        "length",
        "contact_details",
        "measurable_impact",
    }
    assert analysis["score"] == int(sum(analysis["score_breakdown"].values()) + 0.5)
    assert analysis["has_contact_details"] is True
    assert analysis["has_quantified_impact"] is True
    assert {"Summary", "Skills", "Experience", "Education", "Projects"}.issubset(
        analysis["sections"]
    )
    assert analyze_resume("")["score"] == 0
