"""add_token_blacklist_table

Revision ID: de2fbe1077a4
Revises: a3f8e2c91b04
Create Date: 2026-04-08 13:40:21.417641
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'de2fbe1077a4'
down_revision: Union[str, None] = 'a3f8e2c91b04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create token_blacklist table for DB-backed JWT revocation."""
    op.create_table(
        'token_blacklist',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('jti', sa.String(36), nullable=False, unique=True),
        sa.Column('blacklisted_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_token_blacklist_jti', 'token_blacklist', ['jti'], unique=True)


def downgrade() -> None:
    """Drop token_blacklist table."""
    op.drop_index('ix_token_blacklist_jti', table_name='token_blacklist')
    op.drop_table('token_blacklist')
