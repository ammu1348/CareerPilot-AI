def analyze_resume(text):
    skills = [
        "Python",
        "Java",
        "SQL",
        "Machine Learning",
        "Data Analytics",
        "Git",
        "HTML",
        "CSS",
        "JavaScript",
        "FastAPI",
        "C++"
    ]

    found_skills = []

    for skill in skills:
        if skill.lower() in text.lower():
            found_skills.append(skill)

    score = len(found_skills) * 10
    if score > 100:
        score = 100

    return {
        "score": score,
        "skills": found_skills
    }