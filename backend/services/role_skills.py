import re

# Canonical Job Roles and their Required Skills
JOB_ROLE_REQUIREMENTS = {
    "Data Analyst": [
        "Python",
        "SQL",
        "Excel",
        "Power BI",
        "Statistics",
        "Data Analytics",
    ],
    "AI/ML Engineer": [
        "Python",
        "Machine Learning",
        "Statistics",
        "Deep Learning",
        "SQL",
        "Git",
    ],
    "Software Engineer": [
        "Programming",
        "Data Structures",
        "Algorithms",
        "OOP",
        "Git",
        "Database",
    ],
    "Web Developer": [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Git",
        "REST API",
    ],
    "Java Developer": [
        "Java",
        "Spring Boot",
        "SQL",
        "OOP",
        "Git",
        "REST API",
    ],
    "Python Developer": [
        "Python",
        "Django",
        "FastAPI",
        "SQL",
        "Git",
        "REST API",
    ],
    "Data Scientist": [
        "Python",
        "Machine Learning",
        "Statistics",
        "SQL",
        "Data Analytics",
        "Deep Learning",
    ],
    "Frontend Developer": [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Git",
        "Responsive Design",
    ],
    "Backend Developer": [
        "Python",
        "Node.js",
        "SQL",
        "REST API",
        "Git",
        "Database",
    ],
    "Full Stack Developer": [
        "JavaScript",
        "React",
        "Node.js",
        "HTML",
        "CSS",
        "SQL",
        "Git",
        "REST API",
    ],
}

# Skill Normalization Alias Map (Maps raw/alias terms to canonical skill names)
SKILL_NORMALIZATION_MAP = {
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "machine-learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "deep-learning": "Deep Learning",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ecmascript": "JavaScript",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "react js": "React",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node js": "Node.js",
    "py": "Python",
    "python": "Python",
    "python3": "Python",
    "stats": "Statistics",
    "statistics": "Statistics",
    "statistical analysis": "Statistics",
    "probability": "Statistics",
    "power bi": "Power BI",
    "powerbi": "Power BI",
    "power-bi": "Power BI",
    "excel": "Excel",
    "ms excel": "Excel",
    "microsoft excel": "Excel",
    "sql": "SQL",
    "mysql": "SQL",
    "postgresql": "SQL",
    "postgres": "SQL",
    "sqlite": "SQL",
    "database": "Database",
    "dbms": "Database",
    "rdbms": "Database",
    "mongodb": "Database",
    "git": "Git",
    "github": "Git",
    "gitlab": "Git",
    "version control": "Git",
    "html": "HTML",
    "html5": "HTML",
    "css": "CSS",
    "css3": "CSS",
    "tailwind": "CSS",
    "bootstrap": "CSS",
    "java": "Java",
    "core java": "Java",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "django": "Django",
    "fastapi": "FastAPI",
    "rest": "REST API",
    "rest api": "REST API",
    "restful": "REST API",
    "restful api": "REST API",
    "rest apis": "REST API",
    "api": "REST API",
    "data structures": "Data Structures",
    "dsa": "Data Structures",
    "data structures & algorithms": "Data Structures",
    "algorithms": "Algorithms",
    "algo": "Algorithms",
    "oop": "OOP",
    "oops": "OOP",
    "object oriented programming": "OOP",
    "programming": "Programming",
    "coding": "Programming",
    "software development": "Programming",
    "problem solving": "Programming",
    "data analytics": "Data Analytics",
    "data analysis": "Data Analytics",
    "eda": "Data Analytics",
    "pandas": "Data Analytics",
    "numpy": "Data Analytics",
    "responsive design": "Responsive Design",
    "responsive": "Responsive Design",
    "web development": "HTML",
}

# Actionable improvement recommendations mapped by canonical skill
SKILL_RECOMMENDATIONS = {
    "Python": "Strengthen Python core fundamentals (OOP, list comprehensions, data structures, and standard libraries).",
    "SQL": "Practice complex SQL queries (multi-table joins, subqueries, CTEs, and window functions).",
    "Excel": "Learn Excel for data analysis (Pivot Tables, VLOOKUP/XLOOKUP, and conditional data modeling).",
    "Power BI": "Learn Power BI for dashboard creation, DAX calculations, and interactive business intelligence reporting.",
    "Statistics": "Strengthen statistics fundamentals (hypothesis testing, probability distributions, variance, and regression analysis).",
    "Data Analytics": "Master exploratory data analysis (EDA), data cleaning techniques, and visualization with Pandas and Seaborn.",
    "Machine Learning": "Study core ML algorithms (supervised & unsupervised learning, scikit-learn pipeline building, and model evaluation metrics).",
    "Deep Learning": "Explore neural network architectures (CNNs, RNNs, Transformers) using PyTorch or TensorFlow.",
    "Git": "Learn Git version control workflow (branching, rebasing, merge conflict resolution, and pull request collaboration).",
    "Programming": "Practice core problem solving and code modularity across fundamental computer science paradigms.",
    "Data Structures": "Practice essential data structures (arrays, linked lists, trees, graphs, heaps, and hash maps) on LeetCode.",
    "Algorithms": "Master algorithmic problem solving (sorting, binary search, recursion, dynamic programming, and greedy algorithms).",
    "OOP": "Deepen understanding of Object-Oriented Programming (encapsulation, inheritance, polymorphism, and abstraction design patterns).",
    "Database": "Learn relational and NoSQL database architecture, schema design, normalization, and indexing strategies.",
    "HTML": "Master semantic HTML5 markup, modern web accessibility (a11y/WCAG), and search engine optimization basics.",
    "CSS": "Level up modern CSS design skills (Flexbox, CSS Grid, animations, and Tailwind CSS utility styling).",
    "JavaScript": "Strengthen modern JavaScript concepts (ES6+, closures, promises, async/await, event loop, and DOM manipulation).",
    "React": "Build interactive single-page applications using React (functional components, Hooks, state management, and component lifecycle).",
    "REST API": "Learn RESTful API architecture principles, HTTP methods, status codes, JWT authentication, and API documentation.",
    "Spring Boot": "Learn Spring Boot framework for enterprise Java backend development, dependency injection, and microservices.",
    "Django": "Learn Django framework for rapid Python web development, ORM querying, and secure user authentication.",
    "FastAPI": "Build high-speed asynchronous REST APIs in Python using FastAPI, Pydantic data schemas, and OpenAPI.",
    "Node.js": "Develop scalable server-side applications using Node.js, Express.js middleware, and asynchronous I/O.",
    "Responsive Design": "Learn mobile-first responsive web design principles, flexible layouts, and CSS media queries.",
    "Java": "Master core Java principles (Java Collections Framework, multithreading, concurrency, and JVM internals).",
}

def normalize_skill(skill: str) -> str:
    """Normalize a single skill string or alias into its canonical form."""
    cleaned = skill.strip().lower()
    return SKILL_NORMALIZATION_MAP.get(cleaned, skill.strip())

def normalize_skill_list(skills: list) -> list:
    """Normalize and deduplicate a list of skills."""
    normalized_set = set()
    for s in skills:
        norm = normalize_skill(s)
        normalized_set.add(norm)
        # If the skill implies related canonical skills (e.g. DSA implies Data Structures & Algorithms)
        if s.strip().lower() in ["dsa", "data structures and algorithms", "data structures & algorithms"]:
            normalized_set.add("Data Structures")
            normalized_set.add("Algorithms")
        if s.strip().lower() in ["sql", "mysql", "postgresql", "postgres", "mongodb"]:
            normalized_set.add("Database")
            if s.strip().lower() != "mongodb":
                normalized_set.add("SQL")
        if s.strip().lower() in ["python", "java", "javascript", "c++", "c"]:
            normalized_set.add("Programming")

    # Order predictably
    return sorted(list(normalized_set))

def calculate_skill_gap(resume_skills: list, target_role: str) -> dict:
    """
    Perform deterministic skill gap analysis between extracted resume skills and target role.
    
    Returns:
        dict: {
            "target_role": str,
            "required_skills": list,
            "matched_skills": list,
            "missing_skills": list,
            "match_percentage": float,
            "recommendations": list
        }
    """
    normalized_resume = normalize_skill_list(resume_skills)
    
    # Retrieve required skills for target role, fallback to Data Analyst if unknown
    required_skills = JOB_ROLE_REQUIREMENTS.get(target_role)
    if not required_skills:
        # Default or fallback role
        target_role = "Data Analyst"
        required_skills = JOB_ROLE_REQUIREMENTS[target_role]

    matched_skills = [skill for skill in required_skills if skill in normalized_resume]
    missing_skills = [skill for skill in required_skills if skill not in normalized_resume]

    total_required = len(required_skills)
    if total_required > 0:
        match_percentage = round((len(matched_skills) / total_required) * 100, 1)
        # If integer percentage, format nicely
        if match_percentage.is_integer():
            match_percentage = int(match_percentage)
    else:
        match_percentage = 0

    recommendations = []
    for skill in missing_skills:
        rec = SKILL_RECOMMENDATIONS.get(skill, f"Learn and build hands-on projects with {skill}.")
        recommendations.append(rec)

    if not recommendations:
        recommendations.append(
            f"Outstanding match for {target_role}! Focus on system design, end-to-end portfolio projects, and interview practice."
        )

    return {
        "target_role": target_role,
        "required_skills": required_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_percentage,
        "recommendations": recommendations,
        "normalized_resume_skills": normalized_resume,
    }
