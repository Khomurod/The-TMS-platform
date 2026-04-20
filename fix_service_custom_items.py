import re

with open('backend/app/accounting/service.py', 'r') as f:
    content = f.read()

target = r"""        # Apply custom items
        custom_accessorials = Decimal\("0"\)
        custom_deductions = Decimal\("0"\)
        if hasattr\(data, 'custom_items'\) and data.custom_items:"""

replacement = r"""        # Apply custom items
        custom_accessorials = Decimal("0")
        custom_deductions = Decimal("0")
        if getattr(data, 'custom_items', None):"""

content = re.sub(target, replacement, content, flags=re.DOTALL)

target2 = r"""        # Create custom line items
        if hasattr\(data, 'custom_items'\) and data.custom_items:"""

replacement2 = r"""        # Create custom line items
        if getattr(data, 'custom_items', None):"""

content = re.sub(target2, replacement2, content, flags=re.DOTALL)

with open('backend/app/accounting/service.py', 'w') as f:
    f.write(content)
print("Fixed service.py custom items")
