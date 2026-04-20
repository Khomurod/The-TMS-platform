import re

with open('backend/app/accounting/schemas.py', 'r') as f:
    content = f.read()

target = r"""class SettlementGenerateRequest\(BaseModel\):
    \"\"\"POST /settlements/generate — generate draft for driver \+ period\.\"\"\"
    driver_id: str
    period_start: date
    period_end: date"""

replacement = r"""class CustomItem(BaseModel):
    type: str
    description: str
    amount: Decimal

class SettlementGenerateRequest(BaseModel):
    \"\"\"POST /settlements/generate — generate draft for driver + period.\"\"\"
    driver_id: str
    period_start: date
    period_end: date
    custom_items: list[CustomItem] = []"""

new_content = re.sub(target, replacement, content, flags=re.DOTALL)
with open('backend/app/accounting/schemas.py', 'w') as f:
    f.write(new_content)
print("Fixed schemas")
