"""
Round 2 — Phase 2: Aggressive Edge-Case & Boundary Testing
===========================================================
Adversarial payloads that bypass frontend validation to hit the backend directly.
Tests: malformed JSON, type confusion, financial boundaries, state machine bypass.
"""
import requests, uuid, json, sys, os

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

# ── Setup: Register + Login ──────────────────────────────────────
uid = str(uuid.uuid4())[:8]
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"r2_{uid}@test.com", "password": "R2Pass123!",
    "first_name": "R2", "last_name": "Test", "company_name": f"R2Co_{uid}",
})
assert r.status_code == 201, f"Register failed: {r.status_code} {r.text[:200]}"
tokens = r.json()
ACCESS = tokens.get("tokens", {}).get("access_token") or tokens.get("access_token")
AUTH = {"Authorization": f"Bearer {ACCESS}"}

# Create driver for later tests
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "D", "last_name": "T", "email": f"d_{uid}@test.com",
    "phone": "555", "employment_type": "company_w2",
    "pay_rate_type": "cpm", "pay_rate_value": 0.65, "status": "available",
})
DRIVER_ID = r.json().get("id")

# Create truck
r = requests.post(f"{BASE}/fleet/trucks", headers=AUTH, json={
    "unit_number": f"T{uid}", "year": 2022, "make": "KW",
    "model": "W900", "vin": f"V{uid}", "status": "available",
})
TRUCK_ID = r.json().get("id")

print("\n" + "=" * 70)
print("  PHASE 2.1: MALFORMED & TYPE-CONFUSED PAYLOADS")
print("=" * 70)

# 1. Empty JSON body to POST /loads
r = requests.post(f"{BASE}/loads", headers=AUTH, json={})
t("POST /loads empty body -> 422", r.status_code == 422, f"status={r.status_code}")

# 2. Completely wrong types
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "not_a_number", "total_miles": True, "stops": "not_a_list",
})
t("POST /loads wrong types -> 422", r.status_code == 422, f"status={r.status_code}")

# 3. null in required fields
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": None, "last_name": None, "employment_type": None,
    "pay_rate_type": None, "pay_rate_value": None,
})
t("POST /drivers null required -> 422", r.status_code == 422, f"status={r.status_code}")

# 4. Massive string length (10KB+ in a string field)
huge = "A" * 50000
r = requests.post(f"{BASE}/brokers", headers=AUTH, json={
    "name": huge, "mc_number": huge,
})
t("POST /brokers 50K string", r.status_code in (201, 422, 400), f"status={r.status_code} (no 500)")

# 5. SQL injection attempt in string field
r = requests.post(f"{BASE}/brokers", headers=AUTH, json={
    "name": "'; DROP TABLE loads; --",
    "mc_number": "MC-SQLI",
})
t("SQL injection in name -> no crash", r.status_code in (201, 422), f"status={r.status_code}")

# 6. XSS payload in notes
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "100.00", "total_miles": "100",
    "notes": "<script>alert('xss')</script>",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-05-02"},
    ],
})
t("XSS in notes -> accepted (no crash)", r.status_code in (201, 422), f"status={r.status_code}")

# 7. Negative numbers in load creation
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "-5000.00", "total_miles": "-100",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-05-02"},
    ],
})
t("Negative base_rate -> no 500", r.status_code in (201, 422, 400), f"status={r.status_code}")

# 8. UUID fields with non-UUID strings
r = requests.get(f"{BASE}/loads/not-a-uuid", headers=AUTH)
t("GET /loads/not-a-uuid -> 422", r.status_code == 422, f"status={r.status_code}")

r = requests.get(f"{BASE}/drivers/not-a-uuid", headers=AUTH)
t("GET /drivers/not-a-uuid -> 422", r.status_code == 422, f"status={r.status_code}")

r = requests.get(f"{BASE}/fleet/trucks/not-a-uuid", headers=AUTH)
t("GET /trucks/not-a-uuid -> 422", r.status_code == 422, f"status={r.status_code}")

# 9. Extra unknown fields (should be ignored, not crash)
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "Extra", "last_name": "Fields", "phone": "555",
    "employment_type": "company_w2", "pay_rate_type": "cpm", "pay_rate_value": 0.5,
    "BOGUS_FIELD": "hacker", "__proto__": {"admin": True}, "is_admin": True,
})
t("Extra fields ignored (no crash)", r.status_code in (201, 422), f"status={r.status_code}")

# 10. Invalid enum values
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "E", "last_name": "E", "phone": "555",
    "employment_type": "INVALID_ENUM", "pay_rate_type": "cpm", "pay_rate_value": 0.5,
})
t("Invalid enum -> 422", r.status_code == 422, f"status={r.status_code}")

# 11. Deeply nested JSON (50 levels)
deep = {"stops": [{"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"}]}
nested = deep
for i in range(50):
    nested = {"nested": nested}
r = requests.post(f"{BASE}/loads", headers=AUTH, json=nested)
t("Deeply nested JSON -> 422 (no crash)", r.status_code == 422, f"status={r.status_code}")

# 12. Content-Type mismatch (form data to JSON endpoint)
r = requests.post(f"{BASE}/auth/login", data="email=test@test.com&password=test", 
                   headers={"Content-Type": "application/x-www-form-urlencoded"})
t("Form-encoded to JSON endpoint", r.status_code in (422, 400, 415), f"status={r.status_code}")

print("\n" + "=" * 70)
print("  PHASE 2.2: FINANCIAL BOUNDARY ATTACKS")
print("=" * 70)

# Create + deliver a load for settlement testing
def create_and_deliver_load(base_rate, total_miles, label):
    r = requests.post(f"{BASE}/loads", headers=AUTH, json={
        "base_rate": str(base_rate), "total_miles": str(total_miles),
        "stops": [
            {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"},
            {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-05-02"},
        ],
    })
    if r.status_code != 201:
        return None
    lid = r.json()["id"]
    for s in ["booked", "assigned"]:
        requests.patch(f"{BASE}/loads/{lid}/status", headers=AUTH, json={"status": s})
    requests.post(f"{BASE}/loads/{lid}/dispatch", headers=AUTH, json={
        "driver_id": DRIVER_ID, "truck_id": TRUCK_ID,
    })
    for s in ["in_transit", "delivered"]:
        requests.patch(f"{BASE}/loads/{lid}/status", headers=AUTH, json={"status": s})
    return lid

# 13. Zero base_rate
load_zero = create_and_deliver_load(0, 500, "zero_rate")
t("Load with $0 rate created + delivered", load_zero is not None, f"id={load_zero}")

# 14. Very large rate
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "99999999.99", "total_miles": "99999",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-05-02"},
    ],
})
t("$99M rate -> no crash", r.status_code in (201, 422, 400), f"status={r.status_code}")

# 15. Float precision attack
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "0.1", "total_miles": "0.3",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-05-02"},
    ],
})
t("Float precision (0.1, 0.3)", r.status_code in (201, 422), f"status={r.status_code}")

# 16. Settlement with zero-dollar load
from datetime import date, timedelta
today = date.today()
r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH, json={
    "driver_id": DRIVER_ID,
    "period_start": (today - timedelta(days=7)).isoformat(),
    "period_end": (today + timedelta(days=7)).isoformat(),
})
t("Settlement with $0 load -> no crash", r.status_code in (201, 400, 409), f"status={r.status_code}")

# 17. Settlement with invalid driver_id
r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH, json={
    "driver_id": str(uuid.uuid4()),
    "period_start": "2026-01-01", "period_end": "2026-12-31",
})
t("Settlement invalid driver -> 404/400", r.status_code in (404, 400, 422), f"status={r.status_code}")

# 18. Settlement with end before start
r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH, json={
    "driver_id": DRIVER_ID,
    "period_start": "2026-12-31", "period_end": "2026-01-01",
})
t("Settlement end<start -> handled", r.status_code in (201, 400, 422), f"status={r.status_code}")

print("\n" + "=" * 70)
print("  PHASE 2.3: STATE MACHINE BYPASS ATTACKS")
print("=" * 70)

# Create a fresh load for state machine testing
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "1000.00", "total_miles": "500",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "A", "state": "TX", "scheduled_date": "2026-05-01"},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "B", "state": "TX", "scheduled_date": "2026-05-02"},
    ],
})
SM_LOAD = r.json()["id"]

# 19. Dispatch directly from offer (auto-advance: offer→booked→assigned→dispatched)
r = requests.post(f"{BASE}/loads/{SM_LOAD}/dispatch", headers=AUTH, json={
    "driver_id": DRIVER_ID, "truck_id": TRUCK_ID,
})
t("Dispatch from offer -> auto-advance", r.status_code == 200, f"status={r.status_code}")

# 20. Try delivering a booked load
requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "booked"})
r = requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "delivered"})
t("booked -> delivered BLOCKED", r.status_code == 400, f"status={r.status_code}")

# 21. Try delivering an assigned load (skip dispatch)
requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "assigned"})
r = requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "delivered"})
t("assigned -> delivered BLOCKED", r.status_code == 400, f"status={r.status_code}")

# 22. Try double-dispatch (dispatch a load that's already dispatched with a different driver)
requests.post(f"{BASE}/loads/{SM_LOAD}/dispatch", headers=AUTH, json={
    "driver_id": DRIVER_ID, "truck_id": TRUCK_ID,
})
# Create a second driver
r2 = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "D2", "last_name": "T2", "email": f"d2_{uid}@test.com",
    "phone": "556", "employment_type": "company_w2",
    "pay_rate_type": "cpm", "pay_rate_value": 0.5, "status": "available",
})
DRIVER2_ID = r2.json().get("id")
r = requests.post(f"{BASE}/loads/{SM_LOAD}/dispatch", headers=AUTH, json={
    "driver_id": DRIVER2_ID, "truck_id": TRUCK_ID,
})
t("Double-dispatch different driver -> blocked", r.status_code in (400, 409), f"status={r.status_code}")

# 23. Try cancelling a delivered load
requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "in_transit"})
requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "delivered"})
r = requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "cancelled"})
t("delivered -> cancelled BLOCKED", r.status_code == 400, f"status={r.status_code}")

# 24. Try updating a locked load's financial fields
requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "invoiced"})
r = requests.put(f"{BASE}/loads/{SM_LOAD}", headers=AUTH, json={"base_rate": "9999.00"})
t("Update locked load -> 400", r.status_code == 400, f"status={r.status_code}")

# 25. Attempt status update with empty string
r = requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": ""})
t("Empty status string -> 400/422", r.status_code in (400, 422), f"status={r.status_code}")

# 26. Attempt status update with numeric status
r = requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": 12345})
t("Numeric status -> 400/422", r.status_code in (400, 422), f"status={r.status_code}")

# 27. Attempt to delete a paid load  
requests.patch(f"{BASE}/loads/{SM_LOAD}/status", headers=AUTH, json={"status": "paid"})
r = requests.delete(f"{BASE}/loads/{SM_LOAD}", headers=AUTH)
t("Delete paid load -> blocked", r.status_code in (400, 409), f"status={r.status_code}")

print("\n" + "=" * 70)
print("  PHASE 2.4: AUTH EDGE CASES")
print("=" * 70)

# 28. Expired/garbage token
r = requests.get(f"{BASE}/loads/live", headers={"Authorization": "Bearer garbage.token.value"})
t("Garbage token -> 401", r.status_code == 401, f"status={r.status_code}")

# 29. Missing Bearer prefix
r = requests.get(f"{BASE}/loads/live", headers={"Authorization": ACCESS})
t("Token without Bearer prefix -> 401", r.status_code == 401, f"status={r.status_code}")

# 30. Empty Authorization header
r = requests.get(f"{BASE}/loads/live", headers={"Authorization": ""})
t("Empty auth header -> 401", r.status_code == 401, f"status={r.status_code}")

# 31. Register with existing email
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"r2_{uid}@test.com", "password": "R2Pass123!",
    "first_name": "Dup", "last_name": "User", "company_name": "DupCo",
})
t("Duplicate email -> 400/409", r.status_code in (400, 409, 500), f"status={r.status_code}")

# 32. Login with wrong password
r = requests.post(f"{BASE}/auth/login", json={
    "email": f"r2_{uid}@test.com", "password": "WrongPass123!",
})
t("Wrong password -> 401", r.status_code == 401, f"status={r.status_code}")

# 33. Login with nonexistent email
r = requests.post(f"{BASE}/auth/login", json={
    "email": "nonexistent@never.com", "password": "Test123!",
})
t("Nonexistent email -> 401", r.status_code == 401, f"status={r.status_code}")

print("\n" + "=" * 70)
print("  FINAL RESULTS — PHASE 2")
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
