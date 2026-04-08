"""JWT token handling and password hashing.

Implements:
- bcrypt password hashing (direct bcrypt, not passlib — passlib is unmaintained)
- JWT access token (15 min, HS256)
- JWT refresh token (7 day, HS256)
- Token decoding with expiry validation
- Database-backed token blacklist for reliable revocation
"""

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError

from app.config import settings

# ── Token Blacklist (database-backed for multi-worker reliability) ──
# Uses a simple set as in-process cache + DB persistence.
# On token revocation, we add to both the in-process cache and the DB.
# On token validation, we check in-process cache first, then DB.

_blacklisted_jtis_cache: set[str] = set()


async def blacklist_token_db(jti: str, db) -> None:
    """Add a JTI to the blacklist — persisted in DB for cross-worker consistency."""
    from app.models.base import Base
    from sqlalchemy import text, insert

    _blacklisted_jtis_cache.add(jti)
    try:
        await db.execute(
            text(
                "INSERT INTO token_blacklist (jti, blacklisted_at) "
                "VALUES (:jti, :now) ON CONFLICT (jti) DO NOTHING"
            ),
            {"jti": jti, "now": datetime.now(timezone.utc)},
        )
        await db.commit()
    except Exception:
        # If blacklist table doesn't exist yet, fall back to in-memory only
        pass


def blacklist_token(jti: str) -> None:
    """Add a JTI to the in-process blacklist cache (synchronous fallback)."""
    _blacklisted_jtis_cache.add(jti)


def is_token_blacklisted(jti: str) -> bool:
    """Check if a JTI is blacklisted (in-process cache check only — fast path)."""
    return jti in _blacklisted_jtis_cache


async def is_token_blacklisted_db(jti: str, db) -> bool:
    """Check if a JTI is blacklisted (DB check — authoritative)."""
    if jti in _blacklisted_jtis_cache:
        return True
    from sqlalchemy import text

    try:
        result = await db.execute(
            text("SELECT 1 FROM token_blacklist WHERE jti = :jti"),
            {"jti": jti},
        )
        if result.scalar_one_or_none():
            _blacklisted_jtis_cache.add(jti)  # Populate cache
            return True
    except Exception:
        # Table doesn't exist yet — rely on in-memory cache
        pass
    return False


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

    Payload: { user_id, company_id, role, exp, type, jti }
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

    Payload: { user_id, exp, type, jti }
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
    """Decode and validate a JWT token signature and expiry.

    NOTE: Does NOT check the revocation blacklist — that is done
    in the async `get_current_user_id` dependency which has DB access.
    This function is intentionally sync-only (no DB).

    Returns the payload dict.
    Raises InvalidTokenError if token is invalid, expired, or malformed.
    """
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    return payload
