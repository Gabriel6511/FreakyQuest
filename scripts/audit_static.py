# -*- coding: utf-8 -*-
"""
Auditoria estatica do FreakyQuest: cruza JS <-> HTML <-> CSS <-> manifest
sem abrir navegador. Roda em segundos, nao precisa de servidor.

USO: parte do `python scripts/audit_all.py`. Ver docs/QA.md.

Severidades:
  P0 = quebra o app        P1 = bug real pro usuario
  P2 = risco / inconsistencia   P3 = limpeza    INFO = so informacao
"""
import re
import sys
import json
import collections
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
html = (ROOT / "index.html").read_text(encoding="utf-8")
css = (ROOT / "styles.css").read_text(encoding="utf-8")

# O antigo app.js virou js/app-NN-*.js (14 partes, mesmo escopo global).
# Aqui eles sao concatenados na ordem pra analise — e exatamente o que o
# navegador ve, ja que sao scripts classicos carregados em sequencia.
PARTES = sorted((ROOT / "js").glob("app-*.js"))
if not PARTES:
    print("ERRO: nenhum arquivo em js/app-*.js")
    sys.exit(2)

_pedacos = []
_mapa = []  # (linha_inicial_no_concatenado, nome_do_arquivo)
_linha = 1
for p in PARTES:
    txt = p.read_text(encoding="utf-8")
    _mapa.append((_linha, p.name))
    _pedacos.append(txt)
    _linha += txt.count("\n") + 1
js = "\n".join(_pedacos)


def onde(linha_global):
    """Converte linha do JS concatenado em 'arquivo:linha' real."""
    arq, base = _mapa[0][1], _mapa[0][0]
    for ini, nome in _mapa:
        if ini <= linha_global:
            arq, base = nome, ini
        else:
            break
    return f"js/{arq}:{linha_global - base + 1}"

findings = []


def add(sev, cat, msg):
    findings.append((sev, cat, msg))


# ---- 1. IDs: HTML x JS ----
html_ids = set(re.findall(r'\bid="([^"]+)"', html))
js_getbyid = set(re.findall(r"getElementById\(\s*['\"]([^'\"]+)['\"]", js))
js_qs_id = set(re.findall(r"querySelector(?:All)?\(\s*['\"]#([A-Za-z0-9_\-]+)['\"]\s*\)", js))

for i in sorted((js_getbyid | js_qs_id) - html_ids):
    add("P2", "JS->HTML", f"getElementById('{i}') sem id estatico no HTML (verificar criacao dinamica)")

css_id_refs = set(re.findall(r'#([A-Za-z0-9_\-]+)', css))
for i in sorted(html_ids):
    if i not in js_getbyid and i not in js_qs_id and i not in css_id_refs:
        add("P3", "HTML-id-orfao", f"id='{i}' nunca referenciado em JS/CSS (possivel morto)")

# ---- 2. Handlers inline (onclick=) apontando pra funcao inexistente ----
inline_handlers = re.findall(r'on\w+="([^"]+)"', html)
func_calls = set()
for h in inline_handlers:
    for m in re.findall(r'([A-Za-z_$][A-Za-z0-9_$]*)\s*\(', h):
        func_calls.add(m)

defined = set(re.findall(r'function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(', js))
defined |= set(re.findall(r'(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(', js))
defined |= set(re.findall(r'(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?function', js))
window_assigned = set(re.findall(r'window\.([A-Za-z_$][A-Za-z0-9_$]*)\s*=', js))
builtins = {
    'if', 'for', 'while', 'switch', 'return', 'alert', 'confirm', 'console',
    'parseInt', 'parseFloat', 'Math', 'JSON', 'Number', 'String', 'Boolean',
    'Array', 'event', 'setTimeout', 'this',
}
for fn in sorted(func_calls):
    if fn in builtins:
        continue
    if fn not in defined and fn not in window_assigned:
        add("P1", "onclick-orfao", f"handler inline chama '{fn}()' nao definido/exportado em JS")

# ---- 3. Imagens referenciadas existem? ----
img_refs = set(re.findall(r"['\"]([\w\-]+\.(?:png|jpg|jpeg|gif|webp|svg))['\"]", js))
img_refs |= set(re.findall(r'src="([\w\-]+\.(?:png|jpg|jpeg|gif|webp|svg))"', html))
for img in sorted(img_refs):
    if not (ROOT / img).exists():
        add("P1", "img-faltando", f"imagem referenciada '{img}' nao existe no projeto")

# ---- 4. Tema de mentor sem CSS ----
mentor_ids = re.findall(r"id:\s*'([a-z0-9]+)',\s*\n\s*name:", js)
themes_in_css = set(re.findall(r'body\.(theme-[a-z0-9]+)', css))
for mid in mentor_ids:
    if f"theme-{mid}" not in themes_in_css:
        add("P2", "tema-faltando", f"mentor '{mid}' sem body.theme-{mid} no CSS")

# ---- 5. Acesso direto sem guard de null ----
unguarded = re.findall(
    r"getElementById\(\s*['\"]([^'\"]+)['\"]\s*\)\.(addEventListener|value|click|checked|classList|textContent|innerHTML|style)",
    js,
)
for i, _ in collections.Counter(i for i, _ in unguarded).items():
    if i not in html_ids:
        add("P1", "null-ref", f"getElementById('{i}').<prop> direto mas id NAO existe no HTML -> TypeError")

# ---- 6. Funcao duplicada (a ultima sobrescreve silenciosamente) ----
fdefs = re.findall(r'function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(', js)
fcount = collections.Counter(fdefs)
for f, c in fcount.items():
    if c > 1:
        add("P2", "func-duplicada", f"funcao '{f}' definida {c}x (a ultima sobrescreve)")

# ---- 7. Sobras de debug ----
n_console = len(re.findall(r'\bconsole\.(log|debug)\(', js))
n_debugger = len(re.findall(r'\bdebugger\b', js))
if n_console:
    add("P3", "limpeza", f"{n_console} console.log/debug nos js/app-*.js")
if n_debugger:
    add("P2", "limpeza", f"{n_debugger} 'debugger' nos js/app-*.js")

# ---- 8. Navegacao: data-tab sem painel ----
data_tabs = set(re.findall(r'data-tab="([^"]+)"', html))
tab_ids = set(re.findall(r'id="tab-([^"]+)"', html))
for t in data_tabs:
    if t not in tab_ids:
        add("P1", "nav-tab", f"nav data-tab='{t}' sem painel #tab-{t}")

# ================= NOVAS CHECAGENS (2026-08) =================

# ---- 9. XSS: innerHTML com interpolacao de dado que o USUARIO digita ----
#
# Regra pratica: so e XSS se o texto puder vir do usuario. Nomes de mentor,
# item, trofeu e quest sao constantes do codigo — nao contam. Os campos
# realmente digitados estao em USER_INPUT abaixo; se voce criar um campo de
# texto novo, ADICIONE ELE AQUI, senao esta checagem nao vai te proteger.
USER_INPUT = [
    r'\bnickname\b', r'\bapelido\b',
    r'\bemail\b',
    r'userProfile\.name', r'state\.name\b',
    r'\bcustomTitle\b', r'\bcustom_title\b',
    r'customEx\w*\.name', r'customFood\w*\.name',
    r'\bp\.nickname\b', r'\bu\.apelido\b', r'\bdata\.nickname\b',
]
SAFE_WRAPPERS = r'^(escapeHtml|esc)\s*\('

for m in re.finditer(r'\.innerHTML\s*=\s*`((?:[^`\\]|\\.)*)`', js, re.S):
    bloco = m.group(1)
    linha = js[: m.start()].count("\n") + 1
    for expr in re.findall(r'\$\{([^}]+)\}', bloco):
        e = expr.strip()
        if re.match(SAFE_WRAPPERS, e):
            continue
        if any(re.search(p, e, re.I) for p in USER_INPUT):
            add("P1", "xss", f"{onde(linha)} innerHTML interpola dado do usuario '{e[:60]}' sem escapeHtml()")

# Campo de texto novo no HTML que ainda nao esta na lista USER_INPUT acima:
# avisa pra voce decidir se precisa escapar quando renderizar.
campos_texto = set(re.findall(r'<input[^>]+type="text"[^>]+id="([^"]+)"', html))
campos_texto |= set(re.findall(r'<textarea[^>]+id="([^"]+)"', html))
nao_mapeados = [
    c for c in sorted(campos_texto)
    if not any(re.search(p.strip(r'\b'), c, re.I) for p in USER_INPUT)
]
if nao_mapeados:
    add("INFO", "xss", f"campos de texto nao mapeados em USER_INPUT (revisar se viram innerHTML): {nao_mapeados[:12]}")

# ---- 10. PWA: manifest coerente com os arquivos ----
try:
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    icons = manifest.get("icons", [])
    sizes = {i.get("sizes") for i in icons}
    purposes = {i.get("purpose") for i in icons}
    for i in icons:
        src = i.get("src", "")
        if src and not (ROOT / src).exists():
            add("P0", "pwa", f"manifest aponta icone inexistente: {src}")
    if "192x192" not in sizes:
        add("P1", "pwa", "manifest sem icone 192x192 (alguns Android nao instalam bem)")
    if "512x512" not in sizes:
        add("P1", "pwa", "manifest sem icone 512x512 (splash screen)")
    if "maskable" not in purposes:
        add("P2", "pwa", "manifest sem icone purpose=maskable (icone pode sair cortado)")
    for campo in ("name", "short_name", "start_url", "display", "theme_color"):
        if not manifest.get(campo):
            add("P1", "pwa", f"manifest sem campo obrigatorio '{campo}'")
except FileNotFoundError:
    add("P0", "pwa", "manifest.json nao encontrado")
except json.JSONDecodeError as e:
    add("P0", "pwa", f"manifest.json invalido: {e}")

# ---- 11. Service worker: assets do cache existem + versao bateu ----
sw_path = ROOT / "sw.js"
if sw_path.exists():
    sw = sw_path.read_text(encoding="utf-8")
    cache_name = re.search(r"CACHE_NAME\s*=\s*['\"]([^'\"]+)['\"]", sw)
    add("INFO", "sw", f"CACHE_NAME atual: {cache_name.group(1) if cache_name else '???'}")
    for asset in re.findall(r"['\"]\./([\w\-./]+\.\w+)['\"]", sw):
        if not (ROOT / asset).exists():
            add("P1", "sw", f"service worker tenta cachear arquivo inexistente: {asset}")
else:
    add("P2", "sw", "sw.js nao encontrado (PWA nao funciona offline)")

# ---- 12. Acessibilidade estatica basica ----
for m in re.finditer(r'<img\b((?:[^>](?!/>))*?)>', html, re.S):
    attrs = m.group(1)
    if 'alt=' not in attrs:
        linha = html[: m.start()].count("\n") + 1
        add("P2", "a11y", f"index.html:{linha} <img> sem atributo alt")

botoes_sem_texto = 0
for m in re.finditer(r'<button\b([^>]*)>(.*?)</button>', html, re.S):
    attrs, conteudo = m.group(1), m.group(2)
    texto = re.sub(r'<[^>]+>', '', conteudo).strip()
    tem_label = 'aria-label=' in attrs or 'title=' in attrs
    # so emoji/icone tambem conta como "sem texto acessivel"
    so_simbolo = bool(texto) and len(texto) <= 2 and not texto.isalnum()
    if (not texto or so_simbolo) and not tem_label:
        botoes_sem_texto += 1
if botoes_sem_texto:
    add("P2", "a11y", f"{botoes_sem_texto} <button> sem texto nem aria-label (leitor de tela nao anuncia)")

if 'lang=' not in html[:400]:
    add("P2", "a11y", "<html> sem atributo lang (afeta leitor de tela e traducao)")

if not re.search(r'<meta[^>]+name="viewport"', html):
    add("P0", "a11y", "index.html sem <meta viewport> (quebra layout mobile)")

# ---- 13. Segredos: nada alem da chave publica pode vazar ----
for padrao, nome in [
    (r'service_role', 'service_role key'),
    (r'\bsb_secret_\w+', 'chave secreta Supabase'),
    (r'\beyJ[\w\-]{20,}\.[\w\-]{20,}\.[\w\-]{10,}', 'JWT hardcoded'),
    (r'\bsk-[A-Za-z0-9]{20,}', 'chave de API estilo OpenAI'),
]:
    for arquivo, conteudo in (("js/app-*.js", js), ("index.html", html), ("admin.html", (ROOT / "admin.html").read_text(encoding="utf-8") if (ROOT / "admin.html").exists() else "")):
        if re.search(padrao, conteudo):
            add("P0", "segredo", f"{arquivo} contem possivel {nome} — NUNCA commitar isso")

# ---- 14. localStorage: informativo ----
ls_keys = set(re.findall(r"localStorage\.(?:get|set|remove)Item\(\s*['\"]([^'\"]+)['\"]", js))
add("INFO", "localStorage", f"chaves usadas: {sorted(ls_keys)}")

# ---- Saida ----
order = {"P0": 0, "P1": 1, "P2": 2, "P3": 3, "INFO": 4}
findings.sort(key=lambda x: order.get(x[0], 9))
counts = collections.Counter(f[0] for f in findings)

print("== AUDITORIA ESTATICA ==", dict(counts))
print(f"HTML ids: {len(html_ids)} | getElementById unicos: {len(js_getbyid)} | mentores: {len(mentor_ids)}")
print("-" * 70)
for sev, cat, msg in findings:
    print(f"[{sev}] ({cat}) {msg}")

# Exit code: 1 se houver P0 ou P1 (bloqueia deploy)
bloqueantes = counts.get("P0", 0) + counts.get("P1", 0)
if bloqueantes:
    print(f"\n>> {bloqueantes} problema(s) bloqueante(s) (P0/P1).")
sys.exit(1 if bloqueantes else 0)
