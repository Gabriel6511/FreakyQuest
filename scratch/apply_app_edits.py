import os
import re
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

original_js_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\app.js"
temp_js_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\app_temp.js"

if not os.path.exists(original_js_path):
    print("original app.js not found.")
    sys.exit(1)

with open(original_js_path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# 1. Remove DOM_CACHE, getEl, and selectEl function definitions FIRST
# DOM_CACHE is defined as: const DOM_CACHE = {};
content = content.replace("const DOM_CACHE = {};", "")

# Remove function definitions of getEl and selectEl
getel_def_pattern = r"function getEl\(id\) \{[\s\S]*?return DOM_CACHE\[id\];\s*\}"
content = re.sub(getel_def_pattern, "", content)

selectel_def_pattern = r"function selectEl\(query\) \{[\s\S]*?return DOM_CACHE\[query\];\s*\}"
content = re.sub(selectel_def_pattern, "", content)

# 2. Replace icon paths with emojis
icon_replacements = {
    "faixa_lee_icon.png": "🥋",
    "braceletes_aco_icon.png": "🦾",
    "aura_goku_icon.png": "⚡",
    "cinturao_ouro_icon.png": "🥇",
    "aura_broly_icon.png": "🌋",
    "capa_saitama_icon.png": "🦸"
}

for old_icon, new_emoji in icon_replacements.items():
    content = content.replace(old_icon, new_emoji)
    print(f"Replaced {old_icon} -> {new_emoji}")

# 3. Replace getEl and selectEl calls using regex after definitions are removed
getel_matches = re.findall(r'\bgetEl\((.*?)\)', content)
print(f"Found {len(getel_matches)} calls to getEl(). Replaced them.")
content = re.sub(r'\bgetEl\((.*?)\)', r'document.getElementById(\1)', content)

selectel_matches = re.findall(r'\bselectEl\((.*?)\)', content)
print(f"Found {len(selectel_matches)} calls to selectEl(). Replaced them.")
content = re.sub(r'\bselectEl\((.*?)\)', r'document.querySelector(\1)', content)

# Write to temp file for validation
with open(temp_js_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Temp JS file created at: {temp_js_path}")
