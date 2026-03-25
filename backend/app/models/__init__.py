"""Central model imports — Alembic reads this to discover all models for autogenerate."""

from app.models.base import Base, TenantMixin  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.broker import Broker  # noqa: F401
from app.models.driver import Driver  # noqa: F401
from app.models.fleet import Truck, Trailer  # noqa: F401
from app.models.load import Load, LoadStop  # noqa: F401
from app.models.accounting import (  # noqa: F401
    LoadAccessorial,
    CompanyDefaultDeduction,
    DriverSettlement,
    SettlementLineItem,
)
from app.models.document import Document  # noqa: F401
