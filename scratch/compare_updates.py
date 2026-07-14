import difflib
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

project_dir = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest"
extracted_dir = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new"

files_to_compare = ["index.html", "styles.css", "app.js"]

for filename in files_to_compare:
    original_path = os.path.join(project_dir, filename)
    updated_path = os.path.join(extracted_dir, filename)
    
    print("=" * 60)
    print(f"Comparing: {filename}")
    print("=" * 60)
    
    if not os.path.exists(original_path):
        print(f"Original file {filename} does not exist in workspace root!")
        continue
    if not os.path.exists(updated_path):
        print(f"Updated file {filename} does not exist in extracted files!")
        continue
        
    orig_size = os.path.getsize(original_path)
    upd_size = os.path.getsize(updated_path)
    print(f"Original size: {orig_size} bytes")
    print(f"Updated size:  {upd_size} bytes")
    print(f"Size diff:     {upd_size - orig_size} bytes")
    
    with open(original_path, "r", encoding="utf-8", errors="ignore") as f:
        orig_lines = f.readlines()
    with open(updated_path, "r", encoding="utf-8", errors="ignore") as f:
        upd_lines = f.readlines()
        
    diff = list(difflib.unified_diff(orig_lines, upd_lines, fromfile=f"original/{filename}", tofile=f"updated/{filename}", n=3))
    
    added_lines = 0
    removed_lines = 0
    for line in diff:
        if line.startswith("+") and not line.startswith("+++"):
            added_lines += 1
        elif line.startswith("-") and not line.startswith("---"):
            removed_lines += 1
            
    print(f"Diff stats: +{added_lines} lines, -{removed_lines} lines")
    
    # Save diff to scratch
    diff_output_path = os.path.join(extracted_dir, f"{filename}.diff")
    with open(diff_output_path, "w", encoding="utf-8") as f:
        f.writelines(diff)
    print(f"Saved detailed diff to: scratch/temp_zip_extract_new/{filename}.diff")
    
    # Print a quick preview of the diff (first 30 lines) safely
    if len(diff) > 0:
        print("\nDiff Preview (first 30 lines):")
        for line in diff[:30]:
            try:
                print(line, end="")
            except Exception:
                # Fallback to ascii representation if printing still fails
                print(line.encode('ascii', errors='backslashreplace').decode('ascii'), end="")
        if len(diff) > 30:
            print("...")
    else:
        print("Files are identical!")
    print("\n")
