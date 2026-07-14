# -*- coding: utf-8 -*-
import sys

# Set output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/js_diff_full.txt', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Let's group consecutive added blocks (+) and removed blocks (-)
added_blocks = []
current_block = []
for line in lines:
    if line.startswith('+') and not line.startswith('+++'):
        current_block.append(line[1:])
    else:
        if current_block:
            added_blocks.append(''.join(current_block))
            current_block = []
if current_block:
    added_blocks.append(''.join(current_block))

print(f"Number of added code blocks in JS: {len(added_blocks)}")
# Show some large added blocks (larger than 10 lines)
for i, block in enumerate(added_blocks):
    block_lines = block.split('\n')
    if len(block_lines) > 15:
        print(f"\n--- Added Block {i} ({len(block_lines)} lines) ---")
        for bl in block_lines[:8]:
            print(f"  {bl}")
        print("  ...")
        for bl in block_lines[-8:]:
            print(f"  {bl}")
