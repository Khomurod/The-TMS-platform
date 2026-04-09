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
    op.drop_constraint("loads_shipment_id_key", "loads", type_="unique")
    # Add company-scoped unique constraint
    op.create_unique_constraint(
        "uq_loads_company_shipment_id", "loads", ["company_id", "shipment_id"]
    )

    # Fix 16: Prevent duplicate deduction names per company
    op.create_unique_constraint(
        "uq_deductions_company_name",
        "company_default_deductions",
        ["company_id", "name"],
    )


def downgrade() -> None:
    # Reverse Fix 16
    op.drop_constraint(
        "uq_deductions_company_name", "company_default_deductions", type_="unique"
    )

    # Reverse Fix 8
    op.drop_constraint("uq_loads_company_shipment_id", "loads", type_="unique")
    op.create_unique_constraint("loads_shipment_id_key", "loads", ["shipment_id"])
