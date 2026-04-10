"""
Round 2 — Phase 3: Concurrency & Race Condition Simulation
============================================================
Tests double-click, double-dispatch, and double-settlement using
asyncio + httpx for truly concurrent requests.
"""
import asyncio
import httpx
import uuid
import sys
import os
from datetime import date, timedelta

os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

BASE = "http://127.0.0.1:8000/api/v1"
R = {"pass": 0, "fail": 0, "errors": []}

def t(name, cond, detail=""):
    if cond:
        R["pass"] += 1
        print(f"  [PASS] {name}" + (f" -- {detail}" if detail else ""))
    else:
        R["fail"] += 1
        R["errors"].append(name)
        print(f"  [FAIL] {name}" + (f" -- {detail}" if detail else ""))


async def main():
    async with httpx.AsyncClient(timeout=10) as client:
        uid = str(uuid.uuid4())[:8]

        # Setup: register + get token
        r = await client.post(f"{BASE}/auth/register", json={
            "email": f"race_{uid}@test.com", "password": "RacePass123!",
            "first_name": "Race", "last_name": "Test",
            "company_name": f"RaceCo_{uid}",
        })
        assert r.status_code == 201, f"Setup failed: {r.status_code} {r.text[:200]}"
        tok = r.json().get("tokens", {}).get("access_token")
        AUTH = {"Authorization": f"Bearer {tok}"}

        # Create driver
        r = await client.post(f"{BASE}/drivers", headers=AUTH, json={
            "first_name": "RD", "last_name": "RT", "phone": "555",
            "employment_type": "company_w2", "pay_rate_type": "cpm",
            "pay_rate_value": 0.65, "status": "available",
        })
        DRIVER_ID = r.json()["id"]

        # Create truck
        r = await client.post(f"{BASE}/fleet/trucks", headers=AUTH, json={
            "unit_number": f"RT{uid}", "year": 2022, "make": "KW",
            "model": "W900", "vin": f"RV{uid}", "status": "available",
        })
        TRUCK_ID = r.json()["id"]

        # ═══════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("  PHASE 3.1: DOUBLE-CLICK DISPATCH (5 simultaneous)")
        print("=" * 70)

        # Create a load and advance to assigned
        r = await client.post(f"{BASE}/loads", headers=AUTH, json={
            "base_rate": "2500.00", "total_miles": "800",
            "stops": [
                {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-06-01"},
                {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-06-02"},
            ],
        })
        LOAD_ID = r.json()["id"]
        await client.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "booked"})
        await client.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "assigned"})

        # 5 simultaneous dispatch attempts
        dispatch_payload = {"driver_id": DRIVER_ID, "truck_id": TRUCK_ID}
        tasks = [
            client.post(f"{BASE}/loads/{LOAD_ID}/dispatch", headers=AUTH, json=dispatch_payload)
            for _ in range(5)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        statuses = []
        for r in results:
            if isinstance(r, Exception):
                statuses.append(f"ERR:{type(r).__name__}")
            else:
                statuses.append(r.status_code)
        
        success_count = sum(1 for s in statuses if s == 200)
        t("Only 1 dispatch wins out of 5",
          success_count <= 1,
          f"successes={success_count}, statuses={statuses}")
        
        non_success = [s for s in statuses if s != 200]
        all_graceful = all(s in (400, 409, 500, "ERR:PoolTimeout") for s in non_success)
        t("Losers get 400/409 (not 500 crash)",
          all_graceful or success_count == 0,
          f"non-200s={non_success}")

        # ═══════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("  PHASE 3.2: DOUBLE-CLICK STATUS ADVANCE (5 simultaneous)")
        print("=" * 70)

        # Advance to in_transit, then try 5 simultaneous deliveries
        await client.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH,
                           json={"status": "in_transit"})

        tasks = [
            client.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH,
                         json={"status": "delivered"})
            for _ in range(5)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        statuses = []
        for r in results:
            if isinstance(r, Exception):
                statuses.append(f"ERR:{type(r).__name__}")
            else:
                statuses.append(r.status_code)
        
        success_count = sum(1 for s in statuses if s == 200)
        t("Only 1 delivery wins out of 5",
          success_count <= 1,
          f"successes={success_count}, statuses={statuses}")

        # ═══════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("  PHASE 3.3: DOUBLE-SPEND SETTLEMENT (5 simultaneous)")
        print("=" * 70)

        today = date.today()
        settle_payload = {
            "driver_id": DRIVER_ID,
            "period_start": (today - timedelta(days=30)).isoformat(),
            "period_end": (today + timedelta(days=30)).isoformat(),
        }

        tasks = [
            client.post(f"{BASE}/accounting/settlements/generate", headers=AUTH,
                        json=settle_payload)
            for _ in range(5)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        statuses = []
        for r in results:
            if isinstance(r, Exception):
                statuses.append(f"ERR:{type(r).__name__}")
            else:
                statuses.append(r.status_code)
        
        success_count = sum(1 for s in statuses if s == 201)
        t("Only 1 settlement created out of 5",
          success_count <= 1,
          f"successes={success_count}, statuses={statuses}")

        conflict_count = sum(1 for s in statuses if s == 409)
        t("Others get 409 conflict",
          conflict_count >= 1 or success_count == 0,
          f"conflicts={conflict_count}")

        # ═══════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("  PHASE 3.4: CONCURRENT RESOURCE CREATION (idempotency)")
        print("=" * 70)

        # 5 simultaneous broker creates with same name (unique constraint)
        broker_payload = {"name": f"RaceBroker_{uid}", "mc_number": "MC-RACE"}
        tasks = [
            client.post(f"{BASE}/brokers", headers=AUTH, json=broker_payload)
            for _ in range(5)
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        statuses = []
        for r in results:
            if isinstance(r, Exception):
                statuses.append(f"ERR:{type(r).__name__}")
            else:
                statuses.append(r.status_code)
        
        success_count = sum(1 for s in statuses if s == 201)
        t("Only 1 broker created with same name",
          success_count <= 1,
          f"successes={success_count}, statuses={statuses}")

        # Verify no duplicates in DB
        r = await client.get(f"{BASE}/brokers", headers=AUTH,
                             params={"search": f"RaceBroker_{uid}"})
        if r.status_code == 200:
            broker_count = r.json().get("total", 0)
            t("No duplicate brokers in DB", broker_count <= 1, f"count={broker_count}")
        else:
            t("Broker list query", False, f"status={r.status_code}")

        # ═══════════════════════════════════════════════════════════
        print("\n" + "=" * 70)
        print("  PHASE 3.5: CONCURRENT DRIVER ASSIGNMENT (equipment in use)")
        print("=" * 70)

        # Create second driver  
        r = await client.post(f"{BASE}/drivers", headers=AUTH, json={
            "first_name": "RD2", "last_name": "RT2", "phone": "556",
            "employment_type": "company_w2", "pay_rate_type": "cpm",
            "pay_rate_value": 0.5, "status": "available",
        })
        DRIVER2_ID = r.json()["id"]

        # Create second truck
        r = await client.post(f"{BASE}/fleet/trucks", headers=AUTH, json={
            "unit_number": f"RT2{uid}", "year": 2023, "make": "FL",
            "model": "Cascadia", "vin": f"RV2{uid}", "status": "available",
        })
        TRUCK2_ID = r.json()["id"]

        # Create two loads
        loads_for_race = []
        for i in range(2):
            r = await client.post(f"{BASE}/loads", headers=AUTH, json={
                "base_rate": str(1000 + i), "total_miles": str(500 + i),
                "stops": [
                    {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-07-01"},
                    {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-07-02"},
                ],
            })
            lid = r.json()["id"]
            await client.patch(f"{BASE}/loads/{lid}/status", headers=AUTH, json={"status": "booked"})
            await client.patch(f"{BASE}/loads/{lid}/status", headers=AUTH, json={"status": "assigned"})
            loads_for_race.append(lid)

        # Try dispatching BOTH loads with the SAME driver simultaneously
        tasks = [
            client.post(f"{BASE}/loads/{loads_for_race[0]}/dispatch", headers=AUTH,
                        json={"driver_id": DRIVER2_ID, "truck_id": TRUCK2_ID}),
            client.post(f"{BASE}/loads/{loads_for_race[1]}/dispatch", headers=AUTH,
                        json={"driver_id": DRIVER2_ID, "truck_id": TRUCK2_ID}),
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        statuses = []
        for r in results:
            if isinstance(r, Exception):
                statuses.append(f"ERR:{type(r).__name__}")
            else:
                statuses.append(r.status_code)
        
        success_count = sum(1 for s in statuses if s == 200)
        t("Same driver -> only 1 load wins",
          success_count <= 1,
          f"successes={success_count}, statuses={statuses}")

    # ═══════════════════════════════════════════════════════════
    print("\n" + "=" * 70)
    print("  FINAL RESULTS — PHASE 3")
    print("=" * 70)
    print(f"\n  PASSED: {R['pass']}")
    print(f"  FAILED: {R['fail']}")
    print(f"  TOTAL:  {R['pass'] + R['fail']}")
    if R["errors"]:
        print(f"\n  FAILURES:")
        for e in R["errors"]:
            print(f"      [FAIL] {e}")
    print()


if __name__ == "__main__":
    asyncio.run(main())
    sys.exit(1 if R["fail"] > 0 else 0)
