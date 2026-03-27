"""Database seed script — populates the DB with test data for Wenze Trucking.

Usage:
    cd backend && python -m app.seed

The script is idempotent: re-running it skips records that already exist.
"""

from __future__ import annotations

import asyncio
import os
import sys
from datetime import date

# Ensure the backend directory is on sys.path when run as a module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_factory, engine
from app.core.security import hash_password
from app.models.base import Base
from app.models.broker import Broker
from app.models.company import Company
from app.models.driver import Driver, DriverStatus, EmploymentType, PayRateType
from app.models.fleet import EquipmentStatus, OwnershipType, Trailer, TrailerType, Truck
from app.models.load import Load, LoadStatus, LoadStop, StopType
from app.models.user import User, UserRole

# ── Helpers ──────────────────────────────────────────────────────


def _ok(label: str) -> None:
    print(f"  {label:<45} ✅ Created")


def _skip(label: str) -> None:
    print(f"  {label:<45} ⏭  Already exists")


# ── Table creation ───────────────────────────────────────────────


async def create_tables() -> None:
    label = "Creating database tables..."
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(f"  {label:<45} ✅ Done")


# ── Users ────────────────────────────────────────────────────────


async def create_super_admin(db: AsyncSession) -> User:
    email = "superadmin@kinetic.test"
    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        _skip("Creating Super Admin user...")
        return existing

    user = User(
        email=email,
        hashed_password=hash_password("SuperAdmin1!"),
        first_name="System",
        last_name="Admin",
        role=UserRole.super_admin,
        company_id=None,
    )
    db.add(user)
    await db.flush()
    _ok("Creating Super Admin user...")
    return user


async def create_company(db: AsyncSession) -> Company:
    result = await db.execute(select(Company).where(Company.name == "Wenze Trucking"))
    existing = result.scalar_one_or_none()
    if existing:
        _skip("Creating company: Wenze Trucking...")
        return existing

    company = Company(
        name="Wenze Trucking",
        mc_number="MC-789456",
        dot_number="DOT-3214567",
        address="1200 Trucking Blvd, Dallas, TX 75201",
        phone="(214) 555-0100",
        email="dispatch@wenzetrucking.com",
    )
    db.add(company)
    await db.flush()
    _ok("Creating company: Wenze Trucking...")
    return company


async def create_company_users(db: AsyncSession, company_id: object) -> dict[str, User]:
    users_spec = [
        {
            "label": "Creating Company Admin: James Wenze...",
            "email": "admin@wenzetrucking.com",
            "password": "WenzeAdmin1!",
            "first_name": "James",
            "last_name": "Wenze",
            "role": UserRole.company_admin,
        },
        {
            "label": "Creating Dispatcher: Maria Rodriguez...",
            "email": "dispatcher@wenzetrucking.com",
            "password": "Dispatch1!",
            "first_name": "Maria",
            "last_name": "Rodriguez",
            "role": UserRole.dispatcher,
        },
        {
            "label": "Creating Accountant: David Chen...",
            "email": "accounting@wenzetrucking.com",
            "password": "Account1!",
            "first_name": "David",
            "last_name": "Chen",
            "role": UserRole.accountant,
        },
    ]

    created: dict[str, User] = {}
    for spec in users_spec:
        result = await db.execute(select(User).where(User.email == spec["email"]))
        existing = result.scalar_one_or_none()
        if existing:
            _skip(spec["label"])
            created[spec["email"]] = existing
            continue

        user = User(
            email=spec["email"],
            hashed_password=hash_password(spec["password"]),
            first_name=spec["first_name"],
            last_name=spec["last_name"],
            role=spec["role"],
            company_id=company_id,
        )
        db.add(user)
        await db.flush()
        _ok(spec["label"])
        created[spec["email"]] = user

    return created


# ── Brokers ──────────────────────────────────────────────────────


async def create_brokers(db: AsyncSession, company_id: object) -> dict[str, Broker]:
    brokers_spec = [
        {
            "label": "Creating broker: CH Robinson...",
            "name": "CH Robinson",
            "mc_number": "MC-128098",
            "contact_name": "Sarah Mitchell",
            "contact_phone": "(800) 323-7587",
            "contact_email": "sarah.m@chrobinson.com",
        },
        {
            "label": "Creating broker: TQL...",
            "name": "TQL (Total Quality Logistics)",
            "mc_number": "MC-295567",
            "contact_name": "Mike Johnson",
            "contact_phone": "(800) 580-3101",
            "contact_email": "mike.j@tql.com",
        },
        {
            "label": "Creating broker: Echo Global Logistics...",
            "name": "Echo Global Logistics",
            "mc_number": "MC-382946",
            "contact_name": "Jennifer Lee",
            "contact_phone": "(800) 354-7993",
            "contact_email": "jennifer.l@echo.com",
        },
    ]

    created: dict[str, Broker] = {}
    for spec in brokers_spec:
        result = await db.execute(
            select(Broker).where(Broker.name == spec["name"], Broker.company_id == company_id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            _skip(spec["label"])
            created[spec["name"]] = existing
            continue

        broker = Broker(
            company_id=company_id,
            name=spec["name"],
            mc_number=spec["mc_number"],
            contact_name=spec["contact_name"],
            contact_phone=spec["contact_phone"],
            contact_email=spec["contact_email"],
        )
        db.add(broker)
        await db.flush()
        _ok(spec["label"])
        created[spec["name"]] = broker

    return created


# ── Drivers ──────────────────────────────────────────────────────


async def create_drivers(db: AsyncSession, company_id: object) -> dict[str, Driver]:
    drivers_spec = [
        {
            "label": "Creating driver: Robert Williams...",
            "first_name": "Robert",
            "last_name": "Williams",
            "employment_type": EmploymentType.company_w2,
            "cdl_number": "TX-A-78901234",
            "cdl_class": "A",
            "cdl_expiry_date": date(2027, 6, 15),
            "medical_card_expiry_date": date(2026, 12, 1),
            "phone": "(214) 555-0201",
            "email": "robert.w@wenzetrucking.com",
            "pay_rate_type": PayRateType.cpm,
            "pay_rate_value": 0.65,
            "status": DriverStatus.on_route,
            "experience_years": 12,
        },
        {
            "label": "Creating driver: Michael Brown...",
            "first_name": "Michael",
            "last_name": "Brown",
            "employment_type": EmploymentType.owner_operator_1099,
            "cdl_number": "TX-A-65432109",
            "cdl_class": "A",
            "cdl_expiry_date": date(2027, 3, 20),
            "medical_card_expiry_date": date(2026, 9, 15),
            "phone": "(214) 555-0202",
            "email": "michael.b@wenzetrucking.com",
            "pay_rate_type": PayRateType.percentage,
            "pay_rate_value": 85.0,
            "status": DriverStatus.available,
            "experience_years": 8,
        },
        {
            "label": "Creating driver: Carlos Garcia...",
            "first_name": "Carlos",
            "last_name": "Garcia",
            "employment_type": EmploymentType.company_w2,
            "cdl_number": "TX-A-11223344",
            "cdl_class": "A",
            "cdl_expiry_date": date(2026, 11, 30),
            "medical_card_expiry_date": date(2026, 6, 1),
            "phone": "(214) 555-0203",
            "email": "carlos.g@wenzetrucking.com",
            "pay_rate_type": PayRateType.cpm,
            "pay_rate_value": 0.62,
            "status": DriverStatus.available,
            "experience_years": 5,
        },
        {
            "label": "Creating driver: James Thompson...",
            "first_name": "James",
            "last_name": "Thompson",
            "employment_type": EmploymentType.lease_operator,
            "cdl_number": "TX-A-99887766",
            "cdl_class": "A",
            "cdl_expiry_date": date(2028, 1, 15),
            "medical_card_expiry_date": date(2027, 3, 1),
            "phone": "(214) 555-0204",
            "email": "james.t@wenzetrucking.com",
            "pay_rate_type": PayRateType.fixed_per_load,
            "pay_rate_value": 1200.0,
            "status": DriverStatus.off_duty,
            "experience_years": 15,
        },
    ]

    created: dict[str, Driver] = {}
    for spec in drivers_spec:
        full_name = f"{spec['first_name']} {spec['last_name']}"
        result = await db.execute(
            select(Driver).where(
                Driver.email == spec["email"], Driver.company_id == company_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            _skip(spec["label"])
            created[full_name] = existing
            continue

        driver = Driver(
            company_id=company_id,
            first_name=spec["first_name"],
            last_name=spec["last_name"],
            employment_type=spec["employment_type"],
            cdl_number=spec["cdl_number"],
            cdl_class=spec["cdl_class"],
            cdl_expiry_date=spec["cdl_expiry_date"],
            medical_card_expiry_date=spec["medical_card_expiry_date"],
            phone=spec["phone"],
            email=spec["email"],
            pay_rate_type=spec["pay_rate_type"],
            pay_rate_value=spec["pay_rate_value"],
            status=spec["status"],
            experience_years=spec["experience_years"],
        )
        db.add(driver)
        await db.flush()
        _ok(spec["label"])
        created[full_name] = driver

    return created


# ── Trucks ───────────────────────────────────────────────────────


async def create_trucks(db: AsyncSession, company_id: object) -> dict[str, Truck]:
    trucks_spec = [
        {
            "label": "Creating truck: TRK-101...",
            "unit_number": "TRK-101",
            "year": 2023,
            "make": "Freightliner",
            "model": "Cascadia",
            "vin": "1FUJGLDR5PLAB1234",
            "license_plate": "TX-ABC-1234",
            "ownership_type": OwnershipType.owned,
            "status": EquipmentStatus.in_use,
        },
        {
            "label": "Creating truck: TRK-102...",
            "unit_number": "TRK-102",
            "year": 2022,
            "make": "Kenworth",
            "model": "T680",
            "vin": "1XKYD49X2MJ567890",
            "license_plate": "TX-DEF-5678",
            "ownership_type": OwnershipType.financed,
            "status": EquipmentStatus.in_use,
        },
        {
            "label": "Creating truck: TRK-103...",
            "unit_number": "TRK-103",
            "year": 2024,
            "make": "Peterbilt",
            "model": "579",
            "vin": "1XPWD49X4PD901234",
            "license_plate": "TX-GHI-9012",
            "ownership_type": OwnershipType.owned,
            "status": EquipmentStatus.available,
        },
        {
            "label": "Creating truck: TRK-104...",
            "unit_number": "TRK-104",
            "year": 2021,
            "make": "Volvo",
            "model": "VNL 860",
            "vin": "4V4NC9EH8MN345678",
            "license_plate": "TX-JKL-3456",
            "ownership_type": OwnershipType.leased,
            "status": EquipmentStatus.maintenance,
        },
    ]

    created: dict[str, Truck] = {}
    for spec in trucks_spec:
        result = await db.execute(
            select(Truck).where(
                Truck.unit_number == spec["unit_number"], Truck.company_id == company_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            _skip(spec["label"])
            created[spec["unit_number"]] = existing
            continue

        truck = Truck(
            company_id=company_id,
            unit_number=spec["unit_number"],
            year=spec["year"],
            make=spec["make"],
            model=spec["model"],
            vin=spec["vin"],
            license_plate=spec["license_plate"],
            ownership_type=spec["ownership_type"],
            status=spec["status"],
        )
        db.add(truck)
        await db.flush()
        _ok(spec["label"])
        created[spec["unit_number"]] = truck

    return created


# ── Trailers ─────────────────────────────────────────────────────


async def create_trailers(db: AsyncSession, company_id: object) -> dict[str, Trailer]:
    trailers_spec = [
        {
            "label": "Creating trailer: TRL-201...",
            "unit_number": "TRL-201",
            "year": 2022,
            "make": "Great Dane",
            "model": "Everest",
            "vin": "1GRAA0626NB123456",
            "license_plate": "TX-TRL-2001",
            "trailer_type": TrailerType.dry_van,
            "ownership_type": OwnershipType.owned,
            "status": EquipmentStatus.in_use,
        },
        {
            "label": "Creating trailer: TRL-202...",
            "unit_number": "TRL-202",
            "year": 2023,
            "make": "Utility",
            "model": "3000R",
            "vin": "1UYVS2536NU789012",
            "license_plate": "TX-TRL-2002",
            "trailer_type": TrailerType.reefer,
            "ownership_type": OwnershipType.financed,
            "status": EquipmentStatus.in_use,
        },
        {
            "label": "Creating trailer: TRL-203...",
            "unit_number": "TRL-203",
            "year": 2021,
            "make": "Wabash",
            "model": "DuraPlate",
            "vin": "1JJV532D7ML345678",
            "license_plate": "TX-TRL-2003",
            "trailer_type": TrailerType.dry_van,
            "ownership_type": OwnershipType.owned,
            "status": EquipmentStatus.available,
        },
        {
            "label": "Creating trailer: TRL-204...",
            "unit_number": "TRL-204",
            "year": 2023,
            "make": "Fontaine",
            "model": "Revolution",
            "vin": "13N14830XP1901234",
            "license_plate": "TX-TRL-2004",
            "trailer_type": TrailerType.flatbed,
            "ownership_type": OwnershipType.owned,
            "status": EquipmentStatus.available,
        },
    ]

    created: dict[str, Trailer] = {}
    for spec in trailers_spec:
        result = await db.execute(
            select(Trailer).where(
                Trailer.unit_number == spec["unit_number"], Trailer.company_id == company_id
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            _skip(spec["label"])
            created[spec["unit_number"]] = existing
            continue

        trailer = Trailer(
            company_id=company_id,
            unit_number=spec["unit_number"],
            year=spec["year"],
            make=spec["make"],
            model=spec["model"],
            vin=spec["vin"],
            license_plate=spec["license_plate"],
            trailer_type=spec["trailer_type"],
            ownership_type=spec["ownership_type"],
            status=spec["status"],
        )
        db.add(trailer)
        await db.flush()
        _ok(spec["label"])
        created[spec["unit_number"]] = trailer

    return created


# ── Loads ────────────────────────────────────────────────────────


async def create_loads(
    db: AsyncSession,
    company_id: object,
    brokers: dict[str, Broker],
    drivers: dict[str, Driver],
    trucks: dict[str, Truck],
    trailers: dict[str, Trailer],
) -> None:
    loads_spec = [
        {
            "label": "Creating load: LD-1001 (In Transit)...",
            "load_number": "LD-1001",
            "broker_load_id": "CHR-2026-44521",
            "broker": brokers["CH Robinson"],
            "driver": drivers["Robert Williams"],
            "truck": trucks["TRK-101"],
            "trailer": trailers["TRL-201"],
            "status": LoadStatus.in_transit,
            "base_rate": 3200.00,
            "total_miles": 1450,
            "total_rate": 3450.00,
            "stops": [
                {
                    "stop_type": StopType.pickup,
                    "stop_sequence": 1,
                    "facility_name": "Walmart Distribution Center",
                    "address": "2701 SE Moberly Ln",
                    "city": "Bentonville",
                    "state": "AR",
                    "zip_code": "72712",
                    "scheduled_date": date(2026, 3, 25),
                },
                {
                    "stop_type": StopType.delivery,
                    "stop_sequence": 2,
                    "facility_name": "Target DC",
                    "address": "1515 S Platte River Dr",
                    "city": "Denver",
                    "state": "CO",
                    "zip_code": "80223",
                    "scheduled_date": date(2026, 3, 27),
                },
            ],
        },
        {
            "label": "Creating load: LD-1002 (Dispatched)...",
            "load_number": "LD-1002",
            "broker_load_id": "TQL-88234",
            "broker": brokers["TQL (Total Quality Logistics)"],
            "driver": drivers["Michael Brown"],
            "truck": trucks["TRK-102"],
            "trailer": trailers["TRL-202"],
            "status": LoadStatus.dispatched,
            "base_rate": 2800.00,
            "total_miles": 980,
            "total_rate": 2950.00,
            "stops": [
                {
                    "stop_type": StopType.pickup,
                    "stop_sequence": 1,
                    "facility_name": "Amazon Fulfillment SDF8",
                    "address": "4360 Robards Ln",
                    "city": "Louisville",
                    "state": "KY",
                    "zip_code": "40218",
                    "scheduled_date": date(2026, 3, 28),
                },
                {
                    "stop_type": StopType.delivery,
                    "stop_sequence": 2,
                    "facility_name": "FedEx Ground Hub",
                    "address": "1000 FedEx Dr",
                    "city": "Moon Township",
                    "state": "PA",
                    "zip_code": "15108",
                    "scheduled_date": date(2026, 3, 29),
                },
            ],
        },
        {
            "label": "Creating load: LD-1003 (Delivered)...",
            "load_number": "LD-1003",
            "broker_load_id": "ECH-77123",
            "broker": brokers["Echo Global Logistics"],
            "driver": drivers["Carlos Garcia"],
            "truck": trucks["TRK-103"],
            "trailer": trailers["TRL-203"],
            "status": LoadStatus.delivered,
            "base_rate": 1800.00,
            "total_miles": 620,
            "total_rate": 1950.00,
            "stops": [
                {
                    "stop_type": StopType.pickup,
                    "stop_sequence": 1,
                    "facility_name": "Home Depot DC",
                    "address": "8500 Industrial Blvd",
                    "city": "Mechanicsville",
                    "state": "VA",
                    "zip_code": "23116",
                    "scheduled_date": date(2026, 3, 20),
                },
                {
                    "stop_type": StopType.delivery,
                    "stop_sequence": 2,
                    "facility_name": "Lowe's RDC",
                    "address": "1000 Lowes Blvd",
                    "city": "Mooresville",
                    "state": "NC",
                    "zip_code": "28117",
                    "scheduled_date": date(2026, 3, 21),
                },
            ],
        },
        {
            "label": "Creating load: LD-1004 (Planned)...",
            "load_number": "LD-1004",
            "broker_load_id": "CHR-2026-44599",
            "broker": brokers["CH Robinson"],
            "driver": None,
            "truck": None,
            "trailer": None,
            "status": LoadStatus.planned,
            "base_rate": 4100.00,
            "total_miles": 2100,
            "total_rate": 4350.00,
            "stops": [
                {
                    "stop_type": StopType.pickup,
                    "stop_sequence": 1,
                    "facility_name": "Costco Distribution",
                    "address": "47605 Osgood Rd",
                    "city": "Fremont",
                    "state": "CA",
                    "zip_code": "94539",
                    "scheduled_date": date(2026, 4, 1),
                },
                {
                    "stop_type": StopType.delivery,
                    "stop_sequence": 2,
                    "facility_name": "Costco DC",
                    "address": "5001 N Pkwy Calabasas",
                    "city": "Calabasas",
                    "state": "CA",
                    "zip_code": "91302",
                    "scheduled_date": date(2026, 4, 3),
                },
            ],
        },
        {
            "label": "Creating load: LD-1005 (Paid)...",
            "load_number": "LD-1005",
            "broker_load_id": "TQL-77999",
            "broker": brokers["TQL (Total Quality Logistics)"],
            "driver": drivers["James Thompson"],
            "truck": trucks["TRK-103"],
            "trailer": trailers["TRL-203"],
            "status": LoadStatus.paid,
            "base_rate": 2500.00,
            "total_miles": 850,
            "total_rate": 2650.00,
            "stops": [
                {
                    "stop_type": StopType.pickup,
                    "stop_sequence": 1,
                    "facility_name": "General Mills",
                    "address": "9000 Plymouth Ave N",
                    "city": "Golden Valley",
                    "state": "MN",
                    "zip_code": "55427",
                    "scheduled_date": date(2026, 3, 10),
                },
                {
                    "stop_type": StopType.delivery,
                    "stop_sequence": 2,
                    "facility_name": "Kroger DC",
                    "address": "1014 Vine St",
                    "city": "Cincinnati",
                    "state": "OH",
                    "zip_code": "45202",
                    "scheduled_date": date(2026, 3, 12),
                },
            ],
        },
    ]

    for spec in loads_spec:
        result = await db.execute(
            select(Load).where(
                Load.load_number == spec["load_number"],
                Load.company_id == company_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            _skip(spec["label"])
            continue

        driver: Driver | None = spec["driver"]
        truck: Truck | None = spec["truck"]
        trailer: Trailer | None = spec["trailer"]
        broker: Broker = spec["broker"]

        load = Load(
            company_id=company_id,
            load_number=spec["load_number"],
            broker_load_id=spec["broker_load_id"],
            broker_id=broker.id,
            driver_id=driver.id if driver else None,
            truck_id=truck.id if truck else None,
            trailer_id=trailer.id if trailer else None,
            status=spec["status"],
            base_rate=spec["base_rate"],
            total_miles=spec["total_miles"],
            total_rate=spec["total_rate"],
        )
        db.add(load)
        await db.flush()

        for stop_spec in spec["stops"]:
            stop = LoadStop(
                company_id=company_id,
                load_id=load.id,
                stop_type=stop_spec["stop_type"],
                stop_sequence=stop_spec["stop_sequence"],
                facility_name=stop_spec["facility_name"],
                address=stop_spec["address"],
                city=stop_spec["city"],
                state=stop_spec["state"],
                zip_code=stop_spec["zip_code"],
                scheduled_date=stop_spec["scheduled_date"],
            )
            db.add(stop)

        await db.flush()
        _ok(spec["label"])


# ── Summary ──────────────────────────────────────────────────────


def print_summary() -> None:
    sep = "═" * 55
    print(f"\n{sep}")
    print("  ✅ Seed Complete — Test Credentials")
    print(sep)
    print()
    print(f"  {'Role':<18} {'Email':<33} {'Password'}")
    print(f"  {'──────────────':<18} {'─────────────────────────────':<33} {'─────────────'}")
    print(f"  {'Super Admin':<18} {'superadmin@kinetic.test':<33} SuperAdmin1!")
    print(f"  {'Company Admin':<18} {'admin@wenzetrucking.com':<33} WenzeAdmin1!")
    print(f"  {'Dispatcher':<18} {'dispatcher@wenzetrucking.com':<33} Dispatch1!")
    print(f"  {'Accountant':<18} {'accounting@wenzetrucking.com':<33} Account1!")
    print()
    print("  Company: Wenze Trucking (MC-789456 / DOT-3214567)")
    print("  Drivers: 4 | Trucks: 4 | Trailers: 4 | Loads: 5 | Brokers: 3")
    print(sep)


# ── Main entry point ─────────────────────────────────────────────


async def seed() -> None:
    sep = "═" * 55
    print(f"\n{sep}")
    print("  Kinetic TMS — Database Seed Script")
    print(f"{sep}\n")

    await create_tables()

    async with async_session_factory() as db:
        async with db.begin():
            await create_super_admin(db)
            company = await create_company(db)
            await create_company_users(db, company.id)
            brokers = await create_brokers(db, company.id)
            drivers = await create_drivers(db, company.id)
            trucks = await create_trucks(db, company.id)
            trailers = await create_trailers(db, company.id)
            await create_loads(db, company.id, brokers, drivers, trucks, trailers)

    print_summary()


if __name__ == "__main__":
    asyncio.run(seed())
