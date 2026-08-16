/* Tema visual do mentor, render geral da UI, quests na tela, alertas de carga
 *
 * Parte 7/14 do antigo app.js (linhas 3686-4947 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 10. DYNAMIC CSS STYLES FOR CUSTOM MENTORS
// ==========================================
function applyMentorVisualTheme(mentor) {
  if (!mentor) return;
  
  // Manage Bebezinho particles
  let particlesContainer = document.getElementById('bebezinho-particles');
  if (mentor.id === 'bebezinho') {
    if (!particlesContainer) {
      particlesContainer = document.createElement('div');
      particlesContainer.id = 'bebezinho-particles';
      particlesContainer.className = 'bebezinho-particles-container';
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'bebezinho-sparkle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.animationDelay = `${Math.random() * 3}s`;
        p.style.animationDuration = `${2 + Math.random() * 4}s`;
        particlesContainer.appendChild(p);
      }
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.appendChild(particlesContainer);
      }
    }
  } else {
    if (particlesContainer) {
      particlesContainer.remove();
    }
  }

  if (mentor.isCustom) {
    // Dynamic styles generation on fly!
    let styleTag = document.getElementById('custom-mentor-theme-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-mentor-theme-style';
      document.head.appendChild(styleTag);
    }
    
    const h = mentor.hue;
    styleTag.innerHTML = `
      body.theme-custom-${mentor.id} {
        --primary-hue: ${h};
        --primary-sat: 90%;
        --primary-light: 50%;
        --accent-hue: ${(h + 150) % 360};
        --accent-sat: 95%;
        --accent-light: 50%;
      }
    `;
    
    const modeClass = (state.appMode === 'simple') ? 'mode-simple' : '';
    const dietClass = (state.dietTrackingEnabled === false) ? 'diet-disabled' : '';
    document.body.className = [modeClass, dietClass, `theme-custom-${mentor.id}`].filter(Boolean).join(' ');
  } else {
    const modeClass = (state.appMode === 'simple') ? 'mode-simple' : '';
    const dietClass = (state.dietTrackingEnabled === false) ? 'diet-disabled' : '';
    document.body.className = [modeClass, dietClass, mentor.theme].filter(Boolean).join(' ');
  }
}

// ==========================================
// Helper to get avatar source URL (handles URLs, paths, and converts emojis to SVG data URLs)
function getMentorAvatarSrc(mentor) {
  if (!mentor) return 'rocklee.webp';
  const avatar = mentor.avatar;
  if (!avatar) return 'rocklee.webp';
  
  if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.includes('.') || avatar.startsWith('/') || avatar.startsWith('assets/')) {
    return avatar;
  }
  
  // Encode emoji/text into a clean inline SVG data URL
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.82em" font-size="70" x="15">${avatar}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
}

function getUserAvatarSrc() {
  if (state.profilePic) {
    return state.profilePic;
  }
  // Fallback to active mentor avatar
  let activeMentorData = OFFICIAL_MENTORS.find(m => m.id === state.activeMentor);
  if (!activeMentorData) {
    activeMentorData = state.customMentors.find(m => m.id === state.activeMentor);
  }
  if (!activeMentorData) activeMentorData = OFFICIAL_MENTORS[0];
  return getMentorAvatarSrc(activeMentorData);
}

// 11. UI RENDERING SYSTEM
// ==========================================
// ==========================================
function updateUI() {
  checkDailyReset();
  recalculateMacrosTargets();
  document.body.classList.toggle('diet-disabled', state.dietTrackingEnabled === false);

  const isSimple = state.appMode === 'simple';
  const playerNameEl = document.getElementById('player-name');
  if (playerNameEl) playerNameEl.innerText = state.charName;

  const finishBtn = document.getElementById('btn-finish-workout');
  if (finishBtn) finishBtn.innerText = isSimple ? '✅ FINALIZAR TREINO' : '⚔️ FINALIZAR TREINO (+50 XP)';
  const cardioDescEl = document.getElementById('cardio-card-desc');
  if (cardioDescEl) cardioDescEl.innerText = isSimple
    ? 'Esteira, bike, corrida, natação — registre o tempo do seu cardio.'
    : 'Esteira, bike, corrida, natação — registre o tempo e ganhe XP (escala com Resistência).';
  const dietHeaderEl = document.querySelector('#tab-diet .section-title-wrapper h3');
  if (dietHeaderEl) dietHeaderEl.innerText = isSimple ? '🍎 Alimentação & Dieta' : '🍎 Alimentação & Dieta RPG';
  const inventoryHeaderEl = document.querySelector('.rpg-inventory-card h4');
  if (inventoryHeaderEl) inventoryHeaderEl.innerText = isSimple ? '🎒 Registro Rápido (Refeições Rápidas)' : '🎒 Inventário RPG (Refeições Rápidas)';

  if (!isSimple) {
    document.getElementById('player-level-badge').innerText = `Lvl ${state.level}`;
    const mhsLevel = document.getElementById('mhs-level-badge');
    if (mhsLevel) mhsLevel.innerText = state.level;
  } else {
    const levelBadge = document.getElementById('player-level-badge');
    if (levelBadge) levelBadge.innerText = '';
    const mhsLevel = document.getElementById('mhs-level-badge');
    if (mhsLevel) mhsLevel.innerText = '';
  }

  const classLabels = {
    bodybuilder: 'Bodybuilder 💪',
    powerlifter: 'Powerlifter 🏋️‍♂️',
    calistenia: 'Calistênico 🤸‍♂️',
    maratonista: 'Maratonista 🏃‍♂️'
  };
  if (!isSimple) {
    document.getElementById('player-class-name').innerText = classLabels[state.charClass] || state.charClass;
  } else {
    document.getElementById('player-class-name').innerText = '';
  }

  if (!isSimple) {
    const currentRank = getSubclassRank(state.charClass, state.level);
    document.getElementById('player-rank').innerText = currentRank;
  } else {
    document.getElementById('player-rank').innerText = '';
  }

  if (!isSimple) {
    document.getElementById('xp-text').innerText = `${state.xp} / ${state.xpNeeded} XP`;
    const xpPercent = Math.min(100, (state.xp / state.xpNeeded) * 100);
    document.getElementById('xp-fill').style.width = `${xpPercent}%`;
    const mhsXpText = document.getElementById('mhs-xp-text');
    if (mhsXpText) mhsXpText.innerText = `${state.xp} / ${state.xpNeeded}`;
    const mhsXpFill = document.getElementById('mhs-xp-fill');
    if (mhsXpFill) mhsXpFill.style.width = `${xpPercent}%`;
  } else {
    document.getElementById('xp-text').innerText = '';
    document.getElementById('xp-fill').style.width = '0%';
    const mhsXpText = document.getElementById('mhs-xp-text');
    if (mhsXpText) mhsXpText.innerText = '';
    const mhsXpFill = document.getElementById('mhs-xp-fill');
    if (mhsXpFill) mhsXpFill.style.width = '0%';
  }

  // Get active mentor data (Official or Custom)
  let activeMentorData = OFFICIAL_MENTORS.find(m => m.id === state.activeMentor);
  if (!activeMentorData) {
    activeMentorData = state.customMentors.find(m => m.id === state.activeMentor);
  }
  if (!activeMentorData) activeMentorData = OFFICIAL_MENTORS[0]; // fallback Lee

  // Set avatar pictures (using new helper for custom and official mentors)
  const userAvatarSrc = getUserAvatarSrc();
  const avatarSrc = getMentorAvatarSrc(activeMentorData);
  document.getElementById('header-avatar').src = userAvatarSrc;
  document.getElementById('status-avatar').src = userAvatarSrc;

  // Apply aura styles
  const headerAvatarWrapper = document.getElementById('header-avatar').parentElement;
  const statusAvatarWrapper = document.getElementById('status-avatar').parentElement;
  const auraClasses = ['aura-bebezinho', 'aura-brolyz', 'aura-rocklee', 'aura-ramondino', 'aura-goku', 'aura-arnold', 'aura-saitama', 'aura-nickwalker', 'aura-custom'];
  if (headerAvatarWrapper) {
    auraClasses.forEach(c => headerAvatarWrapper.classList.remove(c));
    headerAvatarWrapper.classList.add(activeMentorData.isCustom ? 'aura-custom' : `aura-${activeMentorData.id}`);
  }
  if (statusAvatarWrapper) {
    auraClasses.forEach(c => statusAvatarWrapper.classList.remove(c));
    statusAvatarWrapper.classList.add(activeMentorData.isCustom ? 'aura-custom' : `aura-${activeMentorData.id}`);
  }

  // ── Mentor Hero HUD (novo dashboard hero) ──
  const heroImg = document.getElementById('mentor-bubble-img');
  const heroName = document.getElementById('mentor-bubble-name');
  const heroSub = document.getElementById('mhs-mentor-sub');
  const heroQuote = document.getElementById('mentor-bubble-quote');
  const heroCharName = document.getElementById('mhs-char-name');

  if (heroImg) {
    heroImg.src = avatarSrc;
    if (activeMentorData.filterCSS) heroImg.style.filter = activeMentorData.filterCSS;
  }
  if (heroName) heroName.innerText = activeMentorData.name;
  if (heroSub) {
    const classLabel = classLabels[state.charClass] || state.charClass || '';
    const mAffHero = (state.mentorAffinities && state.mentorAffinities[activeMentorData.id]) || { level: 1 };
    const rankHero = getMentorRankTitle(mAffHero.level);
    heroSub.innerText = `${classLabel} · ${rankHero.label}`;
  }
  if (heroCharName) heroCharName.innerText = state.charName || 'Hunter';

  // Rings e orbs dinâmicos por cor do mentor
  const mc = activeMentorData.colorHex || 'var(--color-primary)';
  ['mhs-ring1','mhs-ring2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.borderColor = mc;
  });
  const orb1 = document.getElementById('mhs-orb1');
  const orb2 = document.getElementById('mhs-orb2');
  if (orb1) orb1.style.background = mc;
  if (orb2) orb2.style.background = activeMentorData.colorHex ? mc + 'bb' : 'var(--color-accent)';

  const avatarGlow = document.getElementById('mhs-avatar-glow');
  if (avatarGlow) avatarGlow.style.background = mc;

  // Atributos no HUD
  if (state.attributes) {
    const eff = getEffectiveAttributes();
    const attrMap = { for: 'dash-attr-for', res: 'dash-attr-res', agi: 'dash-attr-agi', vig: 'dash-attr-vig', foc: 'dash-attr-foc' };
    Object.entries(attrMap).forEach(([key, elId]) => {
      const el = document.getElementById(elId);
      if (el) el.innerText = eff[key] ?? '—';
    });
  }

  // Quote do mentor
  const motivationTip = MOTIVATION_FLAVOR[state.motivation];
  const quoteText = motivationTip ? `${activeMentorData.quote} (${motivationTip})` : activeMentorData.quote;
  if (heroQuote) heroQuote.innerText = quoteText.replace(/^"|"$/g, '');

  // ── Active Mentor Bar (aba de mentores) ──
  const ambImg = document.getElementById('amb-img');
  const ambName = document.getElementById('amb-name');
  const ambUniv = document.getElementById('amb-universe');
  const ambLvl = document.getElementById('amb-lvl');
  const ambRank = document.getElementById('amb-rank');
  if (ambImg) {
    // Zera a opacity antes de trocar o src — o onerror inline do HTML
    // (disparado no primeiro render, quando src="" ainda está vazio) deixa
    // opacity:0 preso mesmo depois que uma imagem válida carrega com sucesso.
    ambImg.style.opacity = '';
    ambImg.src = avatarSrc;
    if (activeMentorData.filterCSS) ambImg.style.filter = activeMentorData.filterCSS;
  }
  if (ambName) ambName.innerText = activeMentorData.name;
  if (ambUniv) ambUniv.innerText = activeMentorData.universe || '';
  if (ambLvl) {
    const mAffBar = (state.mentorAffinities && state.mentorAffinities[activeMentorData.id]) || { level: 1 };
    ambLvl.innerText = `Nv ${mAffBar.level}`;
    const rankBar = getMentorRankTitle(mAffBar.level);
    if (ambRank) { ambRank.innerText = rankBar.label; ambRank.style.color = rankBar.color; }
  }

  // Apply theme coloring
  applyMentorVisualTheme(activeMentorData);

  // ==========================================
  // TAB: PAINEL / DASHBOARD
  // ==========================================
  // Synchronize userProfile from localStorage 'freaky_quest_user' if available
  try {
    const storedUser = localStorage.getItem('freaky_quest_user');
    if (storedUser) {
      Object.assign(userProfile, JSON.parse(storedUser));
    }
  } catch (e) {}

  // Sync basic UI elements based on userProfile
  const pName = userProfile.name || state.charName || 'Nick';
  const playerNameEl2 = document.getElementById('player-name');
  if (playerNameEl2) {
    playerNameEl2.innerText = pName;
  }
  if (!isSimple) {
    document.getElementById('player-level-badge').innerText = `Nv ${state.level}`;
    const mhsLevel2 = document.getElementById('mhs-level-badge');
    if (mhsLevel2) mhsLevel2.innerText = state.level;

    const uClass = userProfile.class || state.charClass || 'bodybuilder';
    document.getElementById('player-class-name').innerText = classLabels[uClass] || uClass;

    const uRank = getSubclassRank(uClass, state.level);
    document.getElementById('player-rank').innerText = uRank;
  }

  // Hero quote (safe — element may be the new mhs strip or legacy)
  const heroQuoteEl = document.getElementById('mentor-bubble-quote');
  if (heroQuoteEl) {
    const uMotivationTip = MOTIVATION_FLAVOR[userProfile.motivation || state.motivation];
    const fullQuote = uMotivationTip
      ? `${activeMentorData.quote} (${uMotivationTip})`
      : activeMentorData.quote;
    heroQuoteEl.innerText = fullQuote.replace(/^"|"$/g, '');
  }

  // IMC Ficha indicators from userProfile
  const weight = parseFloat(userProfile.currentWeight) || parseFloat(state.charWeight) || 75;
  const height = parseFloat(userProfile.height) || parseFloat(state.charHeight) || 175;
  
  document.getElementById('eval-weight').innerText = `${weight} kg`;
  document.getElementById('eval-height').innerText = `${height} cm`;
  
  const hMeters = height / 100;
  const imc = weight / (hMeters * hMeters);
  document.getElementById('eval-imc').innerText = imc.toFixed(1);
  
  let imcCat = "Ideal";
  let imcRpgTip = "";
  if (imc < 18.5) {
    imcCat = "Abaixo do Peso";
    imcRpgTip = isSimple ? "Abaixo do peso. Considere aumentar a ingestão calórica com foco em proteínas e treino de força." : "🏹 <strong>Ectomorfo Ágil:</strong> Alta agilidade nativa! Foco em bater o <strong>Surplus de Calorias (Bulking)</strong> urgente para ganhar massa muscular.";
  } else if (imc < 25) {
    imcCat = "Peso Ideal";
    imcRpgTip = isSimple ? "Peso saudável. Mantenha a rotina de treinos e alimentação equilibrada." : "⚔️ <strong>Shape Equilibrado:</strong> Status corporais estáveis. Pronto para qualquer especialidade do ferro!";
  } else if (imc < 30) {
    imcCat = "Sobrepeso";
    imcRpgTip = isSimple ? "Sobrepeso. Um pequeno déficit calórico e atividade regular ajudam a evoluir." : "🛡️ <strong>Potencial Tanker:</strong> Força muscular acumulada! Ótimo para levantar cargas brutas e lapidar o shape.";
  } else {
    imcCat = "Obesidade";
    imcRpgTip = isSimple ? "Atenção: procure acompanhamento médico e nutricional para ajustes seguros." : "🌋 <strong>Titã Supremo:</strong> Enorme potencial de força bruta. Ajuste sua ingestão proteica e rotina semanal para lapidar essa muralha.";
  }
  document.getElementById('eval-imc-class').innerText = imcCat;
  document.getElementById('eval-rpg-tip').innerHTML = imcRpgTip;
  
  const goalsLabelsSimple = {
    emagrecer: "Perder peso",
    engordar: "Ganhar massa",
    manter: "Manter peso",
    estetico: "Estética",
    saude: "Saúde"
  };
  const goalsLabelsRpg = {
    emagrecer: "Secar (Cutting) ⚡",
    engordar: "Crescer (Bulking) 🌋",
    manter: "Lapidar (Recomp) ⚖️",
    estetico: "Ficar Estético 🏆",
    saude: "Melhorar Saúde 🧬"
  };
  const goalsLabels = isSimple ? goalsLabelsSimple : goalsLabelsRpg;
  document.getElementById('eval-goal-badge').innerText = goalsLabels[userProfile.mainObjective || state.charGoal] || state.charGoal || '—';

  // Meta semanal de treinos
  checkWeeklyReset();
  const weeklyCurrent = state.workoutsThisWeek || 0;
  // state.trainingDays é a fonte real (sincroniza na nuvem); userProfile.weeklyDaysGoal
  // é uma cópia local que não participa do sync — usá-la primeiro podia mostrar a meta
  // desatualizada depois de puxar progresso de outro aparelho.
  const weeklyTarget = (state.trainingDays && state.trainingDays.length) || state.weeklyTrainGoal || 4;
  const weeklyPct = Math.min(100, Math.round((weeklyCurrent / weeklyTarget) * 100));
  const weeklyBadge = document.getElementById('weekly-goal-badge');
  const weeklyFill = document.getElementById('weekly-progress-fill');
  const weeklyText = document.getElementById('weekly-goal-text');
  if (weeklyBadge) weeklyBadge.innerText = `${weeklyCurrent}/${weeklyTarget}`;
  if (weeklyFill) weeklyFill.style.width = `${weeklyPct}%`;
  if (weeklyText) {
    if (weeklyCurrent >= weeklyTarget) {
      weeklyText.innerText = isSimple
        ? `🎯 Meta batida! ${weeklyCurrent - weeklyTarget > 0 ? `+${weeklyCurrent - weeklyTarget} treino(s) extra(s) esta semana.` : 'Constância!'}`
        : `🔥 Meta batida! ${weeklyCurrent - weeklyTarget > 0 ? `+${weeklyCurrent - weeklyTarget} treino(s) extra(s) esta semana.` : 'Constância de caçador!'}`;
    } else {
      weeklyText.innerText = `Faltam ${weeklyTarget - weeklyCurrent} treino(s) para completar sua meta semanal.`;
    }
  }

  // Progresso de séries do treino de hoje
  const workoutStats = getWorkoutCompletionStats();
  const workoutProgressEl = document.getElementById('workout-today-progress');
  if (workoutProgressEl) {
    workoutProgressEl.innerText = `${workoutStats.completedSets}/${workoutStats.totalSets} séries hoje (${Math.round(workoutStats.percent)}%)`;
  }

  const cardioTodayEl = document.getElementById('cardio-minutes-today');
  if (cardioTodayEl) cardioTodayEl.innerText = state.cardioMinutesToday || 0;

  // Water bottles rendering (litre by litre!)
  document.getElementById('water-target-input').value = state.waterTarget;
  const bottlesContainer = document.getElementById('water-bottles-container');
  bottlesContainer.innerHTML = '';
  
  const currentLitres = state.waterDrank || state.waterIntake || 0;
  const targetLitres = state.waterTarget;
  
  // Render target bottles
  for (let i = 1; i <= targetLitres; i++) {
    const b = document.createElement('div');
    b.className = `water-bottle-icon ${i <= currentLitres ? 'active' : ''}`;
    b.title = `${i} Litro`;
    b.addEventListener('click', () => {
      playSound('water');
      state.waterDrank = i;
      state.waterIntake = i;
      checkQuestRequirements();
      saveState();
      updateUI();
      const pct = Math.min(100, Math.round((i / targetLitres) * 100));
      triggerWaterAnimation(pct);
    });
    bottlesContainer.appendChild(b);
  }
  
  // Litres summary text
  document.getElementById('water-text').innerText = `${currentLitres} / ${state.waterTarget} L`;
  
  // Update water cylinder fill level
  const cylinderFill = document.getElementById('water-cylinder-fill');
  if (cylinderFill) {
    const waterPct = Math.min(100, Math.round((currentLitres / targetLitres) * 100));
    cylinderFill.style.height = `${waterPct}%`;
    if (waterPct === 0) {
      cylinderFill.classList.add('empty');
    } else {
      cylinderFill.classList.remove('empty');
    }
  }
  
  // Exceeding water litres calculation
  const extraWaterText = document.getElementById('water-extra-text');
  if (currentLitres > state.waterTarget) {
    const extraL = currentLitres - state.waterTarget;
    if (!isSimple) {
      const extraXp = extraL * 10;
      extraWaterText.classList.remove('hidden');
      extraWaterText.innerText = `🔥 +${extraL} Litros Extras! (+${extraXp} XP creditados)`;
    } else {
      extraWaterText.classList.remove('hidden');
      extraWaterText.innerText = `💧 +${extraL} Litro(s) extra(s) consumido(s) hoje.`;
    }
  } else {
    extraWaterText.classList.add('hidden');
  }

  // Linear Macro metrics on Dashboard dock
  // Eaten today sums
  let totalKcal = 0, totalProt = 0, totalFiber = 0, totalCarbs = 0;
  state.mealLogs.forEach(m => {
    totalKcal += (m.kcal || 0);
    totalProt += (m.prot || 0);
    totalFiber += (m.fiber || 0);
    totalCarbs += (m.carbs || 0);
  });
  
  // Float rounded
  totalKcal = Math.round(totalKcal);
  totalProt = Math.round(totalProt * 10) / 10;
  totalFiber = Math.round(totalFiber * 10) / 10;
  totalCarbs = Math.round(totalCarbs * 10) / 10;

  // Sync state values
  if (!state.dailyMacros) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
  state.dailyMacros.kcal = totalKcal;
  state.dailyMacros.prot = totalProt;
  state.dailyMacros.fiber = totalFiber;
  state.dailyMacros.carbs = totalCarbs;

  state.kcalIntake = totalKcal;
  state.proteinIntake = totalProt;
  state.fiberIntake = totalFiber;

  // Render player active status badges based on macros
  const statusBadgesContainer = document.getElementById('player-status-badges');
  if (statusBadgesContainer && state.dietTrackingEnabled === false) {
    statusBadgesContainer.innerHTML = '';
    state.anabolicActive = false;
    state.catabolizandoActive = false;
  } else if (statusBadgesContainer) {
    statusBadgesContainer.innerHTML = '';

    // 🔥 Estado Anabólico Active check
    if (totalProt >= state.protTarget) {
      state.anabolicActive = true;
      const b = document.createElement('span');
      b.className = 'badge';
      b.style.background = 'linear-gradient(90deg, #ff5e00, #ffb703)';
      b.style.color = '#000';
      b.style.border = 'none';
      b.style.fontSize = '0.62rem';
      b.style.fontWeight = '800';
      b.style.padding = '2px 6px';
      b.style.borderRadius = '4px';
      b.innerText = '🔥 Estado Anabólico Active (+10% Treino XP)';
      statusBadgesContainer.appendChild(b);
    } else {
      state.anabolicActive = false;
    }

    // 💀 Catabolizando check
    const kcalPct = state.kcalTarget > 0 ? (totalKcal / state.kcalTarget) : 0;
    // Neglected kcal or carbs (< 30% of target) while fiber is 0 — só dispara se
    // a pessoa já registrou algo hoje; sem nenhum registro não é "má alimentação",
    // é só ausência de dados (não devia soar alarme pra quem ainda não logou nada).
    if (state.mealLogs.length > 0 && (kcalPct < 0.3 || totalCarbs < 20) && totalFiber === 0) {
      state.catabolizandoActive = true;
      const b = document.createElement('span');
      b.className = 'badge';
      b.style.background = '#e63946';
      b.style.color = '#fff';
      b.style.border = 'none';
      b.style.fontSize = '0.62rem';
      b.style.fontWeight = '800';
      b.style.padding = '2px 6px';
      b.style.borderRadius = '4px';
      b.innerText = '💀 Catabolizando';
      statusBadgesContainer.appendChild(b);
    } else {
      state.catabolizandoActive = false;
    }
  }

  document.getElementById('text-kcal').innerText = `${totalKcal}/${state.kcalTarget}`;
  document.getElementById('text-prot').innerText = `${totalProt}g/${state.protTarget}g`;
  document.getElementById('text-fiber').innerText = `${totalFiber}g/${state.fiberTarget}g`;
  
  const kcalBarPct = Math.min(100, (totalKcal / state.kcalTarget) * 100);
  const protBarPct = Math.min(100, (totalProt / state.protTarget) * 100);
  const fiberBarPct = Math.min(100, (totalFiber / state.fiberTarget) * 100);

  document.getElementById('bar-kcal').style.width = `${kcalBarPct}%`;
  document.getElementById('bar-prot').style.width = `${protBarPct}%`;
  document.getElementById('bar-fiber').style.width = `${fiberBarPct}%`;

  const dockPct = Math.min(100, Math.round((totalProt / state.protTarget) * 100));
  document.getElementById('protein-dock-percent').innerText = `Proteínas: ${dockPct}% da meta`;

  // Render daily quests
  renderDailyQuests();

  // ==========================================
  // TAB: TREINOS (WORKOUTS)
  // ==========================================
  // Standard vs Custom toggle styles
  const btnStd = document.getElementById('toggle-workout-std');
  const btnCust = document.getElementById('toggle-workout-cust');
  const btnAddEx = document.getElementById('btn-open-add-exercise-modal');

  if (state.useCustomWorkout) {
    btnStd.classList.remove('active');
    btnCust.classList.add('active');
    btnAddEx.classList.remove('hidden');
  } else {
    btnStd.classList.add('active');
    btnCust.classList.remove('active');
    btnAddEx.classList.add('hidden');
  }
  renderWorkoutRoutine();

  // ==========================================
  // TAB: DIETA (ALIMENTAÇÃO)
  // ==========================================
  document.getElementById('diet-kcal-summary').innerText = `${totalKcal} / ${state.kcalTarget} kcal`;
  document.getElementById('diet-prot-summary').innerText = `${totalProt} / ${state.protTarget} g`;
  document.getElementById('diet-fiber-summary').innerText = `${totalFiber} / ${state.fiberTarget} g`;
  
  const kcalPercent = Math.min(100, Math.floor((totalKcal / state.kcalTarget) * 100));
  document.getElementById('diet-kcal-percent').innerText = `${kcalPercent}%`;

  // Anel KCAL — r=44, circunferência = 276.46
  const kcalCirc = 276.46;
  document.getElementById('diet-kcal-ring-fill').style.strokeDashoffset = kcalCirc - (kcalPercent / 100) * kcalCirc;

  // Anel PROTEÍNA — r=28, circunferência = 175.93
  const protPercent = Math.min(100, Math.floor((totalProt / state.protTarget) * 100));
  const sideCirc = 175.93;
  const protRing = document.getElementById('diet-prot-ring-fill');
  if (protRing) protRing.style.strokeDashoffset = sideCirc - (protPercent / 100) * sideCirc;
  const protVal = document.getElementById('diet-prot-val');
  if (protVal) protVal.innerText = Math.round(totalProt);

  // Anel FIBRAS — mesmo raio
  const fiberPercent = Math.min(100, Math.floor((totalFiber / state.fiberTarget) * 100));
  const fiberRing = document.getElementById('diet-fiber-ring-fill');
  if (fiberRing) fiberRing.style.strokeDashoffset = sideCirc - (fiberPercent / 100) * sideCirc;
  const fiberVal = document.getElementById('diet-fiber-val');
  if (fiberVal) fiberVal.innerText = Math.round(totalFiber);

  const goalTextSimple = {
    emagrecer: "Perder peso",
    engordar: "Ganhar massa",
    manter: "Manter peso",
    estetico: "Estética",
    saude: "Saúde"
  };
  const goalTextRpg = {
    emagrecer: "Secar (Cutting)",
    engordar: "Crescer (Bulking)",
    manter: "Lapidar (Recomp)",
    estetico: "Ficar Estético",
    saude: "Melhorar Saúde"
  };
  const goalText = isSimple ? goalTextSimple : goalTextRpg;
  document.getElementById('diet-calorie-status').innerText = goalText[state.charGoal] || state.charGoal || '—';

  // Refresh dynamic food selectors
  populateFoodSelector();

  // Update diet buffs card
  const buffsCard = document.getElementById('diet-active-buffs-card');
  const buffsList = document.getElementById('diet-active-buffs-list');
  if (buffsCard && buffsList) {
    buffsList.innerHTML = '';
    let hasBuffs = false;

    if (state.anabolicActive) {
      hasBuffs = true;
      const card = document.createElement('div');
      card.className = 'active-buff-card anabolic';
      const title = isSimple ? 'Proteína suficiente ✅' : 'Estado Anabólico Ativo';
      const desc = isSimple
        ? 'Você atingiu a meta de proteínas de hoje. Continue mantendo o consumo para recuperação muscular.'
        : 'Meta de proteínas batida! Receba <strong>+10% XP</strong> em todos os treinos finalizados hoje.';
      card.innerHTML = `
        <span class="buff-icon">${isSimple ? '🥩' : '🔥'}</span>
        <div class="buff-details">
          <h5>${title}</h5>
          <p>${desc}</p>
        </div>
      `;
      buffsList.appendChild(card);
    }

    if (state.catabolizandoActive) {
      hasBuffs = true;
      const card = document.createElement('div');
      card.className = 'active-buff-card catabolizing';
      card.innerHTML = `
        <span class="buff-icon">⚠️</span>
        <div class="buff-details">
          <h5>Atenção à alimentação</h5>
          <p>Ingestão muito baixa de calorias ou carboidratos. Ajuste suas refeições para manter a energia.</p>
        </div>
      `;
      buffsList.appendChild(card);
    }

    if (hasBuffs) {
      buffsCard.classList.remove('hidden');
    } else {
      buffsCard.classList.add('hidden');
    }
  }

  // Render Food meal logs history
  renderMealLogs();

  // ==========================================
  // TAB: MENTORES
  // ==========================================
  renderMentorsList();

  // ==========================================
  // TAB: STATUS & ATRIBUTOS
  // ==========================================
  const currentRank = getSubclassRank(state.charClass, state.level);
  document.getElementById('stats-total-workouts').innerText = state.workoutsCompleted;
  document.getElementById('stats-level-num').innerText = state.level;
  document.getElementById('status-subclass').innerText = currentRank;
  document.getElementById('status-class').innerText = classLabels[state.charClass];

  let rankChar = 'E';
  if (state.level >= 75) rankChar = 'SSS';
  else if (state.level >= 60) rankChar = 'SS';
  else if (state.level >= 45) rankChar = 'S';
  else if (state.level >= 35) rankChar = 'A';
  else if (state.level >= 25) rankChar = 'B';
  else if (state.level >= 15) rankChar = 'C';
  else if (state.level >= 8) rankChar = 'D';
  document.getElementById('stats-rank-tier').innerText = rankChar;

  // Rank Tier Progress calculation
  let nextLvlReq = 8;
  let currentTierMin = 1;
  if (state.level >= 75) {
    currentTierMin = 75;
    nextLvlReq = 100;
  } else if (state.level >= 60) {
    currentTierMin = 60;
    nextLvlReq = 75;
  } else if (state.level >= 45) {
    currentTierMin = 45;
    nextLvlReq = 60;
  } else if (state.level >= 35) {
    currentTierMin = 35;
    nextLvlReq = 45;
  } else if (state.level >= 25) {
    currentTierMin = 25;
    nextLvlReq = 35;
  } else if (state.level >= 15) {
    currentTierMin = 15;
    nextLvlReq = 25;
  } else if (state.level >= 8) {
    currentTierMin = 8;
    nextLvlReq = 15;
  } else {
    currentTierMin = 1;
    nextLvlReq = 8;
  }
  
  let progressPct = 0;
  if (state.level >= 75) {
    progressPct = 100;
  } else {
    progressPct = Math.round(((state.level - currentTierMin) / (nextLvlReq - currentTierMin)) * 100);
  }
  
  const progressEl = document.getElementById('rank-tier-progress-fill');
  const valEl = document.getElementById('rank-tier-progress-val');
  const labelEl = document.getElementById('rank-tier-progress-label');
  
  if (progressEl && valEl && labelEl) {
    progressEl.style.width = `${progressPct}%`;
    valEl.innerText = `${progressPct}%`;
    if (state.level >= 75) {
      labelEl.innerText = `Rank Máximo Atingido (SSS)`;
    } else {
      const nextTierChar = state.level >= 60 ? 'SSS' :
                           state.level >= 45 ? 'SS' :
                           state.level >= 35 ? 'S' :
                           state.level >= 25 ? 'A' :
                           state.level >= 15 ? 'B' :
                           state.level >= 8 ? 'C' : 'D';
      labelEl.innerText = `Evolução para o Rank ${nextTierChar} (Nv. ${state.level}/${nextLvlReq})`;
    }
  }

  // Subclass Lore Updates
  const loreTitleEl = document.getElementById('lore-subclass-title');
  const loreDescEl = document.getElementById('lore-subclass-desc');
  if (loreTitleEl && loreDescEl) {
    loreTitleEl.innerText = currentRank;
    loreDescEl.innerText = getSubclassLore(state.charClass, currentRank);
  }

  // Attribute values (including gear bonuses)
  const getGearBonus = (stat) => {
    let bonus = 0;
    if (state.equippedItems) {
      Object.values(state.equippedItems).forEach(itemId => {
        if (itemId) {
          const item = EQUIPMENT_DATABASE.find(i => i.id === itemId);
          if (item && item.stats && item.stats[stat]) bonus += item.stats[stat];
        }
      });
    }
    return bonus;
  };

  const renderStat = (id, base, stat) => {
    const bonus = getGearBonus(stat);
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = bonus > 0 
        ? `${base + bonus} <span class="stat-gear-bonus" style="color: var(--color-accent); font-size: 0.8em; font-weight: bold;">(+${bonus} Equip.)</span>`
        : `${base}`;
    }
  };

  renderStat('val-for', state.attributes.for, 'for');
  renderStat('val-res', state.attributes.res, 'res');
  renderStat('val-agi', state.attributes.agi, 'agi');
  renderStat('val-vig', state.attributes.vig, 'vig');
  renderStat('val-foc', state.attributes.foc, 'foc');

  // Attribute Points Indicator
  const attrBox = document.getElementById('attr-points-box');
  const attrValText = document.getElementById('attr-points-value');
  const addBtnList = document.querySelectorAll('.btn-attr-add');

  if (state.attrPoints > 0) {
    attrBox.classList.remove('hidden');
    attrValText.innerText = state.attrPoints;
    addBtnList.forEach(btn => btn.classList.remove('hidden'));
  } else {
    attrBox.classList.add('hidden');
    addBtnList.forEach(btn => btn.classList.add('hidden'));
  }

  // Render trophies slots & showcase
  renderTrophies();
  renderShowcase();

  // Apply unlocked/equipped item visual classes to body so CSS selectors work globally
  const itemClassMap = {
    'item_faixa':     'has-item-faixa',
    'item_bracelete': 'has-item-bracelete',
    'item_aura':      'has-item-aura',
    'item_cinturão':  'has-item-cinturo',
    'item_aurabroly': 'has-item-aurabroly',
    'item_capa':      'has-item-capa',
    // Mentor unlocked cosmetics
    'has-men-beb10':  'has-men-beb10',
    'has-men-beb20':  'has-men-beb20',
    'has-men-beb25':  'has-men-beb25',
    'has-men-lee20':  'has-men-lee20',
    'has-men-lee25':  'has-men-lee25',
    'has-men-gok20':  'has-men-gok20',
    'has-men-arn5':   'has-men-arn5',
    'has-men-arn25':  'has-men-arn25',
    'has-men-ram5':   'has-men-ram5',
    'has-men-ram20':  'has-men-ram20',
    'has-men-bro20':  'has-men-bro20',
    'has-men-sai20':  'has-men-sai20',
    'has-men-sai25':  'has-men-sai25',
    'has-men-nic5':   'has-men-nic5',
    'has-men-nic20':  'has-men-nic20',
    'has-men-nic25':  'has-men-nic25'
  };
  
  // Strip all previous item classes from body
  Object.values(itemClassMap).forEach(cls => document.body.classList.remove(cls));

  // Re-apply currently equipped or non-equipable unlocked ones
  const equippedIds = state.equippedItems ? Object.values(state.equippedItems) : [];
  if (state.unlockedItems && state.unlockedItems.length > 0) {
    state.unlockedItems.forEach(id => {
      const isEquipable = ['item_faixa', 'item_bracelete', 'item_aura', 'item_cinturão', 'item_aurabroly', 'item_capa'].includes(id) 
                       || ['has-item-faixa', 'has-item-bracelete', 'has-item-aura', 'has-item-cinturo', 'has-item-aurabroly', 'has-item-capa'].includes(id);
                       
      if (isEquipable) {
        let stdId = id;
        if (id === 'has-item-faixa') stdId = 'item_faixa';
        if (id === 'has-item-bracelete') stdId = 'item_bracelete';
        if (id === 'has-item-aura') stdId = 'item_aura';
        if (id === 'has-item-cinturo' || id === 'has-item-cinturão') stdId = 'item_cinturão';
        if (id === 'has-item-aurabroly') stdId = 'item_aurabroly';
        if (id === 'has-item-capa') stdId = 'item_capa';

        const isEquipped = equippedIds.includes(stdId) || 
                           (stdId === 'item_faixa' && equippedIds.includes('has-item-faixa')) ||
                           (stdId === 'item_bracelete' && equippedIds.includes('has-item-bracelete')) ||
                           (stdId === 'item_aura' && equippedIds.includes('has-item-aura')) ||
                           (stdId === 'item_cinturão' && equippedIds.includes('has-item-cinturo')) ||
                           (stdId === 'item_aurabroly' && equippedIds.includes('has-item-aurabroly')) ||
                           (stdId === 'item_capa' && equippedIds.includes('has-item-capa'));

        if (isEquipped) {
          const cls = itemClassMap[stdId] || itemClassMap[id];
          if (cls) document.body.classList.add(cls);
        }
      } else {
        const cls = itemClassMap[id];
        if (cls) document.body.classList.add(cls);
      }
    });
  }

  // Sincronizar temporizador de descanso na interface de treinos
  const quickRestEnable = document.getElementById('quick-rest-enable');
  const quickRestTime = document.getElementById('quick-rest-time');
  if (quickRestEnable) {
    quickRestEnable.checked = state.restTimerEnabled !== false;
  }
  if (quickRestTime) {
    quickRestTime.value = state.baseRestTime || 90;
  }
  const quickRestTimeWrap = document.getElementById('quick-rest-time-wrap');
  if (quickRestTimeWrap) {
    quickRestTimeWrap.style.display = (state.restTimerEnabled !== false) ? 'flex' : 'none';
  }

  // Render Daily Challenge & Evolution SVG Chart & Equipment Tab
  renderDailyChallenge();
  renderEvolutionChart();
  renderCalendarHistory();
  if (getWaterStreak() >= 5) unlockTrophy('hidratacao_consistente');
  renderEquipment();

  // Update Eternal Flame Click Counter
  renderEternalFlameCount();
}

// 12. CHECK META COMPLETIONS (DAILY INTEGRATION)
function checkQuestRequirements() {
  let changed = false;
  const focBonus = 1 + (getEffectiveAttributes().foc * 0.01);
  state.dailyQuests.forEach(q => {
    if (!q.completed) {
      if (q.id === 'quest_water' && state.waterIntake >= state.waterTarget) {
        q.completed = true;
        addXP(Math.round(q.xpReward * focBonus));
        addMentorXP(state.activeMentor, 15); // Water Goal met (+15 XP)
        playSound('quest');
        changed = true;
      }
      if (q.id === 'quest_protein' && state.proteinIntake >= (state.protTarget * 0.8)) {
        q.completed = true;
        addXP(Math.round(q.xpReward * focBonus));
        playSound('quest');
        changed = true;
        if (state.proteinIntake >= state.protTarget) {
          addMentorXP(state.activeMentor, 20); // Protein Goal met (+20 XP)
        }
      }
      if (q.id === 'quest_volume') {
        const setsToday = Object.values(state.activeSetsTracker || {}).filter(isSetCompleted).length;
        if (setsToday >= 12) {
          q.completed = true;
          addXP(Math.round(q.xpReward * focBonus));
          playSound('quest');
          changed = true;
        }
      }
    }
  });

  // Check if all daily quests are completed for Mente Blindada
  if (state.dailyQuests && state.dailyQuests.length > 0) {
    const allDone = state.dailyQuests.every(q => q.completed);
    if (allDone && !state.unlockedTrophies.includes('mind_shield')) {
      unlockTrophy('mind_shield');
      changed = true;
    }
  }

  if (changed) {
    saveState();
  }
}

// 13. RENDER QUESTS ON SCREEN
function renderDailyQuests() {
  const container = document.getElementById('daily-quests-list');
  container.innerHTML = '';
  
  let completedCount = 0;
  state.dailyQuests.forEach(q => {
    if (q.completed) completedCount++;

    const card = document.createElement('div');
    card.className = `quest-item-card glass-panel ${q.completed ? 'completed' : ''}`;
    
    const checkDiv = document.createElement('div');
    checkDiv.className = 'quest-check';
    checkDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    
    if (!q.completed) {
      checkDiv.addEventListener('click', () => {
        playSound('quest');
        q.completed = true;
        const focBonus = 1 + (getEffectiveAttributes().foc * 0.01);
        addXP(Math.round(q.xpReward * focBonus));
        saveState();
        updateUI();
      });
    }

    const info = document.createElement('div');
    info.className = 'quest-info-text';
    info.innerHTML = `
      <h4>${q.name}</h4>
      <p style="font-size: 0.65rem; color: var(--text-secondary);">${q.desc}</p>
    `;

    const rewards = document.createElement('div');
    rewards.className = 'quest-rewards';
    const focBonus = 1 + (getEffectiveAttributes().foc * 0.01);
    rewards.innerHTML = `<span class="reward-badge xp-reward">+${Math.round(q.xpReward * focBonus)} XP</span>`;

    const questDetail = document.createElement('div');
    questDetail.className = 'quest-detail';
    questDetail.appendChild(checkDiv);
    questDetail.appendChild(info);

    card.appendChild(questDetail);
    card.appendChild(rewards);
    container.appendChild(card);
  });

  document.getElementById('quests-completed-badge').innerText = `${completedCount}/${state.dailyQuests.length}`;
}

// ==========================================
// 14. EXERCISE PROGRESSION AND OVERLOAD ALERTS
// ==========================================
function showOverloadToast(exerciseName, oldWeight, newWeight) {
  const toast = document.getElementById('overload-notification');
  const message = document.getElementById('overload-msg');
  const voice = resolveVoiceLine('newRecord', { exercise: exerciseName, kg: newWeight });
  message.innerText = state.appMode === 'simple' ? voice : `${voice} (+15 XP)`;
  
  toast.classList.remove('hidden');
  playSound('quest');
  
  // Screen shake on overload toast!
  document.body.classList.add('screen-shake');
  setTimeout(() => {
    document.body.classList.remove('screen-shake');
  }, 500);

  // Slide up/fade out after 3.8s
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3800);
}

function showGenericNotification(msg) {
  const toast = document.getElementById('overload-notification');
  const message = document.getElementById('overload-msg');
  if (toast && message) {
    message.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

// Persist a new PR for an exercise to both state.personalRecords and freaky_quest_user.workoutHistory
function persistPR(exName, newWeight) {
  state.personalRecords[exName] = newWeight;
  if (!userProfile.workoutHistory) userProfile.workoutHistory = {};
  userProfile.workoutHistory[exName] = newWeight;

  // Patch freaky_quest_user in localStorage without overwriting other keys
  try {
    const raw = localStorage.getItem('freaky_quest_user');
    const userObj = raw ? JSON.parse(raw) : {};
    if (!userObj.workoutHistory) userObj.workoutHistory = {};
    userObj.workoutHistory[exName] = newWeight;
    localStorage.setItem('freaky_quest_user', JSON.stringify(userObj));
  } catch (_e) {}
}

// Check and handle a potential PR for an exercise given an input weight.
// Returns true if a new record was set.
// prBadgeEl: optional DOM element to animate the PR badge inside the exercise card.
function triggerPRSparkles(badgeEl) {
  if (!badgeEl) return;
  const rect = badgeEl.getBoundingClientRect();
  const parent = document.body;
  const colors = ['#ffb703', '#ff5e00', '#ffe494', '#ffffff'];
  
  for (let i = 0; i < 20; i++) {
    const s = document.createElement('div');
    s.className = 'pr-sparkle';
    s.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    s.style.top = `${rect.top + rect.height / 2 + window.scrollY}px`;
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    s.style.setProperty('--tx', `${tx}px`);
    s.style.setProperty('--ty', `${ty}px`);
    
    parent.appendChild(s);
    
    setTimeout(() => {
      s.remove();
    }, 850);
  }
}

const CARDIO_TYPE_LABELS = {
  esteira: 'Esteira / Corrida',
  bike: 'Bike',
  eliptico: 'Elíptico',
  natacao: 'Natação',
  outro: 'Cardio'
};

// Teto diário de minutos de cardio que geram XP. Acima disso o tempo continua
// sendo registrado (o histórico é seu), mas não rende mais XP — sem isso dava
// pra spammar o botão e subir de nível em segundos, o que quebraria o ranking.
const CARDIO_XP_DAILY_CAP_MIN = 120;

// Registra uma sessão de cardio livre (esteira, bike, etc.) e concede XP
// proporcional aos minutos, escalado pelo atributo RES (Resistência).
function logCardioSession(type, minutes) {
  const alreadyToday = state.cardioMinutesToday || 0;
  const payableMinutes = Math.max(0, Math.min(minutes, CARDIO_XP_DAILY_CAP_MIN - alreadyToday));
  const xpPerMinute = 1 + Math.max(0, (getEffectiveAttributes().res - 10) * 0.02);
  const xpGained = Math.round(payableMinutes * xpPerMinute);

  if (xpGained > 0) addXP(xpGained);
  state.cardioMinutesToday = alreadyToday + minutes;
  state.cardioMinutesTotal = (state.cardioMinutesTotal || 0) + minutes;
  saveState();
  updateUI();

  const label = CARDIO_TYPE_LABELS[type] || CARDIO_TYPE_LABELS.outro;
  const isSimple = state.appMode === 'simple';
  let desc;
  if (isSimple) {
    // Modo simples esconde XP em toda a UI — não faz sentido citar aqui.
    desc = `${minutes} min de ${label} registrados. Bom trabalho!`;
  } else if (payableMinutes < minutes) {
    desc = `${minutes} min de ${label}. +${xpGained} XP (você bateu o teto diário de ${CARDIO_XP_DAILY_CAP_MIN} min de cardio com XP — o tempo extra fica registrado mesmo assim).`;
  } else {
    desc = `${minutes} min de ${label}. +${xpGained} XP!`;
  }

  showItemAcquiredModal('🏃', 'CARDIO REGISTRADO!', desc, {
    subtitle: 'REGISTRO DE CARDIO',
    btnText: 'BORA MAIS!'
  });
  playSound('quest');
}

function tryBreakPR(exName, inputWeight, prBadgeEl) {
  if (!inputWeight || inputWeight <= 0) return false;

  const prevBest = state.personalRecords[exName];
  const isNew = prevBest === undefined;
  const isBetter = !isNew && inputWeight > prevBest;

  if (!isNew && !isBetter) return false;

  // Award XP: +15 base, scaled by FOR attribute
  const forBonus = 15 + Math.round((getEffectiveAttributes().for || 10) * 0.5);
  addXP(forBonus);
  unlockTrophy('superacao_pessoal');

  if (isBetter) {
    // Show overload toast for weight increase
    showOverloadToast(exName, prevBest, inputWeight);
  }

  // Persist the new record
  persistPR(exName, inputWeight);

  if (Object.keys(state.personalRecords || {}).length >= 5) {
    unlockTrophy('colecionador_recordes');
  }

  // Animate the PR badge on the exercise card
  if (prBadgeEl) {
    prBadgeEl.innerText = isNew ? '⚡ PRIMEIRO REGISTRO!' : 'RECORD QUEBRADO! ⚔️';
    prBadgeEl.style.display = 'flex';
    prBadgeEl.classList.remove('pr-badge-animate');
    // Force reflow to re-trigger animation
    void prBadgeEl.offsetWidth;
    prBadgeEl.classList.add('pr-badge-animate');

    triggerPRSparkles(prBadgeEl);
  }

  return true;
}

// Helper to check for joint pain / injury warnings based on user profile selections.
// Reads state.injury which is always kept as an array (synced from userProfile.jointPain).
function checkExerciseInjuryWarning(exName, exMuscle) {
  // Normalise state.injury to a clean array regardless of legacy string format
  let injuries;
  if (!state.injury) {
    injuries = [];
  } else if (Array.isArray(state.injury)) {
    injuries = state.injury;
  } else {
    injuries = [state.injury];
  }

  // Filter out falsy entries and 'Nenhum' — no warnings when healthy
  injuries = injuries.filter(i => i && i.toUpperCase() !== 'NENHUM');
  if (injuries.length === 0) return null;

  const nameUpper = exName.toUpperCase();
  const muscleUpper = exMuscle.toUpperCase();

  for (const injItem of injuries) {
    const inj = injItem.toUpperCase();

    if (inj === 'JOELHO') {
      if (
        muscleUpper === 'PERNAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('LEG PRESS') ||
        nameUpper.includes('LUNGE') ||
        nameUpper.includes('AFUNDO') ||
        nameUpper.includes('PASSADA') ||
        nameUpper.includes('FLEXORA') ||
        nameUpper.includes('EXTENSORA') ||
        nameUpper.includes('PISTOL')
      ) {
        return '⚠️ Atenção: Carga nos joelhos. Reduza o peso ou evite dores.';
      }
    } else if (inj === 'QUADRIL') {
      if (
        muscleUpper === 'PERNAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('TERRA') ||
        nameUpper.includes('DEADLIFT') ||
        nameUpper.includes('LEG PRESS') ||
        nameUpper.includes('LUNGE') ||
        nameUpper.includes('PISTOL') ||
        nameUpper.includes('GOOD MORNING')
      ) {
        return '⚠️ Atenção: Flexão profunda do quadril. Vá com cautela.';
      }
    } else if (inj === 'COSTAS' || inj === 'COLUNA') {
      if (
        muscleUpper === 'COSTAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('TERRA') ||
        nameUpper.includes('DEADLIFT') ||
        nameUpper.includes('REMADA') ||
        nameUpper.includes('GOOD MORNING') ||
        nameUpper.includes('DESENVOLVIMENTO') ||
        nameUpper.includes('OHP') ||
        nameUpper.includes('MILITAR')
      ) {
        return '⚠️ Atenção: Carga axial na coluna. Cuidado com a lombar!';
      }
    } else if (inj === 'PULSO') {
      if (
        muscleUpper === 'BRAÇOS' ||
        muscleUpper === 'OMBROS' ||
        muscleUpper === 'PEITO' ||
        nameUpper.includes('ROSCA') ||
        nameUpper.includes('SUPINO') ||
        nameUpper.includes('TESTA') ||
        nameUpper.includes('TRÍCEPS') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('HANDSTAND')
      ) {
        return '⚠️ Atenção: Esforço nos punhos. Mantenha estabilizado.';
      }
    } else if (inj === 'OMBRO') {
      if (
        muscleUpper === 'OMBROS' ||
        muscleUpper === 'PEITO' ||
        nameUpper.includes('SUPINO') ||
        nameUpper.includes('DESENVOLVIMENTO') ||
        nameUpper.includes('OHP') ||
        nameUpper.includes('ELEVAÇÃO') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('PIKE') ||
        nameUpper.includes('HANDSTAND')
      ) {
        return '⚠️ Atenção: Articulação do ombro sob carga. Estabilize bem.';
      }
    } else if (inj === 'COTOVELO') {
      if (
        muscleUpper === 'BRAÇOS' ||
        nameUpper.includes('ROSCA') ||
        nameUpper.includes('TESTA') ||
        nameUpper.includes('TRÍCEPS') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('PUXADA') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('PUSHUP')
      ) {
        return '⚠️ Atenção: Esforço nos cotovelos. Evite travar totalmente.';
      }
    }
  }

  return null;
}

