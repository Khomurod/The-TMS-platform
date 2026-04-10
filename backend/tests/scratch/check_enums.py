import asyncio
import asyncpg

async def check_enums():
    conn = await asyncpg.connect(
        'postgresql://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms'
    )
    
    enums = await conn.fetch(
        "SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname LIKE 'employment%' OR typname LIKE 'pay_rate%' ORDER BY typname, enumsortorder"
    )
    print("Employment type enum values:")
    for e in enums:
        print(f"  {e['typname']}: {e['enumlabel']}")
    
    # Also check if employment_type_enum exists
    exists = await conn.fetchval(
        "SELECT 1 FROM pg_type WHERE typname = 'employment_type_enum'"
    )
    print(f"\nemployment_type_enum exists: {exists}")
    
    if not exists:
        print("Need to create the enum!")
    
    await conn.close()

asyncio.run(check_enums())
