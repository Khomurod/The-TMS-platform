import json
import pytest
from unittest.mock import AsyncMock, patch
from fastapi import UploadFile

from app.loads.service import LoadService


@pytest.mark.asyncio
async def test_parse_structured_load_data_with_expanded_schema():
    """
    Test that _parse_structured_load_data handles the expanded JSON schema correctly,
    including new facility names, dates, and zip codes, without breaking existing fields.
    """
    # Mock database session and service initialization
    db_mock = AsyncMock()
    service = LoadService(db=db_mock, company_id="test-company-id")

    extracted_text = "Dummy extracted text for testing."
    api_key = "dummy-api-key"

    # Define the expanded JSON payload simulating the LLM response
    mock_llm_response_dict = {
        "broker_load_id": "LD-9999",
        "pickup_facility": "Georgia-Pacific Consumer Products",
        "pickup_address": "2300 Enterprise Dr.",
        "pickup_city": "Atlanta",
        "pickup_state": "GA",
        "pickup_zip": "30303",
        "pickup_date": "2024-05-10",
        "delivery_facility": "Walmart DC",
        "delivery_address": "123 Main St.",
        "delivery_city": "Dallas",
        "delivery_state": "TX",
        "delivery_zip": "75201",
        "delivery_date": "2024-05-12",
        "base_rate": 1500.50,
        "commodity": "Paper Products",
        "broker_name": "Coyote Logistics",
        "weight": 40000,
        "total_miles": 641
    }

    # Construct a valid Yandex LLM response payload
    mock_yandex_api_response = {
        "result": {
            "alternatives": [
                {
                    "message": {
                        "text": json.dumps(mock_llm_response_dict)
                    }
                }
            ]
        }
    }

    # Mock the httpx.AsyncClient post method to return our custom response
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = lambda: mock_yandex_api_response
        mock_response.text = json.dumps(mock_yandex_api_response)

        # Make the mock act like an async context manager if needed, but httpx post itself returns a response
        mock_post.return_value = mock_response

        # Execute the method under test
        parsed_data = await service._parse_structured_load_data(extracted_text, api_key)

        # Assertions
        assert parsed_data["broker_load_id"] == "LD-9999"

        # Pickup asserts
        assert parsed_data["pickup_facility"] == "Georgia-Pacific Consumer Products"
        assert parsed_data["pickup_address"] == "2300 Enterprise Dr."
        assert parsed_data["pickup_city"] == "Atlanta"
        assert parsed_data["pickup_state"] == "GA"
        assert parsed_data["pickup_zip"] == "30303"
        assert parsed_data["pickup_date"] == "2024-05-10"

        # Delivery asserts
        assert parsed_data["delivery_facility"] == "Walmart DC"
        assert parsed_data["delivery_address"] == "123 Main St."
        assert parsed_data["delivery_city"] == "Dallas"
        assert parsed_data["delivery_state"] == "TX"
        assert parsed_data["delivery_zip"] == "75201"
        assert parsed_data["delivery_date"] == "2024-05-12"

        # Original fields shouldn't be broken
        assert parsed_data["base_rate"] == 1500.50
        assert parsed_data["commodity"] == "Paper Products"
        assert parsed_data["broker_name"] == "Coyote Logistics"
        assert parsed_data["weight"] == 40000.0
        assert parsed_data["total_miles"] == 641.0
