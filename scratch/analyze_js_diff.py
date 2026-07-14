# -*- coding: utf-8 -*-
import sys

# Set output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

with open('app.js', 'r', encoding='utf-8', errors='ignore') as f1:
    orig_js = f1.readlines()
with open('scratch/new_update/app.js', 'r', encoding='utf-8', errors='ignore') as f2:
    new_js = f2.readlines()

import difflib

# Let us find lines in new_js that have additions and see if there are block additions or new features
diff = list(difflib.unified_diff(orig_js, new_js, n=2))
with open('scratch/js_diff_full.txt', 'w', encoding='utf-8') as out:
    out.write(''.join(diff))

print("Total JS diff lines:", len(diff))
