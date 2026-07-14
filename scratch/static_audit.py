# -*- coding: utf-8 -*-
"""Auditoria estatica cruzada JS <-> HTML <-> CSS para FreakyQuest."""
import re, os, collections, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
js = (ROOT / "app.js").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")

findings = []
def add(sev, cat, msg):
    findings.append((sev, cat, msg))

# ---- 1. IDs no HTML ----
html_ids = set(re.findall(r'\bid="([^"]+)"', html))

# ---- 2. getElementById em JS ----
js_getbyid = set(re.findall(r"getElementById\(\s*['\"]([^'\"]+)['\"]", js))
# querySelector('#id') simples
js_qs_id = set(re.findall(r"querySelector(?:All)?\(\s*['\"]#([A-Za-z0-9_\-]+)['\"]\s*\)", js))

# IDs referenciados no JS mas nao existentes no HTML (potenciais null refs)
# Alguns IDs sao criados dinamicamente; marcamos como aviso.
dynamic_ok = set()
for i in sorted((js_getbyid | js_qs_id) - html_ids):
    # heuristica: ignora ids claramente dinamicos (com template literal ja removido)
    add("P2", "JS->HTML", f"getElementById('{i}') sem id correspondente estatico no HTML (verificar criacao dinamica)")

# IDs no HTML nunca referenciados por JS nem CSS (possivel morto) - apenas informativo
css_id_refs = set(re.findall(r'#([A-Za-z0-9_\-]+)', css))
for i in sorted(html_ids):
    if i not in js_getbyid and i not in js_qs_id and i not in css_id_refs:
        # ainda pode ser usado via data-attr/label - informativo baixo
        add("P3", "HTML-id-orfao", f"id='{i}' nunca referenciado em JS/CSS (possivel morto)")

# ---- 3. onclick / on* inline handlers no HTML -> funcoes definidas no JS ----
inline_handlers = re.findall(r'on\w+="([^"]+)"', html)
func_calls = set()
for h in inline_handlers:
    for m in re.findall(r'([A-Za-z_$][A-Za-z0-9_$]*)\s*\(', h):
        func_calls.add(m)
# funcoes definidas no JS
defined = set(re.findall(r'function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(', js))
defined |= set(re.findall(r'(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(', js))
defined |= set(re.findall(r'(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?function', js))
window_assigned = set(re.findall(r'window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=', js))
builtins = {'if','for','while','switch','return','alert','confirm','console','parseInt','parseFloat','Math','JSON','Number','String','Boolean','Array','event','setTimeout'}
for fn in sorted(func_calls):
    if fn in builtins: continue
    if fn not in defined and fn not in window_assigned:
        add("P1", "onclick-orfao", f"handler inline chama '{fn}()' nao definido/exportado em JS")

# ---- 4. Imagens referenciadas ----
img_refs = set(re.findall(r"['\"]([\w\-]+\.(?:png|jpg|jpeg|gif|webp|svg))['\"]", js))
img_refs |= set(re.findall(r'src="([\w\-]+\.(?:png|jpg|jpeg|gif|webp|svg))"', html))
for img in sorted(img_refs):
    if not (ROOT / img).exists():
        add("P1", "img-faltando", f"imagem referenciada '{img}' nao existe no projeto")

# ---- 5. Temas de mentor: theme-<id> deve existir no CSS ----
mentor_ids = re.findall(r"id:\s*'([a-z0-9]+)',\s*\n\s*name:", js)
themes_in_css = set(re.findall(r'body\.(theme-[a-z0-9]+)', css))
for mid in mentor_ids:
    if f"theme-{mid}" not in themes_in_css:
        add("P2", "tema-faltando", f"mentor '{mid}' sem body.theme-{mid} no CSS")

# ---- 6. localStorage keys usadas ----
ls_keys = set(re.findall(r"localStorage\.(?:get|set|remove)Item\(\s*['\"]([^'\"]+)['\"]", js))
add("INFO", "localStorage", f"chaves usadas: {sorted(ls_keys)}")

# ---- 7. addEventListener em ids: verificar getElementById(...).addEventListener sem guard ----
# padrao perigoso: document.getElementById('x').addEventListener  (sem checagem null)
unguarded = re.findall(r"getElementById\(\s*['\"]([^'\"]+)['\"]\s*\)\.(addEventListener|value|click|checked|classList|textContent|innerHTML|style)", js)
unguarded_ids = collections.Counter(i for i,_ in unguarded)
for i, c in unguarded_ids.items():
    if i not in html_ids:
        add("P1", "null-ref", f"getElementById('{i}').<prop> acessado direto mas id NAO existe no HTML -> TypeError")

# ---- 8. Duplicated function definitions ----
fdefs = re.findall(r'function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(', js)
dupfn = [f for f,c in collections.Counter(fdefs).items() if c > 1]
for f in dupfn:
    add("P2", "func-duplicada", f"funcao '{f}' definida {collections.Counter(fdefs)[f]}x (a ultima sobrescreve)")

# ---- 9. console.log/debugger deixados ----
n_console = len(re.findall(r'\bconsole\.(log|debug)\(', js))
n_debugger = len(re.findall(r'\bdebugger\b', js))
if n_console: add("P3", "limpeza", f"{n_console} console.log/debug no app.js")
if n_debugger: add("P2", "limpeza", f"{n_debugger} 'debugger' no app.js")

# ---- 10. data-tab valores vs abas ----
data_tabs = set(re.findall(r'data-tab="([^"]+)"', html))
tab_ids = set(re.findall(r'id="tab-([^"]+)"', html))
for t in data_tabs:
    if t not in tab_ids:
        add("P1", "nav-tab", f"nav data-tab='{t}' sem painel #tab-{t}")

# ---- Saida ----
order = {"P0":0,"P1":1,"P2":2,"P3":3,"INFO":4}
findings.sort(key=lambda x: order.get(x[0],9))
counts = collections.Counter(f[0] for f in findings)
print("== RESUMO ==", dict(counts))
print("HTML ids:", len(html_ids), "| JS getElementById unicos:", len(js_getbyid), "| mentores:", len(mentor_ids))
print("-"*70)
for sev, cat, msg in findings:
    print(f"[{sev}] ({cat}) {msg}")
