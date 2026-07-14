import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

original_js = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\app.js"

if os.path.exists(original_js):
    with open(original_js, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    for idx, line in enumerate(lines):
        if "btn-settings-gear" in line:
            start = max(0, idx - 5)
            end = min(len(lines), idx + 10)
            print(f"Original app.js reference at line {idx+1}:")
            print("".join(lines[start:end]))
            print("-" * 60)
else:
    print("Original app.js not found.")
