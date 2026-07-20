def find_missing_skills(skills):
    required = [
        "Python",
        "Java",
        "SQL",
        "Machine Learning",
        "Data Analytics",
        "Git",
        "FastAPI",
        "Docker",
        "AWS",
        "React"
    ]

    missing = []

    for skill in required:
        if skill not in skills:
            missing.append(skill)

    return missing