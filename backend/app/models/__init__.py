"""Central model imports — Alembic reads this to discover all models for autogenerate."""

from app.models.base import Base, TenantMixin  # noqa: F401

# ── Domain Enums (re-exported for convenience) ───────────────────
from app.models.base import (  # noqa: F401
    LoadStatus,
    TripStatus,
    SettlementBatchStatus,
    InvoiceBatchStatus,
    DriverStatus,
)

# ── Entity Models ────────────────────────────────────────────────
from app.models.company import Company  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.broker import Broker  # noqa: F401
from app.models.driver import Driver  # noqa: F401
from app.models.fleet import Truck, Trailer  # noqa: F401
from app.models.load import Load, LoadStop, Trip, Commodity  # noqa: F401
from app.models.accounting import (  # noqa: F401
    LoadAccessorial,
    CompanyDefaultDeduction,
    SettlementBatch,
    DriverSettlement,
    SettlementLineItem,
    InvoiceBatch,
    Invoice,
)
from app.models.document import Document  # noqa: F401
from app.models.token_blacklist import TokenBlacklist  # noqa: F401
