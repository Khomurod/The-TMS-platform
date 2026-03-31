import os

exclude_dirs = {'.git', 'node_modules', '.next', '__pycache__', 'alembic'}
exclude_files = {'package-lock.json'}

def process_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return
    
    new_content = content.replace('Safehaul', 'Safehaul').replace('Safehaul', 'safehaul').replace('Safehaul', 'SAFEHAUL')
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {path}")

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file in exclude_files:
            continue
        process_file(os.path.join(root, file))
