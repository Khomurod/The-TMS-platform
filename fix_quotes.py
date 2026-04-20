with open('backend/app/accounting/schemas.py', 'r') as f:
    content = f.read()

content = content.replace('\\"\\"\\"', '"""')

with open('backend/app/accounting/schemas.py', 'w') as f:
    f.write(content)
print("Fixed quotes")
