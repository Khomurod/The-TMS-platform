import re

with open('backend/app/accounting/service.py', 'r') as f:
    content = f.read()

target = r"""        if not trips and not \(hasattr\(data, 'custom_items'\) and data.custom_items\):"""
replacement = r"""        if not trips and not getattr(data, 'custom_items', None):"""

content = re.sub(target, replacement, content)

with open('backend/app/accounting/service.py', 'w') as f:
    f.write(content)
print("Fixed zero loads custom items")
