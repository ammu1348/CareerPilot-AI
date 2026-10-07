"""Conservative keyword-based skill extraction for text-based resumes."""

import re

from services.role_skills import normalize_skill_list

# Regexes use explicit token boundaries so terms such as "Java" are not
# inferred from "JavaScript", and "REST" in ordinary prose is not treated as
# a REST API skill. Single-letter languages are intentionally excluded because
# they produce too many false positives in resume text.
SKILL_PATTERNS = [
    (r"(?<![a-z0-9])c\+\+(?![a-z0-9])", "C++"),
    (r"(?<![a-z0-9])c#(?![a-z0-9])", "C#"),
    (r"\bpython(?:\s*3(?:\.\d+)?)?\b", "Python"),
    (r"\bjava\b", "Java"),
    (r"\bsql\b|\bmysql\b|\bpostgres(?:ql)?\b|\bsqlite\b", "SQL"),
    (r"\bhtml(?:\s*5)?\b", "HTML"),
    (r"\bcss(?:\s*3)?\b", "CSS"),
    (r"\btailwind(?:\s*css)?\b|\bbootstrap\b", "CSS"),
    (r"\bjavascript\b|\becmascript\b|(?<![a-z0-9])js(?![a-z0-9])", "JavaScript"),
    (r"\btypescript\b|(?<![a-z0-9])ts(?![a-z0-9])", "TypeScript"),
    (r"\breact(?:\s*\.\s*js|\s*js)?\b", "React"),
    (r"\bnode(?:\s*\.\s*js|\s*js)?\b", "Node.js"),
    (r"\bfastapi\b", "FastAPI"),
    (r"\bdjango\b", "Django"),
    (r"\bspring(?:\s*boot)?\b", "Spring Boot"),
    (r"\bmachine[\s-]+learning\b|(?<![a-z0-9])ml(?![a-z0-9])", "Machine Learning"),
    (r"\bdeep[\s-]+learning\b|(?<![a-z0-9])dl(?![a-z0-9])", "Deep Learning"),
    (r"\bnlp\b|\bnatural\s+language\s+processing\b", "NLP"),
    (r"\bdata\s+analytics\b|\bdata\s+analysis\b|\beda\b", "Data Analytics"),
    (r"\bstatistics\b|\bstats\b|\bstatistical\s+analysis\b", "Statistics"),
    (r"\bexcel\b", "Excel"),
    (r"\bpower\s*[- ]?bi\b|\bpowerbi\b", "Power BI"),
    (r"\bgit\b|\bgithub\b|\bgitlab\b|\bversion\s+control\b", "Git"),
    (r"\bdata\s+structures(?:\s+(?:and|&)\s+algorithms)?\b", "Data Structures"),
    (r"\bdsa\b", "DSA"),
    (r"\balgorithms?\b|\balgo\b", "Algorithms"),
    (r"\boops?\b|\bobject[ -]oriented(?:\s+programming)?\b", "OOP"),
    (r"\brest(?:ful)?\s+apis?\b", "REST API"),
    (r"\bdatabases?\b|\bdbms\b|\brdbms\b|\bmongodb\b", "Database"),
    (r"\bresponsive(?:\s+design)?\b", "Responsive Design"),
    (r"\btensorflow\b|\bpytorch\b", "Deep Learning"),
    (r"\bscikit[ -]?learn\b|\bsklearn\b", "Machine Learning"),
    (r"\bpandas\b|\bnumpy\b", "Data Analytics"),
    (r"\baws\b|\bamazon web services\b", "AWS"),
    (r"\bazure\b|\bmicrosoft azure\b", "Azure"),
    (r"\bdocker\b", "Docker"),
    (r"\bkubernetes\b|\bk8s\b", "Kubernetes"),
    (r"\blinux\b", "Linux"),
    (r"\btableau\b", "Tableau"),
    (r"\bpower\s+point\b|\bpowerpoint\b", "PowerPoint"),
]


def extract_skills(text: str) -> list:
    """Extract canonical skills from text, de-duplicated and normalized."""
    if not isinstance(text, str) or not text.strip():
        return []

    text_lower = text.lower()
    raw_found = [
        canonical
        for pattern, canonical in SKILL_PATTERNS
        if re.search(pattern, text_lower)
    ]
    return normalize_skill_list(raw_found)
