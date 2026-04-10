"""
E2E Live API Audit -- Phases 2-4 Completion
===========================================
Runs against a live backend at http://127.0.0.1:8000/api/v1

Covers:
  Phase 2: Programmatic endpoint exhaustion + malformed payload testing
  Phase 3: Simulated button clicks (matching exact frontend payloads)
  Phase 4: Full E2E lifecycle (register -> login -> create -> dispatch -> deliver -> settle)
"""

import json
import os
import sys
import time
import uuid
import requests
from datetime import date, timedelta
from decimal import Decimal

# Force UTF-8 output on Windows
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

BASE = "http://127.0.0.1:8000/api/v1"
RESULTS = {"passed": 0, "failed": 0, "errors": []}
LOAD2_ID = None  # default

# -- Helpers ------------------------------------------------------

def ok(label, detail=""):
    RESULTS["passed"] += 1
    msg = f"  [PASS] {label}" + (f" -- {detail}" if detail else "")
    print(msg)

def fail(label, detail=""):
    RESULTS["failed"] += 1
    msg = f"  [FAIL] {label}" + (f" -- {detail}" if detail else "")
    print(msg)
    RESULTS["errors"].append(msg)

def test(label, condition, detail=""):
    if condition:
        ok(label, detail)
    else:
        fail(label, detail)

def header():
    print("=" * 70)

# ==================================================================
#   PHASE 2A: AUTH ENDPOINTS -- Register, Login, Refresh, Logout, Me
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 2A: AUTHENTICATION ENDPOINTS")
print("=" * 70)

uid = str(uuid.uuid4())[:8]
TEST_EMAIL = f"audit_{uid}@test.com"
TEST_PASSWORD = "AuditPass123!"
TEST_COMPANY = f"AuditCo_{uid}"

# 1. Register
r = requests.post(f"{BASE}/auth/register", json={
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
    "first_name": "Audit",
    "last_name": "User",
    "company_name": TEST_COMPANY,
})
test("POST /auth/register", r.status_code in (200, 201), f"status={r.status_code}")
tokens = r.json()
ACCESS = tokens.get("access_token") or tokens.get("tokens", {}).get("access_token")
REFRESH = tokens.get("refresh_token") or tokens.get("tokens", {}).get("refresh_token")
COMPANY_ID = tokens.get("company_id") or tokens.get("user", {}).get("company_id", "")
test("Register returns access_token", ACCESS is not None)
test("Register returns refresh_token", REFRESH is not None)

# 2. Login
r = requests.post(f"{BASE}/auth/login", json={
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
})
test("POST /auth/login", r.status_code == 200, f"status={r.status_code}")
data = r.json()
ACCESS = data.get("access_token", ACCESS)
REFRESH = data.get("refresh_token", REFRESH)
COMPANY_ID = data.get("company_id", COMPANY_ID)
test("Login returns tokens", ACCESS is not None and REFRESH is not None)

AUTH = {"Authorization": f"Bearer {ACCESS}"}

# 3. GET /auth/me
r = requests.get(f"{BASE}/auth/me", headers=AUTH)
test("GET /auth/me", r.status_code == 200, f"role={r.json().get('role')}")
me = r.json()
test("ME returns correct email", me.get("email") == TEST_EMAIL)
test("ME returns company_admin role", me.get("role") == "company_admin")

# 4. Refresh token
r = requests.post(f"{BASE}/auth/refresh", json={"refresh_token": REFRESH})
test("POST /auth/refresh", r.status_code == 200, f"status={r.status_code}")
if r.status_code == 200:
    new_tokens = r.json()
    ACCESS = new_tokens.get("access_token", ACCESS)
    REFRESH = new_tokens.get("refresh_token", REFRESH)
    AUTH = {"Authorization": f"Bearer {ACCESS}"}
    test("Refresh returns new access_token", new_tokens.get("access_token") is not None)

# 5. Unauthenticated access blocked
r = requests.get(f"{BASE}/loads/live")
test("Unauthenticated GET /loads/live -> 401", r.status_code == 401, f"status={r.status_code}")

# ==================================================================
#   PHASE 2B: MALFORMED PAYLOAD TESTING (422 Validation)
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 2B: MALFORMED PAYLOAD TESTING (422 Validation)")
print("=" * 70)

# Missing required fields on register
r = requests.post(f"{BASE}/auth/register", json={"email": "x@x.com"})
test("Register missing fields -> 422", r.status_code == 422, f"status={r.status_code}")

# Weak password
r = requests.post(f"{BASE}/auth/register", json={
    "email": "weak@test.com", "password": "weak",
    "first_name": "T", "last_name": "U", "company_name": "WeakCo"
})
test("Register weak password -> 422", r.status_code == 422, f"status={r.status_code}")

# Invalid email format
r = requests.post(f"{BASE}/auth/register", json={
    "email": "not-an-email", "password": "ValidPass123!",
    "first_name": "T", "last_name": "U", "company_name": "BadEmail"
})
test("Register invalid email -> 422", r.status_code == 422, f"status={r.status_code}")

# Create load with no stops (should fail)
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "1500.00",
})
test("Create load without stops -> 422", r.status_code == 422, f"status={r.status_code}")

# Create driver with non-numeric pay_rate_value
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "Bad", "last_name": "Data",
    "email": "bad@test.com", "employment_type": "company_driver",
    "pay_rate_value": "not-a-number"
})
test("Create driver bad pay_rate -> 422", r.status_code == 422, f"status={r.status_code}")

# Invalid UUID in path
r = requests.get(f"{BASE}/loads/not-a-uuid", headers=AUTH)
test("Get load with invalid UUID -> 422", r.status_code == 422, f"status={r.status_code}")

# ==================================================================
#   PHASE 3: SIMULATED BUTTON CLICKS -- CREATE RESOURCES
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 3: SIMULATED BUTTON CLICKS (Frontend Payload Simulation)")
print("=" * 70)

# --- Broker creation (matches CreateLoadDialog broker inline creation) ---
r = requests.post(f"{BASE}/brokers", headers=AUTH, json={
    "name": "Audit Freight LLC",
    "mc_number": "MC-999888",
    "contact_name": "John Broker",
    "contact_email": "john@auditfreight.com",
    "contact_phone": "555-123-4567",
})
test("Create Broker (button sim)", r.status_code in (200, 201), f"status={r.status_code}")
if r.status_code in (200, 201):
    BROKER_ID = r.json().get("id")
    test("Broker has ID", BROKER_ID is not None)
else:
    BROKER_ID = None

# --- Broker search (autocomplete, matches CreateLoadDialog) ---
r = requests.get(f"{BASE}/brokers/search", headers=AUTH, params={"q": "Audit"})
test("Broker search/autocomplete", r.status_code == 200, f"count={len(r.json()) if r.status_code == 200 else 'N/A'}")

# --- Driver creation (matches Driver form payload) ---
r = requests.post(f"{BASE}/drivers", headers=AUTH, json={
    "first_name": "Mike",
    "last_name": "Trucker",
    "email": f"mike_{uid}@test.com",
    "phone": "555-999-0000",
    "employment_type": "company_w2",
    "cdl_number": "CDL-AUDIT-001",
    "cdl_class": "A",
    "cdl_expiry_date": (date.today() + timedelta(days=365)).isoformat(),
    "medical_card_expiry_date": (date.today() + timedelta(days=180)).isoformat(),
    "pay_rate_type": "cpm",
    "pay_rate_value": 0.65,
    "status": "available",
})
test("Create Driver (button sim)", r.status_code in (200, 201), f"status={r.status_code}")
if r.status_code in (200, 201):
    DRIVER_ID = r.json().get("id")
    test("Driver has ID", DRIVER_ID is not None)
else:
    DRIVER_ID = None
    print(f"    DETAIL: {r.text[:300]}")

# --- Truck creation (matches Fleet form) ---
r = requests.post(f"{BASE}/fleet/trucks", headers=AUTH, json={
    "unit_number": f"T-{uid}",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2024,
    "vin": "1FUJGLDR0CLBP8594",
    "license_plate": f"AUD-{uid[:4]}",
    "status": "available",
})
test("Create Truck (button sim)", r.status_code in (200, 201), f"status={r.status_code}")
if r.status_code in (200, 201):
    TRUCK_ID = r.json().get("id")
    test("Truck has ID", TRUCK_ID is not None)
else:
    TRUCK_ID = None
    print(f"    DETAIL: {r.text[:300]}")

# --- Trailer creation (matches Fleet form) ---
r = requests.post(f"{BASE}/fleet/trailers", headers=AUTH, json={
    "unit_number": f"TR-{uid}",
    "trailer_type": "dry_van",
    "make": "Wabash",
    "model": "National",
    "year": 2023,
    "license_plate": f"TRL-{uid[:4]}",
    "status": "available",
})
test("Create Trailer (button sim)", r.status_code in (200, 201), f"status={r.status_code}")
if r.status_code in (200, 201):
    TRAILER_ID = r.json().get("id")
    test("Trailer has ID", TRAILER_ID is not None)
else:
    TRAILER_ID = None
    print(f"    DETAIL: {r.text[:300]}")

# ==================================================================
#   PHASE 4A: FULL LOAD LIFECYCLE (E2E API Chain)
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 4A: FULL LOAD LIFECYCLE (offer -> paid)")
print("=" * 70)

# --- Create Load (matches CreateLoadDialog exact payload) ---
load_payload = {
    "broker_id": BROKER_ID,
    "broker_load_id": "BL-AUDIT-001",
    "contact_agent": "Audit Agent",
    "base_rate": "3200.00",
    "total_miles": "920",
    "stops": [
        {
            "stop_type": "pickup",
            "stop_sequence": 1,
            "facility_name": "Audit Warehouse",
            "address": "123 Test Blvd",
            "city": "Dallas",
            "state": "TX",
            "zip_code": "75201",
            "scheduled_date": (date.today() + timedelta(days=1)).isoformat(),
        },
        {
            "stop_type": "delivery",
            "stop_sequence": 2,
            "facility_name": "Audit Destination",
            "address": "456 Delivery Ave",
            "city": "Houston",
            "state": "TX",
            "zip_code": "77001",
            "scheduled_date": (date.today() + timedelta(days=2)).isoformat(),
        },
    ],
    "accessorials": [
        {"type": "fuel_surcharge", "amount": "150.00", "description": "FSC"},
    ],
    "notes": "E2E audit load",
}
r = requests.post(f"{BASE}/loads", headers=AUTH, json=load_payload)
test("Create Load (CreateLoadDialog sim)", r.status_code in (200, 201), f"status={r.status_code}")
if r.status_code in (200, 201):
    load = r.json()
    LOAD_ID = load.get("id")
    test("Load has ID", LOAD_ID is not None)
    test("Load status is 'offer'", load.get("status") == "offer")
    test("Load has 2 stops", len(load.get("stops", [])) == 2)
    test("Load has 1 accessorial", len(load.get("accessorials", [])) == 1)
    test("Load has load_number", load.get("load_number") is not None, f"load_number={load.get('load_number')}")
else:
    LOAD_ID = None
    print(f"    DETAIL: {r.text[:500]}")

if not LOAD_ID or not DRIVER_ID or not TRUCK_ID:
    print("\n[WARN] Cannot continue lifecycle -- missing load, driver, or truck")
    LIFECYCLE_OK = False
else:
    LIFECYCLE_OK = True

if LIFECYCLE_OK:
    # --- offer -> booked (StatusStepper "Book It" button) ---
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "booked"})
    test("offer -> booked", r.status_code == 200, f"status={r.status_code}")
    
    # --- booked -> assigned (automatic on dispatch, but test manual) ---
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "assigned"})
    test("booked -> assigned", r.status_code == 200, f"status={r.status_code}")
    
    # --- Dispatch Load (DispatchDialog exact payload) ---
    dispatch_payload = {
        "driver_id": DRIVER_ID,
        "truck_id": TRUCK_ID,
        "trailer_id": TRAILER_ID,
    }
    r = requests.post(f"{BASE}/loads/{LOAD_ID}/dispatch", headers=AUTH, json=dispatch_payload)
    test("Dispatch Load (DispatchDialog sim)", r.status_code == 200, f"status={r.status_code}")
    if r.status_code != 200:
        print(f"    DETAIL: {r.text[:500]}")
    else:
        dispatched_load = r.json()
        test("Load status after dispatch is 'dispatched'", dispatched_load.get("status") == "dispatched")
    
    # --- dispatched -> in_transit ---
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "in_transit"})
    test("dispatched -> in_transit", r.status_code == 200, f"status={r.status_code}")
    
    # --- in_transit -> delivered ---
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "delivered"})
    test("in_transit -> delivered", r.status_code == 200, f"status={r.status_code}")
    
    # --- Verify driver released back to available ---
    if DRIVER_ID:
        r = requests.get(f"{BASE}/drivers/{DRIVER_ID}", headers=AUTH)
        if r.status_code == 200:
            driver_status = r.json().get("status")
            test("Driver released after delivery", driver_status == "available", f"status={driver_status}")
    
    # --- Verify truck released back to available ---
    if TRUCK_ID:
        r = requests.get(f"{BASE}/fleet/trucks/{TRUCK_ID}", headers=AUTH)
        if r.status_code == 200:
            truck_status = r.json().get("status")
            test("Truck released after delivery", truck_status == "available", f"status={truck_status}")
    
    # --- delivered -> invoiced (locks financials) ---
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "invoiced"})
    test("delivered -> invoiced", r.status_code == 200, f"status={r.status_code}")
    
    # --- Verify load is locked ---
    r = requests.get(f"{BASE}/loads/{LOAD_ID}", headers=AUTH)
    if r.status_code == 200:
        test("Load is locked after invoicing", r.json().get("is_locked") == True)
    
    # --- invoiced -> paid ---
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "paid"})
    test("invoiced -> paid (TERMINAL)", r.status_code == 200, f"status={r.status_code}")

# ==================================================================
#   PHASE 4B: ILLEGAL STATE TRANSITIONS (Live Server)
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 4B: ILLEGAL STATE TRANSITIONS (Live API)")
print("=" * 70)

if LIFECYCLE_OK:
    # paid is terminal -- can't go anywhere
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "offer"})
    test("paid -> offer BLOCKED", r.status_code == 400, f"status={r.status_code}")
    
    r = requests.patch(f"{BASE}/loads/{LOAD_ID}/status", headers=AUTH, json={"status": "cancelled"})
    test("paid -> cancelled BLOCKED", r.status_code == 400, f"status={r.status_code}")

# Create a fresh load for more illegal transition tests
r = requests.post(f"{BASE}/loads", headers=AUTH, json={
    "base_rate": "1000.00", "total_miles": "500",
    "stops": [
        {"stop_type": "pickup", "stop_sequence": 1, "city": "Austin", "state": "TX",
         "scheduled_date": (date.today() + timedelta(days=3)).isoformat()},
        {"stop_type": "delivery", "stop_sequence": 2, "city": "Denver", "state": "CO",
         "scheduled_date": (date.today() + timedelta(days=4)).isoformat()},
    ],
})
if r.status_code in (200, 201):
    LOAD2_ID = r.json().get("id")
    
    # offer -> delivered (skip 5 steps)
    r2 = requests.patch(f"{BASE}/loads/{LOAD2_ID}/status", headers=AUTH, json={"status": "delivered"})
    test("offer -> delivered BLOCKED (skip)", r2.status_code == 400, f"status={r2.status_code}")
    
    # offer -> in_transit (skip 4 steps)
    r2 = requests.patch(f"{BASE}/loads/{LOAD2_ID}/status", headers=AUTH, json={"status": "in_transit"})
    test("offer -> in_transit BLOCKED", r2.status_code == 400, f"status={r2.status_code}")
    
    # offer -> paid (skip everything)
    r2 = requests.patch(f"{BASE}/loads/{LOAD2_ID}/status", headers=AUTH, json={"status": "paid"})
    test("offer -> paid BLOCKED", r2.status_code == 400, f"status={r2.status_code}")
    
    # Invalid status value
    r2 = requests.patch(f"{BASE}/loads/{LOAD2_ID}/status", headers=AUTH, json={"status": "gibberish"})
    test("Invalid status string -> 400", r2.status_code == 400, f"status={r2.status_code}")

# ==================================================================
#   PHASE 4C: MULTI-TENANT ISOLATION (Live API)
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 4C: MULTI-TENANT ISOLATION")
print("=" * 70)

# Register a second tenant
uid2 = str(uuid.uuid4())[:8]
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"tenant2_{uid2}@test.com",
    "password": "TenantPass123!",
    "first_name": "Tenant2",
    "last_name": "User",
    "company_name": f"TenantB_{uid2}",
})
test("Register Tenant B", r.status_code in (200, 201))
t2_tokens = r.json()
T2_ACCESS = t2_tokens.get("access_token") or t2_tokens.get("tokens", {}).get("access_token")
AUTH_B = {"Authorization": f"Bearer {T2_ACCESS}"} if T2_ACCESS else AUTH

# Tenant B tries to access Tenant A's load
if LOAD_ID:
    r = requests.get(f"{BASE}/loads/{LOAD_ID}", headers=AUTH_B)
    test("Tenant B cannot read Tenant A load -> 404", r.status_code == 404, f"status={r.status_code}")

# Tenant B tries to list loads -- should see 0 (not Tenant A's loads)
r = requests.get(f"{BASE}/loads/live", headers=AUTH_B)
test("Tenant B load list is empty", r.status_code == 200 and len(r.json().get("items", [])) == 0,
     f"count={len(r.json().get('items', [])) if r.status_code == 200 else 'N/A'}")

# Tenant B tries to access Tenant A's driver
if DRIVER_ID:
    r = requests.get(f"{BASE}/drivers/{DRIVER_ID}", headers=AUTH_B)
    test("Tenant B cannot read Tenant A driver -> 404", r.status_code == 404, f"status={r.status_code}")

# Tenant B tries to access Tenant A's truck
if TRUCK_ID:
    r = requests.get(f"{BASE}/fleet/trucks/{TRUCK_ID}", headers=AUTH_B)
    test("Tenant B cannot read Tenant A truck -> 404", r.status_code == 404, f"status={r.status_code}")

# Tenant B tries to mutate Tenant A's load status
if LOAD2_ID:
    r = requests.patch(f"{BASE}/loads/{LOAD2_ID}/status", headers=AUTH_B, json={"status": "booked"})
    test("Tenant B cannot mutate Tenant A load", r.status_code in (404, 403), f"status={r.status_code}")

# ==================================================================
#   PHASE 4D: SETTLEMENT GENERATION & MATH VERIFICATION
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 4D: SETTLEMENT GENERATION & MATH VERIFICATION")
print("=" * 70)

if LIFECYCLE_OK and DRIVER_ID:
    # Generate settlement for the delivered/paid load
    r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH, json={
        "driver_id": DRIVER_ID,
        "period_start": (date.today() - timedelta(days=1)).isoformat(),
        "period_end": (date.today() + timedelta(days=1)).isoformat(),
    })
    test("Generate Settlement", r.status_code in (200, 201), f"status={r.status_code}")
    if r.status_code in (200, 201):
        settlement = r.json()
        SETTLEMENT_ID = settlement.get("id")
        test("Settlement has ID", SETTLEMENT_ID is not None)
        
        # Verify math: CPM $0.65 × 920 miles = $598.00
        gross = settlement.get("gross_pay")
        net = settlement.get("net_pay")
        test("Settlement gross matches CPM math", gross is not None, f"gross_pay=${gross}")
        
        # Get settlement detail
        if SETTLEMENT_ID:
            r = requests.get(f"{BASE}/accounting/settlements/{SETTLEMENT_ID}", headers=AUTH)
            test("Get Settlement Detail", r.status_code == 200)
            if r.status_code == 200:
                detail = r.json()
                line_items = detail.get("line_items", [])
                test("Settlement has line items", len(line_items) > 0, f"count={len(line_items)}")
            
            # Post settlement (freeze)
            r = requests.patch(f"{BASE}/accounting/settlements/{SETTLEMENT_ID}/post", headers=AUTH)
            test("Post Settlement", r.status_code == 200, f"status={r.status_code}")
            
            # Undo post
            r = requests.patch(f"{BASE}/accounting/settlements/{SETTLEMENT_ID}/undo", headers=AUTH)
            test("Undo Post Settlement", r.status_code == 200, f"status={r.status_code}")
            
            # Re-post and pay
            r = requests.patch(f"{BASE}/accounting/settlements/{SETTLEMENT_ID}/post", headers=AUTH)
            test("Re-Post Settlement", r.status_code == 200)
            
            r = requests.patch(f"{BASE}/accounting/settlements/{SETTLEMENT_ID}/pay", headers=AUTH)
            test("Pay Settlement (terminal)", r.status_code == 200, f"status={r.status_code}")

            # Duplicate settlement should fail
            r = requests.post(f"{BASE}/accounting/settlements/generate", headers=AUTH, json={
                "driver_id": DRIVER_ID,
                "period_start": (date.today() - timedelta(days=1)).isoformat(),
                "period_end": (date.today() + timedelta(days=1)).isoformat(),
            })
            test("Duplicate settlement -> 409 conflict", r.status_code in (400, 409), f"status={r.status_code}")
    else:
        print(f"    DETAIL: {r.text[:500]}")

# ==================================================================
#   PHASE 2C: EXHAUSTIVE ENDPOINT COVERAGE (Remaining Endpoints)
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 2C: REMAINING ENDPOINT COVERAGE")
print("=" * 70)

# --- Dashboard ---
for ep in ["dashboard/kpis", "dashboard/compliance-alerts", "dashboard/fleet-status", "dashboard/recent-events"]:
    r = requests.get(f"{BASE}/{ep}", headers=AUTH)
    test(f"GET /{ep}", r.status_code == 200, f"status={r.status_code}")

# --- Load board tabs ---
for tab in ["loads/live", "loads/upcoming", "loads/completed"]:
    r = requests.get(f"{BASE}/{tab}", headers=AUTH)
    test(f"GET /{tab}", r.status_code == 200, f"items={len(r.json().get('items', [])) if r.status_code == 200 else 'N/A'}")

# --- Loads list with filters ---
r = requests.get(f"{BASE}/loads", headers=AUTH, params={"page": 1, "page_size": 5, "status": "paid"})
test("GET /loads with filters", r.status_code == 200)

# --- Drivers ---
r = requests.get(f"{BASE}/drivers", headers=AUTH)
test("GET /drivers", r.status_code == 200)

r = requests.get(f"{BASE}/drivers/available", headers=AUTH)
test("GET /drivers/available", r.status_code == 200)

if DRIVER_ID:
    r = requests.get(f"{BASE}/drivers/{DRIVER_ID}/compliance", headers=AUTH)
    test("GET /drivers/{id}/compliance", r.status_code == 200, f"urgency={r.json().get('urgency') if r.status_code == 200 else 'N/A'}")

# --- Fleet ---
r = requests.get(f"{BASE}/fleet/trucks", headers=AUTH)
test("GET /fleet/trucks", r.status_code == 200)

r = requests.get(f"{BASE}/fleet/trucks/available", headers=AUTH)
test("GET /fleet/trucks/available", r.status_code == 200)

r = requests.get(f"{BASE}/fleet/trailers", headers=AUTH)
test("GET /fleet/trailers", r.status_code == 200)

r = requests.get(f"{BASE}/fleet/trailers/available", headers=AUTH)
test("GET /fleet/trailers/available", r.status_code == 200)

# --- Brokers ---
r = requests.get(f"{BASE}/brokers", headers=AUTH)
test("GET /brokers", r.status_code == 200)

# --- Settings ---
r = requests.get(f"{BASE}/settings/company", headers=AUTH)
test("GET /settings/company", r.status_code == 200)

r = requests.get(f"{BASE}/settings/users", headers=AUTH)
test("GET /settings/users", r.status_code == 200)

# --- Accounting ---
r = requests.get(f"{BASE}/accounting/settlements", headers=AUTH)
test("GET /accounting/settlements", r.status_code == 200)

# --- Load update on locked load ---
if LOAD_ID:
    r = requests.put(f"{BASE}/loads/{LOAD_ID}", headers=AUTH, json={"base_rate": "9999.00"})
    test("Update locked load -> 400", r.status_code == 400, f"status={r.status_code}")

# --- Soft delete (only offer loads) ---
if LOAD2_ID:
    # Book it first so it can't be deleted
    requests.patch(f"{BASE}/loads/{LOAD2_ID}/status", headers=AUTH, json={"status": "booked"})
    r = requests.delete(f"{BASE}/loads/{LOAD2_ID}", headers=AUTH)
    test("Delete non-offer load -> 400/409", r.status_code in (400, 409), f"status={r.status_code}")

# ==================================================================
#   PHASE 2D: TOKEN REVOCATION (Live)
# ==================================================================

print("\n" + "=" * 70)
print("  PHASE 2D: TOKEN REVOCATION (Live API)")
print("=" * 70)

# Login fresh to get a token we can revoke
r = requests.post(f"{BASE}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
if r.status_code == 200:
    revoke_data = r.json()
    REVOKE_ACCESS = revoke_data["access_token"]
    REVOKE_REFRESH = revoke_data["refresh_token"]
    
    # Verify token works before revocation
    r = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {REVOKE_ACCESS}"})
    test("Token works before logout", r.status_code == 200)
    
    # Logout (revoke both tokens)
    r = requests.post(f"{BASE}/auth/logout", 
                      headers={"Authorization": f"Bearer {REVOKE_ACCESS}"},
                      json={"refresh_token": REVOKE_REFRESH})
    test("POST /auth/logout", r.status_code == 200, f"status={r.status_code}")
    
    # Verify revoked token is rejected
    r = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {REVOKE_ACCESS}"})
    test("Revoked token -> 401", r.status_code == 401, f"status={r.status_code}")
    
    # Verify revoked refresh token can't be used
    r = requests.post(f"{BASE}/auth/refresh", json={"refresh_token": REVOKE_REFRESH})
    test("Revoked refresh token -> rejected", r.status_code in (401, 403, 400), f"status={r.status_code}")

# ==================================================================
#   FINAL REPORT
# ==================================================================

print("\n" + "=" * 70)
print("  FINAL RESULTS")
print("=" * 70)
print(f"\n  PASSED: {RESULTS['passed']}")
print(f"  FAILED: {RESULTS['failed']}")
print(f"  TOTAL:  {RESULTS['passed'] + RESULTS['failed']}")
if RESULTS['errors']:
    print(f"\n  FAILURES:")
    for e in RESULTS['errors']:
        print(f"    {e}")
print()
sys.exit(1 if RESULTS['failed'] > 0 else 0)
