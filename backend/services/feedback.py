"""Short feedback labels for the explainable resume-readiness score."""


def generate_feedback(score: int) -> str:
    if score >= 80:
        return "Strong resume signals. Keep tailoring the document to each role and make sure your strongest achievements are easy to scan."
    if score >= 60:
        return "A solid foundation. Add specific outcomes to your experience and make sure your key sections and relevant skills are easy to find."
    if score >= 40:
        return "There is useful experience to build on. Strengthen the role-specific skills, project evidence, and measurable results in your resume."
    return "Start with the essentials: clear experience and education sections, relevant skills, contact details, and concise examples of your impact."
