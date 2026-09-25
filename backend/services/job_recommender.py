def recommend_jobs(skills: list) -> list:
    """Recommend roles based on extracted resume skills, matching supported target roles."""
    jobs = []
    skills_set = set(skills)

    # Data Analyst
    if "Python" in skills_set and ("SQL" in skills_set or "Data Analytics" in skills_set or "Excel" in skills_set or "Power BI" in skills_set):
        jobs.append("Data Analyst")

    # AI/ML Engineer & Data Scientist
    if "Machine Learning" in skills_set or "Deep Learning" in skills_set:
        jobs.append("AI/ML Engineer")
        if "Statistics" in skills_set or "Data Analytics" in skills_set:
            jobs.append("Data Scientist")

    # Frontend Developer & Web Developer
    if "React" in skills_set or "JavaScript" in skills_set or ("HTML" in skills_set and "CSS" in skills_set):
        jobs.append("Frontend Developer")
        jobs.append("Web Developer")

    # Backend Developer
    if ("Node.js" in skills_set or "FastAPI" in skills_set or "Django" in skills_set) and ("SQL" in skills_set or "Database" in skills_set or "REST API" in skills_set):
        jobs.append("Backend Developer")

    # Full Stack Developer
    if ("React" in skills_set or "Frontend Developer" in jobs) and ("Node.js" in skills_set or "Backend Developer" in jobs):
        jobs.append("Full Stack Developer")

    # Java Developer
    if "Java" in skills_set or "Spring Boot" in skills_set:
        jobs.append("Java Developer")

    # Python Developer
    if "Python" in skills_set and "Python Developer" not in jobs:
        jobs.append("Python Developer")

    # Software Engineer
    if "Programming" in skills_set or "Data Structures" in skills_set or "Algorithms" in skills_set or "Git" in skills_set or "OOP" in skills_set:
        jobs.append("Software Engineer")

    # Deduplicate while preserving order
    deduped = []
    for j in jobs:
        if j not in deduped:
            deduped.append(j)

    if not deduped:
        deduped = ["Software Engineer", "Web Developer", "Data Analyst"]

    return deduped[:5]