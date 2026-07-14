import os
import sys

# JS balance check
js_path = r"c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\scratch\app_temp.js"
if os.path.exists(js_path):
    js = open(js_path, 'r', encoding='utf-8').read()
    js_braces = js.count('{') - js.count('}')
    js_parens = js.count('(') - js.count(')')
    js_brackets = js.count('[') - js.count(']')
    print(f'JS Temp: braces={js_braces}, parens={js_parens}, brackets={js_brackets}')
    if js_braces != 0: print('  !! JS BRACE MISMATCH !!')
    if js_parens != 0: print('  !! JS PAREN MISMATCH !!')
    if js_brackets != 0: print('  !! JS BRACKET MISMATCH !!')
else:
    print("JS Temp file not found.")
