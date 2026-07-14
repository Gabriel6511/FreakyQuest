with open('app.js', 'r', encoding='utf-8', errors='ignore') as f1:
    orig = f1.read()
with open('scratch/new_update/app.js', 'r', encoding='utf-8', errors='ignore') as f2:
    new_up = f2.read()

# Let's check some comments or structure changes.
# For example, does the zip have any new systems?
import re
print("Let's look at added lines in the zip's app.js:")
# We can find sections or blocks that are unique.
# Let's count occurrences of some words:
words = ['inventory', 'equipment', 'equip', 'showcase', 'reset', 'water', 'mentors']
for w in words:
    c_orig = len(re.findall(r'\b' + w + r'\b', orig, re.I))
    c_new = len(re.findall(r'\b' + w + r'\b', new_up, re.I))
    print(f'Word \"{w}\": original={c_orig}, zip={c_new}')
