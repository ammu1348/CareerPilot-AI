"""Resume and role-analysis API routes."""

from pathlib import PurePosixPath

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel, Field
from services.analyzer import analyze_resume
from services.feedback import generate_feedback
from services.gemini_service import analyze_with_gemini
from services.job_recommender import recommend_jobs
from services.pdf_parser import extract_text
from services.role_skills import JOB_ROLE_REQUIREMENTS, calculate_skill_gap
from starlette.concurrency import run_in_threadpool

router = APIRouter()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
PDF_HEADER_SEARCH_BYTES = 1024


class SkillGapRequest(BaseModel):
    skills: list[str] = Field(default_factory=list, max_length=100)
    target_role: str = Field(min_length=1, max_length=80)


@router.get("/roles")
def get_job_roles():
    """Return the supported role list and its required skills."""
    return {
        "roles": list(JOB_ROLE_REQUIREMENTS.keys()),
        "requirements": JOB_ROLE_REQUIREMENTS,
    }


@router.post("/skill-gap")
def analyze_gap(request: SkillGapRequest):
    """Calculate a deterministic skill gap for the requested target role."""
    return calculate_skill_gap(request.skills, request.target_role)


def _error(message: str) -> dict:
    """Keep upload errors in the established response envelope."""
    return {"status": "error", "message": message}


def _safe_display_filename(filename: str) -> str:
    """Return only a display name; user filenames are never used as paths."""
    normalized = (filename or "resume.pdf").replace("\\", "/")
    name = PurePosixPath(normalized).name
    return name[:180] or "resume.pdf"


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),  # noqa: B008 - FastAPI declarative upload field
    include_ai: bool = Form(False),
):
    """Analyze an in-memory PDF resume without persisting the uploaded file.

    The optional Gemini request is only made when the user explicitly opts in
    via ``include_ai``. The core skill and role analysis remains deterministic.
    """
    filename = _safe_display_filename(file.filename or "resume.pdf")
    if not filename.lower().endswith(".pdf"):
        await file.close()
        return _error("Unsupported file format. Please upload a PDF document (.pdf).")

    try:
        # Read no more than the allowed limit plus one byte so oversized uploads
        # are rejected without buffering an unbounded body in application code.
        content = await file.read(MAX_UPLOAD_BYTES + 1)
    except Exception:  # noqa: BLE001 - keep upload read failures inside the API envelope
        await file.close()
        return _error("The file could not be read. Please try a different PDF.")
    finally:
        await file.close()

    if not content:
        return _error("The uploaded file is empty. Please choose a valid resume PDF.")
    if len(content) > MAX_UPLOAD_BYTES:
        return _error(
            "The PDF is larger than the 10 MB limit. Please upload a smaller file."
        )

    if b"%PDF-" not in content[:PDF_HEADER_SEARCH_BYTES]:
        return _error(
            "This file does not appear to be a valid PDF. Please check the file and try again."
        )

    resume_text = await run_in_threadpool(extract_text, content)
    if not resume_text:
        return _error(
            "We could not extract selectable text from this PDF. It may be scanned or image-only; please upload a text-based PDF."
        )

    analysis = analyze_resume(resume_text)
    feedback = generate_feedback(analysis["score"])
    jobs = recommend_jobs(analysis["skills"])

    default_role = (
        jobs[0] if jobs and jobs[0] in JOB_ROLE_REQUIREMENTS else "Data Analyst"
    )
    initial_gap = calculate_skill_gap(analysis["skills"], default_role)

    if include_ai:
        ai_feedback = await run_in_threadpool(analyze_with_gemini, resume_text)
    else:
        ai_feedback = "AI insights were not requested. You can optionally enable Gemini insights before analysis; your resume text will then be sent to the configured Gemini service."

    # Resume text and original upload bytes are deliberately not returned or
    # written to the uploads directory. Keep only summary signals in the API.
    return {
        "status": "success",
        "filename": filename,
        "score": analysis["score"],
        "score_breakdown": analysis["score_breakdown"],
        "word_count": analysis["word_count"],
        "sections": analysis["sections"],
        "has_contact_details": analysis["has_contact_details"],
        "has_quantified_impact": analysis["has_quantified_impact"],
        "skills": analysis["skills"],
        "feedback": feedback,
        "recommended_jobs": jobs,
        "ai_analysis": ai_feedback,
        "ai_enabled": include_ai,
        "skill_gap": initial_gap,
        "available_roles": list(JOB_ROLE_REQUIREMENTS.keys()),
    }
