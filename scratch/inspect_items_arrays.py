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
    
    # Find EQUIPMENT_DATABASE
    idx = content.find("EQUIPMENT_DATABASE")
    if idx != -1:
        print("Found EQUIPMENT_DATABASE in original app.js. Printing surrounding:")
        print(content[idx:idx+1500])
    else:
        print("EQUIPMENT_DATABASE not found.")
    print("-" * 60)
    
    # Find LEVEL_REWARDS
    idx = content.find("LEVEL_REWARDS")
    if idx != -1:
        print("Found LEVEL_REWARDS in original app.js. Printing surrounding:")
        print(content[idx:idx+1500])
    else:
        print("LEVEL_REWARDS not found.")
else:
    print("Original app.js not found.")
