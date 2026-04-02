"""Seed script: Create Wenze Trucking company + test users for verification."""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, async_session_factory
from app.core.security import hash_password
from app.models.base import Base
from app.models.company import Company
from app.models.user import User, UserRole
import app.models  # noqa: F401

USERS = [
    {"email": "superadmin@Safehaul.test", "password": "SuperAdmin1!", "first_name": "Super", "last_name": "Admin", "role": UserRole.super_admin},
    {"email": "admin@wenzetrucking.com", "password": "WenzeAdmin1!", "first_name": "Wenze", "last_name": "Admin", "role": UserRole.company_admin},
    {"email": "dispatcher@wenzetrucking.com", "password": "Dispatch1!", "first_name": "Tom", "last_name": "Dispatcher", "role": UserRole.dispatcher},
    {"email": "accounting@wenzetrucking.com", "password": "Account1!", "first_name": "Sarah", "last_name": "Accountant", "role": UserRole.accountant},
]


async def seed():
    async with async_session_factory() as db:
        # 1. Ensure Wenze Trucking company exists
        result = await db.execute(select(Company).where(Company.name == "Wenze Trucking"))
        company = result.scalar_one_or_none()

        if not company:
            company = Company(
                name="Wenze Trucking",
                mc_number="MC-789456",
                dot_number="DOT-3214567",
                enforce_compliance=False,
            )
            db.add(company)
            await db.flush()
            print(f"Created company: Wenze Trucking (id={company.id})")
        else:
            print(f"Company exists: Wenze Trucking (id={company.id})")

        # 2. Seed users
        for u in USERS:
            result = await db.execute(select(User).where(User.email == u["email"]))
            existing = result.scalar_one_or_none()
            if not existing:
                user = User(
                    company_id=company.id,
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    first_name=u["first_name"],
                    last_name=u["last_name"],
                    role=u["role"],
                    is_active=True,
                )
                db.add(user)
                print(f"Created user: {u['email']} ({u['role'].value})")
            else:
                print(f"User exists: {u['email']}")

        await db.commit()

    print("\nSeed complete!")
    print("Login with: admin@wenzetrucking.com / WenzeAdmin1!")


if __name__ == "__main__":
    asyncio.run(seed())
