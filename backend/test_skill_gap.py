import sys
import io

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from services.role_skills import (
    JOB_ROLE_REQUIREMENTS,
    SKILL_NORMALIZATION_MAP,
    normalize_skill,
    normalize_skill_list,
    calculate_skill_gap,
)
from services.skill_extractor import extract_skills
from services.pdf_parser import extract_text

def test_normalization():
    print("--- Test 1: Skill Normalization & Aliases ---")
    test_cases = [
        ("ml", "Machine Learning"),
        ("ML", "Machine Learning"),
        ("js", "JavaScript"),
        ("JS", "JavaScript"),
        ("reactjs", "React"),
        ("React.js", "React"),
        ("stats", "Statistics"),
        ("Statistics", "Statistics"),
        ("PowerBI", "Power BI"),
        ("node", "Node.js"),
        ("dsa", "Data Structures"),
        ("oops", "OOP"),
    ]
    for raw, expected in test_cases:
        actual = normalize_skill(raw)
        assert actual == expected, f"Failed: normalize_skill('{raw}') was '{actual}', expected '{expected}'"
        print(f"  [OK] {raw} -> {actual}")

    # Test list normalization and deduplication
    raw_list = ["ML", "Machine Learning", "js", "JavaScript", "ReactJS", "react", "Stats", "statistics", "Python", "py"]
    normalized = normalize_skill_list(raw_list)
    print("  Normalized list:", normalized)
    assert "Machine Learning" in normalized
    assert "JavaScript" in normalized
    assert "React" in normalized
    assert "Statistics" in normalized
    assert "Python" in normalized
    # Count occurrences
    assert normalized.count("Machine Learning") == 1
    assert normalized.count("JavaScript") == 1
    assert normalized.count("React") == 1
    print("  [OK] No duplicates and all canonical names correctly identified")

def test_math_accuracy():
    print("\n--- Test 2: Mathematical Accuracy of Skill Match % ---")
    # Data Analyst requirements: Python, SQL, Excel, Power BI, Statistics, Data Analytics (total 6)
    # Resume skills: Python, SQL, Data Analytics (3 matched, 3 missing: Excel, Power BI, Statistics)
    result = calculate_skill_gap(["Python", "SQL", "Data Analytics"], "Data Analyst")
    print(f"  Target Role: {result['target_role']}")
    print(f"  Required ({len(result['required_skills'])}): {result['required_skills']}")
    print(f"  Matched ({len(result['matched_skills'])}): {result['matched_skills']}")
    print(f"  Missing ({len(result['missing_skills'])}): {result['missing_skills']}")
    print(f"  Match %: {result['match_percentage']}%")

    assert result["matched_skills"] == ["Python", "SQL", "Data Analytics"]
    assert result["missing_skills"] == ["Excel", "Power BI", "Statistics"]
    expected_pct = (3 / 6) * 100 # exactly 50%
    assert result["match_percentage"] == expected_pct, f"Expected {expected_pct}%, got {result['match_percentage']}%"
    print(f"  [OK] Mathematical formula verified: (3 / 6) * 100 = {expected_pct}%")

    # Recommendations check
    print(f"  Recommendations count: {len(result['recommendations'])}")
    for rec in result["recommendations"]:
        print(f"    - {rec}")
    assert any("Excel" in r for r in result["recommendations"])
    assert any("Power BI" in r for r in result["recommendations"])
    assert any("statistics" in r.lower() for r in result["recommendations"])
    print("  [OK] Actionable recommendations directly match missing skills")

def test_pdf_extraction_and_gap():
    print("\n--- Test 3: Real PDF Parsing and Skill Gap Analysis ---")
    cv_text = extract_text("uploads/CV_pdf.pdf")
    assert len(cv_text) > 0, "Failed to extract text from uploads/CV_pdf.pdf"
    extracted = extract_skills(cv_text)
    print(f"  Extracted {len(extracted)} skills from CV_pdf.pdf: {extracted}")

    # Analyze for Data Analyst
    da_gap = calculate_skill_gap(extracted, "Data Analyst")
    print(f"  Data Analyst Match: {da_gap['match_percentage']}%")
    print(f"    Matched: {da_gap['matched_skills']}")
    print(f"    Missing: {da_gap['missing_skills']}")

    # Analyze for AI/ML Engineer
    aiml_gap = calculate_skill_gap(extracted, "AI/ML Engineer")
    print(f"  AI/ML Engineer Match: {aiml_gap['match_percentage']}%")
    print(f"    Matched: {aiml_gap['matched_skills']}")
    print(f"    Missing: {aiml_gap['missing_skills']}")

    # Test Empty PDF
    empty_text = extract_text("uploads/ANKIT.pdf")
    print(f"  Empty PDF text length: {len(empty_text)}")
    assert len(empty_text) == 0
    print("  [OK] Empty PDF correctly detected with 0 extracted text")

if __name__ == "__main__":
    try:
        test_normalization()
        test_math_accuracy()
        test_pdf_extraction_and_gap()
        print("\nAll Backend Tests PASSED Successfully! 🎉")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
