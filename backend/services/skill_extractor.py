import re

SKILLS = [
    "Python",
    "Java",
    "C",
    "C++",
    "SQL",
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Node.js",
    "FastAPI",
    "Machine Learning",
    "Deep Learning",
    "Data Analytics",
    "NLP",
    "Git",
    "GitHub",
    "MongoDB",
    "MySQL",
    "DBMS",
    "Excel",
    "Power BI",
    "TensorFlow",
    "PyTorch"
]

def extract_skills(text):
    found = []

    text = text.lower()

    for skill in SKILLS:
        if re.search(r"\b" + re.escape(skill.lower()) + r"\b", text):
            found.append(skill)

    return sorted(list(set(found)))