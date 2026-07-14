import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

original_html = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\index.html"

if os.path.exists(original_html):
    with open(original_html, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    print("--- Searching objective-card-img ---")
    for idx, line in enumerate(lines):
        if "objective-card-img" in line:
            print(f"Line {idx+1}: {line.strip()}")
            
    print("\n--- Searching player-avatar-wrapper ---")
    for idx, line in enumerate(lines):
        if "player-avatar-wrapper" in line:
            # Print surrounding lines
            start = max(0, idx - 2)
            end = min(len(lines), idx + 8)
            print("".join(lines[start:end]))
            
    print("\n--- Searching Equipamentos nav button ---")
    for idx, line in enumerate(lines):
        if "Equipamentos" in line:
            print(f"Line {idx+1}: {line.strip()}")
else:
    print("Original index.html not found.")
