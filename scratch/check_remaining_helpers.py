import os
import sys

js_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\app_temp.js"
if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # We want to check if the words "getEl" or "selectEl" are still in the content as isolated words/function names
    import re
    getel_remaining = re.findall(r'\bgetEl\b', content)
    selectel_remaining = re.findall(r'\bselectEl\b', content)
    
    print(f"Remaining getEl count: {len(getel_remaining)}")
    print(f"Remaining selectEl count: {len(selectel_remaining)}")
    
    if len(getel_remaining) > 0:
        print("getEl occurrences remaining:")
        for idx, line in enumerate(content.splitlines()):
            if "getEl" in line:
                print(f"Line {idx+1}: {line}")
                
    if len(selectel_remaining) > 0:
        print("selectEl occurrences remaining:")
        for idx, line in enumerate(content.splitlines()):
            if "selectEl" in line:
                print(f"Line {idx+1}: {line}")
else:
    print("JS Temp file not found.")
