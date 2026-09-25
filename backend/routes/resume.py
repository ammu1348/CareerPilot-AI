import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from services.pdf_parser import extract_text
from services.analyzer import analyze_resume
from services.feedback import generate_feedback
from services.job_recommender import recommend_jobs
from services.gemini_service import analyze_with_gemini
from services.role_skills import (
    JOB_ROLE_REQUIREMENTS,
    calculate_skill_gap,
    normalize_skill_list,
)

router = APIRouter()

UPLOAD_FOLDER = "uploads"

class SkillGapRequest(BaseModel):
    skills: List[str]
    target_role: str

@router.get("/roles")
def get_job_roles():
    """Return all available job roles and their required skills."""
    return {
        "roles": list(JOB_ROLE_REQUIREMENTS.keys()),
        "requirements": JOB_ROLE_REQUIREMENTS
    }

@router.post("/skill-gap")
def analyze_gap(request: SkillGapRequest):
    """Calculate deterministic skill gap for a target job role."""
    return calculate_skill_gap(request.skills, request.target_role)

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    # 1. Validate file format
    if not file.filename.lower().endswith(".pdf"):
        return {
            "status": "error",
            "message": "Unsupported file format. Please upload a valid PDF document (.pdf)."
        }

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    try:
        content = await file.read()
        if len(content) == 0:
            return {
                "status": "error",
                "message": "The uploaded file is empty. Please select a valid PDF resume."
            }

        with open(file_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        return {
            "status": "error",
            "message": "Failed to save and process the uploaded file. Please try again."
        }

    # 2. Extract text from PDF
    resume_text = extract_text(file_path)
    if not resume_text:
        return {
            "status": "error",
            "message": "Unable to extract text from the PDF. It may be a scanned image or empty. Please upload a text-based PDF."
        }

    # 3. Analyze resume skills and score
    analysis = analyze_resume(resume_text)
    feedback = generate_feedback(analysis["score"])
    jobs = recommend_jobs(analysis["skills"])

    # 4. Determine initial target role (first recommended job or Data Analyst)
    default_role = jobs[0] if (jobs and jobs[0] in JOB_ROLE_REQUIREMENTS) else "Data Analyst"
    initial_gap = calculate_skill_gap(analysis["skills"], default_role)

    # 5. Gemini AI feedback (safe with graceful fallback)
    ai_feedback = analyze_with_gemini(resume_text)

    return {
        "status": "success",
        "filename": file.filename,
        "score": analysis["score"],
        "skills": analysis["skills"],
        "feedback": feedback,
        "recommended_jobs": jobs,
        "ai_analysis": ai_feedback,
        "skill_gap": initial_gap,
        "available_roles": list(JOB_ROLE_REQUIREMENTS.keys()),
        "text": resume_text[:2000] # return preview safely
    }