"""FastAPI application for CareerPilot AI."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.admin import router as admin_router
from routes.resume import router as resume_router


def create_app() -> FastAPI:
    """Build the API with exact, environment-configured browser origins."""
    application = FastAPI(
        title="CareerPilot AI",
        description="Privacy-conscious resume signals and deterministic career skill-gap analysis.",
        version="1.0.0",
    )
    configured_origins = [
        origin.strip().rstrip("/")
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
        if origin.strip()
    ]
    if "*" in configured_origins:
        raise ValueError(
            "CORS_ALLOW_ORIGINS must contain exact origins, not a wildcard."
        )

    application.add_middleware(
        CORSMiddleware,
        # Exact origins are important because admin authentication uses cookies.
        # Local and Arena clients use the same-origin /api development proxy.
        allow_origins=configured_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Accept"],
    )
    application.include_router(resume_router)
    application.include_router(admin_router)

    @application.get("/")
    def home():
        return {"message": "CareerPilot AI API is running", "status": "ok"}

    @application.get("/health")
    def health_check():
        return {"status": "ok"}

    return application


app = create_app()
