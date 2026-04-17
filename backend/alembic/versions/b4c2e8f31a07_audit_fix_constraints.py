"""Audit fix: scope shipment_id per tenant + deduction name uniqueness

Fix 8:  shipment_id should be unique per company, not globally.
        Two different tenants should be allowed to have the same shipment_id.

Fix 16: company_default_deductions should not allow duplicate deduction
        names within the same company.

Revision ID: b4c2e8f31a07
Revises: 7cfad6aff5c9
Create Date: 2026-04-09 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b4c2e8f31a07"
down_revision: str = "7cfad6aff5c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Fix 8: Scope shipment_id unique constraint per tenant
    # Drop the global unique constraint on shipment_id
    # Older/newer schemas may or may not have this constraint name; make drop safe.
    op.execute("ALTER TABLE loads DROP CONSTRAINT IF EXISTS loads_shipment_id_key")
    # Add company-scoped unique constraint
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_loads_company_shipment_id'
          ) THEN
            ALTER TABLE loads
            ADD CONSTRAINT uq_loads_company_shipment_id
            UNIQUE (company_id, shipment_id);
          END IF;
        END
        $$;
        """
    )

    # Fix 16: Prevent duplicate deduction names per company
    op.execute(
        """
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'uq_deductions_company_name'
          ) THEN
            ALTER TABLE company_default_deductions
            ADD CONSTRAINT uq_deductions_company_name
            UNIQUE (company_id, name);
          END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    # Reverse Fix 16
    op.drop_constraint(
        "uq_deductions_company_name", "company_default_deductions", type_="unique"
    )

    # Reverse Fix 8
    op.drop_constraint("uq_loads_company_shipment_id", "loads", type_="unique")
    op.create_unique_constraint("loads_shipment_id_key", "loads", ["shipment_id"])
