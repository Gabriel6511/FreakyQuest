import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

diff_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new\app.js.diff"

if not os.path.exists(diff_path):
    print("Diff file not found.")
    sys.exit(1)

with open(diff_path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "icon:" in line and (line.startswith("-") or line.startswith("+")):
        print(f"Line {idx}: {line.strip()}")
