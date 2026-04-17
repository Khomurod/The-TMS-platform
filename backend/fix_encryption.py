import asyncio
from sqlalchemy import text
from app.core.database import async_session_factory

async def clear_corruption():
    async with async_session_factory() as session:
        await session.execute(text("UPDATE drivers SET bank_routing_number = NULL, bank_account_number = NULL"))
        await session.commit()
        print("Driver encryption fields cleared.")

if __name__ == "__main__":
    asyncio.run(clear_corruption())
