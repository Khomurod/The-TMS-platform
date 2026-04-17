"""Hit production endpoints to capture the real 500 error body."""
import httpx
from app.core.security import create_access_token
from uuid import uuid4

BASE = "https://kinetic-api-1065403267999.us-central1.run.app"

# Create a token that will pass JWT validation
# (we need to use the PRODUCTION secret, but we don't have it)
# Instead, try unauthenticated to see if the 500 is pre-auth or post-auth

print("=== Unauthenticated test (expect 401) ===")
for path in ["/api/v1/loads?page=1&page_size=20", "/api/v1/loads/completed?page=1&page_size=20", "/api/v1/dashboard/compliance-alerts"]:
    r = httpx.get(f"{BASE}{path}", timeout=15)
    print(f"  {path}: {r.status_code} {r.text[:200]}")

print("\n=== With fake auth header (expect 401) ===")
headers = {"Authorization": "Bearer fake_token_123"}
for path in ["/api/v1/loads?page=1&page_size=20", "/api/v1/loads/completed?page=1&page_size=20"]:
    r = httpx.get(f"{BASE}{path}", headers=headers, timeout=15)
    print(f"  {path}: {r.status_code} {r.text[:300]}")
