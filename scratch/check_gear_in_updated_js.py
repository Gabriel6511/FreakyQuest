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
        content = f.read()
    if "btn-settings-gear" in content:
        print("Found btn-settings-gear in updated app.js!")
    else:
        print("btn-settings-gear NOT found in updated app.js.")
else:
    print("Updated app.js file not found.")
