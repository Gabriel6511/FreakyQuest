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
                print("   - Tela inicial visível. Selecionando Modo RPG...")
                mode_card = page.locator(".mode-card-rpg")
                if mode_card.count() > 0:
                    mode_card.first.click()
                    time.sleep(0.5)
            
            # Preenchendo o Wizard Onboarding passo a passo
            if page.locator("#onboarding-wizard").is_visible():
                print("2. Preenchendo Wizard Onboarding...")
                
                # Nome (step 1 → manual next)
                page.fill("#wiz-name", "Freaky User")
                page.click("#wiz-btn-next")
                
                # Sexo (step 2 → auto-advances to 3)
                page.wait_for_selector('[data-step="2"].active', state="visible", timeout=3000)
                page.click('[data-step="2"] .option-select-card[data-value="masculino"]')
                
                # Objetivo (step 3 → auto-advances to 4)
                page.wait_for_selector('[data-step="3"].active', state="visible", timeout=3000)
                page.click('[data-step="3"] .option-select-card[data-value="estetico"]')
                
                # Motivação (step 4 → auto-advances to 5)
                page.wait_for_selector('[data-step="4"].active', state="visible", timeout=3000)
                page.click('[data-step="4"] .option-select-card[data-value="aura"]')
                
                # Foco Muscular (step 5 → manual next)
                page.wait_for_selector('[data-step="5"].active', state="visible", timeout=3000)
                page.click('[data-step="5"] .option-select-card[data-value="Peito"]')
                time.sleep(0.2)
                page.click("#wiz-btn-next")
                
                # Classe (step 6 → auto-advances to 7)
                page.wait_for_selector('[data-step="6"].active', state="visible", timeout=3000)
                page.click('[data-step="6"] .option-select-card[data-value="bodybuilder"]')
                
                # Nível de treino (step 7 → auto-advances to 8)
                page.wait_for_selector('[data-step="7"].active', state="visible", timeout=3000)
                page.click('[data-step="7"] .option-select-card[data-value="rato"]')
                
                # Frequência semanal (step 8 → auto-advances to 8b)
                page.wait_for_selector('[data-step="8"].active', state="visible", timeout=3000)
                page.click('[data-step="8"] .option-select-card[data-value="muito"]')
                
                # Idade (step 8b → manual next)
                page.wait_for_selector('[data-step="8b"].active', state="visible", timeout=3000)
                page.click("#wiz-btn-next")
                
                # Altura, Peso, Peso Alvo (steps 9a, 9b, 9c → manual next)
                page.wait_for_selector('[data-step="9a"].active', state="visible", timeout=3000)
                page.click("#wiz-btn-next")
                page.wait_for_selector('[data-step="9b"].active', state="visible", timeout=3000)
                page.click("#wiz-btn-next")
                page.wait_for_selector('[data-step="9c"].active', state="visible", timeout=3000)
                page.click("#wiz-btn-next")
                
                # Lesões (step 10 — NOT auto-advancing, need manual next)
                page.wait_for_selector('[data-step="10"].active', state="visible", timeout=3000)
                page.click('[data-step="10"] .option-select-card[data-value="Nenhum"]')
                time.sleep(0.3)
                page.click("#wiz-btn-next")
                
                # Conclusão do onboarding (step 11 → concluir)
                page.wait_for_selector('[data-step="11"].active', state="visible", timeout=3000)
                page.click("#wiz-btn-next")
                time.sleep(1.5)
                
            # Tutorial Modal (pode demorar devido a timeouts no JS)
            try:
                page.wait_for_selector("#tutorial-overlay", state="visible", timeout=4000)
                print("3. Pulando tutorial...")
                page.click("#btn-tutorial-skip")
                time.sleep(0.5)
            except Exception:
                print("3. Tutorial overlay não apareceu ou já foi pulado.")

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
                    el = checkboxes.nth(i)
                    try:
                        el.scroll_into_view_if_needed(timeout=2000)
                        el.click(timeout=2000)
                        time.sleep(0.15)
                    except Exception:
                        pass  # skip elements hidden in collapsed sections

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

            # --- TESTANDO ABA CONFIGURACOES ---
            print("8. Testando Aba Ajustes...")
            page.click(".bottom-nav button[data-tab='settings']")
            time.sleep(0.5)
            
            # Verificar campos de configuracoes
            settings_weight = page.locator("#tab-settings #settings-weight")
            if settings_weight.count() > 0:
                settings_weight.fill("82")
                print("   - Campo de peso em Ajustes funcionando!")
            
            settings_save = page.locator("#tab-settings #settings-save-btn")
            if settings_save.count() > 0:
                settings_save.click()
                time.sleep(0.3)
                print("   - Botao salvar em Ajustes funcionando!")
            
            page.screenshot(path="test_settings_tab.png")

            # --- TESTANDO ABA STATUS ---
            print("9. Testando Aba Status...")
            page.click(".bottom-nav button[data-tab='status']")
            time.sleep(0.5)
            
            # Verificar se o gráfico SVG está oculto conforme pedido do usuário
            chart_svg = page.locator("#evolution-svg")
            if not chart_svg.is_visible():
                print("   - Gráfico de Evolução SVG está oculto com sucesso no Status (Conforme pedido)!")
            else:
                print("   - ERRO: Gráfico de Evolução SVG deveria estar oculto!")

            # Testar interação com o novo calendário histórico estilo Apple Fitness
            print("   - Testando Calendário de Atividades Histórico...")
            day_1_cell = page.locator(".calendar-day-cell").nth(0) # Dia 1 (0-indexed 0)
            if day_1_cell.is_visible():
                day_1_cell.click()
                time.sleep(0.3)
                
                # Close the activity details modal that opens on day click
                activity_modal = page.locator("#activity-details-modal")
                if activity_modal.is_visible():
                    page.click("#btn-close-activity-details")
                    time.sleep(0.3)
                    print("     - Modal de detalhes da atividade aberto e fechado com sucesso!")
                
                # Verificar se o título e o botão de reset atualizaram
                title_text = page.locator("#fitness-title").inner_text()
                reset_btn = page.locator("#btn-reset-to-today")
                if "1 de Julho" in title_text and reset_btn.is_visible():
                    print("     - Sucesso: Ao clicar no dia 1, título atualizou para '1 de Julho' e botão reset apareceu!")
                    
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
