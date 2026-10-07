"""Environment-configured, single-admin authentication.

There are deliberately no demo credentials or public sign-up endpoints. Admin
access is enabled only when an operator configures a password hash and a strong
session secret in the backend environment.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass

from dotenv import load_dotenv

PASSWORD_HASH_SCHEME = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 390_000
MIN_PASSWORD_HASH_ITERATIONS = 100_000
MAX_PASSWORD_HASH_ITERATIONS = 1_000_000
MIN_SESSION_SECRET_BYTES = 32
DEFAULT_SESSION_TTL_SECONDS = 8 * 60 * 60
MAX_SESSION_TTL_SECONDS = 24 * 60 * 60
ADMIN_COOKIE_NAME = "careerpilot_admin"


@dataclass(frozen=True)
class AdminSettings:
    email: str
    password_hash: str
    session_secret: str
    session_ttl_seconds: int
    cookie_secure: bool
    cookie_same_site: str

    @property
    def configured(self) -> bool:
        return (
            bool(self.email)
            and bool(self.password_hash)
            and len(self.session_secret.encode("utf-8")) >= MIN_SESSION_SECRET_BYTES
            and self.cookie_same_site in {"strict", "lax", "none"}
            and not (self.cookie_same_site == "none" and not self.cookie_secure)
            and verify_password_hash_format(self.password_hash)
        )


def get_admin_settings() -> AdminSettings:
    """Read settings lazily so environment updates are picked up without secrets in code."""
    load_dotenv()
    try:
        ttl = int(os.getenv("ADMIN_SESSION_TTL_SECONDS", DEFAULT_SESSION_TTL_SECONDS))
    except ValueError:
        ttl = DEFAULT_SESSION_TTL_SECONDS
    ttl = max(300, min(ttl, MAX_SESSION_TTL_SECONDS))

    secure_value = os.getenv("ADMIN_COOKIE_SECURE", "true").strip().lower()
    cookie_secure = secure_value not in {"0", "false", "no", "off"}
    cookie_same_site = os.getenv("ADMIN_COOKIE_SAMESITE", "strict").strip().lower()
    if cookie_same_site not in {"strict", "lax", "none"}:
        cookie_same_site = "strict"

    return AdminSettings(
        email=os.getenv("ADMIN_EMAIL", "").strip().casefold(),
        password_hash=os.getenv("ADMIN_PASSWORD_HASH", "").strip(),
        session_secret=os.getenv("ADMIN_SESSION_SECRET", ""),
        session_ttl_seconds=ttl,
        cookie_secure=cookie_secure,
        cookie_same_site=cookie_same_site,
    )


def create_password_hash(password: str, salt: bytes | None = None) -> str:
    """Return a salted PBKDF2-SHA256 hash suitable for ADMIN_PASSWORD_HASH."""
    if not isinstance(password, str) or len(password) < 12:
        raise ValueError("Choose an admin password with at least 12 characters.")
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PASSWORD_HASH_ITERATIONS
    )
    return "$".join(
        (
            PASSWORD_HASH_SCHEME,
            str(PASSWORD_HASH_ITERATIONS),
            _b64encode(salt),
            _b64encode(digest),
        )
    )


def verify_password(password: str, encoded_hash: str) -> bool:
    """Constant-time password verification with bounded hash parameters."""
    try:
        scheme, iterations_raw, salt_raw, digest_raw = encoded_hash.split("$", 3)
        iterations = int(iterations_raw)
        salt = _b64decode(salt_raw)
        expected = _b64decode(digest_raw)
        if (
            scheme != PASSWORD_HASH_SCHEME
            or not MIN_PASSWORD_HASH_ITERATIONS
            <= iterations
            <= MAX_PASSWORD_HASH_ITERATIONS
            or len(salt) < 16
            or len(expected) != 32
        ):
            return False
        actual = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt, iterations
        )
        return hmac.compare_digest(actual, expected)
    except (AttributeError, TypeError, ValueError):
        return False


def verify_password_hash_format(encoded_hash: str) -> bool:
    """Check hash structure without performing the expensive PBKDF2 operation."""
    try:
        scheme, iterations_raw, salt_raw, digest_raw = encoded_hash.split("$", 3)
        iterations = int(iterations_raw)
        return (
            scheme == PASSWORD_HASH_SCHEME
            and MIN_PASSWORD_HASH_ITERATIONS
            <= iterations
            <= MAX_PASSWORD_HASH_ITERATIONS
            and len(_b64decode(salt_raw)) >= 16
            and len(_b64decode(digest_raw)) == 32
        )
    except (AttributeError, TypeError, ValueError):
        return False


def create_session_token(
    email: str, settings: AdminSettings, now: int | None = None
) -> str:
    """Create a signed, expiring, HttpOnly-cookie session token."""
    issued_at = int(time.time()) if now is None else int(now)
    payload = json.dumps(
        {
            "sub": email.casefold(),
            "iat": issued_at,
            "exp": issued_at + settings.session_ttl_seconds,
            "nonce": secrets.token_urlsafe(12),
        },
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    encoded_payload = _b64encode(payload)
    signature = hmac.new(
        settings.session_secret.encode("utf-8"),
        encoded_payload.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{encoded_payload}.{_b64encode(signature)}"


def verify_session_token(
    token: str, settings: AdminSettings, now: int | None = None
) -> str | None:
    """Verify an admin token and return its subject only while valid."""
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        supplied_signature = _b64decode(encoded_signature)
        expected_signature = hmac.new(
            settings.session_secret.encode("utf-8"),
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(supplied_signature, expected_signature):
            return None

        payload = json.loads(_b64decode(encoded_payload))
        subject = payload.get("sub")
        issued_at = int(payload.get("iat", 0))
        expires_at = int(payload.get("exp", 0))
        current_time = int(time.time()) if now is None else int(now)
        if (
            not isinstance(subject, str)
            or subject.casefold() != settings.email
            or issued_at > current_time + 60
            or expires_at <= current_time
            or expires_at - issued_at > MAX_SESSION_TTL_SECONDS
        ):
            return None
        return subject
    except (
        AttributeError,
        TypeError,
        ValueError,
        json.JSONDecodeError,
        UnicodeDecodeError,
    ):
        return None


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


if __name__ == "__main__":
    import getpass

    password = getpass.getpass("New admin password (minimum 12 characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if not secrets.compare_digest(password, confirmation):
        raise SystemExit("Passwords did not match.")
    print("ADMIN_PASSWORD_HASH=" + create_password_hash(password))
