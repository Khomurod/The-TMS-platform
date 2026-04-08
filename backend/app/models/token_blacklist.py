"""Token blacklist model — persists revoked JTIs for cross-worker consistency."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TokenBlacklist(Base):
    """Persisted blacklisted JWT token IDs (JTIs).

    Used by the logout flow to ensure tokens are revoked across all workers.
    Entries auto-expire and can be periodically cleaned up.
    """

    __tablename__ = "token_blacklist"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)
    blacklisted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
