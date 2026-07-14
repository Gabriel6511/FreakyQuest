import sys
sys.stdout.reconfigure(encoding='utf-8')
fn = 'scratch/temp_zip_extract/index.html'
with open(fn, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for idx, line in enumerate(lines):
    if 'id="tab-tribute"' in line:
        start_idx = idx
    if start_idx != -1 and '<!-- ========================================== -->' in line:
        end_idx = idx
        break

print(f"Start: {start_idx}, End: {end_idx}")
if start_idx != -1 and end_idx != -1:
    for idx in range(start_idx, end_idx):
        print(f"{lines[idx]}", end="")
