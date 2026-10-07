"""FastAPI application for CareerPilot AI."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.resume import router as resume_router

app = FastAPI(
    title="CareerPilot AI",
    description="Privacy-conscious resume signals and deterministic career skill-gap analysis.",
    version="1.0.0",
)

configured_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    # Permit local development and the app's Netlify, Vercel, and Arena preview
    # hosts. Production deployments can further restrict this via
    # CORS_ALLOW_ORIGINS. No cookies or credentialed browser requests are used.
    allow_origin_regex=(
        r"^(?:https?://(?:localhost|127\.0\.0\.1)(?::\d+)?|"
        r"https://(?:[a-z0-9-]+\.)*(?:netlify\.app|vercel\.app|e2b\.app))$"
    ),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

app.include_router(resume_router)


@app.get("/")
def home():
    return {"message": "CareerPilot AI API is running", "status": "ok"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
