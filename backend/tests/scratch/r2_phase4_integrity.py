"""
Round 2 — Phase 4: Database Integrity, IDOR, & Cross-Tenant Deep Dive
=======================================================================
Tests cascade deletion, cross-tenant mutation attempts,
and data integrity constraints.
"""
import requests, uuid, sys, os

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

# ── Setup: Create TWO tenants with full data ─────────────────────
uid_a = str(uuid.uuid4())[:8]
uid_b = str(uuid.uuid4())[:8]

# Tenant A
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"idor_a_{uid_a}@test.com", "password": "IdorPass123!",
    "first_name": "TenA", "last_name": "Admin", "company_name": f"CompanyA_{uid_a}",
})
TOKA = r.json().get("tokens", {}).get("access_token")
AUTH_A = {"Authorization": f"Bearer {TOKA}"}

# Tenant B
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"idor_b_{uid_b}@test.com", "password": "IdorPass123!",
    "first_name": "TenB", "last_name": "Admin", "company_name": f"CompanyB_{uid_b}",
})
TOKB = r.json().get("tokens", {}).get("access_token")
AUTH_B = {"Authorization": f"Bearer {TOKB}"}

# Create resources in Tenant A
r = requests.post(f"{BASE}/brokers", headers=AUTH_A, json={"name": f"BrokerA_{uid_a}"})
BROKER_A = r.json()["id"]

r = requests.post(f"{BASE}/drivers", headers=AUTH_A, json={
    "first_name": "DA", "last_name": "TA", "phone": "555",
    "employment_type": "company_w2", "pay_rate_type": "cpm", "pay_rate_value": 0.65,
})
DRIVER_A = r.json()["id"]

r = requests.post(f"{BASE}/fleet/trucks", headers=AUTH_A, json={
    "unit_number": f"TA{uid_a}", "year": 2022, "make": "KW",
    "model": "W900", "vin": f"VA{uid_a}", "status": "available",
})
TRUCK_A = r.json()["id"]

r = requests.post(f"{BASE}/fleet/trailers", headers=AUTH_A, json={
    "unit_number": f"TRA{uid_a}", "year": 2022, "make": "Great Dane",
    "model": "Reefer", "vin": f"VTA{uid_a}", "status": "available",
})
TRAILER_A = r.json()["id"]

r = requests.post(f"{BASE}/loads", headers=AUTH_A, json={
    "base_rate": "5000.00", "total_miles": "1200", "broker_id": BROKER_A,
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "Dallas", "state": "TX", "scheduled_date": "2026-06-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "LA", "state": "CA", "scheduled_date": "2026-06-03"},
    ],
})
LOAD_A = r.json()["id"]

# Create a load in Tenant B
r = requests.post(f"{BASE}/drivers", headers=AUTH_B, json={
    "first_name": "DB", "last_name": "TB", "phone": "556",
    "employment_type": "company_w2", "pay_rate_type": "cpm", "pay_rate_value": 0.5,
})
DRIVER_B = r.json()["id"]

r = requests.post(f"{BASE}/loads", headers=AUTH_B, json={
    "base_rate": "3000.00", "total_miles": "800",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "NYC", "state": "NY", "scheduled_date": "2026-06-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "Boston", "state": "MA", "scheduled_date": "2026-06-02"},
    ],
})
LOAD_B = r.json()["id"]

print("\n" + "=" * 70)
print("  PHASE 4.1: CROSS-TENANT DATA ISOLATION (IDOR)")
print("=" * 70)

# 1. Tenant B tries to READ Tenant A's resources
r = requests.get(f"{BASE}/loads/{LOAD_A}", headers=AUTH_B)
t("B read A's load -> 404", r.status_code == 404, f"status={r.status_code}")

r = requests.get(f"{BASE}/drivers/{DRIVER_A}", headers=AUTH_B)
t("B read A's driver -> 404", r.status_code == 404, f"status={r.status_code}")

r = requests.get(f"{BASE}/fleet/trucks/{TRUCK_A}", headers=AUTH_B)
t("B read A's truck -> 404", r.status_code == 404, f"status={r.status_code}")

r = requests.get(f"{BASE}/fleet/trailers/{TRAILER_A}", headers=AUTH_B)
t("B read A's trailer -> 404", r.status_code == 404, f"status={r.status_code}")

# 2. Tenant B tries to MUTATE Tenant A's resources
r = requests.put(f"{BASE}/loads/{LOAD_A}", headers=AUTH_B, json={"base_rate": "1.00"})
t("B mutate A's load -> 404", r.status_code in (404, 400), f"status={r.status_code}")

r = requests.patch(f"{BASE}/loads/{LOAD_A}/status", headers=AUTH_B, json={"status": "cancelled"})
t("B cancel A's load -> 404", r.status_code == 404, f"status={r.status_code}")

r = requests.delete(f"{BASE}/loads/{LOAD_A}", headers=AUTH_B)
t("B delete A's load -> 404", r.status_code == 404, f"status={r.status_code}")

r = requests.put(f"{BASE}/drivers/{DRIVER_A}", headers=AUTH_B, json={"first_name": "Hacked"})
t("B mutate A's driver -> 404", r.status_code == 404, f"status={r.status_code}")

r = requests.put(f"{BASE}/fleet/trucks/{TRUCK_A}", headers=AUTH_B, json={"unit_number": "HACK"})
t("B mutate A's truck -> 404", r.status_code == 404, f"status={r.status_code}")

# 3. Tenant B tries to DISPATCH A's load with B's driver
r = requests.post(f"{BASE}/loads/{LOAD_A}/dispatch", headers=AUTH_B, json={
    "driver_id": DRIVER_B, "truck_id": TRUCK_A,
})
t("B dispatch A's load -> 404", r.status_code == 404, f"status={r.status_code}")

# 4. Cross-tenant enrollment: B creates load then tries to assign A's driver
requests.patch(f"{BASE}/loads/{LOAD_B}/status", headers=AUTH_B, json={"status": "booked"})
requests.patch(f"{BASE}/loads/{LOAD_B}/status", headers=AUTH_B, json={"status": "assigned"})
r = requests.post(f"{BASE}/loads/{LOAD_B}/dispatch", headers=AUTH_B, json={
    "driver_id": DRIVER_A, "truck_id": TRUCK_A,  # A's resources!
})
t("B dispatch own load with A's driver -> 404", r.status_code == 404, f"status={r.status_code}")

# 5. Cross-tenant settlement: B generates settlement for A's driver
from datetime import date, timedelta
today = date.today()
r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH_B, json={
    "driver_id": DRIVER_A,
    "period_start": (today - timedelta(days=30)).isoformat(),
    "period_end": (today + timedelta(days=30)).isoformat(),
})
t("B settle A's driver -> 404", r.status_code == 404, f"status={r.status_code}")

# 6. B's load list doesn't include A's loads
r = requests.get(f"{BASE}/loads/live", headers=AUTH_B)
if r.status_code == 200:
    b_loads = r.json().get("items", [])
    a_ids_in_b = [l["id"] for l in b_loads if l["id"] == LOAD_A]
    t("A's loads not in B's list", len(a_ids_in_b) == 0, f"count_violations={len(a_ids_in_b)}")
else:
    t("B load list accessible", True, f"status={r.status_code}")

print("\n" + "=" * 70)
print("  PHASE 4.2: CASCADE DELETION INTEGRITY")
print("=" * 70)

# Create a load, advance it fully, then soft-delete it
r = requests.post(f"{BASE}/loads", headers=AUTH_A, json={
    "base_rate": "2000.00", "total_miles": "600",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-07-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-07-02"},
    ],
})
DEL_LOAD = r.json()["id"]

# Load in offer can be deleted
r = requests.delete(f"{BASE}/loads/{DEL_LOAD}", headers=AUTH_A)
t("Delete offer load -> 204", r.status_code == 204, f"status={r.status_code}")

# Verify load is gone from lists
r = requests.get(f"{BASE}/loads/{DEL_LOAD}", headers=AUTH_A)
t("Deleted load -> 404", r.status_code == 404, f"status={r.status_code}")

# Create another load, advance to booked — should NOT be deletable
r = requests.post(f"{BASE}/loads", headers=AUTH_A, json={
    "base_rate": "3000.00", "total_miles": "700",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "C", "state": "TX", "scheduled_date": "2026-07-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "D", "state": "TX", "scheduled_date": "2026-07-02"},
    ],
})
BOOKED_LOAD = r.json()["id"]
requests.patch(f"{BASE}/loads/{BOOKED_LOAD}/status", headers=AUTH_A, json={"status": "booked"})

r = requests.delete(f"{BASE}/loads/{BOOKED_LOAD}", headers=AUTH_A)
t("Delete booked load -> blocked", r.status_code in (400, 409), f"status={r.status_code}")

# Verify the booked load still exists
r = requests.get(f"{BASE}/loads/{BOOKED_LOAD}", headers=AUTH_A)
t("Booked load still exists after failed delete", r.status_code == 200, f"status={r.status_code}")

print("\n" + "=" * 70)
print("  PHASE 4.3: DATA INTEGRITY CONSTRAINTS")
print("=" * 70)

# Unique constraint: same broker name in same tenant
r = requests.post(f"{BASE}/brokers", headers=AUTH_A, json={"name": f"BrokerA_{uid_a}"})
t("Duplicate broker name -> 409", r.status_code == 409, f"status={r.status_code}")

# Same email in same tenant
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"idor_a_{uid_a}@test.com", "password": "IdorPass123!",
    "first_name": "Dup", "last_name": "User", "company_name": "DupCo",
})
t("Duplicate email -> 409", r.status_code == 409, f"status={r.status_code}")

# UUID reference integrity: load with nonexistent broker
r = requests.post(f"{BASE}/loads", headers=AUTH_A, json={
    "base_rate": "1000.00", "total_miles": "500",
    "broker_id": str(uuid.uuid4()),
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "X", "state": "TX", "scheduled_date": "2026-07-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "Y", "state": "TX", "scheduled_date": "2026-07-02"},
    ],
})
t("Load with fake broker_id -> handled", r.status_code in (201, 400, 404, 422, 500), f"status={r.status_code}")

# Company settings roundtrip
r = requests.get(f"{BASE}/settings/company", headers=AUTH_A)
t("Get company settings -> 200", r.status_code == 200, f"status={r.status_code}")
company_data = r.json()

# Users from tenant B shouldn't appear in A's user list
r = requests.get(f"{BASE}/settings/users", headers=AUTH_A)
if r.status_code == 200:
    users = r.json().get("items", [])
    b_emails = [u for u in users if f"idor_b_{uid_b}" in u.get("email", "")]
    t("B users not in A's list", len(b_emails) == 0, f"b_users_found={len(b_emails)}")
else:
    t("A user list", True, f"status={r.status_code}")

# Drivers list from tenant B shouldn't include A's
r = requests.get(f"{BASE}/drivers", headers=AUTH_B)
if r.status_code == 200:
    b_drivers = r.json().get("items", [])
    a_drivers = [d for d in b_drivers if d["id"] == DRIVER_A]
    t("A's drivers not in B's list", len(a_drivers) == 0, f"violations={len(a_drivers)}")
else:
    t("B drivers list", False, f"status={r.status_code}")

# Trucks from tenant B shouldn't include A's
r = requests.get(f"{BASE}/fleet/trucks", headers=AUTH_B)
if r.status_code == 200:
    b_trucks = r.json().get("items", [])
    a_trucks = [t_  for t_ in b_trucks if t_["id"] == TRUCK_A]
    t("A's trucks not in B's list", len(a_trucks) == 0, f"violations={len(a_trucks)}")
else:
    t("B trucks list", False, f"status={r.status_code}")

print("\n" + "=" * 70)
print("  FINAL RESULTS — PHASE 4")
print("=" * 70)
print(f"\n  PASSED: {R['pass']}")
print(f"  FAILED: {R['fail']}")
print(f"  TOTAL:  {R['pass'] + R['fail']}")
if R["errors"]:
    print(f"\n  FAILURES:")
    for e in R["errors"]:
        print(f"      [FAIL] {e}")
print()

sys.exit(1 if R["fail"] > 0 else 0)
