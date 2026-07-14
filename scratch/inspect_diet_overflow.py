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
            print("Loading onboarding intro...")
            page.wait_for_selector("#btn-start-neural", state="visible", timeout=5000)
            page.click("#btn-start-neural")
            time.sleep(0.5)
            
        page.fill("#wiz-name", "Test Hunter")
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
            print("Closing item acquired modal...")
            page.click("#btn-close-item-modal")
            time.sleep(0.5)
        
        # Navigate to Diet
        page.click(".bottom-nav button:has-text('Dieta')")
        time.sleep(0.5)
        
        # Add 8 foods
        for i in range(8):
            # If item acquired modal appears during addition (e.g. from level up)
            if page.locator("#item-acquired-modal").is_visible():
                page.click("#btn-close-item-modal")
                time.sleep(0.3)
            page.click("#diet-food-form button[type='submit']")
            time.sleep(0.2)
            
        # Get dimensions
        info = page.evaluate("""() => {
            const mainApp = document.getElementById('main-app');
            const tabDiet = document.getElementById('tab-diet');
            const historyList = document.getElementById('diet-history-list');
            const appContainer = document.querySelector('.app-container');
            const body = document.body;
            
            return {
                body: { height: body.clientHeight, scrollHeight: body.scrollHeight },
                appContainer: { height: appContainer.clientHeight, scrollHeight: appContainer.scrollHeight },
                mainApp: { height: mainApp.clientHeight, scrollHeight: mainApp.scrollHeight },
                tabDiet: { 
                    height: tabDiet.clientHeight, 
                    scrollHeight: tabDiet.scrollHeight,
                    offsetHeight: tabDiet.offsetHeight,
                    overflowY: window.getComputedStyle(tabDiet).overflowY,
                    display: window.getComputedStyle(tabDiet).display
                },
                historyList: { height: historyList.clientHeight, scrollHeight: historyList.scrollHeight }
            };
        }""")
        
        print("DIMENSIONS:")
        print(f"Body: {info['body']}")
        print(f"AppContainer: {info['appContainer']}")
        print(f"MainApp: {info['mainApp']}")
        print(f"TabDiet: {info['tabDiet']}")
        print(f"HistoryList: {info['historyList']}")
        
        page.screenshot(path="scratch/diet_overflow_check.png")
        print("Screenshot saved to scratch/diet_overflow_check.png")
        
        browser.close()

if __name__ == "__main__":
    inspect()
