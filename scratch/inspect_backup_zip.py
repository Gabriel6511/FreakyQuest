import zipfile
import os

zip_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest.zip"

if os.path.exists(zip_path):
    print("freakyquest.zip exists!")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        names = zip_ref.namelist()
        print(f"Total files in freakyquest.zip: {len(names)}")
        app_js_files = [n for n in names if "app.js" in n]
        print("app.js occurrences in zip:")
        for name in app_js_files:
            print(f"  - {name}")
else:
    print("freakyquest.zip does not exist.")
