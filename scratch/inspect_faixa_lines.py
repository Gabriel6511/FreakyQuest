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
        if "faixa_lee_icon.png" in line:
            print(f"Line {idx+1}: {line.strip()}")
else:
    print("Original app.js not found.")
