import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

extracted_dir = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new"
os.chdir(extracted_dir)

# Read validate.py from original directory and run it on the extracted files
validate_file_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\validate.py"

with open(validate_file_path, "r", encoding="utf-8") as f:
    validate_code = f.read()

# We need to run the validation code, but make sure it checks the files in the current (extracted) directory.
# Let's execute the validation code.
exec(validate_code, {"__name__": "__main__", "open": open, "print": print, "sys": sys, "os": os})
