import re

def get_functions_and_consts(file_path):
    with open(file_path, 'rb') as f:
        raw = f.read()
    # Decode depending on BOM
    if raw.startswith(b'\xff\xfe'):
        content = raw.decode('utf-16-le')
    elif raw.startswith(b'\xfe\xff'):
        content = raw.decode('utf-16-be')
    else:
        for enc in ['utf-8', 'latin-1']:
            try:
                content = raw.decode(enc)
                break
            except:
                continue
                
    functions = re.findall(r'function\s+(\w+)', content)
    consts = re.findall(r'const\s+(\w+)\s*=', content)
    lets = re.findall(r'let\s+(\w+)\s*=', content)
    return set(functions), set(consts), set(lets)

curr_funcs, curr_consts, curr_lets = get_functions_and_consts('app.js')
zip_funcs, zip_consts, zip_lets = get_functions_and_consts('scratch/temp_zip_extract/app.js')

print("=== FUNCTIONS ONLY IN CURRENT ===")
for f in sorted(curr_funcs - zip_funcs):
    print(f" - {f}()")
    
print("\n=== FUNCTIONS ONLY IN ZIP (NEW) ===")
for f in sorted(zip_funcs - curr_funcs):
    print(f" - {f}()")

print("\n=== CONSTANTS ONLY IN CURRENT ===")
for c in sorted(curr_consts - zip_consts):
    print(f" - {c}")
    
print("\n=== CONSTANTS ONLY IN ZIP (NEW) ===")
for c in sorted(zip_consts - curr_consts):
    print(f" - {c}")

print("\n=== LETS ONLY IN CURRENT ===")
for l in sorted(curr_lets - zip_lets):
    print(f" - {l}")
    
print("\n=== LETS ONLY IN ZIP (NEW) ===")
for l in sorted(zip_lets - curr_lets):
    print(f" - {l}")
