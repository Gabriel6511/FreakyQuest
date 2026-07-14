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
    if "@@ -2291,26" in line or "updateUI" in line and "@@" in line:
        end = idx + 1
        while end < len(lines) and not lines[end].startswith("@@"):
            end += 1
        print("=" * 60)
        print(f"Hunk: {line.strip()}")
        print("=" * 60)
        print("".join(lines[idx:end]))
        print("\n")
