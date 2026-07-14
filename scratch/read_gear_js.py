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
    if "btn-settings-gear" in line or "settings-gear" in line:
        start = max(0, idx - 5)
        end = min(len(lines), idx + 10)
        print("=" * 60)
        print(f"Hunk at line {idx}:")
        print("=" * 60)
        print("".join(lines[start:end]))
