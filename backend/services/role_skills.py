"""Canonical career roles and skill-gap calculations.

Both frontend and backend load their role definitions, aliases, and learning
prompts from ``shared/career_data.json`` so comparisons stay in sync.
"""

import json
from pathlib import Path

_DATA_PATH = Path(__file__).resolve().parents[2] / "shared" / "career_data.json"
with _DATA_PATH.open(encoding="utf-8") as data_file:
    _CAREER_DATA = json.load(data_file)

JOB_ROLES = _CAREER_DATA["roles"]
JOB_ROLE_REQUIREMENTS = {
    role: role_data["skills"] for role, role_data in JOB_ROLES.items()
}
SKILL_NORMALIZATION_MAP = _CAREER_DATA["skill_normalization"]
SKILL_RECOMMENDATIONS = _CAREER_DATA["skill_recommendations"]


PROGRAMMING_LANGUAGE_ALIASES = {
    "python",
    "python3",
    "python 3",
    "java",
    "javascript",
    "ecmascript",
    "typescript",
    "ts",
    "c++",
    "c#",
}
RELATIONAL_DATABASE_ALIASES = {"sql", "mysql", "postgresql", "postgres", "sqlite"}
DATABASE_ALIASES = {"database", "dbms", "rdbms", "mongodb"}
DSA_ALIASES = {"dsa", "data structures and algorithms", "data structures & algorithms"}


def normalize_skill(skill: str) -> str:
    """Normalize one skill or alias to its canonical label."""
    if not isinstance(skill, str):
        return ""
    cleaned = " ".join(skill.strip().lower().split())
    if not cleaned:
        return ""
    return SKILL_NORMALIZATION_MAP.get(cleaned, " ".join(skill.strip().split()))


def normalize_skill_list(skills: list) -> list:
    """Normalize a skill collection, expand useful composites, and deduplicate."""
    if skills is None:
        return []
    if isinstance(skills, str):
        skills = [skills]

    normalized_set = set()
    for raw_skill in skills:
        if not isinstance(raw_skill, str):
            continue

        raw = " ".join(raw_skill.strip().lower().split())
        normalized = normalize_skill(raw_skill)
        if normalized:
            normalized_set.add(normalized)

        if raw in RELATIONAL_DATABASE_ALIASES:
            normalized_set.update({"Database", "SQL"})
        elif raw in DATABASE_ALIASES:
            normalized_set.add("Database")

        if raw in DSA_ALIASES:
            normalized_set.update({"Data Structures", "Algorithms"})

        if raw in PROGRAMMING_LANGUAGE_ALIASES or normalized in {
            "Python",
            "Java",
            "JavaScript",
            "TypeScript",
            "C++",
            "C#",
        }:
            normalized_set.add("Programming")

    return sorted(normalized_set)


def calculate_skill_gap(resume_skills: list, target_role: str) -> dict:
    """Compare canonical resume skills with role requirements.

    Match percentage is ``matched required skills / total required skills``.
    Unknown roles safely fall back to Data Analyst and are labeled accordingly.
    """
    normalized_resume = normalize_skill_list(resume_skills)
    if not isinstance(target_role, str) or target_role not in JOB_ROLE_REQUIREMENTS:
        target_role = "Data Analyst"
    required_skills = JOB_ROLE_REQUIREMENTS[target_role]

    matched_skills = [skill for skill in required_skills if skill in normalized_resume]
    missing_skills = [
        skill for skill in required_skills if skill not in normalized_resume
    ]

    if required_skills:
        match_percentage = round((len(matched_skills) / len(required_skills)) * 100, 1)
        if match_percentage.is_integer():
            match_percentage = int(match_percentage)
    else:
        match_percentage = 0

    recommendations = [
        SKILL_RECOMMENDATIONS.get(
            skill, f"Learn and build hands-on projects with {skill}."
        )
        for skill in missing_skills
    ]
    if not recommendations:
        recommendations.append(
            f"Strong listed-skill match for {target_role}. Keep building project evidence and prepare role-specific interview examples."
        )

    return {
        "target_role": target_role,
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
        "recommendations": recommendations,
        "normalized_resume_skills": normalized_resume,
    }
