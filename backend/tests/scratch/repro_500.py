"""
Minimal reproduction of the server 500 issue.
Makes EXACTLY ONE register call and EXACTLY ONE /auth/me call.
"""
import requests, uuid

BASE = "http://127.0.0.1:8000/api/v1"
uid = str(uuid.uuid4())[:8]

print("1. Health check...")
r = requests.get(f"{BASE}/health")
print(f"   Health: {r.status_code} {r.json()}")

print("2. Registering...")
r = requests.post(f"{BASE}/auth/register", json={
    "email": f"repro_{uid}@test.com",
    "password": "ReproPass123!",
    "first_name": "Repro",
    "last_name": "User",
    "company_name": f"ReproCo_{uid}",
})
print(f"   Register: {r.status_code}")
data = r.json()
access = data.get("tokens", {}).get("access_token")
print(f"   Token present: {access is not None}")

if not access:
    print("   CANNOT CONTINUE - no token")
    exit(1)

print("3. Calling /auth/me...")
AUTH = {"Authorization": f"Bearer {access}"}
r = requests.get(f"{BASE}/auth/me", headers=AUTH)
print(f"   ME: {r.status_code} {r.text[:300]}")

print("4. Logging in to get fresh token...")
r = requests.post(f"{BASE}/auth/login", json={
    "email": f"repro_{uid}@test.com",
    "password": "ReproPass123!",
})
print(f"   Login: {r.status_code}")
access2 = r.json().get("access_token")

print("5. Calling /auth/me with login token...")
AUTH2 = {"Authorization": f"Bearer {access2}"}
r = requests.get(f"{BASE}/auth/me", headers=AUTH2)
print(f"   ME: {r.status_code} {r.text[:300]}")
