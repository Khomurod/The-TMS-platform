import io
import json
from reportlab.pdfgen import canvas
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
import uuid

# 1. Generate a mock PDF Rate Confirmation
pdf_buffer = io.BytesIO()
c = canvas.Canvas(pdf_buffer)
c.drawString(100, 750, "RATE CONFIRMATION")
c.drawString(100, 730, "Broker: CH Robinson")
c.drawString(100, 710, "Pickup Location: Chicago, IL")
c.drawString(100, 690, "Delivery Location: Los Angeles, CA")
c.drawString(100, 670, "Commodity: Auto Parts")
c.drawString(100, 650, "Total Payout: $4500.00")
c.save()

pdf_buffer.seek(0)

# 2. Setup TestClient
client = TestClient(app)

# Generate an admin token for testing
user_id = str(uuid.uuid4())
company_id = str(uuid.uuid4())
token = create_access_token(user_id, company_id, "company_admin")
headers = {"Authorization": f"Bearer {token}"}

# 3. Post to the endpoint
print("Testing /api/v1/loads/parse-document with mock PDF...")
files = {"file": ("rate_con.pdf", pdf_buffer, "application/pdf")}

response = client.post("/api/v1/loads/parse-document", files=files, headers=headers)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print("Success! Yandex AI Response:")
    print(json.dumps(response.json(), indent=2))
else:
    print("Failed!")
    print(response.text)
