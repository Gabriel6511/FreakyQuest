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
    
    # Let's search for the definitions
    for name in ["getEl", "selectEl"]:
        idx = content.find(f"const {name}")
        if idx == -1:
            idx = content.find(f"function {name}")
        if idx != -1:
            print(f"Found {name} definition:")
            print(content[idx:idx+300])
        else:
            print(f"Definition of {name} not found.")
        print("-" * 60)
else:
    print("Original app.js not found.")
