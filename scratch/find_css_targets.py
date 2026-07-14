import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

original_css = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\styles.css"

if os.path.exists(original_css):
    with open(original_css, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    targets = [".nav-item {", ".nav-icon {", ".nav-item span {"]
    for target in targets:
        print(f"--- Searching '{target}' ---")
        for idx, line in enumerate(lines):
            if target in line:
                start = idx
                end = min(len(lines), idx + 10)
                print(f"Line {idx+1}:")
                print("".join(lines[start:end]))
                print("-" * 40)
else:
    print("Original styles.css not found.")
