import asyncio
import asyncpg

async def migrate():
    conn = await asyncpg.connect(
        'postgresql://Safehaul:Safehaul_dev_2024@localhost:5432/Safehaul_tms'
    )
    
    # Check which columns are missing and add them
    migrations = [
        ("loads", "delivered_at", "ALTER TABLE loads ADD COLUMN delivered_at TIMESTAMPTZ NULL"),
    ]
    
    for table, column, sql in migrations:
        exists = await conn.fetchval(
            "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
            table, column
        )
        if exists:
            print(f"  [OK] {table}.{column} already exists")
        else:
            await conn.execute(sql)
            print(f"  [ADDED] {table}.{column}")
    
    # Create index if missing
    idx_exists = await conn.fetchval(
        "SELECT 1 FROM pg_indexes WHERE indexname = 'ix_loads_delivered_at'"
    )
    if not idx_exists:
        await conn.execute("CREATE INDEX ix_loads_delivered_at ON loads (delivered_at)")
        print("  [ADDED] ix_loads_delivered_at index")
    
    await conn.close()
    print("Migration complete")

asyncio.run(migrate())
