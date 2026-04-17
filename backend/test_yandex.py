import os
import json
import asyncio
import httpx
from dotenv import load_dotenv

# Explicitly load the .env file located in the backend directory
load_dotenv()

async def test_yandex_integration():
    api_key = os.getenv("YANDEX_API_KEY")
    folder_id = os.getenv("YANDEX_FOLDER_ID")

    print(f"--- DEBUG INFO ---")
    print(f"Folder ID Loaded: {bool(folder_id)} (Length: {len(folder_id) if folder_id else 0})")
    print(f"API Key Loaded: {bool(api_key)} (Length: {len(api_key) if api_key else 0})")
    print(f"------------------\n")

    if not api_key or not folder_id:
        print("ERROR: Script still cannot see the keys. Ensure your .env file is inside the 'backend' folder and saved.")
        exit(1)

    # Mock extracted text
    mock_text = "RATE CONFIRMATION. Broker: Coyote Logistics. Pickup: 123 Main St, Chicago IL. Delivery: 456 Oak St, Dallas TX. Commodity: Dry Goods. Total Pay: $2450.00"
    
    system_prompt = (
        "You are a freight logistics expert. Extract information from the provided document. "
        "Return strictly formatted JSON containing: pickup_location (string), delivery_location (string), "
        "payout (numeric), commodity (string), and broker_name (string). Do not include markdown formatting or extra text."
    )

    headers = {
        "Authorization": f"Api-Key {api_key}",
        "x-folder-id": folder_id or "",
        "Content-Type": "application/json"
    }

    # Handle different models or endpoints if needed, but standard Yandex GPT
    payload = {
        "modelUri": f"gpt://{folder_id}/yandexgpt/latest" if folder_id else "yandexgpt",
        "completionOptions": {
            "stream": False,
            "temperature": 0.1,
            "maxTokens": "2000"
        },
        "messages": [
            {
                "role": "system",
                "text": system_prompt
            },
            {
                "role": "user",
                "text": f"Here is the extracted text from the freight document:\n\n{mock_text}\n\nParse it and return strictly formatted JSON."
            }
        ]
    }

    print("Sending POST request to Yandex API...")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
                headers=headers,
                json=payload,
                timeout=45.0
            )
            
            print(f"HTTP Status Code: {resp.status_code}")
            
            if resp.status_code != 200:
                print(f"Yandex API error: {resp.text}")
                return

            data = resp.json()
            
            try:
                result_text = data["result"]["alternatives"][0]["message"]["text"]
                
                print("\n--- Raw Response Text from Yandex ---")
                print(result_text)
                print("-------------------------------------\n")
                
                if result_text.startswith("```json"):
                    result_text = result_text[7:-3]
                elif result_text.startswith("```"):
                    result_text = result_text[3:-3]
                    
                parsed_data = json.loads(result_text.strip())
                
                print("SUCCESS: Successfully parsed JSON:")
                print(json.dumps(parsed_data, indent=2))
                
            except Exception as e:
                print(f"FAILED: Failed to parse Yandex response into JSON: {e}")
                
        except httpx.RequestError as e:
            print(f"Request Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_yandex_integration())
