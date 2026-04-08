"""Auth service — business logic for registration, login, token refresh."""

from uuid import UUID

from jwt.exceptions import InvalidTokenError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.company import Company
from app.models.user import User, UserRole


class AuthService:
    """Handles authentication business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(
        self,
        company_name: str,
        mc_number: str | None,
        dot_number: str | None,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
    ) -> tuple[User, Company, dict]:
        """Register a new company + admin user (onboarding flow).

        Returns (user, company, tokens).
        """
        # Check if email already exists
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ConflictError(f"User with email '{email}' already exists")

        # Create company
        company = Company(
            name=company_name,
            mc_number=mc_number,
            dot_number=dot_number,
        )
        self.db.add(company)
        await self.db.flush()  # Get company.id before creating user

        # Create admin user
        user = User(
            company_id=company.id,
            email=email,
            hashed_password=hash_password(password),
            first_name=first_name,
            last_name=last_name,
            role=UserRole.company_admin,
        )
        self.db.add(user)
        await self.db.flush()  # Get user.id for token

        # Generate tokens
        tokens = self._generate_tokens(user)

        await self.db.commit()
        return user, company, tokens

    async def login(self, email: str, password: str) -> tuple[User, dict]:
        """Authenticate user by email + password.

        Returns (user, tokens).
        """
        result = await self.db.execute(select(User).where(func.lower(User.email) == email.lower()))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedError("Account is deactivated")

        # Update last login
        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()

        tokens = self._generate_tokens(user)
        return user, tokens

    async def refresh(self, refresh_token: str) -> dict:
        """Issue a new access token using a valid refresh token.

        Returns new token pair.
        """
        try:
            payload = decode_token(refresh_token)
        except InvalidTokenError:
            raise UnauthorizedError("Invalid or expired refresh token")

        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token payload")

        result = await self.db.execute(select(User).where(User.id == UUID(user_id)))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise UnauthorizedError("User not found or deactivated")

        return self._generate_tokens(user)

    async def get_current_user(self, user_id: UUID) -> User:
        """Get user by ID (for /auth/me endpoint)."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise UnauthorizedError("User not found or deactivated")

        return user

    def _generate_tokens(self, user: User) -> dict:
        """Generate access + refresh token pair for a user."""
        return {
            "access_token": create_access_token(user.id, user.company_id, user.role.value),
            "refresh_token": create_refresh_token(user.id),
            "token_type": "bearer",
        }
