"""Create a single, clean Super Admin account.

This script ONLY creates a super admin user — it does NOT touch
any other data. Safe to run on an already-wiped database.

Usage:
    cd backend
    python create_admin.py
"""

import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, async_session_factory
from app.core.security import hash_password
from app.models.base import Base
from app.models.company import Company
from app.models.user import User, UserRole

# Import ALL models so Base.metadata is fully populated
import app.models  # noqa: F401

ADMIN_EMAIL = "superadmin@safehaul.com"
ADMIN_PASSWORD = "SafehaulAdmin2024!"


async def create_admin():
    """Create Super Admin if it doesn't already exist."""

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # Check if admin already exists
        existing = await db.execute(
            select(User).where(User.email == ADMIN_EMAIL)
        )
        if existing.scalar_one_or_none():
            print(f"• Super Admin already exists: {ADMIN_EMAIL}")
            return

        # Ensure a platform company exists
        company_result = await db.execute(
            select(Company).where(Company.name == "Safehaul Platform")
        )
        company = company_result.scalar_one_or_none()

        if not company:
            company = Company(name="Safehaul Platform")
            db.add(company)
            await db.flush()
            print(f"✓ Created platform company (id={company.id})")

        # Create super admin
        admin = User(
            company_id=company.id,
            email=ADMIN_EMAIL,
            hashed_password=hash_password(ADMIN_PASSWORD),
            first_name="Super",
            last_name="Admin",
            role=UserRole.super_admin,
            is_active=True,
        )
        db.add(admin)
        await db.commit()

        print(f"✓ Created super admin: {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(create_admin())
