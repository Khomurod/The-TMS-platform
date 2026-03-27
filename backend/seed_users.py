"""Seed script — creates 2 initial users for local development.

Usage:
    cd backend
    python seed_users.py
"""

import asyncio
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, async_session_factory
from app.core.security import hash_password
from app.models.base import Base
from app.models.company import Company
from app.models.user import User, UserRole

# Import ALL models so Base.metadata knows every table
import app.models  # noqa: F401


async def seed():
    # Create all tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        # ── 1. Create company for company admin ──────────────────
        result = await db.execute(select(Company).where(Company.name == "Kinetic Demo Corp"))
        company = result.scalar_one_or_none()

        if not company:
            company = Company(name="Kinetic Demo Corp", mc_number="MC-123456", dot_number="DOT-789012")
            db.add(company)
            await db.flush()
            print(f"✓ Created company: Kinetic Demo Corp (id={company.id})")
        else:
            print(f"• Company already exists: Kinetic Demo Corp (id={company.id})")

        # ── 2. Create company admin user ─────────────────────────
        result = await db.execute(select(User).where(User.email == "adminuser"))
        user1 = result.scalar_one_or_none()

        if not user1:
            user1 = User(
                company_id=company.id,
                email="adminuser",
                hashed_password=hash_password("admin123"),
                first_name="Admin",
                last_name="User",
                role=UserRole.company_admin,
                is_active=True,
            )
            db.add(user1)
            print("✓ Created user: adminuser (company_admin)")
        else:
            print("• User already exists: adminuser")

        # ── 3. Create super admin user ───────────────────────────
        result = await db.execute(select(User).where(User.email == "adminadmin"))
        user2 = result.scalar_one_or_none()

        if not user2:
            user2 = User(
                company_id=company.id,
                email="adminadmin",
                hashed_password=hash_password("admin123"),
                first_name="Super",
                last_name="Admin",
                role=UserRole.super_admin,
                is_active=True,
            )
            db.add(user2)
            print("✓ Created user: adminadmin (super_admin)")
        else:
            print("• User already exists: adminadmin")

        await db.commit()

    print("\n🚀 Seed complete! You can now log in with:")
    print("   1) adminuser / admin123  (Company Admin)")
    print("   2) adminadmin / admin123 (Super Admin)")


if __name__ == "__main__":
    asyncio.run(seed())
