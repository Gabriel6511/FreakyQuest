# -*- coding: utf-8 -*-
import re
import shutil

print("=== INICIANDO MESCLAGEM INTELIGENTE ===")

# --- 1. RESTAURANDO / PRESERVANDO ARQUIVOS ATUAIS COMO BASE ---
# Copiaremos a versão atual como base, depois aplicaremos as mudanças cirurgicamente.

# --- 2. INDEX.HTML ---
# Precisamos garantir que os novos elementos do ZIP sejam incorporados,
# mas mantendo o painel de anéis de atividade, o calendário histórico e o tooltip.
with open('index.html', 'r', encoding='utf-8', errors='ignore') as f:
    current_html = f.read()

with open('scratch/new_update/index.html', 'r', encoding='utf-8', errors='ignore') as f:
    zip_html = f.read()

# No ZIP, o "Painel de Fitness & Evolução" foi reduzido a apenas a div de gráfico minimalista.
# Vamos substituir de volta pela nossa versão completa de fitness dashboard + anéis + calendário + tooltip.
# Vamos extrair do current_html o bloco da chart-card glass-panel atualizado.
chart_card_pattern = r'<!-- Painel de Fitness & Evolução -->.*?<!-- FIM Painel de Fitness & Evolução -->|<!-- Painel de Fitness & Evolução -->.*?<!-- FIM Calendário -->'
# Let's find exactly the current html block that starts with "<!-- Painel de Fitness & Evolução -->" and goes up to the end of the calendar (or includes calendar).
# Let's see:
start_idx = current_html.find('<!-- Painel de Fitness & Evolução -->')
end_idx = current_html.find('<!-- Calendário de Atividades (Histórico Mensal estilo Apple Fitness) -->')
# We need to include the calendar and the closing div after it. Let's find the closing div of the calendar block.
calendar_start = current_html.find('<!-- Calendário de Atividades (Histórico Mensal estilo Apple Fitness) -->')
calendar_end_anchor = '<!-- Ficha de Treinos -->' # usually next major section or bottom nav
# Let's inspect the tags around calendar in current_html:
print("Start Index:", start_idx)
print("Calendar Index:", calendar_start)

# Let's write a python function to carefully transplant the missing/replaced sections.
# In the ZIP index.html, they replaced the whole chart-card + rings + calendar with just:
# <div class="chart-card glass-panel" style="margin-top: 15px; margin-bottom: 15px; padding: 16px;">
#   <h3 style="color: var(--color-primary); font-size: 0.95rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
#     📈 Histórico de Evolução
#   </h3>
#   ...
# </div>
#
# Let's search zip_html for this block:
zip_chart_start = zip_html.find('<div class="chart-card glass-panel" style="margin-top: 15px; margin-bottom: 15px; padding: 16px;">')
zip_chart_end = zip_html.find('<!-- Ficha de Treinos -->', zip_chart_start)
if zip_chart_end == -1:
    zip_chart_end = zip_html.find('<div id="tab-workouts"', zip_chart_start)

print("Zip Chart Start:", zip_chart_start)
print("Zip Chart End:", zip_chart_end)

# In current_html, the block starts at '<!-- Painel de Fitness & Evolução -->' and goes until the element before the next tab (Treinos tab/nav/or elements).
# Let's find the exact block in current_html:
curr_chart_start = current_html.find('<!-- Painel de Fitness & Evolução -->')
curr_chart_end = current_html.find('<!-- Ficha de Treinos -->')
if curr_chart_end == -1:
    curr_chart_end = current_html.find('<div id="tab-workouts"')

print("Current Chart Start:", curr_chart_start)
print("Current Chart End:", curr_chart_end)

if curr_chart_start != -1 and curr_chart_end != -1 and zip_chart_start != -1 and zip_chart_end != -1:
    # We replace the new simplified chart card in the ZIP HTML with our complete current chart card + rings + calendar + tooltip
    transplanted_html = zip_html[:zip_chart_start] + current_html[curr_chart_start:curr_chart_end] + zip_html[zip_chart_end:]
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(transplanted_html)
    print("[OK] index.html mesclado com sucesso, preservando Anéis e Calendário!")
else:
    print("[ERROR] Falha ao localizar seções de transplante no index.html")

# --- 3. STYLES.CSS ---
# Em styles.css do ZIP, a seção correspondente aos Anéis de Fitness e Premium Chart Tooltip foi removida.
# Vamos anexar ela de volta no styles.css do ZIP se estiver ausente, ou mesclar cirurgicamente.
with open('styles.css', 'r', encoding='utf-8', errors='ignore') as f:
    current_css = f.read()

with open('scratch/new_update/styles.css', 'r', encoding='utf-8', errors='ignore') as f:
    zip_css = f.read()

# Let's find if Apple Fitness Rings section exists in current_css
rings_css_idx = current_css.find('/* ==========================================\nApple Fitness Rings & Premium Chart Tooltip\n========================================== */')
if rings_css_idx == -1:
    rings_css_idx = current_css.find('Apple Fitness Rings & Premium Chart Tooltip')

if rings_css_idx != -1:
    # Extract the rest of the file from that point onwards (which is the rings, tooltip, calendar animations, and global functions/styles we added)
    rings_css_block = current_css[rings_css_idx:]
    # Append this block to zip_css
    merged_css = zip_css + '\n\n' + rings_css_block
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(merged_css)
    print("[OK] styles.css mesclado com sucesso, preservando estilos dos Anéis/Calendário!")
else:
    # If not found, just copy zip_css to styles.css
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(zip_css)
    print("[SKIP] styles.css copiado diretamente (bloco de anéis não encontrado na base)")

# --- 4. APP.JS ---
# A lógica de desenho dos anéis e calendário do app.js precisa ser copiada para o final do novo app.js do ZIP.
# E também precisamos registrar as funções `renderFitnessRings`, `selectHistoricalDay`, `drawEvolutionChart`
# e garantir que a lógica em updateUI() e saveState() chame elas.
with open('app.js', 'r', encoding='utf-8', errors='ignore') as f:
    current_js = f.read()

with open('scratch/new_update/app.js', 'r', encoding='utf-8', errors='ignore') as f:
    zip_js = f.read()

# Let's locate the added systems at the end of our current app.js:
# Specifically, the drawEvolutionChart, selectHistoricalDay, renderFitnessRings, celebrateTributeQuote, etc.
# In current_js, let's search for "function renderFitnessRings"
rings_js_idx = current_js.find('function renderFitnessRings')
chart_js_idx = current_js.find('function drawEvolutionChart')
calendar_js_idx = current_js.find('function selectHistoricalDay')
tribute_js_idx = current_js.find('function celebrateTributeQuote')

print("Rings JS index:", rings_js_idx)
print("Chart JS index:", chart_js_idx)
print("Calendar JS index:", calendar_js_idx)
print("Tribute JS index:", tribute_js_idx)

# Let's extract all our custom code blocks from current_js:
# Usually, they are at the very bottom. Let's find the start of the first custom function among these.
first_custom_idx = min(idx for idx in [rings_js_idx, chart_js_idx, calendar_js_idx, tribute_js_idx] if idx != -1)
custom_js_code = current_js[first_custom_idx:]

# Let's check updateUI() in zip_js to make sure we insert our rendering calls:
# inside updateUI():
# we want to call renderFitnessRings() and drawEvolutionChart() and renderCalendar()
# Let's find updateUI definition in zip_js
update_ui_start = zip_js.find('function updateUI() {')
update_ui_end = zip_js.find('}', update_ui_start)
# Let's see what is inside updateUI() in zip_js:
# We can print it.
print("updateUI in zip_js:")
print(zip_js[update_ui_start:update_ui_start+500])

# We need to make sure updateUI calls renderFitnessRings() and drawEvolutionChart() and renderCalendar()
# Let's check if they are already called, or if we need to insert them.
# Let's insert them at the end of updateUI() block.
# The end of updateUI is just before the closing bracket of the function.
# Let's find the closing bracket of updateUI() in zip_js. Since updateUI is long, let's write a parser to find matching braces.
def find_matching_brace(text, start_idx):
    brace_count = 0
    for i in range(start_idx, len(text)):
        if text[i] == '{':
            brace_count += 1
        elif text[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                return i
    return -1

update_ui_brace_end = find_matching_brace(zip_js, update_ui_start + len('function updateUI() '))
print("Matching brace index for updateUI:", update_ui_brace_end)

if update_ui_brace_end != -1:
    # Insert renderFitnessRings(); and drawEvolutionChart(); before the closing brace of updateUI
    insert_code = '\n    // Render dynamic fitness rings and evolution chart\n    if (typeof renderFitnessRings === "function") renderFitnessRings();\n    if (typeof drawEvolutionChart === "function") drawEvolutionChart();\n'
    zip_js = zip_js[:update_ui_brace_end] + insert_code + zip_js[update_ui_brace_end:]
    print("[OK] updateUI atualizado com chamadas de renderização!")

# Let's append the custom JS code to the end of the ZIP JS
merged_js = zip_js + '\n\n' + custom_js_code

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(merged_js)
print("[OK] app.js mesclado com sucesso!")
