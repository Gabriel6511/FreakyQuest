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
    
    # Search for icon usage in the equipment list rendering
    idx = content.find("EQUIPMENT_DATABASE.forEach")
    if idx != -1:
        print("Found EQUIPMENT_DATABASE render block. Printing:")
        print(content[idx:idx+1500])
    else:
        print("EQUIPMENT_DATABASE.forEach not found.")
else:
    print("Original app.js not found.")
