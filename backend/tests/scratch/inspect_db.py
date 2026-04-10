import asyncio
import asyncpg

async def check():
    conn = await asyncpg.connect(
        'postgresql://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms'
    )
    
    # Check users table columns
    cols = await conn.fetch(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
    )
    print("Users table columns:")
    for c in cols:
        print(f"  {c['column_name']:25s} {c['data_type']:20s} nullable={c['is_nullable']}")
    
    users = await conn.fetch('SELECT COUNT(*) as cnt FROM users')
    print(f"\nTotal users: {users[0]['cnt']}")
    
    companies = await conn.fetch('SELECT COUNT(*) as cnt FROM companies')
    print(f"Total companies: {companies[0]['cnt']}")
    
    # Check for enum types
    enums = await conn.fetch(
        "SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname LIKE '%status%' OR typname LIKE '%role%' ORDER BY typname, enumsortorder"
    )
    print("\nEnum types:")
    current_type = None
    for e in enums:
        if e['typname'] != current_type:
            current_type = e['typname']
            print(f"  {current_type}:")
        print(f"    - {e['enumlabel']}")
    
    await conn.close()

asyncio.run(check())
