import os
import json
import time
import hashlib
from playwright.sync_api import sync_playwright

REPORT = []
BASE = os.path.abspath("index.html")
FILE_URL = f"file:///{BASE.replace(os.sep, '/')}"
VIEWPORTS = [
    {"name": "mobile-small", "width": 375, "height": 667},
    {"name": "mobile-large", "width": 390, "height": 844},
    {"name": "tablet", "width": 768, "height": 1024},
    {"name": "desktop", "width": 1280, "height": 800},
]

def log(msg, severity="INFO"):
    entry = f"[{severity}] {msg}"
    print(entry)
    REPORT.append(entry)

def force_close_tutorial(page):
    try:
        page.evaluate("""() => {
            const ids = ['tutorial-overlay','level-up-modal','item-acquired-modal','profile-card-modal'];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
        }""")
        time.sleep(0.2)
    except Exception:
        pass

def switch_tab(page, tab):
    btn = page.locator(f'.bottom-nav .nav-item[data-tab="{tab}"]')
    if btn.count() > 0:
        try:
            btn.first.click()
            time.sleep(0.25)
            return True
        except Exception as e:
            log(f"WARN: falha ao trocar para {tab}: {e}", "P2")
    return False

def open_app(page, mode="simple"):
    page.goto(FILE_URL)
    time.sleep(2.5)
    
    # If intro with mode cards exists, click RPG to keep current QA path stable
    mode_card = page.locator(".mode-card-rpg")
    if mode_card.count() > 0:
        try:
            mode_card.first.click()
            time.sleep(0.5)
        except Exception:
            pass
    
    # If RPG wizard is visible, complete quickly to main app
    if page.locator("#onboarding-wizard").is_visible():
        try:
            page.fill("#wiz-name", "QA User")
            page.click("#wiz-btn-next")
            time.sleep(0.12)
            page.click('[data-step="2"] .option-select-card[data-value="masculino"]')
            time.sleep(0.12)
            page.click("#wiz-btn-next")
            time.sleep(0.12)
            page.click('[data-step="3"] .option-select-card[data-value="manter"]')
            time.sleep(0.12)
            page.click("#wiz-btn-next")
            time.sleep(0.12)
            page.click('[data-step="4"] .option-select-card[data-value="velho"]')
            time.sleep(0.12)
            page.click("#wiz-btn-next")
            time.sleep(0.12)
            page.click('[data-step="5"] .option-select-card[data-value="FullBody"]')
            time.sleep(0.12)
            page.click("#wiz-btn-next")
            time.sleep(0.12)
            page.click('[data-step="6"] .option-select-card[data-value="bodybuilder"]')
            time.sleep(0.12)
            page.click("#wiz-btn-next")
            time.sleep(0.12)
            page.click('[data-step="7"] .option-select-card[data-value="rato"]')
            time.sleep(0.12)
            page.click("#wiz-btn-next")
            time.sleep(0.12)
            page.click('[data-step="8"] .option-select-card[data-value="ativo"]')
            time.sleep(0.15)
            for _ in range(5):
                page.click("#wiz-btn-next")
                time.sleep(0.12)
            page.click('[data-step="10"] .option-select-card[data-value="Nenhum"]')
            time.sleep(0.12)
            page.click("#wiz-btn-next")
            time.sleep(1)
        except Exception:
            pass
    
    force_close_tutorial(page)
    time.sleep(0.3)

# ==========================
# NAVEGAÇÃO E CLIQUE EM ELEMENTOS
# ==========================
def test_navigation_and_interactions(page):
    log("\n=== NAVEGAÇÃO E INTERAÇÕES ===")
    
    tabs = ["dashboard", "workouts", "diet", "mentors", "status", "settings"]
    for tab in tabs:
        if switch_tab(page, tab):
            log(f"OK: tab {tab} acessível", "INFO")
        else:
            log(f"FAIL: tab {tab} não acessível", "P1")
    
    # Interações básicas em cada tab
    switch_tab(page, "dashboard")
    time.sleep(0.3)
    
    # Add water
    add_water = page.locator("#add-water-btn")
    if add_water.count() > 0:
        try:
            add_water.first.click()
            time.sleep(0.2)
            log("OK: botão adicionar água funciona", "INFO")
        except Exception as e:
            log(f"WARN: botão água falhou: {e}", "P2")
    
    # Edit measures shortcut
    edit_measures = page.locator("#btn-edit-measures-shortcut")
    if edit_measures.count() > 0 and edit_measures.is_visible():
        try:
            edit_measures.first.click()
            time.sleep(0.2)
            log("OK: atalho editar medidas funciona", "INFO")
            switch_tab(page, "dashboard")
        except Exception as e:
            log(f"WARN: atalho medidas falhou: {e}", "P2")
    
    # Workout interactions
    switch_tab(page, "workouts")
    time.sleep(0.3)
    
    finish_btn = page.locator("#btn-finish-workout")
    if finish_btn.count() > 0 and finish_btn.is_visible():
        try:
            finish_btn.first.click()
            time.sleep(0.3)
            log("OK: botão finalizar treino clicável", "INFO")
            # Close any modal
            force_close_tutorial(page)
        except Exception as e:
            log(f"WARN: finalizar treino falhou: {e}", "P2")
    
    # Diet interactions
    switch_tab(page, "diet")
    time.sleep(0.3)
    
    add_food_btn = page.locator("#btn-open-custom-food-modal")
    if add_food_btn.count() > 0 and add_food_btn.is_visible():
        try:
            add_food_btn.first.click()
            time.sleep(0.2)
            log("OK: botão criar alimento funciona", "INFO")
            force_close_tutorial(page)
        except Exception as e:
            log(f"WARN: criar alimento falhou: {e}", "P2")
    
    # Settings interactions
    switch_tab(page, "settings")
    time.sleep(0.3)
    
    save_btn = page.locator("#settings-save-btn")
    if save_btn.count() > 0 and save_btn.is_visible():
        try:
            save_btn.first.click()
            time.sleep(0.2)
            log("OK: botão salvar configurações funciona", "INFO")
        except Exception as e:
            log(f"WARN: salvar configurações falhou: {e}", "P2")

# ==========================
# RESPONSIVIDADE
# ==========================
def test_responsiveness(page):
    log("\n=== RESPONSIVIDADE ===")
    
    for vp in VIEWPORTS:
        log(f"\n-- {vp['name']} ({vp['width']}x{vp['height']}) --")
        page.set_viewport_size({"width": vp["width"], "height": vp["height"]})
        open_app(page, "simple")
        
        has_scroll = page.evaluate("document.body.scrollWidth > window.innerWidth")
        if has_scroll:
            log(f"WARN: scroll horizontal em {vp['name']}", "P2")
        else:
            log(f"OK: sem scroll horizontal em {vp['name']}", "INFO")
        
        for tab in ["dashboard", "workouts", "diet", "settings"]:
            if switch_tab(page, tab):
                visible = page.locator(f"#tab-{tab}").first.is_visible()
                log(f"OK: tab {tab} {'visível' if visible else 'invisível'} em {vp['name']}", "INFO")
            else:
                log(f"FAIL: tab {tab} não acessível em {vp['name']}", "P1")

# ==========================
# AUDITORIA DE DADOS
# ==========================
def test_data_audit(page):
    log("\n=== AUDITORIA DE DADOS ===")
    open_app(page, "simple")
    time.sleep(0.5)
    
    state_json = page.evaluate("JSON.stringify(state)")
    if not state_json:
        log("FAIL: state não encontrado", "P0")
        return
    
    state = json.loads(state_json)
    
    required_keys = [
        "charName", "charClass", "appMode", "useCustomWorkout", "customWorkouts",
        "mealLogs", "personalRecords", "mentorLevels", "equippedItems", "unlockedItems"
    ]
    for k in required_keys:
        if k in state:
            log(f"OK: state.{k} presente", "INFO")
        else:
            log(f"FAIL: state.{k} ausente", "P1")
    
    cw = state.get("customWorkouts", {})
    empty_slots = [k for k, v in cw.items() if isinstance(v, dict) and not v.get("exercises")]
    if empty_slots:
        log(f"WARN: slots de treino custom vazios: {empty_slots}", "P2")
    
    today = time.strftime("%Y-%m-%d")
    meals_today = [m for m in state.get("mealLogs", []) if m.get("date") == today]
    seen = set()
    dupes = []
    for m in meals_today:
        key = (m.get("food"), m.get("grams"))
        if key in seen:
            dupes.append(key)
        seen.add(key)
    if dupes:
        log(f"FAIL: mealLogs duplicados: {dupes}", "P2")
    else:
        log("OK: sem duplicações em mealLogs", "INFO")
    
    obsolete = ["profilePic", "targetWeight", "activeWorkoutDiv", "lastNotificationDate"]
    found_obsolete = [k for k in obsolete if k in state]
    if found_obsolete:
        log(f"WARN: possíveis campos obsoletos: {found_obsolete}", "P3")
    
    user_json = page.evaluate("localStorage.getItem('freaky_quest_user')")
    if user_json:
        user_data = json.loads(user_json)
        keys_state = set(state.keys())
        keys_user = set(user_data.keys())
        common = keys_state & keys_user
        log(f"INFO: campos comuns state/userProfile: {sorted(common)}", "INFO")

# ==========================
# CONFIGURAÇÕES
# ==========================
def test_settings(page):
    log("\n=== CONFIGURAÇÕES ===")
    open_app(page, "simple")
    switch_tab(page, "settings")
    time.sleep(0.3)
    
    fields = [
        ("#settings-app-mode", "Modo"),
        ("#settings-weight", "Peso"),
        ("#settings-height", "Altura"),
        ("#settings-goal", "Objetivo"),
        ("#settings-weekly-days", "Meta semanal"),
        ("#settings-notif-enable", "Lembretes"),
        ("#settings-notif-time", "Horário"),
        ("#settings-reset-progress", "Reset"),
        ("#settings-save-btn", "Salvar"),
    ]
    for sel, name in fields:
        el = page.locator(f"#tab-settings {sel}").first
        if el.count() > 0 and el.is_visible():
            log(f"OK: {name} visível", "INFO")
        else:
            log(f"FAIL: {name} ausente/invisível", "P1")
    
    try:
        page.fill("#tab-settings #settings-weight", "82")
        page.fill("#tab-settings #settings-height", "178")
        page.select_option("#tab-settings #settings-goal", "saude")
        page.fill("#tab-settings #settings-weekly-days", "3")
        page.click("#tab-settings #settings-save-btn")
        time.sleep(0.5)
        log("OK: configurações salvas", "INFO")
    except Exception as e:
        log(f"FAIL: erro ao salvar: {e}", "P1")
    
    stored = page.evaluate("localStorage.getItem('freaky_quest_user')")
    if stored:
        data = json.loads(stored)
        if data.get("currentWeight") == 82:
            log("OK: peso persistido", "INFO")
        else:
            log(f"FAIL: peso persistido incorreto: {data.get('currentWeight')}", "P1")

# ==========================
# MAIN
# ==========================
def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            test_navigation_and_interactions(page)
            test_responsiveness(page)
            test_data_audit(page)
            test_settings(page)
        finally:
            browser.close()
    
    print("\n===== RELATÓRIO FINAL =====")
    for r in REPORT:
        print(r)
    
    issues = [r for r in REPORT if "FAIL" in r or "WARN" in r]
    print(f"\nTotal issues: {len(issues)}")

if __name__ == "__main__":
    run()
