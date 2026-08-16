/* Tutorial
 *
 * Parte 13/14 do antigo app.js (linhas 6929-7122 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 20. TUTORIAL SYSTEM
// ==========================================
const TUTORIAL_STEPS = [
  {
    title: 'Bem-vindo, Caçador! ⚔️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">🎯</div></div>',
    text: 'O FreakyQuest transforma seu treino de academia em um RPG de verdade. Suor virando XP, disciplina virando nível. Toque em "Avançar" pra ver o mapa rápido antes de começar a jornada.'
  },
  {
    title: 'Seu Painel é a Base de Operações 📋',
    illoHTML: '<div class="tutorial-anim-quests"><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Beber água</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Bater proteína</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Treino do dia</span></div></div>',
    text: 'No Painel você vê seu mentor, sua barra de XP e seus atributos em tempo real. Beba água, complete as Missões Diárias e o Desafio Freaky pra garantir XP extra todo santo dia.'
  },
  {
    title: 'Arena de Treino: Cada Série Conta 🏋️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">💪</div></div>',
    text: 'Registre a carga, toque nas séries pra completar e deixe o Cronômetro de Descanso cuidar do tempo entre elas. Supere seu próprio recorde e a Progressão de Carga te recompensa com XP bônus na hora.'
  },
  {
    title: 'Cardio Também Vale XP 🏃',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">🏃</div></div>',
    text: 'Esteira, bike, corrida ou natação: na aba Treinos, toque em "Registrar Cardio", escolha a atividade e o tempo. O XP é proporcional aos minutos e cresce junto com sua Resistência — quem prefere cardio a puxar ferro evolui igual.'
  },
  {
    title: 'Dieta: Três Anéis, Um Objetivo 🍗',
    illoHTML: '<div class="tutorial-anim-attributes"><div class="tutorial-attr-node node-n"></div><div class="tutorial-attr-node node-e"></div><div class="tutorial-attr-node node-w"></div><div class="tutorial-attr-core">🍗</div></div>',
    text: 'Calorias, proteína e fibra ganharam HUD próprio com três anéis. Registre suas refeições e veja eles se preencherem — sua meta calórica já é calculada automaticamente com base no seu objetivo.'
  },
  {
    title: 'Mentores: Todos Liberados desde o Nível 1 🐉',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-mentors">🐉</div></div>',
    text: 'Filtre por universo — Dragon Ball, Naruto, One Punch Man, Fisiculturistas, Coreaninhos — e escolha seu mentor base sem precisar destravar nada. Cada um sobe até o nível 30 com 23 recompensas próprias: a jornada é longa de propósito.'
  },
  {
    title: 'Equipamentos: Vista suas Conquistas 🛡️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-auras">🛡️</div></div>',
    text: 'Subindo de nível com um mentor, você destrava itens — auras, faixas, cinturões. Equipe-os na aba Itens e ganhe bônus reais de atributo, não é só visual!'
  },
  {
    title: 'Seu Cartão de Caçador 🪪',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-profile">🪪</div></div>',
    text: 'Na aba Status, abra o Cartão de Caçador pra ver seu Hunter Rank, fixar seus marcos de força favoritos e destacar troféus.'
  },
  {
    title: 'Amigos & Ranking 👥',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-mentors">👥</div></div>',
    text: 'Compartilhe seu link de convite e acompanhe a evolução da galera lado a lado. Tem também o Ranking Global, com os caçadores de mais XP. Você encontra tudo em Ajustes → Amigos & Ranking.'
  },
  {
    title: 'Salve seu Progresso na Nuvem ☁️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">☁️</div></div>',
    text: 'Em Ajustes → Conta, coloque seu e-mail e digite o código que chegar por e-mail (sem senha pra decorar). Assim seu progresso fica salvo e você continua de onde parou mesmo trocando de celular. Bora treinar?'
  }
];

const SIMPLE_TUTORIAL_STEPS = [
  {
    title: 'Bem-vindo! 👋',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">🎯</div></div>',
    text: 'Este é o modo simples: focado em treinos, dieta e água, sem complicações. Toque em "Avançar" para uma overview rápida.'
  },
  {
    title: 'Painel Diário 📋',
    illoHTML: '<div class="tutorial-anim-quests"><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Beber água</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Bater proteína</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Treino do dia</span></div></div>',
    text: 'Acompanhe aqui sua água, suas metas de macros e o resumo do dia. Tudo calculado automaticamente a partir do seu objetivo.'
  },
  {
    title: 'Treinos 🏋️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">🏋️</div></div>',
    text: 'Marque as séries conforme conclui, acompanhe o progresso e finalize o treino. Sem XP, sem ranks — só registro.'
  },
  {
    title: 'Cardio 🏃',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">🏃</div></div>',
    text: 'Fez esteira, bike ou corrida? Na aba Treinos, toque em "Registrar Cardio" e anote o tempo. Fica tudo registrado junto com o resto do seu dia.'
  },
  {
    title: 'Dieta 🍗',
    illoHTML: '<div class="tutorial-anim-attributes"><div class="tutorial-attr-node node-n"></div><div class="tutorial-attr-node node-e"></div><div class="tutorial-attr-node node-w"></div><div class="tutorial-attr-core">🍗</div></div>',
    text: 'Registre refeições e veja os anéis de calorias, proteína e fibra atualizados em tempo real. Seu objetivo já está configurado no onboarding.'
  },
  {
    title: 'Salve seu Progresso ☁️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">☁️</div></div>',
    text: 'Em Ajustes → Conta, coloque seu e-mail e digite o código que chegar por e-mail (sem senha pra decorar). Seu progresso fica salvo e você continua de onde parou mesmo trocando de celular.'
  },
  {
    title: 'Pronto para começar! ✅',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-profile">🚀</div></div>',
    text: 'Use o menu inferior para navegar entre Painel, Treinos e Dieta. Sem distrações, sem gamificação. Bora treinar?'
  }
];

let tutorialStep = 0;
let tutorialTimeoutId = null;

function getTutorialSteps() {
  return state.appMode === 'simple' ? SIMPLE_TUTORIAL_STEPS : TUTORIAL_STEPS;
}

function closeTutorial() {
  state.tutorialCompleted = true;
  saveState();
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (tutorialTimeoutId) {
    clearTimeout(tutorialTimeoutId);
    tutorialTimeoutId = null;
  }

  // Conta nova nunca escolheu mentor de verdade (o app só usa Rock Lee como
  // valor inicial padrão) — leva pra aba Mentores e destaca o convite pra
  // escolher, em vez de deixar o jogador com um mentor que ele nunca pediu.
  if (!state.mentorManuallyChosen) {
    const mentorsNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="mentors"]');
    if (mentorsNavBtn) mentorsNavBtn.click();
    const banner = document.getElementById('pick-mentor-banner');
    if (banner) banner.classList.remove('hidden');
  }
}

function startTutorial() {
  const overlay = document.getElementById('tutorial-overlay');
  // O overlay nasce com a classe "hidden" no HTML — checar por ela aqui
  // fazia o tutorial se marcar como concluído e nunca aparecer.
  if (!overlay) {
    state.tutorialCompleted = true;
    saveState();
    return;
  }
  tutorialStep = 0;
  renderTutorialStep(tutorialStep);
  overlay.classList.remove('hidden');
}

function renderTutorialStep(idx) {
  const steps = getTutorialSteps();
  const step = steps[idx];
  document.getElementById('tutorial-step-title').innerText = step.title;
  document.getElementById('tutorial-step-illustration').innerHTML = step.illoHTML;
  document.getElementById('tutorial-step-text').innerText = step.text;

  // Bolinhas geradas conforme o número real de passos do modo atual (RPG e
  // Simples têm quantidades diferentes).
  const dotsContainer = document.getElementById('tutorial-steps-dots');
  if (dotsContainer) {
    if (dotsContainer.children.length !== steps.length) {
      dotsContainer.innerHTML = steps.map((_, i) => `<span class="dot" data-step="${i}"></span>`).join('');
    }
    Array.from(dotsContainer.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  }
  const btnNext = document.getElementById('btn-tutorial-next');
  btnNext.innerText = (idx === steps.length - 1) ? 'VAMOS TREINAR! 💪' : 'AVANÇAR →';

  const btnSkip = document.getElementById('btn-tutorial-skip');
  const btnPrev = document.getElementById('btn-tutorial-prev');
  if (btnSkip && btnPrev) {
    if (idx === 0) {
      btnSkip.classList.remove('hidden');
      btnPrev.classList.add('hidden');
    } else {
      btnSkip.classList.add('hidden');
      btnPrev.classList.remove('hidden');
    }
  }
}

function applyNumericSanitizer(selector, decimals) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.type = 'text';
  el.inputMode = 'decimal';
  el.addEventListener('input', (e) => {
    let val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > decimals) {
      val = parts[0] + '.' + parts[1].substring(0, decimals);
    }
    e.target.value = val;
  });
  el.addEventListener('change', (e) => {
    let val = e.target.value;
    if (val.endsWith('.')) {
      e.target.value = val.slice(0, -1);
    }
  });
}

// ==========================================
