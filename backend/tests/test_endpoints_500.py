import pytest
from httpx import AsyncClient
import uuid

from tests.conftest import register_and_login, auth_headers

@pytest.mark.asyncio
async def test_pagination_endpoints_200_ok(client: AsyncClient):
    token, company_id = await register_and_login(client)
    headers = await auth_headers(token)

    # Test /drivers pagination
    resp_drivers = await client.get("/api/v1/drivers?page=1&page_size=20", headers=headers)
    assert resp_drivers.status_code == 200
    data = resp_drivers.json()
    assert "items" in data
    assert "total" in data

    # Test /fleet/trucks pagination
    resp_trucks = await client.get("/api/v1/fleet/trucks?page=1&page_size=20", headers=headers)
    assert resp_trucks.status_code == 200
    data = resp_trucks.json()
    assert "items" in data

    # Test /brokers pagination
    resp_brokers = await client.get("/api/v1/brokers?page=1&page_size=20", headers=headers)
    assert resp_brokers.status_code == 200
    data = resp_brokers.json()
    assert "items" in data

@pytest.mark.asyncio
async def test_driver_decryption(client: AsyncClient):
    token, company_id = await register_and_login(client)
    headers = await auth_headers(token)

    # Create driver
    create_payload = {
        "first_name": "Encrypted",
        "last_name": "Driver",
        "phone": "555-9999",
        "email": "encrypted@test.com",
        "employment_type": "company_w2",
        "bank_routing_number": "123456789",
        "bank_account_number": "987654321"
    }
    
    resp_create = await client.post("/api/v1/drivers", json=create_payload, headers=headers)
    assert resp_create.status_code in (200, 201), resp_create.text
    driver_id = resp_create.json()["id"]

    # Fetch driver back
    resp_get = await client.get(f"/api/v1/drivers/{driver_id}", headers=headers)
    assert resp_get.status_code == 200, resp_get.text
    data = resp_get.json()
    assert data["first_name"] == "Encrypted"

    print("\n[SUCCESS] Endpoint 500 & Decryption Validation PASSED.")
