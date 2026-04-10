"""Reproduce settlement generation error in isolation."""
import requests
from datetime import date, timedelta

BASE = "http://127.0.0.1:8000/api/v1"

# Login with the most recent test-created user
# First register fresh 
import uuid
uid = str(uuid.uuid4())[:8]
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"settle_{uid}@test.com",
    "password": "SettlePass123!",
    "first_name": "Settle",
    "last_name": "Test",
    "company_name": f"SettleCo_{uid}",
})
data = r.json()
access = data.get("tokens", {}).get("access_token")
AUTH = {"Authorization": f"Bearer {access}"}
company_id = data.get("user", {}).get("company_id")
print(f"Company: {company_id}")

# Create a driver
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "Settle",
    "last_name": "Driver",
    "email": f"driver_{uid}@test.com",
    "phone": "555-000",
    "employment_type": "company_w2",
    "pay_rate_type": "cpm",
    "pay_rate_value": 0.65,
    "status": "available",
})
print(f"Driver: {r.status_code}")
driver_id = r.json().get("id")

# Create truck
r = requests.post(f"{BASE}/fleet/trucks", headers=AUTH, json={
    "unit_number": "T-001",
    "year": 2022,
    "make": "Kenworth",
    "model": "W900",
    "vin": f"VIN{uid}",
    "status": "available",
})
truck_id = r.json().get("id")

# Create load with stops
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "1000.00",
    "total_miles": "500",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "Dallas", "state": "TX", "scheduled_date": "2026-04-15"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "Houston", "state": "TX", "scheduled_date": "2026-04-16"},
    ]
})
print(f"Load: {r.status_code}")
load_id = r.json().get("id")

# Advance to paid
for target in ["booked", "assigned"]:
    r = requests.patch(f"{BASE}/loads/{load_id}/status", headers=AUTH, json={"status": target})
    print(f"  {target}: {r.status_code}")

# Dispatch
r = requests.post(f"{BASE}/loads/{load_id}/dispatch", headers=AUTH, json={
    "driver_id": driver_id,
    "truck_id": truck_id,
})
print(f"  dispatch: {r.status_code}")

for target in ["in_transit", "delivered", "invoiced", "paid"]:
    r = requests.patch(f"{BASE}/loads/{load_id}/status", headers=AUTH, json={"status": target})
    print(f"  {target}: {r.status_code}")

# Now generate settlement
today = date.today()
r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH, json={
    "driver_id": driver_id,
    "period_start": (today - timedelta(days=1)).isoformat(),
    "period_end": (today + timedelta(days=1)).isoformat(),
})
print(f"\nSettlement: {r.status_code}")
print(f"Response: {r.text[:500]}")
