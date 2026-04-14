"""Add lowboy and other to trailer_type_enum

Revision ID: c8f3e2a91d05
Revises: b4c2e8f31a07
Create Date: 2026-04-14

Fixes HIGH bug: frontend allows 'lowboy' and 'other' trailer types
but the backend enum only had 5 values, causing 500 on insert.
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c8f3e2a91d05'
down_revision = 'b4c2e8f31a07'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL: ALTER TYPE to add new enum values (idempotent with IF NOT EXISTS)
    # SQLite: enum constraints are not enforced at DB level, so this is a no-op.
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute("ALTER TYPE trailer_type_enum ADD VALUE IF NOT EXISTS 'lowboy'")
        op.execute("ALTER TYPE trailer_type_enum ADD VALUE IF NOT EXISTS 'other'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly.
    # A full enum replacement would be needed (recreate type + migrate column).
    # Since 'lowboy' and 'other' are additive and non-breaking, downgrade is a no-op.
    pass
