import os
import sys
import time
from playwright.sync_api import sync_playwright

def run_tests():
    print("Iniciando Teste Automatizado de Ponta a Ponta - FreakyQuest...")
    
    html_path = os.path.abspath("index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    print(f"Caminho do arquivo: {file_url}")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 430, "height": 900})
        
        print("1. Abrindo index.html...")
        page.goto(file_url)
        time.sleep(1)
        
        # 1. Se estiver na tela de loading inicial
        if page.locator("#onboarding-intro").is_visible():
            print("Carregando tela inicial...")
            # Espera carregar o botao de conectar neural (2.5 segundos de animacao)
            page.wait_for_selector("#btn-start-neural", state="visible", timeout=5000)
            print("Clicando em Conectar Neural...")
            page.click("#btn-start-neural")
            time.sleep(0.5)
            
        # 2. Preencher Wizard de Onboarding
        if page.locator("#onboarding-wizard").is_visible():
            print("Preenchendo as etapas do Wizard de Onboarding...")
            
            # Step 1: Nickname
            print("Etapa 1: Codinome")
            page.fill("#wiz-name", "Test Hunter")
            page.click("#wiz-btn-next")
            time.sleep(0.3)
            
            # Step 2: Sexo
            print("Etapa 2: Sexo")
            page.click('[data-step="2"] .option-select-card[data-value="masculino"]')
            time.sleep(0.3)
            
            # Step 3: Objetivo
            print("Etapa 3: Objetivo")
            page.click('[data-step="3"] .option-select-card[data-value="engordar"]')
            time.sleep(0.3)
            
            # Step 4: Motivacao
            print("Etapa 4: Motivacao")
            page.click('[data-step="4"] .option-select-card[data-value="saude"]')
            time.sleep(0.3)
            
            # Step 5: Ênfase muscular
            print("Etapa 5: Musculo alvo")
            page.click('[data-step="5"] .option-select-card[data-value="FullBody"]')
            time.sleep(0.1)
            page.click('#wiz-btn-next')
            time.sleep(0.3)
            
            # Step 6: Classe
            print("Etapa 6: Classe")
            page.click('[data-step="6"] .option-select-card[data-value="bodybuilder"]')
            time.sleep(0.3)
            
            # Step 7: Experiencia
            print("Etapa 7: Experiencia")
            page.click('[data-step="7"] .option-select-card[data-value="rato"]')
            time.sleep(0.3)
            
            # Step 8: Frequencia
            print("Etapa 8: Frequencia")
            page.click('[data-step="8"] .option-select-card[data-value="ativo"]')
            time.sleep(0.3)
            
            # Step 9a: Altura (Avanca com botao)
            print("Etapa 9a: Altura")
            page.click("#wiz-btn-next")
            time.sleep(0.3)
            
            # Step 9b: Peso (Avanca com botao)
            print("Etapa 9b: Peso")
            page.click("#wiz-btn-next")
            time.sleep(0.3)
            
            # Step 9c: Meta peso (Avanca com botao)
            print("Etapa 9c: Meta peso")
            page.click("#wiz-btn-next")
            time.sleep(0.3)
            
            # Step 10: Lesoes
            print("Etapa 10: Lesoes")
            page.click('[data-step="10"] .option-select-card[data-value="Nenhum"]')
            time.sleep(0.3)
            page.click("#wiz-btn-next")
            time.sleep(0.3)
            
            # Step 11: Conclusao
            print("Etapa 11: Finalizando criacao...")
            page.click("#wiz-btn-next")
            time.sleep(1.5)
            
        # 3. Pular Tutorial se estiver aberto
        if page.locator("#tutorial-overlay").is_visible():
            print("Fechando tutorial popup...")
            page.click("#btn-tutorial-skip")
            time.sleep(0.5)
            
        print("Capturando tela do painel principal (Dashboard)...")
        page.screenshot(path="screenshot_dashboard.png")
        
        # 4. Navegacao e Ações de teste
        print("Testando navegacao entre abas...")
        
        # Aba Treino
        page.click(".bottom-nav button:has-text('Treinos')")
        time.sleep(0.5)
        print("Capturando aba de Treino...")
        page.screenshot(path="screenshot_workouts.png")
        
        # Completar serie
        checkboxes = page.locator(".rep-col")
        if checkboxes.count() > 0:
            print("Marcando uma serie de exercicio como feita...")
            checkboxes.nth(0).click()
            time.sleep(0.5)
            
        # Aba Dieta
        page.click(".bottom-nav button:has-text('Dieta')")
        time.sleep(0.5)
        print("Capturando aba de Dieta...")
        page.screenshot(path="screenshot_diet.png")
        
        # Aba Mentores
        page.click(".bottom-nav button:has-text('Mentores')")
        time.sleep(0.5)
        print("Capturando aba de Mentores...")
        page.screenshot(path="screenshot_mentors.png")
        
        # Escolher outro mentor para testar o sistema de progressão
        choose_buttons = page.locator(".mcn-btn-choose")
        if choose_buttons.count() > 0:
            print("Trocando de mentor base...")
            for i in range(choose_buttons.count()):
                if choose_buttons.nth(i).is_enabled() and choose_buttons.nth(i).inner_text() != "✓ ATIVO":
                    choose_buttons.nth(i).click()
                    time.sleep(0.5)
                    break
        
        # Aba Status
        page.click(".bottom-nav button:has-text('Status')")
        time.sleep(0.5)
        print("Capturando aba de Status...")
        page.screenshot(path="screenshot_status.png")
        
        browser.close()
        print("Todos os testes de ponta a ponta foram concluídos perfeitamente!")
        print("Imagens salvas na pasta do projeto:")
        print(" - screenshot_dashboard.png")
        print(" - screenshot_workouts.png")
        print(" - screenshot_mentors.png")
        print(" - screenshot_status.png")
        print(" - screenshot_diet.png")

if __name__ == "__main__":
    run_tests()
