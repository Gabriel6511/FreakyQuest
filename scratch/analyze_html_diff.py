# -*- coding: utf-8 -*-
import sys

# Set output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8', errors='ignore') as f1:
    orig_html = f1.readlines()
with open('scratch/new_update/index.html', 'r', encoding='utf-8', errors='ignore') as f2:
    new_html = f2.readlines()

import difflib

print("=== HTML CHANGES SUMMARY ===")
diff = list(difflib.unified_diff(orig_html, new_html, n=0))
added_lines = []
removed_lines = []
for line in diff:
    if line.startswith('+') and not line.startswith('+++'):
        added_lines.append(line.strip())
    elif line.startswith('-') and not line.startswith('---'):
        removed_lines.append(line.strip())

print(f"Total HTML additions: {len(added_lines)} lines")
print(f"Total HTML removals: {len(removed_lines)} lines")

# Let's inspect some of the key additions in HTML:
print("\nHTML Additions Sample (up to 30 lines):")
for line in added_lines[:30]:
    print(f"  {line}")

print("\nHTML Removals Sample (up to 30 lines):")
for line in removed_lines[:30]:
    print(f"  {line}")
