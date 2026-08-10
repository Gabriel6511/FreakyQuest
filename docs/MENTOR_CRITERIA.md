# Critérios para Novos Mentores — FreakyQuest

Guia de referência para adicionar um mentor novo (oficial, mantido pelo dev) ao FreakyQuest.
Cobre o que precisa ser **decidido** (design) e o que precisa ser **tocado no código** (checklist técnico), na ordem em que normalmente é feito.

> Mentores "personalizados" pelo próprio jogador (botão "➕ Criar" na aba Mentores) hoje **não** têm criação self-service — o botão só abre um modal pedindo pra chamar no WhatsApp. Este documento é sobre mentores **oficiais**, adicionados via código.

---

## 1. Onde um mentor vive no código

Um mentor toca 4 arquivos e ~5 estruturas de dados diferentes. Nenhuma delas gera a outra automaticamente — é tudo manual.

| O quê | Onde | Arquivo |
|---|---|---|
| Identidade, tema, avatar, frase, buff | `OFFICIAL_MENTORS` (array) | `app.js` (~linha 85) |
| Progressão de 30 níveis (recompensas, missão, títulos) | `MENTOR_REWARD_CONFIGS` (objeto, um por mentor) | `app.js` (~linha 418) |
| Item de equipamento (opcional) desbloqueado por ele | `EQUIPMENT_DATABASE` (array) | `app.js` (~linha 536) |
| Cor do tema visual (hue/sat/light) | `body.theme-<id>` | `styles.css` (~linha 61) |
| Efeito visual da aura no avatar do jogador quando ele é mentor ativo | `.aura-<id>` | `styles.css` (~linha 5459) |
| Botão de filtro por universo (só se for universo novo) | `.muf-btn[data-filter="..."]` | `index.html` (~linha 1292) |
| Ordem/descrição do universo na lista (só se for universo novo) | `UNIVERSE_ORDER` (array) + `UNIVERSE_META` (objeto) | `app.js` (~linha 3798) |
| Frases rotativas do dashboard quando o mentor está ativo (opcional, tem fallback vazio) | `MENTOR_DASHBOARD_QUOTES[id]` | `app.js` (~linha 224) |
| Imagem do mentor | `<id>.webp` na raiz + precache | `sw.js` (`ASSETS`) |

> ⚠️ **Universo novo precisa OBRIGATORIAMENTE entrar em `UNIVERSE_ORDER`** — o comentário no código diz "aparece automaticamente" mas isso só é verdade pra `UNIVERSE_META` (tem fallback gracioso). `renderMentorsList()` só itera sobre `UNIVERSE_ORDER`; um universo de fora dessa lista fica com mentores **invisíveis na aba Mentores** mesmo existindo em `OFFICIAL_MENTORS`. Descoberto na prática ao adicionar a categoria `Coreaninhos` (2026-07-30).

`MENTOR_REWARDS` é gerado automaticamente a partir de `MENTOR_REWARD_CONFIGS` via `generateMentorRewards()` — **não** escreva a progressão de 30 níveis à mão, só preencha o config.

---

## 2. Critérios de design (decidir antes de codar)

Para cada mentor novo, definir:

1. **Universo/categoria** — `Dragon Ball`, `Naruto`, `One Punch Man`, `Fisiculturistas`, `Coreaninhos` (cantores/pessoas públicas coreanas, categoria criada em 2026-07 pra Namjoon/RM e Jin do BTS — não travar em "cantor", serve pra qualquer pessoa pública coreana), ou um novo. Universo novo = precisa de chip de filtro novo na aba Mentores (ver checklist).
2. **Arquétipo** (`archetype`) — hoje existem `effort`, `genetics`, `wisdom`, `beast`, `legend`. Reaproveitar um existente sempre que possível; só criar um novo se nenhum descrever o personagem.
3. **Stat primário e secundário** — de `for` (força), `res` (resistência), `agi` (agilidade), `vig` (vigor), `foc` (foco). Evitar repetir a MESMA combinação primário+secundário de um mentor já existente do mesmo universo, pra manter diferenciação de build.
4. **Frase de efeito (buff) e frase de fala (`quote`)** — o buff é só texto descritivo (ex: "+15% Força & +5% Foco"); não precisa bater matematicamente com nada automatizado, é flavor text hoje.
5. **Nível de requisito** (`levelReq`) — nível mínimo do jogador pra desbloquear o mentor como opção ativável. Os 8 atuais são todos `1`; se quiser criar uma sensação de progressão, um mentor novo pode ter `levelReq` maior.
6. **Progressão de 30 níveis** (`MENTOR_REWARD_CONFIGS`) — preencher:
   - `tier1` (nível 1-ish, geralmente visual: `css_class` de aura/borda) e `tier2` (som ou visual) — essas duas viram os "achievements" mais visíveis cedo.
   - `mission` — a missão semanal exclusiva do mentor (nome + descrição).
   - `tier4` — recompensa de nível mais alto (badge/som).
   - `leaderboardTitle` e `finalTitle` — títulos de rank intermediário e "eterno" (nível 30).
   - `easterDesc` — texto do easter egg secreto (nível 29).
   - `colorLabel`/`particleLabel` — usados em textos gerados automaticamente pelas outras 26 recompensas da progressão.
7. **Item de equipamento (opcional, mas recomendado)** — dos 10 mentores atuais, 7 têm um item real em `EQUIPMENT_DATABASE` (Faixa do Rock Lee, Aura do Goku, Aura do Broly, Capa do Saitama, Cinturão do Arnold, Sorriso do Jin, Aura do Líder/RM); Bebezinho, Ramon Dino e Nick Walker não têm. Não é obrigatório, mas um item visual reforça a identidade do mentor na aba Itens — considerar sempre que o `tier1`/`tier2` do mentor já for do tipo `css_class` (ou seja, já é "um acessório visual" por natureza).
   - ⚠️ **O ícone do item PRECISA ser uma imagem `.webp` gerada (nunca emoji solto)** — regra fixada em 2026-08 depois que os itens do Jin/RM foram lançados com emoji genérico (✨/📖) e ficou claramente inconsistente com os outros 5 itens (que têm arte própria).
   - **O ícone tem que representar o NOME do item ao pé da letra, não a personalidade geral do mentor.** Erro cometido no primeiro rascunho: pra "Aura do Líder" foi gerado um livro (ligado à fama do RM de gostar de ler, mas o item não se chama "aura do leitor") — o certo era uma coroa, símbolo universal de líder. Mesma coisa pra "Sorriso Worldwide Handsome": o primeiro rascunho gerou um coração; o certo é um sorriso brilhando, porque o nome do item é literalmente "sorriso". Regra prática: leia o nome do item, ache o substantivo central, e desenhe ESSE substantivo brilhando — não um símbolo "adjacente" à vibe do personagem.
   - Prompt-modelo (mesmo estilo dos 5 ícones antigos — pintura digital, brilho dramático, fundo preto): *"Digital painting icon, [cor] radiant glow, a glowing [SUBSTANTIVO DO NOME DO ITEM] silhouette/shape at the very center as the light source, [raios/partículas de acordo com o tom], flat vector illustration style, black background, centered composition, square 1:1, no text, no human face — abstract glowing aura only"*.
8. **Nome do arquivo/id** — `id` curto e único (usado em `theme-<id>`, `aura-<id>`, nome do arquivo de imagem); `shortcode` de 3 letras único em `MENTOR_REWARD_CONFIGS` (usado em `has-men-<shortcode><nível>`).

---

## 3. Padrão visual da imagem — proposta de unificação

> ⚠️ **Regra fixa pra mentor baseado em pessoa real viva (fisiculturista, cantor, qualquer pessoa pública)**: **nunca gerar imagem sintética/IA dela numa cena fabricada** (ex: "recriar" a pessoa fazendo exercício que ela nunca fez). Usar sempre uma **foto real** (oficial, dela mesma, de uso permitido) e aplicar o filtro CSS do preset (seção abaixo) — o mesmo tratamento já usado em Arnold/Ramon Dino/Nick Walker, que são fotos reais com filtro, não renders gerados. Decidido em 2026-07 ao adicionar os mentores do BTS. Personagens fictícios (anime) não têm essa restrição.

**Problema atual**: as imagens dos 8 mentores hoje misturam estilos-fonte diferentes (personagens de anime em arte estilizada vs. fisiculturistas reais em foto/render realista), e isso é disfarçado apenas parcialmente por dois presets de filtro CSS (`filterCSS` em `OFFICIAL_MENTORS`) que já existem informalmente:

- **Preset "Anime/Vívido"** (Goku, Broly, Rock Lee, Saitama): `contrast(1.4–1.6) saturate(1.7–2.0) brightness(0.85–0.92)` — realça cor e contraste, mantém o visual de arte/anime saturado.
- **Preset "Lenda/Sépia"** (Bebezinho, Ramon Dino, Arnold, Nick Walker): `contrast(1.3–1.35) saturate(0.1–0.2) sepia(0.4–0.55) brightness(0.88–0.95)` — dessatura quase pro monocromático, tom sépia, clima "lenda old school".

**Recomendação daqui pra frente**:

1. **Formalizar os dois presets como classes CSS reutilizáveis** (`.mentor-filter-anime` / `.mentor-filter-legend`) em vez de recalcular os valores de `filter` a cada mentor novo — reduz inconsistência e facilita ajuste global.
2. **Toda imagem nova, na hora de ser gerada/encomendada, já deve nascer dentro de um dos dois presets** — não tentar misturar um terceiro estilo visual sem antes decidir se vira um terceiro preset formal (e documentá-lo aqui).
3. **Enquadramento padrão**: retrato ou 3/4 do corpo, plano de fundo neutro/escuro (o app já aplica tema de cor por cima), o personagem olhando na direção da câmera ou em pose de ação de treino.
4. **Considerar padronizar todos os mentores em cena/pose de academia** (puxando ferro, alongando, no vestiário) — reforça o tema do app e reduz a sensação de colagem de fontes de imagem diferentes. Se adotado, vale um plano de atualizar os 8 mentores existentes numa leva só, não só os novos (pra não piorar a inconsistência ao criar um 9º estilo).
5. **Especificação técnica do arquivo**:
   - Dimensão: `1024x1024` (padrão dos 8 atuais).
   - Formato: `.webp`, qualidade 90 (ver `scratch/convert_webp.py`), a não ser que o arquivo já venha nesse formato da origem.
   - Nome do arquivo = `<id>.webp` (mesmo id usado em `OFFICIAL_MENTORS`).

---

## 4. Checklist técnico (ordem sugerida)

1. [ ] Definir `id`, `shortcode`, universo, arquétipo, stats, `levelReq` (seção 2).
2. [ ] Gerar/obter a imagem já no preset visual correto (seção 3) e converter pra `<id>.webp` 1024x1024.
3. [ ] Adicionar entrada em `OFFICIAL_MENTORS` (`app.js`).
4. [ ] Adicionar entrada em `MENTOR_REWARD_CONFIGS` (`app.js`) — a progressão de 30 níveis é gerada sozinha.
5. [ ] (Opcional) Adicionar item correspondente em `EQUIPMENT_DATABASE` (`app.js`) se o mentor tiver um acessório visual marcante.
6. [ ] Adicionar `body.theme-<id> { --primary-hue/sat/light; --accent-hue/sat/light; }` em `styles.css`.
7. [ ] Adicionar `.aura-<id>` (efeito de borda/aura no avatar do jogador) em `styles.css`, seguindo o padrão de `.aura-rocklee`/`.aura-goku`.
8. [ ] Se for universo novo: adicionar `<button class="muf-btn" data-filter="<Universo>">` no filtro de universo em `index.html` **e** adicionar o universo em `UNIVERSE_ORDER` + `UNIVERSE_META` em `app.js` (~linha 3798) — sem isso o mentor fica invisível na lista.
9. [ ] (Opcional) Adicionar 5 frases em `MENTOR_DASHBOARD_QUOTES[id]` (`app.js`) — tem fallback vazio, não quebra se pular.
10. [ ] Adicionar `<id>.webp` à lista `ASSETS` do `sw.js` **e** bumpar `CACHE_NAME` (senão o app fica preso na versão de cache anterior sem a imagem nova).
11. [ ] Rodar `python validate.py` e `python check_duplicate_ids.py`.
12. [ ] Testar visualmente: mentor aparece no grupo certo da lista, filtro de universo funciona, ativar mentor troca o tema/aura/avatar em toda a UI (header, bubble do dashboard, cards), 0 erros de console.

---

## 5. Inconsistências conhecidas nos 8 mentores atuais (não bloqueante, registrado pra decisão futura)

- Bebezinho, Ramon Dino e Nick Walker não têm item em `EQUIPMENT_DATABASE` (ver item 7 da seção 2).
- Os presets de filtro (seção 3) existem só implicitamente nos valores de `filterCSS` — ainda não foram extraídos pra classes CSS reutilizáveis.
- As imagens dos 8 mentores atuais não seguem literalmente o mesmo enquadramento/pose (mistura retrato de rosto com corpo inteiro) — candidato a nivelamento numa leva futura de atualização visual, se a padronização da seção 3 for adotada.

## 6. Plano em andamento (2026-07)

- ✅ **Concluído (2026-07-30)**: adicionados **Jin "Worldwide Handsome"** (`genetics`, VIG/FOR) e **RM "Namjoon"** (`wisdom`, FOC/VIG), categoria nova `Coreaninhos`. Fotos reais (não geradas por IA) fornecidas pelo usuário, recortadas em quadrado 1024x1024 e convertidas pra webp. 10 mentores no total agora.
- ✅ **Concluído (2026-08-10)**: itens dos dois mentores (`item_jin`/"Sorriso Worldwide Handsome" e `item_namjoon`/"Aura do Líder") ganharam ícone `.webp` próprio, substituindo os emoji genéricos (✨/📖) do lançamento inicial. Ver regra nova na seção 2, item 7.
- **Próximo passo, ainda não iniciado**: refazer as fotos de TODOS os 10 mentores numa leva só, pra padronizar tudo dentro dos presets formais desta seção (usuário confirmou que quer fazer isso).
