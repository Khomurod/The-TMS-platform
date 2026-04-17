
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_conn(url):
    print(f"Testing {url}...")
    try:
        engine = create_async_engine(url)
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print(f"SUCCESS: {url}")
        return True
    except Exception as e:
        print(f"FAILED: {url} - {str(e)[:200]}")
        return False

async def main():
    urls = [
        "postgresql+asyncpg://kinetic:kinetic_dev_2024@localhost:5432/kinetic_tms",
        "postgresql+asyncpg://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms",
    ]
    for url in urls:
        await test_conn(url)

if __name__ == "__main__":
    asyncio.run(main())
