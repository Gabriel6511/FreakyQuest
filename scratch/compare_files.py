import difflib
import os

def read_file(path):
    # Try reading as binary first to detect BOM
    with open(path, 'rb') as f:
        raw = f.read()
    if raw.startswith(b'\xff\xfe'):
        return raw.decode('utf-16-le').splitlines()
    elif raw.startswith(b'\xfe\xff'):
        return raw.decode('utf-16-be').splitlines()
    
    # Try UTF-8, then UTF-16, then latin-1
    for enc in ['utf-8', 'utf-16-le', 'utf-16', 'latin-1']:
        try:
            content = raw.decode(enc)
            # Check for binary-like strings
            if enc.startswith('utf-16') or '\x00' not in content:
                return content.splitlines()
        except UnicodeDecodeError:
            continue
    return raw.decode('latin-1').splitlines()

def compare_file(current_path, update_path, out_file):
    out_file.write(f"\n==================================================\n")
    out_file.write(f"COMPARING {os.path.basename(current_path)}\n")
    out_file.write(f"==================================================\n")
    
    if not os.path.exists(update_path):
        out_file.write("Update file does not exist!\n")
        return
        
    current_lines = read_file(current_path)
    update_lines = read_file(update_path)
    
    out_file.write(f"Current lines: {len(current_lines)}, Update lines: {len(update_lines)}\n")
    
    diff = list(difflib.unified_diff(current_lines, update_lines, fromfile='current', tofile='update', n=2))
    
    if not diff:
        out_file.write("Files are identical!\n")
        return
        
    added = 0
    removed = 0
    
    added_lines = []
    removed_lines = []
    
    for line in diff:
        if line.startswith('+') and not line.startswith('+++'):
            added += 1
            added_lines.append(line)
        elif line.startswith('-') and not line.startswith('---'):
            removed += 1
            removed_lines.append(line)
                
    out_file.write(f"Total lines added in update: {added}\n")
    out_file.write(f"Total lines removed in update: {removed}\n")
    
    out_file.write("\n--- SAMPLE OF REMOVED LINES (Only in current, NOT in update) ---\n")
    for l in removed_lines[:50]:
        out_file.write(l + "\n")
    if len(removed_lines) > 50:
        out_file.write(f"... and {len(removed_lines) - 50} more lines\n")
        
    out_file.write("\n--- SAMPLE OF ADDED LINES (Only in update, NOT in current) ---\n")
    for l in added_lines[:50]:
        out_file.write(l + "\n")
    if len(added_lines) > 50:
        out_file.write(f"... and {len(added_lines) - 50} more lines\n")

with open('scratch/diff_result.txt', 'w', encoding='utf-8') as out_file:
    compare_file('index.html', 'scratch/temp_zip_extract/index.html', out_file)
    compare_file('app.js', 'scratch/temp_zip_extract/app.js', out_file)
    compare_file('styles.css', 'scratch/temp_zip_extract/styles.css', out_file)

print("Comparison complete with improved encoding detection!")
