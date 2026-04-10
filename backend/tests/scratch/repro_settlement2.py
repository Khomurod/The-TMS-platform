"""Precise settlement repro - fresh server, single user."""
import requests
from datetime import date, timedelta
import uuid

BASE = "http://127.0.0.1:8000/api/v1"
uid = str(uuid.uuid4())[:8]

# Register
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"s_{uid}@test.com",
    "password": "SettlePass123!",
    "first_name": "S", "last_name": "T",
    "company_name": f"SCo_{uid}",
})
access = r.json().get("tokens", {}).get("access_token")
AUTH = {"Authorization": f"Bearer {access}"}

# Create driver
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "D", "last_name": "T",
    "email": f"d_{uid}@test.com", "phone": "555",
    "employment_type": "company_w2",
    "pay_rate_type": "cpm", "pay_rate_value": 0.65,
    "status": "available",
})
driver_id = r.json().get("id")
print(f"Driver: {r.status_code} id={driver_id}")

# Create truck
r = requests.post(f"{BASE}/fleet/trucks", headers=AUTH, json={
    "unit_number": "T1", "year": 2022, "make": "KW",
    "model": "W900", "vin": f"V{uid}", "status": "available",
})
truck_id = r.json().get("id")

# Create load (simple, no accessorials)
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "1000.00", "total_miles": "500",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-04-15"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-04-16"},
    ]
})
print(f"Load: {r.status_code} {r.text[:200]}")
load_id = r.json().get("id")

# Advance lifecycle
for s in ["booked", "assigned"]:
    requests.patch(f"{BASE}/loads/{load_id}/status", headers=AUTH, json={"status": s})

requests.post(f"{BASE}/loads/{load_id}/dispatch", headers=AUTH, json={
    "driver_id": driver_id, "truck_id": truck_id,
})

for s in ["in_transit", "delivered", "invoiced", "paid"]:
    r = requests.patch(f"{BASE}/loads/{load_id}/status", headers=AUTH, json={"status": s})
    print(f"  {s}: {r.status_code}")

# Generate settlement
today = date.today()
r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH, json={
    "driver_id": driver_id,
    "period_start": (today - timedelta(days=1)).isoformat(),
    "period_end": (today + timedelta(days=1)).isoformat(),
})
print(f"\nSettlement: {r.status_code}")
print(f"Response: {r.text[:500]}")
