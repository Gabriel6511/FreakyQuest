import os
import time
from playwright.sync_api import sync_playwright

def run_simple_mode_test():
    html_path = os.path.abspath("index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    print(f"Testing simple mode: {file_url}\n")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.set_viewport_size({"width": 430, "height": 950})
        
        page.goto(file_url)
        time.sleep(1.5)
        
        # Select simple mode
        mode_card = page.locator(".mode-card-simple")
        if mode_card.count() > 0:
            print("Selecionando Modo Simples...")
            mode_card.first.click()
            time.sleep(0.5)
        
        # Step 1: Name
        page.fill("#simple-wiz-name", "Usuario Teste")
        page.click("#simple-wiz-btn-next")
        time.sleep(0.3)
        
        # Step 2: Sexo
        page.click('#simple-onboarding-wizard [data-step="s2"] .option-select-card[data-value="feminino"]')
        time.sleep(0.3)
        
        # Step 3: Objetivo
        page.click('#simple-onboarding-wizard [data-step="s3"] .option-select-card[data-value="manter"]')
        time.sleep(0.3)
        
        # Step 4: Atividade
        page.click('#simple-onboarding-wizard [data-step="s4"] .option-select-card[data-value="ativo"]')
        time.sleep(0.3)
        
        # Step 5: Medidas - just next
        page.click("#simple-wiz-btn-next")
        time.sleep(0.3)
        
        # Step 6: Finalizar (default days + notif checked)
        page.click("#simple-wiz-btn-next")
        time.sleep(1.5)
        
        # Should be on main app now
        main_app = page.locator("#main-app")
        if main_app.is_visible():
            print("SUCCESS: Main app visible after simple onboarding")
        else:
            print("ERROR: Main app not visible")
        
        # Check body class has mode-simple
        body_class = page.evaluate("document.body.className")
        print(f"Body classes: {body_class}")
        if "mode-simple" in body_class:
            print("SUCCESS: mode-simple class applied")
        else:
            print("ERROR: mode-simple class missing")
        
        page.screenshot(path="simple_mode_dashboard.png")
        print("Screenshot saved: simple_mode_dashboard.png")
        
        browser.close()

if __name__ == "__main__":
    run_simple_mode_test()
