with open('scratch/new_update/app.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

import re

# Find each function definition and show its signature and first few lines
matches = re.finditer(r'function\s+(\w+)\s*\((.*?)\)\s*\{', content)
print("=== Functions defined in zip/app.js ===")
for m in matches:
    name = m.group(1)
    # Get first 3 lines of the function body
    start = m.start()
    body_lines = content[start:start+250].split('\n')
    print(f'- {name}({m.group(2)}):')
    for line in body_lines[:4]:
        print(f'    {line.strip()}')
