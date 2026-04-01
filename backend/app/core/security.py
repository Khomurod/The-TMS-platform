"""JWT token handling and password hashing.

Implements:
- bcrypt password hashing (direct bcrypt, not passlib — passlib is unmaintained)
- JWT access token (15 min, HS256)
- JWT refresh token (7 day, HS256)
- Token decoding with expiry validation
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError

from app.config import settings

# ── Token Blacklist (in-memory — acceptable for single Cloud Run instance) ──
_blacklisted_jtis: set[str] = set()

def blacklist_token(jti: str) -> None:
    """Add a JTI to the blacklist."""
    _blacklisted_jtis.add(jti)

def is_token_blacklisted(jti: str) -> bool:
    """Check if a JTI is blacklisted."""
    return jti in _blacklisted_jtis

# ── Password Hashing ─────────────────────────────────────────────


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


# ── JWT Token Functions ──────────────────────────────────────────

def create_access_token(user_id: UUID, company_id: UUID | None, role: str) -> str:
    """Create a short-lived access token (15 min default).

    Payload: { user_id, company_id, role, exp, type }
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "company_id": str(company_id) if company_id else None,
        "role": role,
        "exp": expire,
        "type": "access",
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: UUID) -> str:
    """Create a long-lived refresh token (7 day default).

    Payload: { user_id, exp, type }
    """
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token.

    Returns the payload dict.
    Raises InvalidTokenError if token is invalid, expired, blacklisted, or malformed.
    """
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    jti = payload.get("jti")
    if jti and is_token_blacklisted(jti):
        raise InvalidTokenError("Token has been revoked")
    return payload
