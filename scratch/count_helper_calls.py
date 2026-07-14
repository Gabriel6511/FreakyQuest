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
        content = f.read()
    
    getel_count = content.count("getEl(")
    selectel_count = content.count("selectEl(")
    print(f"Total calls to getEl(): {getel_count}")
    print(f"Total calls to selectEl(): {selectel_count}")
else:
    print("Original app.js not found.")
