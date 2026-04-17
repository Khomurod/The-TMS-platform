import asyncio
import json
from unittest.mock import patch, AsyncMock
from app.loads.service import LoadService
import httpx

async def test_universal_parser():
    print("Running Universal Parser & Type Coercion Test...")
    service = LoadService(db=None, company_id=None)

    # Mock the response from Yandex LLM to simulate extracting from a FedEx manifest
    mock_llm_response = {
        "pickup_city": "00291/SVNH",
        "pickup_state": None,
        "delivery_city": "00405/ATLH",
        "delivery_state": "GA",
        "base_rate": "PAID",
        "commodity": "General Freight",
        "broker_name": "FedEx Ground",
        "weight": "15,903.62 lbs"
    }

    class MockResponse:
        status_code = 200
        text = json.dumps({"result": {"alternatives": [{"message": {"text": json.dumps(mock_llm_response)}}]}})
        def json(self):
            return {"result": {"alternatives": [{"message": {"text": json.dumps(mock_llm_response)}}]}}

    # We patch httpx.AsyncClient to return our MockResponse
    mock_client_instance = AsyncMock()
    mock_client_instance.post.return_value = MockResponse()

    # The async with ctx manager logic
    mock_client_instance.__aenter__.return_value = mock_client_instance
    mock_client_instance.__aexit__.return_value = None

    with patch("app.loads.service.httpx.AsyncClient", return_value=mock_client_instance):
        result = await service._parse_structured_load_data(
            extracted_text="MOCK RAW TEXT",
            api_key="dummy_key",
            folder_id="dummy_folder"
        )
    
    print("\nParsed Result:")
    print(json.dumps(result, indent=2))

    assert result["base_rate"] is None, f"Expected base_rate to be None, got {result['base_rate']}"
    assert result["weight"] == 15903.62, f"Expected weight to be 15903.62, got {result['weight']}"
    assert result["pickup_city"] == "00291/SVNH", "Expected pickup_city to be FedEx code"

    print("\n[SUCCESS] Universal Parser Coercion Validation PASSED.")

if __name__ == "__main__":
    asyncio.run(test_universal_parser())
