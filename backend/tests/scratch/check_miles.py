import asyncio, asyncpg

async def check():
    conn = await asyncpg.connect('postgresql://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms')
    rows = await conn.fetch("SELECT loaded_miles, status, company_id FROM trips ORDER BY created_at DESC LIMIT 5")
    for r in rows:
        print(f"  loaded_miles={r['loaded_miles']} status={r['status']} company={r['company_id']}")
    await conn.close()

asyncio.run(check())
