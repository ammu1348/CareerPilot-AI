import re
from services.role_skills import normalize_skill_list

# Comprehensive Skill Patterns with abbreviations and aliases
# Tuple: (Regex pattern, Canonical skill name or alias)
SKILL_PATTERNS = [
    (r"\bpython\b", "Python"),
    (r"\bjava\b", "Java"),
    (r"\bc\+\+\b", "C++"),
    (r"\bc\b", "C"),
    (r"\bsql\b", "SQL"),
    (r"\bmysql\b", "SQL"),
    (r"\bpostgresql\b", "SQL"),
    (r"\bpostgres\b", "SQL"),
    (r"\bhtml(?:5)?\b", "HTML"),
    (r"\bcss(?:3)?\b", "CSS"),
    (r"\btailwind\b", "CSS"),
    (r"\bbootstrap\b", "CSS"),
    (r"\bjavascript\b", "JavaScript"),
    (r"\bjs\b", "JavaScript"),
    (r"\breact(?:js|\.js)?\b", "React"),
    (r"\bnode(?:\.js|js)?\b", "Node.js"),
    (r"\bfastapi\b", "FastAPI"),
    (r"\bdjango\b", "Django"),
    (r"\bspring(?:\s*boot)?\b", "Spring Boot"),
    (r"\bmachine\s+learning\b", "Machine Learning"),
    (r"\bml\b", "Machine Learning"),
    (r"\bdeep\s+learning\b", "Deep Learning"),
    (r"\bdl\b", "Deep Learning"),
    (r"\bnlp\b", "NLP"),
    (r"\bdata\s+analytics\b", "Data Analytics"),
    (r"\bdata\s+analysis\b", "Data Analytics"),
    (r"\bstatistics\b", "Statistics"),
    (r"\bstats\b", "Statistics"),
    (r"\bexcel\b", "Excel"),
    (r"\bpower\s*bi\b", "Power BI"),
    (r"\bgit\b", "Git"),
    (r"\bgithub\b", "Git"),
    (r"\bdata\s+structures\b", "Data Structures"),
    (r"\bdsa\b", "Data Structures"),
    (r"\balgorithms\b", "Algorithms"),
    (r"\boop[s]?\b", "OOP"),
    (r"\bobject\s+oriented\b", "OOP"),
    (r"\brest(?:ful)?(?:\s+api)?\b", "REST API"),
    (r"\bapi[s]?\b", "REST API"),
    (r"\bdatabase[s]?\b", "Database"),
    (r"\bdbms\b", "Database"),
    (r"\bmongodb\b", "Database"),
    (r"\bresponsive(?:\s+design)?\b", "Responsive Design"),
    (r"\btensorflow\b", "Deep Learning"),
    (r"\bpytorch\b", "Deep Learning"),
]

def extract_skills(text: str) -> list:
    """Extract skills from text with regex word boundaries and return normalized skills."""
    if not text:
        return []

    text_lower = text.lower()
    raw_found = []

    for pattern, canonical in SKILL_PATTERNS:
        if re.search(pattern, text_lower):
            raw_found.append(canonical)

    return normalize_skill_list(raw_found)