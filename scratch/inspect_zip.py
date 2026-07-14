import zipfile
import os
import shutil

zip_path = r"C:\Users\SAMSUNG\Downloads\files.zip"
extract_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new"

if os.path.exists(extract_path):
    try:
        shutil.rmtree(extract_path)
    except Exception as e:
        print(f"Warning: Could not remove old extract path: {e}")

os.makedirs(extract_path, exist_ok=True)

print(f"Reading zip: {zip_path}")
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    namelist = zip_ref.namelist()
    print("Files in zip:")
    for name in namelist:
        print(f"  - {name}")
    
    zip_ref.extractall(extract_path)
    print(f"Extracted to: {extract_path}")
