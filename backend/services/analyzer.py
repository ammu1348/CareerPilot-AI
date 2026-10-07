"""Deterministic, explainable resume signals used by the API."""

import re

from services.skill_extractor import extract_skills

SECTION_PATTERNS = {
    "Experience": re.compile(
        r"\b(?:professional\s+)?(?:work\s+)?experience\b|\bemployment\s+history\b|\binternships?\b",
        re.IGNORECASE,
    ),
    "Education": re.compile(
        r"\b(?:education|academic\s+background|qualifications?)\b", re.IGNORECASE
    ),
    "Projects": re.compile(
        r"\b(?:personal\s+)?projects?\b|\bportfolio\b", re.IGNORECASE
    ),
    "Skills": re.compile(
        r"\b(?:technical\s+)?skills\b|\btechnologies\b|\bcore\s+competencies\b",
        re.IGNORECASE,
    ),
    "Summary": re.compile(
        r"\b(?:professional\s+)?(?:summary|profile|objective)\b|\babout\s+me\b",
        re.IGNORECASE,
    ),
}

WORD_PATTERN = re.compile(r"\b[\w+#.-]+\b", re.UNICODE)
EMAIL_PATTERN = re.compile(
    r"\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+\b",
    re.IGNORECASE,
)
PHONE_PATTERN = re.compile(r"(?<!\w)(?:\+?\d[\d\s().-]{6,}\d)(?!\w)")
IMPACT_PATTERN = re.compile(
    r"(?:\b\d+(?:\.\d+)?\s*(?:%|percent|x|users?|customers?|clients?|hours?|days?|weeks?|months?|years?|projects?|teams?|\$|k\b|million\b|billion\b))|(?:\$\s?\d+(?:,\d{3})*(?:\.\d{2})?)",
    re.IGNORECASE,
)


def _length_score(word_count: int) -> int:
    """Reward a readable resume length without treating length as quality."""
    if 250 <= word_count <= 1000:
        return 20
    if 150 <= word_count < 250 or 1000 < word_count <= 1300:
        return 15
    if 80 <= word_count < 150 or 1300 < word_count <= 1800:
        return 8
    if word_count:
        return 3
    return 0


def analyze_resume(text: str) -> dict:
    """Extract skills and return a transparent heuristic score breakdown.

    This is a lightweight resume-readiness signal, not an ATS score or a
    prediction of hiring outcomes. The score is composed from observable text
    signals so the UI can explain exactly what affected it.
    """
    text = text or ""
    if not isinstance(text, str):
        text = str(text)

    stripped_text = text.strip()
    if not stripped_text:
        return {
            "score": 0,
            "skills": [],
            "score_breakdown": {
                "technical_skills": 0,
                "resume_sections": 0,
                "length": 0,
                "contact_details": 0,
                "measurable_impact": 0,
            },
            "word_count": 0,
            "sections": [],
            "has_contact_details": False,
            "has_quantified_impact": False,
        }

    skills = extract_skills(stripped_text)
    word_count = len(WORD_PATTERN.findall(stripped_text))
    sections = [
        name
        for name, pattern in SECTION_PATTERNS.items()
        if pattern.search(stripped_text)
    ]
    has_contact_details = bool(
        EMAIL_PATTERN.search(stripped_text) or PHONE_PATTERN.search(stripped_text)
    )
    has_quantified_impact = bool(IMPACT_PATTERN.search(stripped_text))

    # The maximum is 100: skills 35, sections 25, length 20, contact 10,
    # and measurable outcomes 10. These are directional content signals only.
    score_breakdown = {
        "technical_skills": min(len(skills), 10) * 3.5,
        "resume_sections": len(sections) * 5,
        "length": _length_score(word_count),
        "contact_details": 10 if has_contact_details else 0,
        "measurable_impact": 10 if has_quantified_impact else 0,
    }
    # Scores are non-negative, so adding 0.5 gives conventional half-up rounding.
    score = int(sum(score_breakdown.values()) + 0.5)

    return {
        "score": min(100, score),
        "skills": skills,
        "score_breakdown": score_breakdown,
        "word_count": word_count,
        "sections": sections,
        "has_contact_details": has_contact_details,
        "has_quantified_impact": has_quantified_impact,
    }
