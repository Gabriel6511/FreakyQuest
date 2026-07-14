import os
import sys
import time
from playwright.sync_api import sync_playwright

def run_mobile_emulation():
    print("==================================================================")
    print("INICIANDO EMULAÇÃO DE DISPOSITIVO MÓVEL REAL (iPhone 13)")
    print("==================================================================")
    
    html_path = os.path.abspath("index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    
    with sync_playwright() as p:
        # Carregando preset do iPhone 13
        iphone_13 = p.devices['iPhone 13']
        print(f"Emulando: {iphone_13['user_agent']}")
        print(f"Resolução: {iphone_13['viewport']['width']}x{iphone_13['viewport']['height']} @ {iphone_13['device_scale_factor']}x")
        
        browser = p.chromium.launch(headless=True)
        # Criando contexto com as configurações nativas do iPhone (Touch, User-Agent, Viewport)
        context = browser.new_context(**iphone_13)
        page = context.new_page()
        
        try:
            print("1. Abrindo aplicativo...")
            page.goto(file_url)
            time.sleep(1.0)
            
            # Captura Splash Screen
            page.screenshot(path="mobile_01_splash.png")
            print("   - Splash Screen capturada (mobile_01_splash.png)")
            
            # Clicar em Conectar
            page.wait_for_selector("#btn-start-neural", state="visible", timeout=5000)
            page.click("#btn-start-neural")
            time.sleep(0.5)
            
            # Cadastro (Onboarding)
            if page.locator("#onboarding-wizard").is_visible():
                print("2. Preenchendo cadastro em modo mobile...")
                
                # Nome
                page.fill("#wiz-name", "Maromba Mobile")
                page.screenshot(path="mobile_02_onboarding_name.png")
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                
                # Gênero
                page.click('[data-step="2"] .option-select-card[data-value="masculino"]')
                time.sleep(0.2)
                
                # Objetivo
                page.click('[data-step="3"] .option-select-card[data-value="estetico"]')
                time.sleep(0.2)
                
                # Motivação
                page.click('[data-step="4"] .option-select-card[data-value="aura"]')
                time.sleep(0.2)
                
                # Foco Muscular
                page.click('[data-step="5"] .option-select-card[data-value="FullBody"]') # Clear all
                time.sleep(0.1)
                page.click('[data-step="5"] .option-select-card[data-value="Peito"]') # Select Peito
                time.sleep(0.1)
                page.click('#wiz-btn-next')
                time.sleep(0.2)
                
                # Classe
                page.screenshot(path="mobile_03_class_select.png")
                page.click('[data-step="6"] .option-select-card[data-value="bodybuilder"]')
                time.sleep(0.2)
                
                # Atributos Roller
                page.screenshot(path="mobile_04_attributes.png")
                page.click('[data-step="7"] .option-select-card[data-value="rato"]')
                time.sleep(0.2)
                
                # Frequência
                page.click('[data-step="8"] .option-select-card[data-value="muito"]')
                time.sleep(0.2)
                
                # Medidas (Altura/Peso)
                page.screenshot(path="mobile_05_measurements.png")
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                
                # Lesões
                page.click('[data-step="10"] .option-select-card[data-value="Nenhum"]')
                time.sleep(0.2)
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                
                # Concluir
                page.click("#wiz-btn-next")
                time.sleep(1.0)
            
            # Pular Tutorial
            if page.locator("#tutorial-overlay").is_visible():
                page.click("#btn-tutorial-skip")
                time.sleep(0.5)
            
            # Painel principal
            page.screenshot(path="mobile_06_dashboard.png")
            print("   - Dashboard capturado (mobile_06_dashboard.png)")
            
            # Dieta Tab
            page.click(".bottom-nav button[data-tab='diet']")
            time.sleep(0.5)
            page.screenshot(path="mobile_07_diet.png")
            print("   - Dieta capturada (mobile_07_diet.png)")
            
            # Treinos Tab
            page.click(".bottom-nav button[data-tab='workouts']")
            time.sleep(0.5)
            page.screenshot(path="mobile_08_workouts.png")
            print("   - Treinos capturados (mobile_08_workouts.png)")
            
            print("Emulação mobile concluída com sucesso!")
            
        except Exception as e:
            print(f"Erro na emulação: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run_mobile_emulation()
