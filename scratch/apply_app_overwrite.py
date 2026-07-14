import os
import shutil

src = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\app_temp.js"
dst = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\app.js"

if os.path.exists(src):
    shutil.copy2(src, dst)
    print("Successfully overwrote app.js with updated version!")
else:
    print("Source app_temp.js not found.")
