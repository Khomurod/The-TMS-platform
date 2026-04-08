"""add_load_delivered_at

Revision ID: 7cfad6aff5c9
Revises: 218d85a93d52
Create Date: 2026-04-08

Adds delivered_at TIMESTAMPTZ column to the loads table.

This records when a load was actually delivered (in_transit → delivered
transition), enabling accurate settlement period filtering. Previously,
settlements used Load.created_at which caused payroll period mismatches
when loads were created in one period but delivered in another.

Existing rows will have NULL delivered_at; the settlement query falls
back to created_at via COALESCE, preserving historical behavior.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '7cfad6aff5c9'
down_revision: Union[str, None] = '218d85a93d52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add delivered_at column to loads table with index."""
    op.add_column(
        'loads',
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True)
    )
    op.create_index(
        'ix_loads_delivered_at',
        'loads',
        ['delivered_at'],
        unique=False
    )


def downgrade() -> None:
    """Remove delivered_at column and index."""
    op.drop_index('ix_loads_delivered_at', table_name='loads')
    op.drop_column('loads', 'delivered_at')
