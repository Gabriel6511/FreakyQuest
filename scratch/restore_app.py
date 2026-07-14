import zipfile
import os
import shutil

zip_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest.zip"
target_extracted = r"freakyquest/app.js"
destination = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\app.js"

if os.path.exists(zip_path):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        # Extract to a temp location first
        temp_dir = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_restore"
        os.makedirs(temp_dir, exist_ok=True)
        zip_ref.extract(target_extracted, temp_dir)
        
        # Copy to destination
        extracted_file = os.path.join(temp_dir, target_extracted)
        shutil.copy2(extracted_file, destination)
        print("Successfully restored original app.js from freakyquest.zip!")
        
        # Clean up temp
        shutil.rmtree(temp_dir)
else:
    print("Zip path does not exist.")
