#!/usr/bin/env python3
"""
Direct SQL migration runner for Cloud Run production environment.

This script applies the two pending migrations using raw SQL via asyncpg
(bypassing Alembic's URL parsing issues with Cloud SQL Unix sockets).
It connects using the DATABASE_URL env var.

Migrations applied:
  - 218d85a93d52: Add 'cancelled' value to tripstatus_enum
  - 7cfad6aff5c9: Add delivered_at column to loads table
  - Updates alembic_version table to reflect head
"""
import asyncio
import os
import sys
import asyncpg


DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Convert SQLAlchemy URL format to raw asyncpg DSN
# Input:  postgresql+asyncpg://user:pass@host:port/dbname
# Output: postgresql://user:pass@host:port/dbname
def to_asyncpg_dsn(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://", 1)


MIGRATIONS = [
    {
        "id": "218d85a93d52",
        "description": "Add 'cancelled' to tripstatus_enum",
        "sql": [
            "ALTER TYPE tripstatus_enum ADD VALUE IF NOT EXISTS 'cancelled'",
        ],
    },
    {
        "id": "7cfad6aff5c9",
        "description": "Add delivered_at column to loads table",
        "sql": [
            "ALTER TABLE loads ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ",
            "CREATE INDEX IF NOT EXISTS ix_loads_delivered_at ON loads (delivered_at)",
        ],
    },
]


async def main() -> None:
    dsn = to_asyncpg_dsn(DATABASE_URL)
    if not dsn:
        print("ERROR: DATABASE_URL is not set", file=sys.stderr)
        sys.exit(1)

    print(f"Connecting to database...")
    conn = await asyncpg.connect(dsn)
    try:
        # Get current Alembic version
        rows = await conn.fetch("SELECT version_num FROM alembic_version")
        current = rows[0]["version_num"] if rows else None
        print(f"Current Alembic version: {current}")

        for migration in MIGRATIONS:
            mid = migration["id"]
            desc = migration["description"]
            print(f"\nApplying migration {mid}: {desc}")
            for stmt in migration["sql"]:
                print(f"  SQL: {stmt[:80]}...")
                await conn.execute(stmt)
                print(f"  OK")

        # Update alembic_version to the head
        head = MIGRATIONS[-1]["id"]
        if current:
            await conn.execute(
                "UPDATE alembic_version SET version_num = $1", head
            )
        else:
            await conn.execute(
                "INSERT INTO alembic_version (version_num) VALUES ($1)", head
            )
        print(f"\nAlembic version updated to: {head}")
        print("\n✓ All migrations applied successfully!")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
