"""Compatibility helper for role-specific missing-skill calculations."""

from services.role_skills import calculate_skill_gap


def find_missing_skills(skills, target_role="Data Analyst"):
    """Return the skills missing for a selected supported role.

    The default preserves the original helper's Data Analyst behavior while
    keeping the required-skills source of truth aligned with the API.
    """
    return calculate_skill_gap(skills or [], target_role)["missing_skills"]
