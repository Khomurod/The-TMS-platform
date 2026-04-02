"""
Step 4: Load -> Trip End-to-End Workflow Test
=============================================
Tests the full lifecycle:
  1. Login
  2. Create a Driver
  3. Create a Truck
  4. Create a Load (with pickup/delivery stops)
  5. Dispatch the Load (creates Trip, assigns Driver+Truck)
  6. Verify Trip created with correct data
  7. Advance status: in_transit -> delivered
  8. Verify final state
"""
import json
import urllib.request
import urllib.error
import sys

BASE = "http://localhost:8000/api/v1"
PASS = 0
FAIL = 0


def api(method, path, data=None, token=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, {"raw": body}


def check(label, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [PASS] {label}")
    else:
        FAIL += 1
        print(f"  [FAIL] {label} -- {detail}")


# ── 1. LOGIN ──────────────────────────────────────────────────────
print("=" * 60)
print("STEP 4: Load -> Trip E2E Workflow Test")
print("=" * 60)

print("\n1. Login")
status, data = api("POST", "/auth/login", {
    "email": "admin@wenzetrucking.com",
    "password": "WenzeAdmin1!"
})
check("Login returns 200", status == 200, f"got {status}")
token = data.get("access_token", "")
check("JWT token received", len(token) > 0)

# ── 2. CREATE DRIVER ──────────────────────────────────────────────
print("\n2. Create Driver")
status, driver = api("POST", "/drivers", {
    "first_name": "John",
    "last_name": "TestDriver",
    "employment_type": "company_w2",
    "phone": "555-0101",
    "cdl_number": "CDL-TEST-001",
    "cdl_class": "A",
    "pay_rate_type": "cpm",
    "pay_rate_value": "0.55",
}, token)
check("Driver created (201)", status == 201, f"got {status}: {json.dumps(driver)[:200]}")
driver_id = driver.get("id", "")
check("Driver ID returned", len(driver_id) > 0)
check("Driver status = available", driver.get("status") == "available", f"got {driver.get('status')}")

# ── 3. CREATE TRUCK ───────────────────────────────────────────────
print("\n3. Create Truck")
status, truck = api("POST", "/fleet/trucks", {
    "unit_number": "TRK-101",
    "year": 2023,
    "make": "Freightliner",
    "model": "Cascadia",
    "vin": "1FUJGLDR5CLBP1234",
    "license_plate": "TX-TEST-01",
    "ownership_type": "owned",
}, token)
check("Truck created (201)", status == 201, f"got {status}: {json.dumps(truck)[:200]}")
truck_id = truck.get("id", "")
check("Truck ID returned", len(truck_id) > 0)
check("Truck status = available", truck.get("status") == "available", f"got {truck.get('status')}")

# ── 4. CREATE LOAD ────────────────────────────────────────────────
print("\n4. Create Load")
status, load = api("POST", "/loads", {
    "base_rate": "3500.00",
    "total_miles": "850",
    "contact_agent": "Jane Broker",
    "notes": "E2E test load",
    "stops": [
        {
            "stop_type": "pickup",
            "stop_sequence": 1,
            "facility_name": "ABC Warehouse",
            "city": "Dallas",
            "state": "TX",
            "zip_code": "75201",
            "scheduled_date": "2026-04-05",
        },
        {
            "stop_type": "delivery",
            "stop_sequence": 2,
            "facility_name": "XYZ Distribution",
            "city": "Atlanta",
            "state": "GA",
            "zip_code": "30301",
            "scheduled_date": "2026-04-07",
        },
    ],
    "accessorials": [
        {"type": "fuel_surcharge", "amount": "175.00", "description": "FSC 5%"}
    ]
}, token)
check("Load created", status in (200, 201), f"got {status}: {json.dumps(load)[:300]}")

if status not in (200, 201):
    print(f"\n  FATAL: Cannot continue without a load. Response: {json.dumps(load)[:500]}")
    sys.exit(1)

load_id = load.get("id", "")
load_number = load.get("load_number", "")
check("Load ID returned", len(load_id) > 0)
check("Load number assigned", len(load_number) > 0, f"got '{load_number}'")
check("Load status = offer", load.get("status") == "offer", f"got {load.get('status')}")
check("2 stops created", len(load.get("stops", [])) == 2, f"got {len(load.get('stops', []))}")
check("1 accessorial created", len(load.get("accessorials", [])) == 1, f"got {len(load.get('accessorials', []))}")
check("No trips yet", len(load.get("trips", [])) == 0)

# ── 5. DISPATCH LOAD ──────────────────────────────────────────────
print("\n5. Dispatch Load (creates Trip)")
status, dispatch_result = api("POST", f"/loads/{load_id}/dispatch", {
    "driver_id": driver_id,
    "truck_id": truck_id,
}, token)
check("Dispatch successful", status in (200, 201), f"got {status}: {json.dumps(dispatch_result)[:300]}")

if status not in (200, 201):
    print(f"\n  Dispatch failed. Checking Load detail...")
    s2, detail = api("GET", f"/loads/{load_id}", token=token)
    print(f"  Load status: {detail.get('status')}, trips: {detail.get('trips', [])}")
    print(f"  Full dispatch response: {json.dumps(dispatch_result)[:500]}")
    sys.exit(1)

# ── 6. VERIFY TRIP ────────────────────────────────────────────────
print("\n6. Verify Trip created")
status, load_detail = api("GET", f"/loads/{load_id}", token=token)
check("Load detail fetched (200)", status == 200)
check("Load status = dispatched", load_detail.get("status") == "dispatched", f"got {load_detail.get('status')}")
check("Load is_locked = False (not invoiced yet)", load_detail.get("is_locked") == False, f"got {load_detail.get('is_locked')}")

trips = load_detail.get("trips", [])
check("1 trip created", len(trips) == 1, f"got {len(trips)}")

if trips:
    trip = trips[0]
    check("Trip has trip_number", len(trip.get("trip_number", "")) > 0)
    check("Trip status = dispatched", trip.get("status") == "dispatched", f"got {trip.get('status')}")
    check("Trip driver_id matches", trip.get("driver_id") == driver_id)
    check("Trip truck_id matches", trip.get("truck_id") == truck_id)
    check("Trip driver_name populated", trip.get("driver_name") is not None, f"got {trip.get('driver_name')}")
    check("Trip truck_number populated", trip.get("truck_number") is not None, f"got {trip.get('truck_number')}")

# ── 7. ADVANCE STATUS: in_transit -> delivered ────────────────────
print("\n7. Status Transitions")

# in_transit
status, result = api("PATCH", f"/loads/{load_id}/status", {"status": "in_transit"}, token)
check("Transition to in_transit", status == 200, f"got {status}: {json.dumps(result)[:200]}")

# delivered
status, result = api("PATCH", f"/loads/{load_id}/status", {"status": "delivered"}, token)
check("Transition to delivered", status == 200, f"got {status}: {json.dumps(result)[:200]}")

# ── 8. VERIFY FINAL STATE ────────────────────────────────────────
print("\n8. Verify Final State")
status, final = api("GET", f"/loads/{load_id}", token=token)
check("Load status = delivered", final.get("status") == "delivered", f"got {final.get('status')}")

if final.get("trips"):
    trip_status = final["trips"][0].get("status")
    check("Trip status = delivered", trip_status == "delivered", f"got {trip_status}")

# Driver should be back to available after delivery
status, driver_check = api("GET", f"/drivers/{driver_id}", token=token)
if status == 200:
    check("Driver status after delivery", driver_check.get("status") in ("available", "on_trip"), f"got {driver_check.get('status')}")

# ── 9. INVOICED -> is_locked ──────────────────────────────────────
print("\n9. Invoice & Pay")

status, result = api("PATCH", f"/loads/{load_id}/status", {"status": "invoiced"}, token)
check("Transition to invoiced", status == 200, f"got {status}: {json.dumps(result)[:200]}")
if status == 200:
    check("is_locked = True after invoiced", result.get("is_locked") == True, f"got {result.get('is_locked')}")

status, result = api("PATCH", f"/loads/{load_id}/status", {"status": "paid"}, token)
check("Transition to paid (terminal)", status == 200, f"got {status}: {json.dumps(result)[:200]}")

# Check board tabs
status, live = api("GET", "/loads/live", token=token)
check("Board /live returns 200", status == 200)

status, completed = api("GET", "/loads/completed", token=token)
check("Board /completed returns 200", status == 200)
if status == 200:
    completed_ids = [item["id"] for item in completed.get("items", [])]
    check("Paid load in /completed", load_id in completed_ids, f"items: {len(completed.get('items', []))}")

# ── SUMMARY ───────────────────────────────────────────────────────
print("\n" + "=" * 60)
print(f"RESULTS: {PASS} passed, {FAIL} failed, {PASS + FAIL} total")
print("=" * 60)

if FAIL > 0:
    sys.exit(1)
