import asyncio
import asyncpg

async def check():
    try:
        conn = await asyncpg.connect(
            'postgresql://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms'
        )
        v = await conn.fetchval('SELECT version()')
        tables = await conn.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
        )
        print(f"DB OK: {v[:60]}")
        print(f"Tables ({len(tables)}):", [t['tablename'] for t in tables])
        await conn.close()
    except Exception as e:
        print(f"DB ERROR: {e}")

asyncio.run(check())
