import os
import sys
import time
from playwright.sync_api import sync_playwright

def run_comprehensive_tests():
    print("==================================================================")
    print("INICIANDO TESTE SISTÊMICO E VISUAL COMPLETO DO FREAKYQUEST")
    print("==================================================================")
    
    html_path = os.path.abspath("index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    print(f"Caminho do arquivo local: {file_url}\n")
    
    console_errors = []
    
    with sync_playwright() as p:
        # Iniciando o navegador
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        page.set_viewport_size({"width": 430, "height": 950})
        
        # Captura logs de erro do console
        page.on("pageerror", lambda err: console_errors.append(err.message))
        page.on("console", lambda msg: print(f"[Console] {msg.type}: {msg.text}") if msg.type in ["error", "warning"] else None)

        try:
            print("1. Carregando a aplicação...")
            page.goto(file_url)
            time.sleep(1.5)
            
            # Se a tela de onboarding inicial estiver ativa
            if page.locator("#onboarding-intro").is_visible():
                print("   - Tela inicial visível. Clicando em Conectar Neural...")
                page.wait_for_selector("#btn-start-neural", state="visible", timeout=5000)
                page.click("#btn-start-neural")
                time.sleep(0.5)
            
            # Preenchendo o Wizard Onboarding passo a passo
            if page.locator("#onboarding-wizard").is_visible():
                print("2. Preenchendo Wizard Onboarding...")
                
                # Nome
                page.fill("#wiz-name", "Freaky User")
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                
                # Sexo
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
                page.click('[data-step="6"] .option-select-card[data-value="bodybuilder"]')
                time.sleep(0.2)
                
                # Nível de treino
                page.click('[data-step="7"] .option-select-card[data-value="rato"]')
                time.sleep(0.2)
                
                # Frequência semanal
                page.click('[data-step="8"] .option-select-card[data-value="muito"]')
                time.sleep(0.2)
                
                # Altura, Peso, Peso Alvo (avançando direto)
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                page.click("#wiz-btn-next")
                time.sleep(0.2)
                
                # Lesões
                page.click('[data-step="10"] .option-select-card[data-value="Nenhum"]')
                time.sleep(0.2)
                page.click("#wiz-btn-next") # Avanca para a etapa 11 (Metas)
                time.sleep(0.2)
                
                # Conclusão do onboarding
                page.click("#wiz-btn-next") # Conclui
                time.sleep(1.5)
                
            # Tutorial Modal
            if page.locator("#tutorial-overlay").is_visible():
                print("3. Pulando tutorial...")
                page.click("#btn-tutorial-skip")
                time.sleep(0.5)

            # Capturando Dashboard Inicial
            print("4. Salvando screenshot do Dashboard...")
            page.screenshot(path="screenshot_dashboard.png")

            # Verificar Desafio Diário
            challenge_title = page.locator("#daily-challenge-title")
            if challenge_title.is_visible():
                safe_title = challenge_title.inner_text().encode(sys.stdout.encoding or 'ascii', errors='replace').decode(sys.stdout.encoding or 'ascii')
                print(f"   - Desafio Diario visivel: {safe_title}")
            else:
                print("   - AVISO: Card de Desafio Diario nao localizado no Painel!")
            
            # Adicionar água (que fica no Dashboard!)
            print("   - Clicando em adicionar +1L de água no Dashboard...")
            page.click("#add-water-btn")
            time.sleep(0.3)
            
            # --- TESTANDO ABA TREINOS ---
            print("5. Testando Aba Treinos...")
            page.click(".bottom-nav button[data-tab='workouts']")
            time.sleep(0.5)
            
            # Toggling entre Ficha do Mentor e Ficha Customizada
            toggle_cust = page.locator("#toggle-workout-cust")
            if toggle_cust.is_visible():
                print("   - Alternando para Ficha Customizada...")
                toggle_cust.click()
                time.sleep(0.3)
                page.screenshot(path="test_workout_custom.png")
                
                print("   - Retornando para Ficha do Mentor...")
                page.click("#toggle-workout-std")
                time.sleep(0.3)
            else:
                print("   - Seletor de Ficha Mentor/Custom oculto (Foco em Custom unica).")
            
            # Tocar checkboxes de exercícios (colunas de repetições .rep-col)
            checkboxes = page.locator(".rep-col")
            count_chk = checkboxes.count()
            print(f"   - Encontrados {count_chk} botoes de serie na ficha.")
            if count_chk > 0:
                print("   - Completando metade das series visiveis...")
                limit = max(1, count_chk // 2)
                for i in range(limit):
                    checkboxes.nth(i).click()
                    time.sleep(0.15)

            skip_rest = page.locator("#btn-skip-rest")
            if skip_rest.is_visible():
                skip_rest.click()
                time.sleep(0.2)
            
            # Verificar meta semanal no dashboard
            page.click(".bottom-nav button[data-tab='dashboard']")
            time.sleep(0.3)
            weekly = page.locator("#weekly-goal-badge")
            if weekly.is_visible():
                print(f"   - Meta semanal visivel: {weekly.inner_text()}")
            
            page.click(".bottom-nav button[data-tab='workouts']")
            time.sleep(0.3)
            
            # Clicar em finalizar treino
            print("   - Finalizando Treino...")
            page.once("dialog", lambda dialog: dialog.accept())
            page.click("#btn-finish-workout")
            time.sleep(1.0)
            
            # Se o modal de RPE estiver visível, escolher uma opção
            rpe_modal = page.locator("#rpe-modal")
            if rpe_modal.is_visible():
                print("   - Modal de RPE detectado! Selecionando 'Treino Intenso'...")
                page.click(".rpe-intenso")
                time.sleep(1.2)
            
            page.screenshot(path="test_workout_finished_modal.png")
            
            # Fechar modal de level up ou de treino concluído se aparecer
            if page.locator("#level-up-modal").is_visible():
                print("   - Modal de Level Up detectado! Fechando...")
                page.click("#btn-close-level-up")
                time.sleep(0.5)

            # Fechar modal de item/conquista adquirida se aparecer (como primeiro_passo)
            if page.locator("#item-acquired-modal").is_visible():
                print("   - Modal de Item/Conquista Adquirida detectado! Fechando...")
                page.click("#btn-close-item-modal")
                time.sleep(0.5)
            
            # --- TESTANDO ABA DIETA ---
            print("6. Testando Aba Dieta...")
            page.click(".bottom-nav button[data-tab='diet']")
            time.sleep(0.5)
            
            # Registrar refeição padrão
            print("   - Registrando refeição padrão...")
            page.click("#diet-food-form button[type='submit']")
            time.sleep(0.3)
            page.screenshot(path="screenshot_diet.png")

            # --- TESTANDO ABA MENTORES ---
            print("7. Testando Aba Mentores...")
            page.click(".bottom-nav button[data-tab='mentors']")
            time.sleep(0.5)
            page.screenshot(path="screenshot_mentors.png")
            
            # Verificar se Nick Walker está listado
            walker_card = page.locator(".mentor-card-new:has-text('Nick Walker')")
            if walker_card.count() > 0:
                print("   - Mentor Nick Walker 'The Mutant' encontrado na lista!")
                
                # Testar botão de voz do Nick Walker
                voice_btn = walker_card.locator(".voice-btn")
                if voice_btn.count() > 0:
                    voice_btn.nth(0).click()
                    print("   - Botão de voz do Nick Walker acionado com sucesso!")
                    time.sleep(0.3)
                
                # Selecionar Nick Walker
                walker_card.locator(".mcn-btn-choose").click()
                print("   - Nick Walker ativado com sucesso!")
                time.sleep(0.5)
                page.screenshot(path="test_mentor_nickwalker_active.png")
            else:
                print("   - AVISO: Nick Walker não foi localizado na lista de mentores!")

            # Selecionar Gabriel Bebezinho
            bebezinho_card = page.locator(".mentor-card-new:has-text('Gabriel')")
            if bebezinho_card.count() > 0:
                print("   - Mentor Gabriel Bebezinho encontrado na lista!")
                bebezinho_card.locator(".mcn-btn-choose").click()
                print("   - Gabriel Bebezinho ativado com sucesso!")
                time.sleep(0.5)
                page.screenshot(path="test_mentor_bebezinho_active.png")
            else:
                print("   - AVISO: Gabriel Bebezinho não foi localizado na lista de mentores!")
                
            # Forçar evolução de mentor para testar as recompensas estéticas e buffs
            print("   - Simulando evolução do Bebezinho e do Nick Walker para Nível 5 (Bordas Néon/Estilos)...")
            page.evaluate("""
                state.mentorLevels['bebezinho'] = 5;
                state.mentorLevels['nickwalker'] = 5;
                if (!state.unlockedItems) state.unlockedItems = [];
                state.unlockedItems.push('has-men-beb10');
                state.unlockedItems.push('has-men-nic5');
                updateUI();
                renderMentorsList();
            """)
            time.sleep(0.5)
            page.screenshot(path="test_mentor_unlocked_rewards.png")

            # --- TESTANDO ABA TRIBUTO ---
            print("8. Testando Aba Tributo...")
            page.click(".bottom-nav button[data-tab='tribute']")
            time.sleep(0.5)
            
            # Verificar se a imagem de tributo do Bebezinho está renderizada
            tribute_img = page.locator(".tribute-hero-card img[src*='bebezinho_tribute.png']")
            if tribute_img.count() > 0:
                print("   - Imagem de tributo 'bebezinho_tribute.png' renderizada com sucesso no card do herói!")
            else:
                print("   - ERRO: Imagem de tributo bebezinho_tribute.png NÃO foi encontrada ou carregada!")

            # Clicar nas Frases que Ficaram
            print("   - Testando botões de Frases que Ficaram...")
            wake_wake_card = page.locator(".tribute-quote-card:has-text('WAKE WAKE')")
            if wake_wake_card.count() > 0:
                wake_wake_card.click()
                print("   - Card 'WAKE WAKE' clicado (efeito visual acionado)!")
            else:
                print("   - AVISO: Card 'WAKE WAKE' não encontrado na aba tributo!")
                
            page.screenshot(path="test_tribute_tab.png")

            # --- TESTANDO ABA STATUS ---
            print("9. Testando Aba Status...")
            page.click(".bottom-nav button[data-tab='status']")
            time.sleep(0.5)
            
            # Verificar se o gráfico SVG está renderizado
            chart_svg = page.locator("#evolution-svg")
            if chart_svg.is_visible():
                print("   - Gráfico de Evolução SVG (#evolution-svg) renderizado com sucesso no Status!")
            else:
                print("   - ERRO: Gráfico de Evolução SVG não localizado na aba de Status!")

            # Testar interação com o novo calendário histórico estilo Apple Fitness
            print("   - Testando Calendário de Atividades Histórico...")
            day_15_cell = page.locator(".calendar-day-cell").nth(14) # Dia 15 (0-indexed 14)
            if day_15_cell.is_visible():
                day_15_cell.click()
                time.sleep(0.3)
                
                # Verificar se o título e o botão de reset atualizaram
                title_text = page.locator("#fitness-title").inner_text()
                reset_btn = page.locator("#btn-reset-to-today")
                if "15 de Junho" in title_text and reset_btn.is_visible():
                    print("     - Sucesso: Ao clicar no dia 15, título atualizou para '15 de Junho' e botão reset apareceu!")
                    
                    # Clicar no botão Reset
                    reset_btn.click()
                    time.sleep(0.3)
                    
                    if not reset_btn.is_visible():
                        print("     - Sucesso: Ao clicar em 'Voltar para Hoje', o botão reset desapareceu e o estado voltou ao normal!")
                    else:
                        print("     - ERRO: O botão reset continuou visível após ser clicado!")
                else:
                    print(f"     - ERRO: Título do painel ('{title_text}') ou visibilidade do botão reset incorreta!")
            else:
                print("     - ERRO: Célula do dia 15 no calendário de histórico não encontrada!")
                
            page.screenshot(path="screenshot_status.png")
            
            print("10. Todos os cliques de navegação e interações de elementos foram concluídos.")

        except Exception as e:
            err_msg = str(e).encode(sys.stdout.encoding or 'ascii', errors='replace').decode(sys.stdout.encoding or 'ascii')
            print(f"\n[FALHA] Ocorreu uma excecao inesperada durante o teste: {err_msg}")
            import traceback
            traceback.print_exc()
        
        finally:
            browser.close()
            
    print("\n==================================================================")
    print("ANÁLISE E CONCLUSÃO DOS ERROS DO CONSOLE:")
    if len(console_errors) > 0:
        print(f"Encontrados {len(console_errors)} erros no console durante a navegação:")
        for err in console_errors:
            print(f" - {err}")
    else:
        print("Nenhum erro foi registrado no console do navegador. Perfeito!")
    print("==================================================================")

if __name__ == "__main__":
    run_comprehensive_tests()
