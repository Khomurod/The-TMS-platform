import sys
import os
import asyncio
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

# Mock the database before importing app
import app.core.database
async def mock_get_db():
    mock_session = AsyncMock()
    # Mock the execute result for list query
    mock_result = MagicMock()
    # Provide dummy items and total count for items, total = await self.repo.list(...)
    # Actually list returns items, total but in the repository it executes a query
    # If the user requested an E2E test to prevent similar crashes, maybe we should mock repo.list directly?
    # No, we want to see if the Pydantic model formatting crashes.
    yield mock_session

from app.main import app
from app.core.security import create_access_token
import uuid

from app.core.database import get_db
app.dependency_overrides[get_db] = mock_get_db

# However, since repo.list() does real DB queries with asyncpg and might fail, we can mock the repository.
# To test if the endpoint formats the response correctly, let's just mock the service list_drivers method.
from app.drivers.service import DriverService
from app.drivers.schemas import DriverResponse, DriverListResponse
from app.models.base import DriverStatus

original_list_drivers = DriverService.list_drivers

async def mock_list_drivers(self, *args, **kwargs):
    # Mocking the repository response format internally or overriding the service
    # The instructions say: "Check methods like list_drivers(). Ensure they are formatting the repository's (items, total) tuple into the proper DriverListResponse Pydantic model before returning it to the router."
    # If the router crashes, it's because it returns the tuple directly. 
    # The current code in service returns DriverListResponse. 
    # Let's override the repository to return dummy data so the service executes its actual code.
    
    class DummyDriver:
        id = uuid.uuid4()
        company_id = uuid.uuid4()
        first_name = "John"
        last_name = "Doe"
        phone = "555-1234"
        email = "john@example.com"
        status = DriverStatus.available
        employment_type = "company"
        cdl_number = "CDL123"
        cdl_state = "IL"
        cdl_expiry_date = None
        medical_card_expiry_date = None
        bank_routing_number = None
        bank_account_number = None
        created_at = None
        updated_at = None
        use_company_defaults = True
        is_active = True

    items = [DummyDriver()]
    total = 1
    
    # Run the original list_drivers method, but mock self.repo.list
    self.repo.list = AsyncMock(return_value=(items, total))
    return await original_list_drivers(self, *args, **kwargs)

DriverService.list_drivers = mock_list_drivers

def run_test():
    client = TestClient(app)
    user_id = str(uuid.uuid4())
    company_id = str(uuid.uuid4())
    token = create_access_token(user_id, company_id, "company_admin")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/api/v1/drivers?page=1", headers=headers)
    print(f"Status: {response.status_code}")
    print("Response JSON:")
    print(response.json())
    
    if response.status_code == 200:
        print("SUCCESS: Endpoint returned 200 OK")
    else:
        print("FAIL: Endpoint did not return 200 OK")

if __name__ == "__main__":
    run_test()
