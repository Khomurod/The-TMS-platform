"""add_tripstatus_cancelled

Revision ID: 218d85a93d52
Revises: de2fbe1077a4
Create Date: 2026-04-08

Adds 'cancelled' value to the tripstatus_enum PostgreSQL ENUM type.
This allows trips to be correctly marked as cancelled rather than
being misclassified as 'delivered' when their parent load is cancelled.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '218d85a93d52'
down_revision: Union[str, None] = 'de2fbe1077a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add 'cancelled' to tripstatus_enum."""
    # NOTE:
    # Earlier migrations create `trip_status_enum` (with an underscore), not
    # `tripstatus_enum`. Some environments may still have the legacy name.
    # Make this migration safe/idempotent across both.
    op.execute(
        """
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status_enum') THEN
            EXECUTE 'ALTER TYPE trip_status_enum ADD VALUE IF NOT EXISTS ''cancelled''';
          ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tripstatus_enum') THEN
            EXECUTE 'ALTER TYPE tripstatus_enum ADD VALUE IF NOT EXISTS ''cancelled''';
          END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    """
    Reverting an ENUM value in PostgreSQL requires recreating the type.
    Only safe if no rows use the 'cancelled' value.
    """
    op.execute("""
        ALTER TABLE trips
        ALTER COLUMN status TYPE VARCHAR(50);
    """)
    op.execute("DROP TYPE IF EXISTS tripstatus_enum")
    op.execute("""
        CREATE TYPE tripstatus_enum AS ENUM (
            'assigned', 'dispatched', 'in_transit', 'delivered'
        )
    """)
    op.execute("""
        ALTER TABLE trips
        ALTER COLUMN status TYPE tripstatus_enum
        USING status::tripstatus_enum
    """)
