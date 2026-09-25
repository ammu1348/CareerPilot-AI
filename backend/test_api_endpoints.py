import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_endpoints():
    print("--- Testing API Endpoints ---")

    # 1. Test /roles
    resp_roles = client.get("/roles")
    assert resp_roles.status_code == 200
    roles_data = resp_roles.json()
    assert "roles" in roles_data
    assert len(roles_data["roles"]) >= 10
    print(f"  [OK] GET /roles returned {len(roles_data['roles'])} roles")

    # 2. Test /skill-gap
    resp_gap = client.post(
        "/skill-gap",
        json={"skills": ["Python", "SQL", "Data Analytics"], "target_role": "Data Analyst"}
    )
    assert resp_gap.status_code == 200
    gap_data = resp_gap.json()
    assert gap_data["target_role"] == "Data Analyst"
    assert gap_data["match_percentage"] == 50
    assert gap_data["matched_skills"] == ["Python", "SQL", "Data Analytics"]
    assert gap_data["missing_skills"] == ["Excel", "Power BI", "Statistics"]
    print("  [OK] POST /skill-gap returned exactly 50% match for Data Analyst test case")

    # 3. Test /upload with valid PDF
    with open("uploads/CV_pdf.pdf", "rb") as f:
        resp_upload = client.post("/upload", files={"file": ("CV_pdf.pdf", f, "application/pdf")})
    assert resp_upload.status_code == 200
    upload_data = resp_upload.json()
    assert upload_data["status"] == "success"
    assert upload_data["score"] > 0
    assert len(upload_data["skills"]) > 0
    assert "skill_gap" in upload_data
    assert "ai_analysis" in upload_data
    assert "recommended_jobs" in upload_data
    print(f"  [OK] POST /upload with real PDF succeeded (score: {upload_data['score']}, skills count: {len(upload_data['skills'])})")
    print(f"       Initial gap role: {upload_data['skill_gap']['target_role']}, match: {upload_data['skill_gap']['match_percentage']}%")

    # 4. Test /upload with empty/unreadable PDF
    with open("uploads/ANKIT.pdf", "rb") as f:
        resp_empty = client.post("/upload", files={"file": ("ANKIT.pdf", f, "application/pdf")})
    assert resp_empty.status_code == 200
    empty_data = resp_empty.json()
    assert empty_data["status"] == "error"
    assert "scanned" in empty_data["message"].lower() or "unable" in empty_data["message"].lower() or "empty" in empty_data["message"].lower()
    print("  [OK] POST /upload with empty PDF returned clean user-friendly error")

    # 5. Test /upload with non-PDF
    resp_invalid = client.post(
        "/upload",
        files={"file": ("test.txt", b"Hello world text", "text/plain")}
    )
    assert resp_invalid.status_code == 200
    invalid_data = resp_invalid.json()
    assert invalid_data["status"] == "error"
    assert "pdf" in invalid_data["message"].lower()
    print("  [OK] POST /upload with non-PDF returned unsupported format message")

if __name__ == "__main__":
    try:
        test_endpoints()
        print("\nAll API Endpoint Tests PASSED Successfully! 🎉")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
