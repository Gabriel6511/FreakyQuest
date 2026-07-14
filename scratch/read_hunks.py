import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

diff_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new\app.js.diff"

if not os.path.exists(diff_path):
    print("Diff file not found.")
    sys.exit(1)

with open(diff_path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

def print_hunk_by_header(header_substring):
    found = False
    for idx, line in enumerate(lines):
        if line.startswith("@@") and header_substring in line:
            found = True
            print("=" * 60)
            print(f"Hunk matching {header_substring}:")
            print("=" * 60)
            # print up to next @@
            start = idx
            end = idx + 1
            while end < len(lines) and not lines[end].startswith("@@"):
                end += 1
            print("".join(lines[start:end]))
            print("\n")
            
# Let's inspect some of the specific hunks:
# Hunk 25: @@ -2924,93 +2977,6 @@ (Removed eternal flame)
print_hunk_by_header("2924,93")

# Hunk 27: @@ -4050,162 +4016,7 @@ (Removed selectedHistoryDate / dailyHistory)
print_hunk_by_header("4050,162")

# Hunk 32: @@ -4361,279 +4130,22 @@ (SVG chart hover guide & tooltip engine)
print_hunk_by_header("4361,279")
