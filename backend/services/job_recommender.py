def recommend_jobs(skills):
    jobs = []

    if "Python" in skills and "Machine Learning" in skills:
        jobs.append("Machine Learning Engineer")

    if "Python" in skills and "SQL" in skills:
        jobs.append("Data Analyst")

    if "Java" in skills:
        jobs.append("Java Developer")

    if "Git" in skills:
        jobs.append("Software Engineer")

    if not jobs:
        jobs.append("Software Developer Intern")

    return jobs