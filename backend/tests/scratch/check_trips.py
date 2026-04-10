import asyncio
import asyncpg

async def check_trips():
    conn = await asyncpg.connect(
        'postgresql://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms'
    )
    
    trips = await conn.fetch("SELECT t.id, t.load_id, t.driver_id, t.status, t.company_id, l.status as load_status, l.delivered_at, l.created_at FROM trips t JOIN loads l ON t.load_id = l.id ORDER BY t.created_at DESC LIMIT 5")
    print("Recent trips:")
    for t in trips:
        print(f"  trip={t['id']} load_status={t['load_status']} trip_status={t['status']} delivered_at={t['delivered_at']} company={t['company_id']}")
    
    if not trips:
        print("  No trips found!")
    
    await conn.close()

asyncio.run(check_trips())
