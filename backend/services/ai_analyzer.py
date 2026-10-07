"""Backward-compatible import for the optional Gemini analyzer."""

from services.gemini_service import analyze_with_gemini


def analyze_with_ai(resume_text: str) -> str:
    """Compatibility wrapper; safely returns a fallback when Gemini is unset."""
    return analyze_with_gemini(resume_text)
