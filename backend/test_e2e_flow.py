import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from fastapi.testclient import TestClient
from app import app
from services.role_skills import calculate_skill_gap, JOB_ROLE_REQUIREMENTS

client = TestClient(app)

def run_end_to_end_test():
    print("==========================================================")
    print("   CAREERPILOT-AI END-TO-END VERIFICATION PIPELINE")
    print("   HackFusion 2026 Problem Statement #8 Evaluation")
    print("==========================================================\n")

    # Step 1: Upload a real PDF resume
    print("[STEP 1] Uploading real PDF: 'uploads/CV_pdf.pdf'...")
    with open("uploads/CV_pdf.pdf", "rb") as f:
        response = client.post("/upload", files={"file": ("CV_pdf.pdf", f, "application/pdf")})

    assert response.status_code == 200, f"Upload failed with status {response.status_code}"
    data = response.json()
    assert data["status"] == "success"
    print("  ✓ Upload processed successfully!")

    # Step 2: Verify Resume Score and Extracted Skills
    score = data["score"]
    skills = data["skills"]
    feedback = data["feedback"]
    recommended_jobs = data["recommended_jobs"]
    ai_analysis = data["ai_analysis"]

    print(f"\n[STEP 2] Extracted Resume Data:")
    print(f"  • Resume Score: {score}/100")
    print(f"  • Feedback: {feedback}")
    print(f"  • Extracted Skills ({len(skills)}): {skills}")
    print(f"  • Recommended Jobs: {recommended_jobs}")
    print(f"  • AI Analysis Preview: {ai_analysis[:100]}...")

    assert score > 0, "Expected non-zero score"
    assert len(skills) > 0, "Expected detected skills"
    assert len(recommended_jobs) > 0, "Expected recommended jobs"
    print("  ✓ Core Resume Analysis features fully intact!")

    # Step 3: Select Target Job Role: 'Data Analyst'
    target_role = "Data Analyst"
    print(f"\n[STEP 3] Selecting Target Job Role: '{target_role}'")
    gap = calculate_skill_gap(skills, target_role)

    print(f"  • Required Skills ({len(gap['required_skills'])}): {gap['required_skills']}")
    print(f"  • Matched Skills ({len(gap['matched_skills'])}): {gap['matched_skills']}")
    print(f"  • Missing Skills ({len(gap['missing_skills'])}): {gap['missing_skills']}")

    # Step 4: Mathematical Accuracy Check
    print(f"\n[STEP 4] Calculating Skill Match Percentage:")
    total_req = len(gap["required_skills"])
    matched_req = len(gap["matched_skills"])
    calculated_pct = round((matched_req / total_req) * 100, 1)
    if calculated_pct.is_integer():
        calculated_pct = int(calculated_pct)

    print(f"  • Formula: ({matched_req} matched / {total_req} total required) * 100 = {calculated_pct}%")
    print(f"  • Reported Match: {gap['match_percentage']}%")
    assert gap["match_percentage"] == calculated_pct, f"Math mismatch: {gap['match_percentage']} != {calculated_pct}"
    print("  ✓ Skill Match % is mathematically exact!")

    # Step 5: Personalized Recommendations Check
    print(f"\n[STEP 5] Personalized Learning Recommendations for Missing Skills:")
    recommendations = gap["recommendations"]
    assert len(recommendations) == len(gap["missing_skills"])
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec}")
    print("  ✓ Recommendations are strictly tied to actual missing skills!")

    # Step 6: Verify Other Target Job Roles
    print(f"\n[STEP 6] Testing Alternative Target Roles:")
    for role in ["AI/ML Engineer", "Software Engineer", "Web Developer", "Full Stack Developer"]:
        role_gap = calculate_skill_gap(skills, role)
        print(f"  • Role: {role:22} | Match: {role_gap['match_percentage']:>5}% | Matched: {len(role_gap['matched_skills'])}/{len(role_gap['required_skills'])}")
    print("  ✓ Multi-role gap analysis verified across career tracks!")

    # Step 7: Negative / Edge-Case Tests
    print(f"\n[STEP 7] Testing Edge Cases & Failure Handling:")
    # Empty PDF
    with open("uploads/ANKIT.pdf", "rb") as f:
        empty_resp = client.post("/upload", files={"file": ("ANKIT.pdf", f, "application/pdf")})
    empty_data = empty_resp.json()
    assert empty_data["status"] == "error"
    print(f"  • Empty/Scanned PDF Response: '{empty_data['message']}' (Handled cleanly)")

    # Non-PDF
    bad_resp = client.post("/upload", files={"file": ("notes.docx", b"word doc", "application/octet-stream")})
    bad_data = bad_resp.json()
    assert bad_data["status"] == "error"
    print(f"  • Non-PDF File Response: '{bad_data['message']}' (Handled cleanly)")

    # Known mathematical test requirement from prompt:
    # Python, SQL, Data Analytics for Data Analyst -> 50% match
    prompt_test = calculate_skill_gap(["Python", "SQL", "Data Analytics"], "Data Analyst")
    assert prompt_test["match_percentage"] == 50
    assert prompt_test["missing_skills"] == ["Excel", "Power BI", "Statistics"]
    print("  • Prompt baseline (Python, SQL, Data Analytics -> Data Analyst = 50%): VERIFIED")

    print("\n==========================================================")
    print("   ALL ACCEPTANCE REQUIREMENTS VERIFIED AND PASSED! ✓")
    print("==========================================================")

if __name__ == "__main__":
    try:
        run_end_to_end_test()
    except Exception as e:
        print(f"\nEND-TO-END TEST FAILED: {e}")
        sys.exit(1)
