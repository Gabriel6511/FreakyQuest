import re

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f1:
    orig = f1.read()
with open('scratch/new_update/index.html', 'r', encoding='utf-8', errors='ignore') as f2:
    new_up = f2.read()

orig_ids = set(re.findall(r'id=["\']([a-zA-Z0-9_-]+)["\']', orig))
new_ids = set(re.findall(r'id=["\']([a-zA-Z0-9_-]+)["\']', new_up))

print('Added IDs in zip index.html:')
for i in sorted(list(new_ids - orig_ids)):
    print(f'  - {i}')

print('\nRemoved IDs in zip index.html:')
for i in sorted(list(orig_ids - new_ids)):
    print(f'  - {i}')
