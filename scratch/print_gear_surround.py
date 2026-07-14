import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

updated_js = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new\app.js"

if os.path.exists(updated_js):
    with open(updated_js, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    for idx, line in enumerate(lines):
        if "btn-settings-gear" in line:
            start = max(0, idx - 10)
            end = min(len(lines), idx + 15)
            print(f"Lines {start+1}-{end} in updated app.js:")
            print("".join(lines[start:end]))
            print("-" * 60)
else:
    print("Updated app.js file not found.")
