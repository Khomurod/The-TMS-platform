"""sync_db_with_models

Revision ID: e7f8a9b0c1d2
Revises: de2fbe1077a4
Create Date: 2026-04-18 13:35:00.000000

This migration synchronizes the database with the latest SQLAlchemy models,
adding missing columns and enum values that were causing API failures.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, None] = 'de2fbe1077a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. ENUMS SYNC
    # Ensure all enum values exist
    op.execute("ALTER TYPE driver_status_enum ADD VALUE IF NOT EXISTS 'on_trip'")
    op.execute("ALTER TYPE driver_status_enum ADD VALUE IF NOT EXISTS 'inactive'")
    op.execute("ALTER TYPE load_status_enum ADD VALUE IF NOT EXISTS 'offer'")
    op.execute("ALTER TYPE load_status_enum ADD VALUE IF NOT EXISTS 'booked'")
    op.execute("ALTER TYPE load_status_enum ADD VALUE IF NOT EXISTS 'assigned'")
    op.execute("ALTER TYPE load_status_enum ADD VALUE IF NOT EXISTS 'invoiced'")
    
    # Create tax_classification_enum if missing
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_classification_enum') THEN
                CREATE TYPE tax_classification_enum AS ENUM ('w2_employee', 'contractor_1099');
            END IF;
        END $$;
    """)

    # 2. TABLES SYNC
    # Add missing columns to drivers
    op.execute("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS home_address TEXT")
    op.execute("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hire_date DATE")
    op.execute("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS payment_tariff_type VARCHAR(50)")
    op.execute("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS payment_tariff_value NUMERIC(10, 4)")
    op.execute("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tax_classification tax_classification_enum")
    op.execute("ALTER TABLE drivers ADD COLUMN IF NOT EXISTS notes TEXT")

    # Add missing columns to companies
    op.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS enforce_compliance BOOLEAN DEFAULT FALSE")

    # Ensure other tables from a3f8e2c91b04 exist (in case migration was skipped)
    op.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES companies(id),
            trip_number VARCHAR(50) NOT NULL,
            load_id UUID NOT NULL REFERENCES loads(id),
            driver_id UUID REFERENCES drivers(id),
            truck_id UUID REFERENCES trucks(id),
            trailer_id UUID REFERENCES trailers(id),
            sequence_number INTEGER DEFAULT 1,
            status VARCHAR(50) DEFAULT 'assigned',
            loaded_miles NUMERIC(10, 2),
            empty_miles NUMERIC(10, 2),
            driver_gross NUMERIC(10, 2),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
    """)

def downgrade() -> None:
    # Downgrade is not practical for a sync migration
    pass
