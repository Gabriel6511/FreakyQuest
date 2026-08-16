/* Progressao: XP, nivel, XP de mentor, desafio diario, quests
 *
 * Parte 6/14 do antigo app.js (linhas 3149-3685 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 8. PROGRESSION SYSTEM
function getSubclassRank(charClass, lvl) {
  // charClass vem do localStorage sem validacao (loadState lê userObj.class
  // direto). Um valor legado/corrompido aqui derrubava updateUI() inteiro com
  // TypeError — ou seja, app em branco. Mesmo fallback já usado em
  // WORKOUT_TEMPLATES.
  const list = SUB_CLASSES[charClass] || SUB_CLASSES.bodybuilder;
  let activeRank = list[0].name;
  for (let rank of list) {
    if (lvl >= rank.lvl) {
      activeRank = rank.name;
    }
  }
  return activeRank;
}

// XP addition helper - now levels up player level AND credits active mentor XP!
function addXP(amount) {
  const mentorBonus = getMentorXPBonus();
  amount = Math.round(amount * mentorBonus);
  state.xp += amount;
  
  // Add equivalent XP to the active mentor!
  addMentorXP(state.activeMentor, amount);

  // Dynamic floating combat text XP popup
  const floatingXp = document.createElement('div');
  floatingXp.className = 'floating-combat-xp';
  floatingXp.innerText = `+${amount} XP ⚔️`;
  floatingXp.style.left = `${40 + Math.random() * 20}%`;
  floatingXp.style.top = `${60 + Math.random() * 10}%`;
  document.body.appendChild(floatingXp);
  setTimeout(() => floatingXp.remove(), 1200);

  state.xpNeeded = 100 + (state.level * 25);

  while (state.xp >= state.xpNeeded) {
    const oldLevel = state.level;
    state.xp -= state.xpNeeded;
    state.level += 1;
    state.xpNeeded = 100 + (state.level * 25);
    state.attrPoints += 5; // Unlocks 5 points per lvl

    playSound('levelup');
    showLevelUpModal();

    if (state.level >= 5) unlockTrophy('limite_superado');
    if (state.level >= 25) unlockTrophy('freaky_tier');
    
    checkLevelRewards(oldLevel, state.level);
  }
  saveState();
  updateUI();
}

function checkLevelRewards(oldLvl, newLvl) {
  const rewards = [
    { lvl: 5, id: 'item_faixa', name: 'Faixa do Rock Lee', icon: 'faixa_lee_icon.webp', desc: 'Sua agilidade foi notada. Você equipou a faixa do Rock Lee! Ganha uma borda verde neon no seu avatar.' },
    { lvl: 10, id: 'item_bracelete', name: 'Braceletes de Aço', icon: 'braceletes_aco_icon.webp', desc: 'Seus braços estão se tornando resistentes. Braceletes de metal equipados ao lado do seu nome!' },
    { lvl: 20, id: 'item_aura', name: 'Aura de Super Saiyajin', icon: 'aura_goku_icon.webp', desc: 'Seu Ki despertou! Uma aura de chamas douradas agora brilha ao redor do seu avatar!' },
    { lvl: 30, id: 'item_cinturão', name: 'Cinturão de Ouro', icon: 'cinturao_ouro_icon.webp', desc: 'Estética inquestionável. O Cinturão de Ouro de Arnold foi equipado no fundo do seu Status!' },
    { lvl: 40, id: 'item_aurabroly', name: 'Aura Lendária de Broly Z', icon: 'aura_broly_icon.webp', desc: 'Seu poder é máximo! Uma aura colossal de chamas verde néon foi equipada no seu avatar!' },
    { lvl: 50, id: 'item_capa', name: 'Capa do Saitama', icon: 'capa_saitama_icon.webp', desc: 'Treino concluído. Você destravou a Capa do Saitama, que flutua atrás do seu avatar!' }
  ];

  if (!state.unlockedItems) state.unlockedItems = [];

  rewards.forEach(r => {
    if (newLvl >= r.lvl && !state.unlockedItems.includes(r.id)) {
      state.unlockedItems.push(r.id);
      setTimeout(() => {
        showItemAcquiredModal(r.icon, r.name, r.desc);
      }, 1500);
    }
  });
}

// 8b. MENTOR XP & REWARD SYSTEM
function addMentorXP(mentorId, amount) {
  if (!state.mentorAffinities) state.mentorAffinities = {};
  if (!state.mentorAffinities[mentorId]) {
    state.mentorAffinities[mentorId] = { level: 1, xp: 0, prestige: 0 };
  }
  
  let mData = state.mentorAffinities[mentorId];
  if (mData.level >= 50) {
    // Lock XP at level 50
    mData.level = 50;
    mData.xp = 0;
    state.mentorXP[mentorId] = 0;
    state.mentorLevels[mentorId] = 50;
    return;
  }
  
  mData.xp += amount;
  let requiredXP = 100 + (mData.level * 25);
  
  while (mData.xp >= requiredXP && mData.level < 50) {
    mData.xp -= requiredXP;
    const oldLvl = mData.level;
    mData.level += 1;
    requiredXP = 100 + (mData.level * 25);
    
    // Sync to legacy keys
    state.mentorLevels[mentorId] = mData.level;
    state.mentorXP[mentorId] = mData.xp;

    // Play level up sound for active mentor
    playSound('levelup');

    // Check level achievements for active mentor
    checkMentorRewards(mentorId, oldLvl, mData.level);

    if (mData.level >= 10) unlockTrophy('vinculo_forte');
  }
  
  // Sync to legacy keys
  state.mentorLevels[mentorId] = mData.level;
  state.mentorXP[mentorId] = mData.xp;
}

function checkMentorRewards(mentorId, oldLvl, newLvl) {
  const rewards = MENTOR_REWARDS[mentorId];
  if (!rewards) return;

  rewards.forEach(r => {
    if (newLvl >= r.lvl && oldLvl < r.lvl) {
      // Unlock item inside active unlocked items list if not custom (official items are added here)
      if (!state.unlockedItems) state.unlockedItems = [];
      
      // If it is a css_class, save it directly to state.unlockedItems
      if (r.type === 'css_class' && !state.unlockedItems.includes(r.value)) {
        state.unlockedItems.push(r.value);
      }

      // If it is a buff, apply attributes increases dynamically
      if (r.type === 'buff') {
        const parts = r.value.split('+');
        const attr = parts[0]; // e.g. "for", "res", "agi", "vig", "foc"
        const bonus = parseInt(parts[1]) || 5;
        if (state.attributes[attr] !== undefined) {
          state.attributes[attr] += bonus;
        }
      }

      // Play custom unlock sound
      if (r.type === 'sound') {
        setTimeout(() => {
          playSound(r.value);
        }, 1200);
      }

      // Trigger reward modal pop-up on screen
      setTimeout(() => {
        const opts = r.type === 'css_class' ? undefined : { subtitle: 'RECOMPENSA DESBLOQUEADA', btnText: 'SHOW DE BOLA!' };
        const info = getRewardDisplayInfo(r);
        showItemAcquiredModal(info.icon, info.name, `${info.desc} (Ganho ao subir nível do Mentor ${OFFICIAL_MENTORS.find(m => m.id === mentorId)?.name || mentorId}!)`, opts);
      }, 1600);
    }
  });
}

function transcendMentor(mentorId) {
  if (!state.mentorAffinities) state.mentorAffinities = {};
  if (!state.mentorAffinities[mentorId]) {
    state.mentorAffinities[mentorId] = { level: 1, xp: 0, prestige: 0 };
  }
  
  let mData = state.mentorAffinities[mentorId];
  if (mData.level < 50) return; // Must be at least level 50
  
  mData.level = 1;
  mData.xp = 0;
  mData.prestige = (mData.prestige || 0) + 1;
  
  // Sync to legacy keys
  state.mentorLevels[mentorId] = 1;
  state.mentorXP[mentorId] = 0;
  
  if (!state.bakedBuffs) state.bakedBuffs = [];
  const buffName = `${mentorId}_t3_passive`;
  if (!state.bakedBuffs.includes(buffName)) {
    state.bakedBuffs.push(buffName);
  }
  
  const mentor = OFFICIAL_MENTORS.find(m => m.id === mentorId);
  if (mentor) {
    triggerNeuralFlash(mentor);
  }
  playSound('levelup');
  showItemAcquiredModal('⭐', 'ASCENSÃO TRANSCENDIDA!', `O mentor ${OFFICIAL_MENTORS.find(m => m.id === mentorId)?.name || mentorId} atingiu Prestige ${mData.prestige}! Seu bônus passivo Tier 3 (+15s de redução de descanso) foi baked permanentemente na sua conta!`, { subtitle: 'PRESTÍGIO DESBLOQUEADO', btnText: 'MANDA VER!' });
  
  saveState();
  updateUI();
}

// ==========================================
// 8b. DAILY FREAKY CHALLENGE SYSTEM
// ==========================================
const DAILY_CHALLENGES = [
  { id: 'dc_water', title: '💧 Hidratação Absurda', desc: 'Beba 4 Litros de água hoje para purificar o organismo e ganhar poder.', target: 4, type: 'water', rewardXP: 120 },
  { id: 'dc_protein', title: '🥩 Hipertrofia Extrema', desc: 'Consuma 100% da sua meta de proteínas diárias na dieta.', target: 1, type: 'protein', rewardXP: 100 },
  { id: 'dc_workout', title: '🏋️ Volume Mutante', desc: 'Conclua seu treino diário com intensidade extrema.', target: 1, type: 'workout', rewardXP: 150 },
  { id: 'dc_quests', title: '⚔️ Conquista Total', desc: 'Complete todas as 3 missões diárias de hoje.', target: 3, type: 'quests', rewardXP: 130 }
];

function initDailyChallenge() {
  const todayStr = new Date().toDateString();

  // Se dieta está desativada, tira os desafios de tipo 'protein' do sorteio —
  // senão ficariam impossíveis de completar pra quem não registra refeições.
  const eligibleChallenges = state.dietTrackingEnabled === false
    ? DAILY_CHALLENGES.filter(c => c.type !== 'protein')
    : DAILY_CHALLENGES;

  // Select a challenge based on the date so it changes daily
  const dayIndex = Math.abs(todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % eligibleChallenges.length;
  const challenge = eligibleChallenges[dayIndex];
  
  if (!state.dailyChallenge || state.dailyChallenge.dateStr !== todayStr) {
    state.dailyChallenge = {
      id: challenge.id,
      progress: 0,
      completed: false,
      claimed: false,
      dateStr: todayStr
    };
    saveState();
  }
}

function updateDailyChallengeProgress(type, amount) {
  if (!state.dailyChallenge || state.dailyChallenge.claimed) return;
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge || challenge.type !== type) return;

  if (type === 'water') {
    state.dailyChallenge.progress = Math.min(challenge.target, state.waterIntake);
  } else if (type === 'protein') {
    const isTargetMet = state.proteinIntake >= state.protTarget;
    state.dailyChallenge.progress = isTargetMet ? 1 : 0;
  } else if (type === 'workout') {
    state.dailyChallenge.progress = 1;
  } else if (type === 'quests') {
    const completedCount = state.dailyQuests.filter(q => q.completed).length;
    state.dailyChallenge.progress = Math.min(challenge.target, completedCount);
  }

  if (state.dailyChallenge.progress >= challenge.target && !state.dailyChallenge.completed) {
    state.dailyChallenge.completed = true;
    playSound('quest');
  }

  saveState();
  updateUI();
}

function triggerCelebrationConfetti() {
  const canvas = document.getElementById('celebration-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#ff5e00', '#ffb703', '#9b5de5', '#38b000', '#0077b6', '#d4af37', '#e63946'];
  
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 40,
      y: canvas.height * 0.6 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 15 - 5,
      radius: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.01,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    
    particles.forEach(p => {
      if (p.alpha > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      }
    });
    
    if (active) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  animate();
}

function claimDailyChallengeReward() {
  if (!state.dailyChallenge || !state.dailyChallenge.completed || state.dailyChallenge.claimed) return;
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge) return;

  state.dailyChallenge.claimed = true;
  
  const xpReward = challenge.rewardXP;
  addXP(xpReward);

  unlockTrophy('insignia_mutante');

  playSound('levelup');
  showItemAcquiredModal('🔥', 'RECOMPENSA RESGATADA!', `Você ganhou +${xpReward} XP e a Insígnia Mutante para seu Shape!`, { subtitle: 'DESAFIO DIÁRIO', btnText: 'SHOW DE BOLA!' });

  triggerCelebrationConfetti();

  saveState();
  updateUI();
}

function renderDailyChallenge() {
  initDailyChallenge();
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge) return;

  // Refresh progress dynamically
  if (!state.dailyChallenge.claimed) {
    if (challenge.type === 'water') {
      state.dailyChallenge.progress = Math.min(challenge.target, state.waterIntake);
    } else if (challenge.type === 'protein') {
      state.dailyChallenge.progress = state.proteinIntake >= state.protTarget ? 1 : 0;
    } else if (challenge.type === 'quests') {
      const completedCount = state.dailyQuests.filter(q => q.completed).length;
      state.dailyChallenge.progress = Math.min(challenge.target, completedCount);
    }
    if (state.dailyChallenge.progress >= challenge.target) {
      state.dailyChallenge.completed = true;
    }
  }

  const titleEl = document.getElementById('daily-challenge-title');
  const descEl = document.getElementById('daily-challenge-desc');
  const progressFill = document.getElementById('daily-challenge-progress-fill');
  const progressText = document.getElementById('daily-challenge-progress-text');
  const rewardEl = document.getElementById('daily-challenge-reward');
  const claimBtn = document.getElementById('btn-claim-challenge');
  const badgeEl = document.getElementById('daily-challenge-badge');

  if (titleEl) titleEl.innerText = challenge.title;
  if (descEl) descEl.innerText = challenge.desc;

  const currentProg = state.dailyChallenge.progress;
  const targetProg = challenge.target;
  const pct = Math.round((currentProg / targetProg) * 100);

  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) {
    if (challenge.type === 'water') {
      progressText.innerText = `${currentProg} / ${targetProg} L`;
    } else if (challenge.type === 'protein') {
      progressText.innerText = currentProg >= targetProg ? 'CONCLUÍDO' : 'PENDENTE';
    } else if (challenge.type === 'workout') {
      progressText.innerText = currentProg >= targetProg ? 'CONCLUÍDO' : 'PENDENTE';
    } else if (challenge.type === 'quests') {
      progressText.innerText = `${currentProg} / ${targetProg}`;
    }
  }

  if (rewardEl) {
    rewardEl.innerText = `Recompensa: +${challenge.rewardXP} XP Mutante 👑`;
  }

  const dailySectionEl = document.querySelector('.daily-challenge-section');
  if (state.dailyChallenge.claimed) {
    if (dailySectionEl) dailySectionEl.classList.remove('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'CONCLUÍDO';
      badgeEl.style.background = '#4caf50';
    }
    if (claimBtn) {
      claimBtn.classList.add('hidden');
    }
  } else if (state.dailyChallenge.completed) {
    if (dailySectionEl) dailySectionEl.classList.add('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'CONCLUÍDO';
      badgeEl.style.background = '#4caf50';
    }
    if (claimBtn) {
      claimBtn.classList.remove('hidden');
    }
  } else {
    if (dailySectionEl) dailySectionEl.classList.remove('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'ATIVO';
      badgeEl.style.background = 'var(--accent-orange, #ff5e00)';
    }
    if (claimBtn) {
      claimBtn.classList.add('hidden');
    }
  }
}

// ==========================================
// 9. DAILY QUEST GENERATOR
// ==========================================
function generateDailyQuests() {
  const quests = [];
  const todayStr = new Date().toDateString();
  const seed = Math.abs(todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));

  // 1. Water Quest Pool
  const waterPool = [
    { name: 'Hidratação Padrão', desc: `Beber pelo menos ${state.waterTarget}L de água hoje`, xpReward: 20 },
    { name: 'Cardio de H2O Supremo', desc: `Bater ou superar sua meta de água hoje (${state.waterTarget}L)`, xpReward: 25 },
    { name: 'Purificação Líquida', desc: `Consumir pelo menos ${state.waterTarget}L de água para máxima eliminação de toxinas`, xpReward: 20 },
    { name: 'Absorção Anabólica', desc: `Beber ${state.waterTarget}L de água hoje para otimizar síntese proteica`, xpReward: 25 }
  ];
  const waterChoice = waterPool[seed % waterPool.length];
  quests.push({
    id: 'quest_water',
    name: waterChoice.name,
    desc: waterChoice.desc,
    xpReward: waterChoice.xpReward,
    completed: false
  });

  // 2. Diet Quest Pool (ou missão de volume de treino, se dieta estiver desativada)
  if (state.dietTrackingEnabled === false) {
    const volumePool = [
      { name: 'Volume de Ferro', desc: 'Completar pelo menos 12 séries de treino hoje', xpReward: 25 },
      { name: 'Sequência Brutal', desc: 'Bater 12 séries concluídas na Arena de Treino hoje', xpReward: 25 },
      { name: 'Maratona de Séries', desc: 'Concluir 12 séries de treino em um único dia', xpReward: 30 },
      { name: 'Disciplina de Ferro', desc: 'Fechar pelo menos 12 séries de treino hoje', xpReward: 25 }
    ];
    const volumeChoice = volumePool[(seed + 1) % volumePool.length];
    quests.push({
      id: 'quest_volume',
      name: volumeChoice.name,
      desc: volumeChoice.desc,
      xpReward: volumeChoice.xpReward,
      completed: false
    });
  } else {
    const proteinPool = [
      { name: 'Meta Nutricional', desc: `Bater pelo menos 80% da sua meta de proteínas (${Math.round(state.protTarget * 0.8)}g)`, xpReward: 25 },
      { name: 'Hipertrofia Ativada', desc: `Consumir pelo menos 80% de proteínas hoje (${Math.round(state.protTarget * 0.8)}g) para anabolismo`, xpReward: 25 },
      { name: 'Combustível Fibroso', desc: `Registrar pelo menos 80% da meta de proteínas (${Math.round(state.protTarget * 0.8)}g) nas refeições`, xpReward: 30 },
      { name: 'Síntese de Caçador', desc: `Garantir aporte proteico diário de pelo menos (${Math.round(state.protTarget * 0.8)}g)`, xpReward: 25 }
    ];
    const proteinChoice = proteinPool[(seed + 1) % proteinPool.length];
    quests.push({
      id: 'quest_protein',
      name: proteinChoice.name,
      desc: proteinChoice.desc,
      xpReward: proteinChoice.xpReward,
      completed: false
    });
  }

  // 3. Class Quest Pool
  let classPool = [];
  switch(state.charClass) {
    case 'bodybuilder':
      classPool = [
        { name: 'Pump Máximo', desc: 'Finalizar um treino completo na arena de treino', xpReward: 30 },
        { name: 'Exaustão Muscular', desc: 'Finalizar um treino completo com foco em contração extrema', xpReward: 30 },
        { name: 'Volume Anabólico', desc: 'Completar seu treino diário com esforço máximo', xpReward: 35 }
      ];
      break;
    case 'powerlifter':
      classPool = [
        { name: 'Batalha de Cargas', desc: 'Registrar cargas pesadas com postura perfeita', xpReward: 30 },
        { name: 'Tensão Extrema', desc: 'Completar um treino pesado com técnica perfeita e alta carga', xpReward: 35 },
        { name: 'Levantamento de Ferro', desc: 'Registrar um treino focado em exercícios compostos pesados', xpReward: 30 }
      ];
      break;
    case 'calistenia':
      classPool = [
        { name: 'Controle de Aço', desc: 'Completar rotina calistênica isométrica', xpReward: 30 },
        { name: 'Gravidade Desafiada', desc: 'Finalizar um treino completo usando apenas o peso corporal', xpReward: 30 },
        { name: 'Tensão Corporal', desc: 'Concluir treino focado em força isométrica e controle de core', xpReward: 35 }
      ];
      break;
    case 'maratonista':
      classPool = [
        { name: 'Cardio Violento', desc: 'Concluir treino de alta intensidade ou tiros rápidos', xpReward: 30 },
        { name: 'Ritmo de Caçador', desc: 'Finalizar treino de corrida ou cardio com alta frequência cardíaca', xpReward: 30 },
        { name: 'Resistência Extrema', desc: 'Completar uma sessão de condicionamento de alta performance', xpReward: 35 }
      ];
      break;
    default:
      classPool = [
        { name: 'Desafio do Aço', desc: 'Concluir sua atividade física diária com foco total', xpReward: 30 }
      ];
  }
  
  const classChoice = classPool[(seed + 2) % classPool.length];
  let classQuest = {
    id: 'quest_class',
    name: classChoice.name,
    desc: classChoice.desc,
    xpReward: classChoice.xpReward,
    completed: false
  };

  const motivationNote = MOTIVATION_FLAVOR[state.motivation];
  if (motivationNote) {
    classQuest.desc += ` · ${motivationNote}`;
  }
  quests.push(classQuest);
  
  state.dailyQuests = quests;
  saveState();
}

// ==========================================
