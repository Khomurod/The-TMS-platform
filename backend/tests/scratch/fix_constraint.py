import asyncio
import asyncpg

async def fix_constraints():
    conn = await asyncpg.connect(
        'postgresql://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms'
    )
    
    # Drop the global unique constraint on shipment_id
    try:
        await conn.execute("ALTER TABLE loads DROP CONSTRAINT IF EXISTS loads_shipment_id_key")
        print("  [DROPPED] loads_shipment_id_key (global unique)")
    except Exception as e:
        print(f"  [SKIP] {e}")
    
    # Add composite unique constraint (company_id, shipment_id)
    try:
        await conn.execute("ALTER TABLE loads ADD CONSTRAINT uq_loads_company_shipment UNIQUE (company_id, shipment_id)")
        print("  [ADDED] uq_loads_company_shipment (composite unique)")
    except Exception as e:
        print(f"  [SKIP] {e}")
    
    await conn.close()
    print("Constraint migration complete")

asyncio.run(fix_constraints())
