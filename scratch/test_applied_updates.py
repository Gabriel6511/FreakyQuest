import os
import shutil
import subprocess
import sys

# Ensure UTF-8 output on Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

project_dir = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest"
extracted_dir = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_zip_extract_new"
test_sandbox = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\temp_test_system"

# Clean up sandbox
if os.path.exists(test_sandbox):
    try:
        shutil.rmtree(test_sandbox)
    except Exception as e:
        print(f"Warning: Could not remove old test sandbox: {e}")

os.makedirs(test_sandbox, exist_ok=True)

# Copy original project files
print("Copying original project files to sandbox...")
for item in os.listdir(project_dir):
    s = os.path.join(project_dir, item)
    d = os.path.join(test_sandbox, item)
    if os.path.isdir(s):
        if item in ["scratch", ".git", ".vercel", "__pycache__", ".tmp.driveupload"]:
            continue
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# Apply zip updates
print("Applying updates from zip...")
for filename in ["index.html", "styles.css", "app.js"]:
    src = os.path.join(extracted_dir, filename)
    dst = os.path.join(test_sandbox, filename)
    shutil.copy2(src, dst)

print("Running test_complete_system.py in sandbox...")
result = subprocess.run(
    [sys.executable, "test_complete_system.py"],
    cwd=test_sandbox,
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="ignore"
)

print("\n--- TEST RUN RESULTS ---")
print("Exit Code:", result.returncode)
print("Stdout:")
print(result.stdout)
print("Stderr:")
print(result.stderr)
