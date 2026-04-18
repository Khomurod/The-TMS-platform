"""Merge multiple heads

Revision ID: 686c192774da
Revises: c8f3e2a91d05, e7f8a9b0c1d2
Create Date: 2026-04-18 11:14:37.960845
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '686c192774da'
down_revision: Union[str, None] = ('c8f3e2a91d05', 'e7f8a9b0c1d2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
