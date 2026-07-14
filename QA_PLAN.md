# FreakyQuest — Plano de Testes Exaustivo & Matriz de Dispositivos
_Atualizado: 2026-07-10 · Ambiente: Windows / Playwright Chromium / Python 3.14 / Node 26_

## 1. Objetivo e Escopo
Validar integridade, estabilidade e usabilidade do FreakyQuest em **todos os módulos**,
nos modos **Simples** e **RPG**, e em ampla gama de dispositivos móveis (modelos,
resoluções e densidades de pixel/hardware). Cobre:
- Auditoria estática (cruzamento JS ↔ HTML ↔ CSS)
- Auditoria de runtime (captura de exceções JS e `console.error`)
- Fluxos completos de onboarding, navegação e interações
- Responsividade, overflow e alvos de toque
- Persistência de estado (localStorage) e reset

## 2. Prioridades
- **P0** — Bloqueante: impede uso / crash / exceção JS
- **P1** — Crítico: degrada funcionalidade relevante ou erro de console
- **P2** — Médio: quebra visual/layout, overflow, texto inadequado
- **P3** — Baixo: cosmético / acessibilidade não crítica

## 3. Ferramentas de QA (reexecutáveis)
| Script | Finalidade |
|---|---|
| `validate.py` | Balanceamento de chaves JS/CSS, IDs obrigatórios, imagens |
| `check_duplicate_ids.py` | Detecta IDs duplicados no HTML |
| `scratch/static_audit.py` | Cruza `getElementById`/`onclick` ↔ IDs/funções, imagens, temas de mentor, localStorage, funções duplicadas |
| `scratch/runtime_qa.py` | Matriz de 12 dispositivos: exceções, console, overflow, tap-targets, persistência |
| `scratch/verify_fixes.py` | Verificação isolada do modo simples + medição pós-correção |

Servir a pasta: `python -m http.server 8099` e apontar os scripts para `http://localhost:8099/index.html`.

## 4. Matriz de Dispositivos Móveis
| Dispositivo | Resolução (CSS px) | DPR | Classe |
|---|---|---|---|
| iPhone SE (2020) | 375×667 | 2 | Compacto |
| iPhone 12/13/14 | 390×844 | 3 | Padrão |
| iPhone 14 Pro Max | 430×932 | 3 | Grande |
| iPhone 4 / antigos | 320×480 | 2 | Legado estreito |
| Galaxy S8/S22 | 360×740 | 3 | Android padrão |
| Galaxy S20 Ultra | 412×915 | 3.5 | Android grande |
| Pixel 5 | 393×851 | 2.75 | Android referência |
| Galaxy Fold (fechado) | 280×653 | 3 | Ultra-estreito |
| Android baixo custo | 360×640 | 1.5 | Hardware fraco |
| iPad Mini | 768×1024 | 2 | Tablet |
| iPad Pro 11 | 834×1194 | 2 | Tablet grande |
| Desktop | 1280×800 | 1 | Referência web |

## 5. Cobertura por Módulo
### A. Onboarding
1. Intro: cards Modo Simples / RPG e transição para o wizard
2. Wizard RPG: 10 steps (nome, sexo, objetivo, motivação, foco muscular, classe, experiência, frequência, medidas, lesões)
3. Wizard Simples: 6 steps (nome, sexo, objetivo, atividade, medidas, dias/lembretes)
4. Persistência do perfil e transição para `main-app`

### B. Navegação e Abas (7)
`dashboard · workouts · diet · equipment · mentors · status · settings`
- RPG: todas as abas visíveis
- Simples: `equipment/mentors/status` ocultas (verificado)

### C. Dashboard
Água (+/-), atalho de medidas, meta semanal, desafio diário, hero do mentor, ir para dieta.

### D. Treinos
Toggle padrão/custom, divisões A/B/C, exercícios, séries, progressão de carga, finalizar treino (modal + XP).

### E. Dieta
Anéis de macro, alimentos, quick-logs, criar alimento custom, histórico.

### F. Mentores / Status / Equipamentos / Tributo
Filtro por universo (carrossel horizontal), seleção/ativação de mentor, recompensas por nível, troféus, calendário de atividade, slots de equipamento.

### G. Configurações
Modo do app, medidas (peso/altura), objetivo, meta semanal, lembretes/horário, reset de progresso, salvar (persistência).

### H. PWA / Infra
`manifest.json`, `sw.js` (cache v10, estratégia stale-while-revalidate), pausa de animações em background, prevenção de zoom acidental.

## 6. Critérios de Aprovação
- **0** exceções JS (`pageerror`) e **0** `console.error` reais em todos os dispositivos
- **0** overflow horizontal de página em qualquer viewport
- Ambos os modos alcançam `main-app` e persistem estado
- Nenhuma imagem/tema/função referenciada ausente
