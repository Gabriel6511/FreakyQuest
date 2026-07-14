import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

extracted_dir = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new"
diff_files = ["index.html.diff", "styles.css.diff", "app.js.diff"]

for diff_file in diff_files:
    path = os.path.join(extracted_dir, diff_file)
    print("=" * 60)
    print(f"Summary of {diff_file}:")
    print("=" * 60)
    
    if not os.path.exists(path):
        print("Diff file does not exist.")
        continue
        
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    # Group changes into chunks
    chunks = []
    current_chunk = []
    
    for line in lines:
        if line.startswith("@@"):
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = [line]
        elif current_chunk:
            current_chunk.append(line)
            
    if current_chunk:
        chunks.append(current_chunk)
        
    print(f"Total change areas (hunks): {len(chunks)}")
    
    # Print the details of each hunk
    for idx, chunk in enumerate(chunks):
        hunk_header = chunk[0].strip()
        print(f"\n--- Hunk {idx+1}: {hunk_header} ---")
        
        # Count modifications inside this hunk
        adds = [l for l in chunk if l.startswith("+") and not l.startswith("+++")]
        dels = [l for l in chunk if l.startswith("-") and not l.startswith("---")]
        
        print(f"Added {len(adds)} lines, Removed {len(dels)} lines")
        
        # Display the added and removed lines (first few lines of each) safely
        if dels:
            print("  Removed sample:")
            for l in dels[:5]:
                try:
                    print(f"    - {l.strip()[:100]}")
                except Exception:
                    print(f"    - {l.strip()[:100].encode('ascii', errors='backslashreplace').decode('ascii')}")
            if len(dels) > 5:
                print(f"    - ... and {len(dels)-5} more lines")
        if adds:
            print("  Added sample:")
            for l in adds[:5]:
                try:
                    print(f"    + {l.strip()[:100]}")
                except Exception:
                    print(f"    + {l.strip()[:100].encode('ascii', errors='backslashreplace').decode('ascii')}")
            if len(adds) > 5:
                print(f"    + ... and {len(adds)-5} more lines")
    print("\n")
