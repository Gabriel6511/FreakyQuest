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
    
    # Search for function updateUI
    idx = content.find("function updateUI()")
    if idx != -1:
        print("Found updateUI() in original app.js. Printing first 100 lines of it:")
        print(content[idx:idx+2500])
    else:
        print("function updateUI() not found in original app.js.")
else:
    print("Original app.js not found.")
