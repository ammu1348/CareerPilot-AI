from fastapi import APIRouter, UploadFile, File
from services.pdf_parser import extract_text
from services.analyzer import analyze_resume
from services.feedback import generate_feedback
from services.job_recommender import recommend_jobs
import os

router = APIRouter()

UPLOAD_FOLDER = "uploads"

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    resume_text = extract_text(file_path)

    analysis = analyze_resume(resume_text)
    feedback = generate_feedback(analysis["score"])
    jobs = recommend_jobs(analysis["skills"])

    ai_feedback = "AI Analysis is temporarily disabled because Gemini API quota is exceeded."

    return {
        "status": "success",
        "filename": file.filename,
        "score": analysis["score"],
        "skills": analysis["skills"],
        "feedback": feedback,
        "recommended_jobs": jobs,
        "ai_analysis": ai_feedback,
        "text": resume_text
    }