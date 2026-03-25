"""Settings repository — database queries for company profile & user management."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.user import User


class CompanyRepository:
    """Company profile DB operations."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    async def get(self) -> Optional[Company]:
        query = select(Company).where(Company.id == self.company_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def update(self, company: Company, **kwargs) -> Company:
        for key, value in kwargs.items():
            if value is not None:
                setattr(company, key, value)
        await self.db.commit()
        await self.db.refresh(company)
        return company


class UserRepository:
    """Company user DB operations — tenant-isolated."""

    def __init__(self, db: AsyncSession, company_id: UUID):
        self.db = db
        self.company_id = company_id

    async def list(self) -> tuple[list[User], int]:
        """List all users for this company."""
        query = (
            select(User)
            .where(User.company_id == self.company_id)
            .order_by(User.last_name, User.first_name)
        )
        count_query = (
            select(func.count())
            .select_from(User)
            .where(User.company_id == self.company_id)
        )
        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        query = (
            select(User)
            .where(User.id == user_id)
            .where(User.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> User:
        user = User(company_id=self.company_id, **kwargs)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            if value is not None:
                setattr(user, key, value)
        await self.db.commit()
        await self.db.refresh(user)
        return user
