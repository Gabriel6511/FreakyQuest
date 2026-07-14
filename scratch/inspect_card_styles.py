import os
import time
from playwright.sync_api import sync_playwright

def inspect():
    html_path = os.path.abspath("index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 430, "height": 900})
        page.goto(file_url)
        time.sleep(1)
        
        # Pass onboarding
        if page.locator("#onboarding-intro").is_visible():
            page.wait_for_selector("#btn-start-neural", state="visible")
            page.click("#btn-start-neural")
            time.sleep(0.5)
            
        page.fill("#wiz-name", "Test User")
        page.click("#wiz-btn-next") # Name
        time.sleep(0.2)
        page.click('[data-step="2"] .option-select-card[data-value="masculino"]') # Sex
        time.sleep(0.2)
        page.click('[data-step="3"] .option-select-card[data-value="engordar"]') # Obj
        time.sleep(0.2)
        page.click('[data-step="4"] .option-select-card[data-value="saude"]') # Motive
        time.sleep(0.2)
        page.click('[data-step="5"] .option-select-card[data-value="FullBody"]') # Focus
        time.sleep(0.2)
        page.click('[data-step="6"] .option-select-card[data-value="bodybuilder"]') # Class
        time.sleep(0.2)
        page.click('[data-step="7"] .option-select-card[data-value="rato"]') # Exp
        time.sleep(0.2)
        page.click('[data-step="8"] .option-select-card[data-value="ativo"]') # Freq
        time.sleep(0.2)
        page.click("#wiz-btn-next") # H
        time.sleep(0.2)
        page.click("#wiz-btn-next") # W
        time.sleep(0.2)
        page.click("#wiz-btn-next") # Target
        time.sleep(0.2)
        page.click('[data-step="10"] .option-select-card[data-value="Nenhum"]')
        time.sleep(0.2)
        page.click("#wiz-btn-next") # Injuries
        time.sleep(0.2)
        page.click("#wiz-btn-next") # Done
        time.sleep(1.5)
        
        # Skip tutorial
        if page.locator("#tutorial-overlay").is_visible():
            page.click("#btn-tutorial-skip")
            time.sleep(0.5)
            
        # Close item acquired modal if visible
        if page.locator("#item-acquired-modal").is_visible():
            page.click("#btn-close-item-modal")
            time.sleep(0.5)
            
        # Navigate to Diet
        page.click(".bottom-nav button:has-text('Dieta')")
        time.sleep(0.5)
        
        # Get styles
        styles = page.evaluate("""() => {
            const card = document.querySelector('.diet-hud-card');
            const style = window.getComputedStyle(card);
            const props = ['display', 'position', 'height', 'width', 'min-height', 'max-height', 
                           'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom',
                           'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'box-sizing', 'overflow-y', 'overflow-x'];
            
            const res = {};
            props.forEach(p => res[p] = style.getPropertyValue(p));
            return res;
        }""")
        
        print("CARD DETAILED STYLES:")
        print(styles)
        
        browser.close()

if __name__ == "__main__":
    inspect()
