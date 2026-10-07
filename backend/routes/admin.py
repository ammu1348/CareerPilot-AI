"""Protected admin authentication and operational overview endpoints."""

from __future__ import annotations

import hashlib
import hmac
import os
import threading
import time
from collections import deque
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from services.admin_auth import (
    ADMIN_COOKIE_NAME,
    create_session_token,
    get_admin_settings,
    verify_password,
    verify_session_token,
)
from services.role_skills import JOB_ROLES

router = APIRouter(prefix="/admin", tags=["admin"])
LOGIN_WINDOW_SECONDS = 15 * 60
MAX_LOGIN_ATTEMPTS = 8
_FAILURES_BY_CLIENT: dict[str, deque[float]] = {}
_FAILURES_LOCK = threading.Lock()


class AdminLoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


def _login_key(request: Request) -> str:
    """Use a non-reversible, short-lived key; never retain passwords or raw IPs."""
    client_host = request.client.host if request.client else "unknown"
    return hashlib.sha256(client_host.encode("utf-8", errors="replace")).hexdigest()


def _recent_failures(key: str, now: float) -> int:
    with _FAILURES_LOCK:
        failures = _FAILURES_BY_CLIENT.setdefault(key, deque())
        while failures and now - failures[0] > LOGIN_WINDOW_SECONDS:
            failures.popleft()
        return len(failures)


def _record_failure(key: str, now: float) -> None:
    with _FAILURES_LOCK:
        failures = _FAILURES_BY_CLIENT.setdefault(key, deque())
        while failures and now - failures[0] > LOGIN_WINDOW_SECONDS:
            failures.popleft()
        failures.append(now)
        # Bound in-memory bookkeeping if this API is exposed to many clients.
        if len(_FAILURES_BY_CLIENT) > 10_000:
            stale_keys = [
                client_key
                for client_key, timestamps in _FAILURES_BY_CLIENT.items()
                if not timestamps or now - timestamps[-1] > LOGIN_WINDOW_SECONDS
            ]
            for client_key in stale_keys:
                _FAILURES_BY_CLIENT.pop(client_key, None)
            while len(_FAILURES_BY_CLIENT) > 10_000:
                _FAILURES_BY_CLIENT.pop(next(iter(_FAILURES_BY_CLIENT)), None)


def _clear_failures(key: str) -> None:
    with _FAILURES_LOCK:
        _FAILURES_BY_CLIENT.pop(key, None)


def require_admin(request: Request) -> str:
    """Resolve the current admin from a signed, expiring HttpOnly cookie."""
    settings = get_admin_settings()
    if not settings.configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin access is not configured on this deployment.",
        )
    token = request.cookies.get(ADMIN_COOKIE_NAME, "")
    email = verify_session_token(token, settings)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to the admin console.",
        )
    return email


@router.post("/auth/login")
def login(
    credentials: AdminLoginRequest,
    request: Request,
    response: Response,
):
    """Sign in the single configured administrator without accepting demo credentials."""
    settings = get_admin_settings()
    if not settings.configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin access is not configured. Follow the admin setup in the project README.",
        )

    key = _login_key(request)
    now = time.monotonic()
    if _recent_failures(key, now) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many sign-in attempts. Wait 15 minutes and try again.",
            headers={"Retry-After": str(LOGIN_WINDOW_SECONDS)},
        )

    submitted_email = credentials.email.strip().casefold()
    password_matches = verify_password(credentials.password, settings.password_hash)
    email_matches = hmac.compare_digest(
        submitted_email.encode("utf-8"), settings.email.encode("utf-8")
    )
    if not (password_matches and email_matches):
        _record_failure(key, now)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
        )

    _clear_failures(key)
    response.headers["Cache-Control"] = "no-store"
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=create_session_token(settings.email, settings),
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
        path="/",
    )
    return {"authenticated": True, "email": settings.email}


@router.get("/auth/me")
def who_am_i(
    response: Response,
    admin_email: Annotated[str, Depends(require_admin)],
):
    response.headers["Cache-Control"] = "no-store"
    return {"authenticated": True, "email": admin_email}


@router.post("/auth/logout")
def logout(response: Response):
    """Clear the browser cookie; no server-side resume or account records exist."""
    settings = get_admin_settings()
    response.headers["Cache-Control"] = "no-store"
    response.delete_cookie(
        key=ADMIN_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_same_site,
    )
    return {"authenticated": False}


@router.get("/overview")
def admin_overview(
    response: Response,
    admin_email: Annotated[str, Depends(require_admin)],
):
    """Return live configuration and catalog data without exposing secrets or resume data."""
    response.headers["Cache-Control"] = "no-store"
    settings = get_admin_settings()
    ai_configured = bool(os.getenv("GEMINI_API_KEY", "").strip())
    return {
        "admin_email": admin_email,
        "system": {
            "status": "operational",
            "api_version": "1.0.0",
            "resume_storage": "ephemeral processing; no resume records stored",
            "upload_limit_mb": 10,
            "max_pdf_pages": 40,
            "max_extracted_characters": 100_000,
            "session_ttl_hours": round(settings.session_ttl_seconds / 3600, 1),
        },
        "ai": {
            "provider": "Google Gemini",
            "configured": ai_configured,
            "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite"),
            "consent": "explicit user opt-in",
        },
        "roles": [
            {
                "name": name,
                "description": details["description"],
                "skills": details["skills"],
            }
            for name, details in JOB_ROLES.items()
        ],
    }
