"""Reproduce dispatch from offer -> expected 200 but got 500"""
import requests, uuid

BASE = "http://127.0.0.1:8000/api/v1"
uid = str(uuid.uuid4())[:8]

r = requests.post(f"{BASE}/auth/register", json={
    "email": f"disp_{uid}@test.com", "password": "TestPass123!",
    "first_name": "D", "last_name": "T", "company_name": f"Co_{uid}",
})
tok = r.json().get("tokens", {}).get("access_token")
AUTH = {"Authorization": f"Bearer {tok}"}

r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "Dr", "last_name": "T", "phone": "555",
    "employment_type": "company_w2", "pay_rate_type": "cpm",
    "pay_rate_value": 0.5, "status": "available",
})
did = r.json()["id"]

r = requests.post(f"{BASE}/fleet/trucks", headers=AUTH, json={
    "unit_number": "TT1", "year": 2022, "make": "KW",
    "model": "W900", "vin": f"V{uid}", "status": "available",
})
tid = r.json()["id"]

# Create load (stays in offer)
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "1000", "total_miles": "500",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-05-02"},
    ],
})
lid = r.json()["id"]
print(f"Load status: {r.json()['status']}")

# Dispatch directly from offer state
r = requests.post(f"{BASE}/loads/{lid}/dispatch", headers=AUTH, json={
    "driver_id": did, "truck_id": tid,
})
print(f"Dispatch from offer: {r.status_code}")
print(f"Body: {r.text[:500]}")
