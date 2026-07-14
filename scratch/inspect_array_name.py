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
    
    # Print lines 1740 to 1765
    start = 1739
    end = 1765
    print("".join(lines[start:end]))
else:
    print("Original app.js not found.")
