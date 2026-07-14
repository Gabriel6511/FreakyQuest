import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

diff_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new\index.html.diff"

if os.path.exists(diff_path):
    with open(diff_path, "r", encoding="utf-8", errors="ignore") as f:
        print(f.read())
else:
    print("File not found.")
