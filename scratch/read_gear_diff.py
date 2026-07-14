import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

diff_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new\index.html.diff"

if os.path.exists(diff_path):
    with open(diff_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    for idx, line in enumerate(lines):
        if "btn-settings-gear" in line:
            start = max(0, idx - 5)
            end = min(len(lines), idx + 10)
            print("".join(lines[start:end]))
else:
    print("File not found.")
