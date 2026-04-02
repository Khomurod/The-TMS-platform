"""Complete database wipe + pristine Super Admin seed.

Connects to the production (or local) database using the app's DATABASE_URL,
truncates ALL business tables with CASCADE, then inserts a single Super Admin
user so the system can be logged into on a clean slate.

Usage:
    cd backend
    python wipe_and_seed.py
"""

import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import engine, async_session_factory
from app.core.security import hash_password
from app.models.base import Base
from app.models.company import Company
from app.models.user import User, UserRole

# Import ALL models so Base.metadata is fully populated
import app.models  # noqa: F401


# ── Tables to truncate (order doesn't matter with CASCADE) ───────
TABLES_TO_TRUNCATE = [
    "settlement_line_items",
    "driver_settlements",
    "company_default_deductions",
    "load_accessorials",
    "documents",
    "load_stops",
    "loads",
    "trailers",
    "trucks",
    "drivers",
    "brokers",
    "users",
    "companies",
]


async def wipe_and_seed():
    """Truncate all tables and create a single Super Admin."""

    print("=" * 60)
    print("  SAFEHAUL TMS — DATABASE WIPE & SEED")
    print("=" * 60)
    print(f"\n  DATABASE_URL: {engine.url}\n")

    # ── Step 1: Truncate all tables ──────────────────────────────
    print("─── Step 1: Truncating all tables ───")
    async with engine.begin() as conn:
        for table in TABLES_TO_TRUNCATE:
            try:
                await conn.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))
                print(f"  ✓ Truncated: {table}")
            except Exception as e:
                # Table might not exist if migrations haven't run
                print(f"  ⚠ Skipped {table}: {e}")

    print("\n─── Step 2: Creating Super Admin ───")
    async with async_session_factory() as db:
        # Create a placeholder company for the super admin
        # (Super admins can have company_id=NULL, but some flows expect it)
        company = Company(
            name="Safehaul Platform",
            mc_number=None,
            dot_number=None,
        )
        db.add(company)
        await db.flush()
        print(f"  ✓ Created platform company (id={company.id})")

        # Create Super Admin user
        admin = User(
            company_id=company.id,
            email="superadmin@safehaul.com",
            hashed_password=hash_password("SafehaulAdmin2024!"),
            first_name="Super",
            last_name="Admin",
            role=UserRole.super_admin,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print(f"  ✓ Created super admin (id={admin.id})")

    print("\n" + "=" * 60)
    print("  ✅ DATABASE WIPE COMPLETE")
    print("=" * 60)
    print("\n  Login credentials:")
    print("    Email:    superadmin@safehaul.com")
    print("    Password: SafehaulAdmin2024!")
    print()


if __name__ == "__main__":
    asyncio.run(wipe_and_seed())
