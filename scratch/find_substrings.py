filepath = r'c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\app.js'
with open(filepath, 'r', encoding='latin-1') as f:
    content = f.read()

def find_context_repr(query, length=500):
    idx = content.find(query)
    if idx == -1:
        print(f"QUERY NOT FOUND: {repr(query)}")
    else:
        print(f"FOUND QUERY AT INDEX {idx}:")
        print("----------------------------------------")
        print(repr(content[idx:idx+length]))
        print("----------------------------------------")

print("Checking FOCUS_BONUS_EXERCISES repr:")
find_context_repr("const FOCUS_BONUS_EXERCISES = {")
