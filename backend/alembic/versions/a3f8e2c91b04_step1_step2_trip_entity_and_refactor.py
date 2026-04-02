"""step1_step2_trip_entity_and_refactor

Revision ID: a3f8e2c91b04
Revises: 57b1d7b43c06
Create Date: 2026-04-02 19:00:00.000000

This migration implements the full Trip-based architecture refactor:
  - Creates new tables: trips, commodities, settlement_batches, invoice_batches, invoices
  - Decouples loads from drivers/trucks/trailers (removes direct FKs)
  - Migrates existing load assignments to Trip records (data migration)
  - Updates enum values for LoadStatus, DriverStatus, SettlementBatchStatus
  - Adds new columns to loads, drivers, companies, load_stops, settlement_line_items
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'a3f8e2c91b04'
down_revision: Union[str, None] = '57b1d7b43c06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ══════════════════════════════════════════════════════════════
    #  1. CREATE NEW ENUM TYPES
    # ══════════════════════════════════════════════════════════════

    # Trip status enum
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status_enum') THEN
                CREATE TYPE trip_status_enum AS ENUM ('assigned', 'dispatched', 'in_transit', 'delivered', 'cancelled');
            END IF;
        END $$
    """)

    # Invoice batch status enum
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_batch_status_enum') THEN
                CREATE TYPE invoice_batch_status_enum AS ENUM ('unposted', 'partial_posted', 'posted', 'paid');
            END IF;
        END $$
    """)

    # Settlement batch status enum (replaces old settlement_status_enum)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'settlement_batch_status_enum') THEN
                CREATE TYPE settlement_batch_status_enum AS ENUM ('unposted', 'posted', 'paid');
            END IF;
        END $$
    """)

    # Tax classification enum
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_classification_enum') THEN
                CREATE TYPE tax_classification_enum AS ENUM ('w2_employee', 'contractor_1099');
            END IF;
        END $$
    """)

    # Add 'bonus' value to settlement_line_type_enum if missing
    # ALTER TYPE ADD VALUE IF NOT EXISTS is available in PG 9.3+
    op.execute("ALTER TYPE settlement_line_type_enum ADD VALUE IF NOT EXISTS 'bonus'")

    # ══════════════════════════════════════════════════════════════
    #  2. UPDATE EXISTING ENUM TYPES
    # ══════════════════════════════════════════════════════════════

    # --- LoadStatus: planned→offer, add booked+assigned, at_pickup→(removed),
    #     billed→invoiced, delayed→(removed)
    # PostgreSQL doesn't support removing enum values, so we recreate the type
    op.execute("ALTER TYPE load_status_enum RENAME TO load_status_enum_old")
    op.execute(
        "CREATE TYPE load_status_enum AS ENUM "
        "('offer', 'booked', 'assigned', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'cancelled')"
    )
    # Migrate existing data
    op.execute("""
        ALTER TABLE loads
        ALTER COLUMN status DROP DEFAULT
    """)
    op.execute("""
        ALTER TABLE loads
        ALTER COLUMN status TYPE load_status_enum
        USING (
            CASE status::text
                WHEN 'planned' THEN 'offer'::load_status_enum
                WHEN 'at_pickup' THEN 'dispatched'::load_status_enum
                WHEN 'billed' THEN 'invoiced'::load_status_enum
                WHEN 'delayed' THEN 'in_transit'::load_status_enum
                ELSE status::text::load_status_enum
            END
        )
    """)
    op.execute("ALTER TABLE loads ALTER COLUMN status SET DEFAULT 'offer'::load_status_enum")
    op.execute("DROP TYPE load_status_enum_old")

    # --- DriverStatus: on_route→on_trip, off_duty→inactive
    op.execute("ALTER TYPE driver_status_enum RENAME TO driver_status_enum_old")
    op.execute(
        "CREATE TYPE driver_status_enum AS ENUM "
        "('available', 'on_trip', 'inactive', 'on_leave', 'terminated')"
    )
    op.execute("""
        ALTER TABLE drivers
        ALTER COLUMN status DROP DEFAULT
    """)
    op.execute("""
        ALTER TABLE drivers
        ALTER COLUMN status TYPE driver_status_enum
        USING (
            CASE status::text
                WHEN 'on_route' THEN 'on_trip'::driver_status_enum
                WHEN 'off_duty' THEN 'inactive'::driver_status_enum
                ELSE status::text::driver_status_enum
            END
        )
    """)
    op.execute("ALTER TABLE drivers ALTER COLUMN status SET DEFAULT 'available'::driver_status_enum")
    op.execute("DROP TYPE driver_status_enum_old")

    # --- SettlementStatus: migrate existing column to new enum
    op.execute("ALTER TYPE settlement_status_enum RENAME TO settlement_status_enum_old")
    op.execute("""
        ALTER TABLE driver_settlements
        ALTER COLUMN status DROP DEFAULT
    """)
    op.execute("""
        ALTER TABLE driver_settlements
        ALTER COLUMN status TYPE settlement_batch_status_enum
        USING (
            CASE status::text
                WHEN 'draft' THEN 'unposted'::settlement_batch_status_enum
                WHEN 'ready' THEN 'posted'::settlement_batch_status_enum
                WHEN 'paid' THEN 'paid'::settlement_batch_status_enum
                ELSE 'unposted'::settlement_batch_status_enum
            END
        )
    """)
    op.execute("ALTER TABLE driver_settlements ALTER COLUMN status SET DEFAULT 'unposted'::settlement_batch_status_enum")
    op.execute("DROP TYPE settlement_status_enum_old")

    # ══════════════════════════════════════════════════════════════
    #  3. CREATE NEW TABLES (in dependency order)
    # ══════════════════════════════════════════════════════════════

    # --- settlement_batches (before driver_settlements FK)
    op.create_table('settlement_batches',
        sa.Column('batch_number', sa.String(length=50), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=True),
        sa.Column('period_end', sa.Date(), nullable=True),
        sa.Column('status', postgresql.ENUM('unposted', 'posted', 'paid', name='settlement_batch_status_enum', create_type=False), server_default='unposted', nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
        sa.Column('settlement_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id', 'batch_number', name='uq_settlement_batches_company_number'),
    )
    op.create_index(op.f('ix_settlement_batches_company_id'), 'settlement_batches', ['company_id'], unique=False)

    # --- invoice_batches
    op.create_table('invoice_batches',
        sa.Column('batch_id', sa.String(length=20), nullable=False),
        sa.Column('status', postgresql.ENUM('unposted', 'partial_posted', 'posted', 'paid', name='invoice_batch_status_enum', create_type=False), server_default='unposted', nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), server_default='0', nullable=False),
        sa.Column('invoice_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id', 'batch_id', name='uq_invoice_batches_company_batch'),
    )
    op.create_index(op.f('ix_invoice_batches_company_id'), 'invoice_batches', ['company_id'], unique=False)

    # --- trips (depends on loads, drivers, trucks, trailers)
    op.create_table('trips',
        sa.Column('trip_number', sa.String(length=50), nullable=False),
        sa.Column('load_id', sa.UUID(), nullable=False),
        sa.Column('driver_id', sa.UUID(), nullable=True),
        sa.Column('truck_id', sa.UUID(), nullable=True),
        sa.Column('trailer_id', sa.UUID(), nullable=True),
        sa.Column('sequence_number', sa.Integer(), server_default='1', nullable=False),
        sa.Column('status', postgresql.ENUM('assigned', 'dispatched', 'in_transit', 'delivered', 'cancelled', name='trip_status_enum', create_type=False), server_default='assigned', nullable=False),
        sa.Column('loaded_miles', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('empty_miles', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('driver_gross', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['driver_id'], ['drivers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['load_id'], ['loads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trailer_id'], ['trailers.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['truck_id'], ['trucks.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trips_company_id'), 'trips', ['company_id'], unique=False)
    op.create_index(op.f('ix_trips_load_id'), 'trips', ['load_id'], unique=False)
    op.create_index(op.f('ix_trips_driver_id'), 'trips', ['driver_id'], unique=False)

    # --- commodities
    op.create_table('commodities',
        sa.Column('load_id', sa.UUID(), nullable=False),
        sa.Column('description', sa.String(length=255), server_default='General freight', nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('package_type', sa.String(length=50), server_default='Skid', nullable=False),
        sa.Column('pieces', sa.String(length=20), server_default='PCS', nullable=False),
        sa.Column('total_weight', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('weight_unit', sa.String(length=5), server_default='lb', nullable=False),
        sa.Column('width', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('height', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('length', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['load_id'], ['loads.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_commodities_company_id'), 'commodities', ['company_id'], unique=False)

    # --- invoices (depends on invoice_batches, loads)
    op.create_table('invoices',
        sa.Column('invoice_number', sa.String(length=20), nullable=False),
        sa.Column('batch_id', sa.UUID(), nullable=False),
        sa.Column('load_id', sa.UUID(), nullable=False),
        sa.Column('customer_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('billing_type', sa.String(length=50), server_default='standard', nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['invoice_batches.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['customer_id'], ['brokers.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['load_id'], ['loads.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('company_id', 'invoice_number', name='uq_invoices_company_number'),
    )
    op.create_index(op.f('ix_invoices_company_id'), 'invoices', ['company_id'], unique=False)

    # ══════════════════════════════════════════════════════════════
    #  4. ALTER EXISTING TABLES — Add new columns
    # ══════════════════════════════════════════════════════════════

    # --- companies: add enforce_compliance
    op.add_column('companies', sa.Column('enforce_compliance', sa.Boolean(), server_default='false', nullable=False))

    # --- loads: add shipment_id, is_locked, commission_dispatcher_id
    op.add_column('loads', sa.Column('shipment_id', sa.String(length=100), nullable=True))
    op.add_column('loads', sa.Column('is_locked', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('loads', sa.Column('commission_dispatcher_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_loads_commission_dispatcher', 'loads', 'users', ['commission_dispatcher_id'], ['id'], ondelete='SET NULL')

    # --- drivers: add payment_tariff_type, payment_tariff_value, tax_classification
    op.add_column('drivers', sa.Column('payment_tariff_type', sa.String(length=50), nullable=True))
    op.add_column('drivers', sa.Column('payment_tariff_value', sa.Numeric(precision=10, scale=4), nullable=True))
    op.add_column('drivers', sa.Column('tax_classification', sa.Enum('w2_employee', 'contractor_1099', name='tax_classification_enum', create_type=False), nullable=True))
    op.add_column('drivers', sa.Column('hire_date', sa.Date(), nullable=True))
    op.add_column('drivers', sa.Column('notes', sa.Text(), nullable=True))

    # --- load_stops: add trip_id FK
    op.add_column('load_stops', sa.Column('trip_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_load_stops_trip', 'load_stops', 'trips', ['trip_id'], ['id'], ondelete='SET NULL')

    # --- settlement_line_items: add trip_id FK
    op.add_column('settlement_line_items', sa.Column('trip_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_settlement_line_items_trip', 'settlement_line_items', 'trips', ['trip_id'], ['id'], ondelete='SET NULL')

    # --- driver_settlements: add batch_id FK, total_bonus
    op.add_column('driver_settlements', sa.Column('batch_id', sa.UUID(), nullable=True))
    op.add_column('driver_settlements', sa.Column('total_bonus', sa.Numeric(precision=10, scale=2), server_default='0', nullable=False))
    op.create_foreign_key('fk_driver_settlements_batch', 'driver_settlements', 'settlement_batches', ['batch_id'], ['id'], ondelete='SET NULL')

    # ══════════════════════════════════════════════════════════════
    #  5. DATA MIGRATION — Port existing Load assignments to Trip
    # ══════════════════════════════════════════════════════════════
    # This creates a Trip record for every Load that has a driver_id assigned.
    # The Trip inherits the driver, truck, trailer from the Load.

    op.execute("""
        INSERT INTO trips (id, company_id, trip_number, load_id, driver_id, truck_id, trailer_id,
                           sequence_number, status, loaded_miles, created_at)
        SELECT
            gen_random_uuid(),
            l.company_id,
            'TR-' || REPLACE(l.load_number, 'LD-', '') || '-01',
            l.id,
            l.driver_id,
            l.truck_id,
            l.trailer_id,
            1,
            CASE
                WHEN l.status::text IN ('delivered', 'invoiced', 'paid') THEN 'delivered'::trip_status_enum
                WHEN l.status::text = 'cancelled' THEN 'cancelled'::trip_status_enum
                ELSE 'dispatched'::trip_status_enum
            END,
            l.total_miles,
            l.created_at
        FROM loads l
        WHERE l.driver_id IS NOT NULL
    """)

    # ══════════════════════════════════════════════════════════════
    #  6. DROP OLD FK COLUMNS from loads (DESTRUCTIVE)
    # ══════════════════════════════════════════════════════════════

    # Drop FKs first, then columns
    op.drop_constraint('loads_driver_id_fkey', 'loads', type_='foreignkey')
    op.drop_constraint('loads_truck_id_fkey', 'loads', type_='foreignkey')
    op.drop_constraint('loads_trailer_id_fkey', 'loads', type_='foreignkey')
    op.drop_column('loads', 'driver_id')
    op.drop_column('loads', 'truck_id')
    op.drop_column('loads', 'trailer_id')


def downgrade() -> None:
    """Reverse the Trip-based refactor.

    WARNING: This is a destructive downgrade that does NOT restore data
    from Trip records back to Load columns.
    """
    # Re-add FK columns to loads
    op.add_column('loads', sa.Column('driver_id', sa.UUID(), nullable=True))
    op.add_column('loads', sa.Column('truck_id', sa.UUID(), nullable=True))
    op.add_column('loads', sa.Column('trailer_id', sa.UUID(), nullable=True))
    op.create_foreign_key('loads_driver_id_fkey', 'loads', 'drivers', ['driver_id'], ['id'], ondelete='RESTRICT')
    op.create_foreign_key('loads_truck_id_fkey', 'loads', 'trucks', ['truck_id'], ['id'], ondelete='RESTRICT')
    op.create_foreign_key('loads_trailer_id_fkey', 'loads', 'trailers', ['trailer_id'], ['id'], ondelete='RESTRICT')

    # Attempt to restore data from trips → loads
    op.execute("""
        UPDATE loads SET
            driver_id = t.driver_id,
            truck_id = t.truck_id,
            trailer_id = t.trailer_id
        FROM trips t
        WHERE t.load_id = loads.id AND t.sequence_number = 1
    """)

    # Drop new FKs and columns from existing tables
    op.drop_constraint('fk_driver_settlements_batch', 'driver_settlements', type_='foreignkey')
    op.drop_column('driver_settlements', 'total_bonus')
    op.drop_column('driver_settlements', 'batch_id')

    op.drop_constraint('fk_settlement_line_items_trip', 'settlement_line_items', type_='foreignkey')
    op.drop_column('settlement_line_items', 'trip_id')

    op.drop_constraint('fk_load_stops_trip', 'load_stops', type_='foreignkey')
    op.drop_column('load_stops', 'trip_id')

    op.drop_column('drivers', 'notes')
    op.drop_column('drivers', 'hire_date')
    op.drop_column('drivers', 'tax_classification')
    op.drop_column('drivers', 'payment_tariff_value')
    op.drop_column('drivers', 'payment_tariff_type')

    op.drop_constraint('fk_loads_commission_dispatcher', 'loads', type_='foreignkey')
    op.drop_column('loads', 'commission_dispatcher_id')
    op.drop_column('loads', 'is_locked')
    op.drop_column('loads', 'shipment_id')

    op.drop_column('companies', 'enforce_compliance')

    # Drop new tables
    op.drop_index(op.f('ix_invoices_company_id'), table_name='invoices')
    op.drop_table('invoices')
    op.drop_index(op.f('ix_commodities_company_id'), table_name='commodities')
    op.drop_table('commodities')
    op.drop_index(op.f('ix_trips_driver_id'), table_name='trips')
    op.drop_index(op.f('ix_trips_load_id'), table_name='trips')
    op.drop_index(op.f('ix_trips_company_id'), table_name='trips')
    op.drop_table('trips')
    op.drop_index(op.f('ix_invoice_batches_company_id'), table_name='invoice_batches')
    op.drop_table('invoice_batches')
    op.drop_index(op.f('ix_settlement_batches_company_id'), table_name='settlement_batches')
    op.drop_table('settlement_batches')

    # Revert enums
    # Settlement status
    op.execute("CREATE TYPE settlement_status_enum AS ENUM ('draft', 'ready', 'paid')")
    op.execute("""
        ALTER TABLE driver_settlements
        ALTER COLUMN status DROP DEFAULT
    """)
    op.execute("""
        ALTER TABLE driver_settlements
        ALTER COLUMN status TYPE settlement_status_enum
        USING (
            CASE status::text
                WHEN 'unposted' THEN 'draft'::settlement_status_enum
                WHEN 'posted' THEN 'ready'::settlement_status_enum
                WHEN 'paid' THEN 'paid'::settlement_status_enum
                ELSE 'draft'::settlement_status_enum
            END
        )
    """)
    op.execute("ALTER TABLE driver_settlements ALTER COLUMN status SET DEFAULT 'draft'::settlement_status_enum")

    # Driver status
    op.execute("ALTER TYPE driver_status_enum RENAME TO driver_status_enum_new")
    op.execute("CREATE TYPE driver_status_enum AS ENUM ('available', 'on_route', 'off_duty', 'on_leave', 'terminated')")
    op.execute("""
        ALTER TABLE drivers ALTER COLUMN status DROP DEFAULT
    """)
    op.execute("""
        ALTER TABLE drivers
        ALTER COLUMN status TYPE driver_status_enum
        USING (
            CASE status::text
                WHEN 'on_trip' THEN 'on_route'::driver_status_enum
                WHEN 'inactive' THEN 'off_duty'::driver_status_enum
                ELSE status::text::driver_status_enum
            END
        )
    """)
    op.execute("ALTER TABLE drivers ALTER COLUMN status SET DEFAULT 'available'::driver_status_enum")
    op.execute("DROP TYPE driver_status_enum_new")

    # Load status
    op.execute("ALTER TYPE load_status_enum RENAME TO load_status_enum_new")
    op.execute("CREATE TYPE load_status_enum AS ENUM ('planned', 'dispatched', 'at_pickup', 'in_transit', 'delivered', 'delayed', 'billed', 'paid', 'cancelled')")
    op.execute("""
        ALTER TABLE loads ALTER COLUMN status DROP DEFAULT
    """)
    op.execute("""
        ALTER TABLE loads
        ALTER COLUMN status TYPE load_status_enum
        USING (
            CASE status::text
                WHEN 'offer' THEN 'planned'::load_status_enum
                WHEN 'booked' THEN 'planned'::load_status_enum
                WHEN 'assigned' THEN 'planned'::load_status_enum
                WHEN 'invoiced' THEN 'billed'::load_status_enum
                ELSE status::text::load_status_enum
            END
        )
    """)
    op.execute("ALTER TABLE loads ALTER COLUMN status SET DEFAULT 'planned'::load_status_enum")
    op.execute("DROP TYPE load_status_enum_new")

    # Drop new enum types
    op.execute("DROP TYPE IF EXISTS tax_classification_enum")
    op.execute("DROP TYPE IF EXISTS settlement_batch_status_enum")
    op.execute("DROP TYPE IF EXISTS invoice_batch_status_enum")
    op.execute("DROP TYPE IF EXISTS trip_status_enum")
