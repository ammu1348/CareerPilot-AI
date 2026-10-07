"""Rank the supported career tracks by required-skill overlap."""

from services.role_skills import JOB_ROLE_REQUIREMENTS, normalize_skill_list

FALLBACK_ROLES = ["Software Engineer", "Web Developer", "Data Analyst"]


def recommend_jobs(skills: list) -> list:
    """Return up to five supported roles, best skill overlap first.

    When no role-specific skills are detected, return a few starter tracks so
    the UI can still let a user explore the skill-gap tool. Those suggestions
    should be presented as starting points, not as strong matches.
    """
    normalized_skills = set(normalize_skill_list(skills))
    if not normalized_skills:
        return FALLBACK_ROLES.copy()

    ranked_roles = []
    for order, (role, required_skills) in enumerate(JOB_ROLE_REQUIREMENTS.items()):
        matched_count = sum(skill in normalized_skills for skill in required_skills)
        if not matched_count:
            continue

        percentage = (
            (matched_count / len(required_skills)) * 100 if required_skills else 0
        )
        ranked_roles.append((-percentage, -matched_count, order, role))

    ranked_roles.sort()
    if not ranked_roles:
        return FALLBACK_ROLES.copy()

    return [entry[3] for entry in ranked_roles[:5]]
