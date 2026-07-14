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
    
    idx = content.find("item-acquired-modal")
    if idx != -1:
        print("Found item-acquired-modal references. Printing:")
        # Print surrounding context (2 references)
        start = max(0, idx - 500)
        end = min(len(content), idx + 1500)
        print(content[start:end])
    else:
        print("item-acquired-modal not found.")
else:
    print("Original app.js not found.")
