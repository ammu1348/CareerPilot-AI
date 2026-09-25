from services.skill_extractor import extract_skills

def analyze_resume(text: str) -> dict:
    """Analyze resume text to extract skills and calculate resume score."""
    if not text:
        return {
            "score": 0,
            "skills": []
        }

    found_skills = extract_skills(text)

    # Resume score calculation (preserving original scoring method, max 100)
    score = len(found_skills) * 10
    if score > 100:
        score = 100

    return {
        "score": score,
        "skills": found_skills
    }