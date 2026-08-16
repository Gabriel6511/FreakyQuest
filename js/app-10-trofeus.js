/* Trofeus e equipamentos
 *
 * Parte 10/14 do antigo app.js (linhas 5616-6673 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 17. TROPHIES SLOTS RENDER
function renderTrophies() {
  const container = document.getElementById('trophies-list');
  if (!container) return;
  container.innerHTML = '';

  if (!state.showcaseTrophies) state.showcaseTrophies = [];
  if (!state.unlockedTrophies) state.unlockedTrophies = [];

  TROPHIES.forEach(t => {
    const isUnlocked = state.unlockedTrophies.includes(t.id);
    const isFeatured = state.showcaseTrophies.includes(t.id);
    
    const slot = document.createElement('div');
    slot.className = `trophy-slot ${isUnlocked ? 'unlocked' : ''} ${isFeatured ? 'featured' : ''}`;
    slot.innerHTML = isUnlocked ? t.icon : '❓';
    
    if (isUnlocked) {
      slot.title = `${t.name} - ${t.desc} (Toque para destacar/remover)`;
      slot.addEventListener('click', () => {
        toggleShowcaseTrophy(t.id);
      });
    } else {
      slot.title = `Bloqueado - ${t.desc}`;
    }
    container.appendChild(slot);
  });
}

function renderShowcase() {
  const container = document.getElementById('showcase-slots');
  if (!container) return;
  container.innerHTML = '';

  if (!state.showcaseTrophies) state.showcaseTrophies = [];

  for (let i = 0; i < 3; i++) {
    const slotId = state.showcaseTrophies[i];
    const slotEl = document.createElement('div');
    
    if (slotId) {
      const t = TROPHIES.find(item => item.id === slotId);
      if (t) {
        slotEl.className = 'showcase-slot active';
        slotEl.innerHTML = `
          <span class="showcase-icon">${t.icon}</span>
          <span class="showcase-name">${t.name}</span>
        `;
        slotEl.title = `Clique para remover "${t.name}" da vitrine`;
        slotEl.addEventListener('click', () => {
          toggleShowcaseTrophy(slotId);
        });
      } else {
        slotEl.className = 'showcase-slot';
        slotEl.innerHTML = `<span class="showcase-empty">+ Destacar</span>`;
      }
    } else {
      slotEl.className = 'showcase-slot';
      slotEl.innerHTML = `<span class="showcase-empty">+ Destacar</span>`;
    }
    container.appendChild(slotEl);
  }
}

function toggleShowcaseTrophy(trophyId) {
  if (!state.showcaseTrophies) state.showcaseTrophies = [];
  
  if (state.showcaseTrophies.includes(trophyId)) {
    state.showcaseTrophies = state.showcaseTrophies.filter(id => id !== trophyId);
    playSound('click');
  } else {
    if (state.showcaseTrophies.length < 3) {
      state.showcaseTrophies.push(trophyId);
      playSound('click');
    } else {
      showGenericNotification('Vitrine cheia! Remova um destaque antes.');
      playSound('click');
    }
  }
  saveState();
  renderTrophies();
  renderShowcase();
  updateUI();
}

// ─────────────────────────────────────────────────────────────
// CARTÃO DE CAÇADOR — perfil resumido do jogador
// ─────────────────────────────────────────────────────────────
function getHunterRankChar(level) {
  if (level >= 75) return 'SSS';
  if (level >= 60) return 'SS';
  if (level >= 45) return 'S';
  if (level >= 35) return 'A';
  if (level >= 25) return 'B';
  if (level >= 15) return 'C';
  if (level >= 8) return 'D';
  return 'E';
}

function renderProfileCard() {
  const classLabels = {
    bodybuilder: 'Bodybuilder 💪',
    powerlifter: 'Powerlifter 🏋️‍♂️',
    calistenia: 'Calistênico 🤸‍♂️',
    maratonista: 'Maratonista 🏃‍♂️'
  };

  const avatarEl = document.getElementById('pcm-avatar');
  // Mesmo bug do amb-img: onerror inline (disparado quando src="" no primeiro
  // render) deixa opacity presa mesmo depois de um avatar válido carregar.
  if (avatarEl) { avatarEl.style.opacity = ''; avatarEl.src = getUserAvatarSrc(); }

  const nameEl = document.getElementById('pcm-name');
  if (nameEl) nameEl.innerText = state.charName || 'Hunter';

  const isSimpleProfile = state.appMode === 'simple';
  const subEl = document.getElementById('pcm-sub');
  if (subEl) {
    if (isSimpleProfile) {
      subEl.innerText = classLabels[state.charClass] || state.charClass || '';
    } else {
      const rankChar = getHunterRankChar(state.level);
      subEl.innerText = `Hunter Rank ${rankChar} · ${classLabels[state.charClass] || state.charClass || ''}`;
    }
  }

  const titleEl = document.getElementById('pcm-title-badge');
  if (titleEl) titleEl.innerText = getSubclassRank(state.charClass, state.level);

  document.getElementById('pcm-stat-streak').innerText = state.currentStreak || 0;
  document.getElementById('pcm-stat-xp').innerText = state.xp + (state.level > 1 ? '' : '');
  document.getElementById('pcm-stat-workouts').innerText = state.workoutsCompleted || 0;
  document.getElementById('pcm-stat-trophies').innerText = (state.unlockedTrophies || []).length;
  document.getElementById('pcm-stat-cardio').innerText = state.cardioMinutesTotal || 0;

  renderPinnedRecords();
  renderProfileMentorMinis();
  renderProfileTrophiesPreview();
}

function renderPinnedRecords() {
  const container = document.getElementById('pcm-records-list');
  if (!container) return;
  container.innerHTML = '';
  if (!state.pinnedRecords) state.pinnedRecords = [];

  for (let i = 0; i < 3; i++) {
    const exName = state.pinnedRecords[i];
    const row = document.createElement('div');
    if (exName && state.personalRecords[exName] !== undefined) {
      row.className = 'pcm-record-row filled';
      row.innerHTML = `
        <span class="pcm-record-name">🏋️ ${escapeHtml(exName)}</span>
        <span class="pcm-record-val">${state.personalRecords[exName]} kg</span>
      `;
      row.title = 'Toque para remover este marco';
      row.addEventListener('click', () => togglePinnedRecord(exName));
    } else {
      row.className = 'pcm-record-row';
      row.innerHTML = `<span class="pcm-record-empty">+ Fixar um marco de força</span>`;
      row.addEventListener('click', () => openRecordPicker());
    }
    container.appendChild(row);
  }
}

window.togglePinnedRecord = function(exerciseName) {
  if (!state.pinnedRecords) state.pinnedRecords = [];
  if (state.pinnedRecords.includes(exerciseName)) {
    state.pinnedRecords = state.pinnedRecords.filter(n => n !== exerciseName);
    playSound('click');
  } else {
    if (state.pinnedRecords.length < 3) {
      state.pinnedRecords.push(exerciseName);
      playSound('click');
    } else {
      showGenericNotification('Você já fixou 3 marcos! Remova um antes.');
      playSound('click');
    }
  }
  saveState();
  renderPinnedRecords();
};

function openRecordPicker() {
  const available = Object.keys(state.personalRecords || {}).filter(n => !(state.pinnedRecords || []).includes(n));
  const overlay = document.createElement('div');
  overlay.className = 'pcm-record-picker';
  const card = document.createElement('div');
  card.className = 'pcm-record-picker-card';

  if (available.length === 0) {
    card.innerHTML = `
      <p class="pcm-record-picker-title">Nenhum recorde disponível</p>
      <p style="font-size:0.68rem;color:var(--text-secondary);margin-bottom:8px;">Registre cargas na Arena de Treino para poder fixá-las aqui.</p>
      <button class="pcm-record-picker-close">Fechar</button>
    `;
  } else {
    card.innerHTML = `<p class="pcm-record-picker-title">Escolha um marco para fixar</p>`;
    available.forEach(name => {
      const item = document.createElement('div');
      item.className = 'pcm-record-picker-item';
      item.innerHTML = `<span>${escapeHtml(name)}</span><span style="color:var(--color-primary);font-weight:800;">${state.personalRecords[name]} kg</span>`;
      item.addEventListener('click', () => {
        togglePinnedRecord(name);
        overlay.remove();
      });
      card.appendChild(item);
    });
    const closeBtn = document.createElement('button');
    closeBtn.className = 'pcm-record-picker-close';
    closeBtn.innerText = 'Cancelar';
    card.appendChild(closeBtn);
  }

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  card.querySelectorAll('.pcm-record-picker-close').forEach(b => b.addEventListener('click', () => overlay.remove()));
}

function renderProfileMentorMinis() {
  const container = document.getElementById('pcm-mentors-mini');
  if (!container) return;
  container.innerHTML = '';

  const affinities = state.mentorAffinities || {};
  const ranked = Object.keys(affinities)
    .map(id => ({ id, level: affinities[id].level || 1 }))
    .sort((a, b) => b.level - a.level)
    .slice(0, 2);

  if (ranked.length === 0) {
    container.innerHTML = `<div class="pcm-mentor-mini-empty">Treine com um mentor para ele aparecer aqui!</div>`;
    return;
  }

  const fullList = MENTORS_LIST_FULL();
  ranked.forEach(r => {
    const m = fullList.find(x => x.id === r.id);
    if (!m) return;
    const rankInfo = getMentorRankTitle(r.level);
    const card = document.createElement('div');
    card.className = 'pcm-mentor-mini';
    card.innerHTML = `
      <div class="pcm-mentor-mini-name">${m.name}</div>
      <div class="pcm-mentor-mini-lvl">Nv ${r.level} · ${rankInfo.label}</div>
    `;
    container.appendChild(card);
  });
}

function renderProfileTrophiesPreview() {
  const container = document.getElementById('pcm-trophies-preview');
  if (!container) return;
  container.innerHTML = '';

  const showcased = (state.showcaseTrophies || []).filter(Boolean);
  if (showcased.length === 0) {
    container.innerHTML = `<span class="pcm-trophies-empty">Nenhum troféu fixado ainda — vá em Status → Vitrine de Conquistas.</span>`;
    return;
  }
  showcased.forEach(tId => {
    const t = TROPHIES.find(item => item.id === tId);
    if (!t) return;
    const chip = document.createElement('div');
    chip.className = 'pcm-trophy-chip';
    chip.innerHTML = `<span>${t.icon}</span><span>${t.name}</span>`;
    container.appendChild(chip);
  });
}

// Conta dias seguidos (até hoje) em que a meta de água foi batida, usando o histórico do calendário
function getWaterStreak() {
  if (!state.dailyHistory) return 0;
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const entry = state.dailyHistory[dateStr];
    if (entry && entry.waterTarget > 0 && entry.water >= entry.waterTarget) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function unlockTrophy(trophyId) {
  if (!state.unlockedTrophies) {
    state.unlockedTrophies = [];
  }
  if (!state.unlockedTrophies.includes(trophyId)) {
    state.unlockedTrophies.push(trophyId);
    saveState();
    renderTrophies();
    renderShowcase();
    
    const trophy = TROPHIES.find(t => t.id === trophyId);
    if (trophy) {
      playSound('levelup');
      showItemAcquiredModal(trophy.icon, `CONQUISTA DESBLOQUEADA!`, `${trophy.name}: ${trophy.desc}`, { subtitle: '🏆 TROFÉU', btnText: 'SHOW!' });
    }
  }
}

function renderEvolutionChart() {
  const svg = document.getElementById('evolution-svg');
  if (!svg) return;

  const container = document.getElementById('evolution-chart-container');
  const emptyState = document.getElementById('evolution-empty-state');
  const axisLabels = document.getElementById('evolution-axis-labels');

  // Volume total (kg x reps) de cada treino finalizado — dado real, vem de
  // calculateSessionVolume() em completeActiveWorkout(). strengthHistory
  // nasce com só o seed [0] (sem treino ainda); menos de 2 entradas = nunca
  // treinou de verdade. Nesse caso um gráfico "reto em zero" só parece
  // quebrado — mostra um aviso em vez de renderizar SVG vazio.
  const sHist = state.strengthHistory || [];
  if (sHist.length < 2) {
    if (container) container.classList.add('hidden');
    if (axisLabels) axisLabels.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  if (container) container.classList.remove('hidden');
  if (axisLabels) axisLabels.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');

  svg.innerHTML = '';

  const wHist = state.weightHistory || [];
  if (wHist.length === 0) wHist.push(parseFloat(state.charWeight) || 80);

  const finalW = [...wHist];
  const finalS = [...sHist];

  if (finalW.length === 1) finalW.unshift(finalW[0]);
  if (finalS.length === 1) finalS.unshift(finalS[0]);

  const width = 400;
  const height = 150;
  const padding = 20;

  const minW = Math.min(...finalW) - 1;
  const maxW = Math.max(...finalW) + 1;
  const diffW = (maxW - minW) || 1;

  const minS = Math.min(...finalS) - 5;
  const maxS = Math.max(...finalS) + 5;
  const diffS = (maxS - minS) || 1;

  const pointsCount = finalW.length;

  for (let i = 0; i <= 3; i++) {
    const yVal = padding + ((height - 2 * padding) / 3) * i;
    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', padding.toString());
    gridLine.setAttribute('y1', yVal.toString());
    gridLine.setAttribute('x2', (width - padding).toString());
    gridLine.setAttribute('y2', yVal.toString());
    gridLine.setAttribute('stroke', 'rgba(255, 255, 255, 0.05)');
    gridLine.setAttribute('stroke-width', '1');
    svg.appendChild(gridLine);
  }

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  const strengthPoints = [];
  const weightPoints = [];

  for (let idx = 0; idx < pointsCount; idx++) {
    const x = padding + ((width - 2 * padding) / (pointsCount - 1)) * idx;
    const yS = height - padding - ((finalS[idx] - minS) / diffS) * (height - 2 * padding);
    strengthPoints.push({ x, y: yS, val: finalS[idx] });

    const yW = height - padding - ((finalW[idx] - minW) / diffW) * (height - 2 * padding);
    weightPoints.push({ x, y: yW, val: finalW[idx] });
  }

  function drawLine(points, color, glowId, isDashed) {
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2.5');
    if (isDashed) {
      path.setAttribute('stroke-dasharray', '4,4');
    }
    path.setAttribute('filter', `url(#${glowId})`);
    svg.appendChild(path);
  }

  drawLine(strengthPoints, '#ff5e00', 'glow-orange', false);
  drawLine(weightPoints, '#00f2fe', 'glow-cyan', true);

  function drawDots(points, color, typeLabel, unit) {
    points.forEach((p, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x.toString());
      circle.setAttribute('cy', p.y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', color);
      circle.setAttribute('class', 'chart-dot chart-node');
      
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${typeLabel}: ${Math.round(p.val * 10) / 10} ${unit}`;
      circle.appendChild(title);

      circle.addEventListener('click', () => {
        playSound('click');
        const desc = `Métrica de evolução histórica registrada:
        • Categoria: ${typeLabel}
        • Valor alcançado: ${Math.round(p.val * 10) / 10} ${unit}
        • Registro: Armazenado com sucesso na Forja do Destino.`;
        showItemAcquiredModal('📈', 'REGISTRO DE EVOLUÇÃO', desc, { subtitle: 'HISTÓRICO', btnText: 'ENTENDI' });
      });

      svg.appendChild(circle);

      if (idx === pointsCount - 1) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (p.x - 45).toString());
        text.setAttribute('y', (p.y - 8).toString());
        text.setAttribute('fill', color);
        text.setAttribute('font-size', '8px');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `${Math.round(p.val * 10) / 10} ${unit}`;
        svg.appendChild(text);
      }
    });
  }

  drawDots(strengthPoints, '#ff9f1c', 'Volume Total', 'kg');
  drawDots(weightPoints, '#00f2fe', 'Peso', 'kg');
}

// Calendar History Variables
let selectedHistoryDate = null;

function selectHistoricalDay(dateStr) {
  playSound('click');
  selectedHistoryDate = dateStr;

  const btnReset = document.getElementById('btn-reset-to-today');
  const fitTitle = document.getElementById('fitness-title');

  if (dateStr) {
    const dayPart = dateStr.split('-')[2];
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const monthIdx = parseInt(dateStr.split('-')[1]) - 1;
    if (fitTitle) fitTitle.innerText = `Histórico de Atividade (${parseInt(dayPart)} de ${monthNames[monthIdx]})`;
    if (btnReset) btnReset.style.display = 'inline-block';
    openActivityDetailsModal(dateStr);
  } else {
    const now = new Date();
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    if (fitTitle) fitTitle.innerText = `Histórico de Atividade (${monthNames[now.getMonth()]} ${now.getFullYear()})`;
    if (btnReset) btnReset.style.display = 'none';
  }

  renderCalendarHistory();
}

function openActivityDetailsModal(dateStr) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dateStr === todayStr) {
    state.dailyHistory[todayStr] = {
      kcal: state.dailyMacros ? (state.dailyMacros.kcal || 0) : 0,
      kcalTarget: state.kcalTarget || 2500,
      water: state.waterDrank || 0,
      waterTarget: state.waterTarget || 3.0,
      workouts: state.workoutsThisWeek || 0,
      workoutTarget: state.weeklyTrainGoal || 4
    };
  }

  const entry = state.dailyHistory[dateStr] || {
    kcal: 0,
    kcalTarget: state.kcalTarget || 2500,
    water: 0,
    waterTarget: state.waterTarget || 3.0,
    workouts: 0,
    workoutTarget: state.weeklyTrainGoal || 4
  };

  const dayPart = dateStr.split('-')[2];
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const monthIdx = parseInt(dateStr.split('-')[1]) - 1;
  const formattedDate = `${parseInt(dayPart)} de ${monthNames[monthIdx]}`;

  const dateEl = document.getElementById('activity-details-date');
  if (dateEl) dateEl.innerText = formattedDate;

  // --- Draw Apple Fitness-style concentric rings ---
  const svgEl = document.getElementById('activity-rings-svg');
  if (!svgEl) return;
  svgEl.innerHTML = ''; // Clear previous

  const cx = 110, cy = 110;
  // Ring definitions: outer -> inner
  // Outer: Alimentação (red/pink), Middle: Treino (green), Inner: Água (cyan/blue)
  const rings = [
    {
      key: 'food',
      label: 'Alimentação',
      icon: '🍎',
      value: entry.kcal || 0,
      target: entry.kcalTarget || 2500,
      unit: 'kcal',
      radius: 95,
      strokeWidth: 18,
      colorStart: '#FF2D55',
      colorEnd: '#FF6B8A',
      bgColor: 'rgba(255, 45, 85, 0.15)',
      arrow: '→'
    },
    {
      key: 'workout',
      label: 'Treino',
      icon: '🏋️',
      value: entry.workouts || 0,
      target: entry.workoutTarget || 4,
      unit: 'treinos',
      radius: 72,
      strokeWidth: 18,
      colorStart: '#30D158',
      colorEnd: '#A8FF78',
      bgColor: 'rgba(48, 209, 88, 0.15)',
      arrow: '»'
    },
    {
      key: 'water',
      label: 'Consumo de Água',
      icon: '💧',
      value: entry.water || 0,
      target: entry.waterTarget || 3.0,
      unit: 'L',
      radius: 49,
      strokeWidth: 18,
      colorStart: '#00C7FC',
      colorEnd: '#5AC8FA',
      bgColor: 'rgba(0, 199, 252, 0.15)',
      arrow: '↑'
    }
  ];

  const ns = 'http://www.w3.org/2000/svg';

  // Add gradient definitions
  const defs = document.createElementNS(ns, 'defs');
  rings.forEach((ring, idx) => {
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', `ring-grad-${idx}`);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const stop1 = document.createElementNS(ns, 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', ring.colorStart);
    const stop2 = document.createElementNS(ns, 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', ring.colorEnd);
    grad.appendChild(stop1); grad.appendChild(stop2);
    defs.appendChild(grad);

    // Glow filter
    const filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', `ring-glow-${idx}`);
    filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
    const feGauss = document.createElementNS(ns, 'feGaussianBlur');
    feGauss.setAttribute('in', 'SourceGraphic');
    feGauss.setAttribute('stdDeviation', '3');
    filter.appendChild(feGauss);
    defs.appendChild(filter);
  });
  svgEl.appendChild(defs);

  rings.forEach((ring, idx) => {
    const circumference = 2 * Math.PI * ring.radius;
    const progress = ring.value / ring.target;
    
    // Background track circle
    const bgCircle = document.createElementNS(ns, 'circle');
    bgCircle.setAttribute('cx', cx); bgCircle.setAttribute('cy', cy);
    bgCircle.setAttribute('r', ring.radius);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', ring.bgColor);
    bgCircle.setAttribute('stroke-width', ring.strokeWidth);
    bgCircle.setAttribute('stroke-linecap', 'round');
    svgEl.appendChild(bgCircle);

    // 1. Draw base 100% progress if progress is >= 1.0, otherwise draw actual progress
    const baseProgress = Math.min(progress, 1.0);
    const baseDashLen = baseProgress * circumference;

    if (baseProgress > 0) {
      // Glow layer behind base progress
      const glowCircle = document.createElementNS(ns, 'circle');
      glowCircle.setAttribute('cx', cx); glowCircle.setAttribute('cy', cy);
      glowCircle.setAttribute('r', ring.radius);
      glowCircle.setAttribute('fill', 'none');
      glowCircle.setAttribute('stroke', ring.colorStart);
      glowCircle.setAttribute('stroke-width', ring.strokeWidth + 4);
      glowCircle.setAttribute('stroke-linecap', 'round');
      glowCircle.setAttribute('stroke-dasharray', `${baseDashLen} ${circumference}`);
      glowCircle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      glowCircle.setAttribute('filter', `url(#ring-glow-${idx})`);
      glowCircle.setAttribute('opacity', '0.35');
      svgEl.appendChild(glowCircle);

      // Progress arc circle
      const progCircle = document.createElementNS(ns, 'circle');
      progCircle.setAttribute('cx', cx); progCircle.setAttribute('cy', cy);
      progCircle.setAttribute('r', ring.radius);
      progCircle.setAttribute('fill', 'none');
      progCircle.setAttribute('stroke', `url(#ring-grad-${idx})`);
      progCircle.setAttribute('stroke-width', ring.strokeWidth);
      progCircle.setAttribute('stroke-linecap', 'round');
      progCircle.setAttribute('stroke-dasharray', `${baseDashLen} ${circumference}`);
      progCircle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      progCircle.style.transition = 'stroke-dasharray 0.6s ease';
      svgEl.appendChild(progCircle);
    }

    // 2. Draw overflow overlapping arc if progress > 1.0
    if (progress > 1.0) {
      const overflowProgress = Math.min(progress - 1.0, 0.98); // cap slightly below 2.0 to show overlapping end clearly
      const overflowDashLen = overflowProgress * circumference;

      // Glow layer behind overflow progress
      const glowOverflow = document.createElementNS(ns, 'circle');
      glowOverflow.setAttribute('cx', cx); glowOverflow.setAttribute('cy', cy);
      glowOverflow.setAttribute('r', ring.radius);
      glowOverflow.setAttribute('fill', 'none');
      glowOverflow.setAttribute('stroke', ring.colorEnd);
      glowOverflow.setAttribute('stroke-width', ring.strokeWidth + 4);
      glowOverflow.setAttribute('stroke-linecap', 'round');
      glowOverflow.setAttribute('stroke-dasharray', `${overflowDashLen} ${circumference}`);
      glowOverflow.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      glowOverflow.setAttribute('filter', `url(#ring-glow-${idx})`);
      glowOverflow.setAttribute('opacity', '0.45');
      svgEl.appendChild(glowOverflow);

      // Overflow arc circle
      const overflowCircle = document.createElementNS(ns, 'circle');
      overflowCircle.setAttribute('cx', cx); overflowCircle.setAttribute('cy', cy);
      overflowCircle.setAttribute('r', ring.radius);
      overflowCircle.setAttribute('fill', 'none');
      overflowCircle.setAttribute('stroke', `url(#ring-grad-${idx})`);
      overflowCircle.setAttribute('stroke-width', ring.strokeWidth);
      overflowCircle.setAttribute('stroke-linecap', 'round');
      overflowCircle.setAttribute('stroke-dasharray', `${overflowDashLen} ${circumference}`);
      overflowCircle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      overflowCircle.style.transition = 'stroke-dasharray 0.6s ease';
      // Add subtle shadow to separate overlapping ring
      overflowCircle.setAttribute('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))');
      svgEl.appendChild(overflowCircle);
    }

    // Arrow/icon at the end of the arc
    const displayProgress = progress > 1.0 ? progress - 1.0 : progress;
    const endAngle = (displayProgress * 360) - 90;
    const endRad = (endAngle * Math.PI) / 180;
    const arrowX = cx + ring.radius * Math.cos(endRad);
    const arrowY = cy + ring.radius * Math.sin(endRad);
    if (progress > 0.02) {
      const arrowText = document.createElementNS(ns, 'text');
      arrowText.setAttribute('x', arrowX);
      arrowText.setAttribute('y', arrowY);
      arrowText.setAttribute('text-anchor', 'middle');
      arrowText.setAttribute('dominant-baseline', 'central');
      arrowText.setAttribute('font-size', '10');
      arrowText.setAttribute('font-weight', '900');
      arrowText.setAttribute('fill', '#fff');
      arrowText.textContent = ring.arrow;
      svgEl.appendChild(arrowText);
    }

    // Invisible clickable area for this ring
    const hitCircle = document.createElementNS(ns, 'circle');
    hitCircle.setAttribute('cx', cx); hitCircle.setAttribute('cy', cy);
    hitCircle.setAttribute('r', ring.radius);
    hitCircle.setAttribute('fill', 'none');
    hitCircle.setAttribute('stroke', 'transparent');
    hitCircle.setAttribute('stroke-width', ring.strokeWidth + 6);
    hitCircle.style.cursor = 'pointer';
    hitCircle.addEventListener('click', () => showRingDetail(ring));
    svgEl.appendChild(hitCircle);
  });

  // Hide detail card initially
  const detailCard = document.getElementById('activity-ring-detail');
  if (detailCard) detailCard.style.display = 'none';

  const modalEl = document.getElementById('activity-details-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function showRingDetail(ring) {
  const detailCard = document.getElementById('activity-ring-detail');
  const iconEl = document.getElementById('ring-detail-icon');
  const labelEl = document.getElementById('ring-detail-label');
  const valueEl = document.getElementById('ring-detail-value');
  const barEl = document.getElementById('ring-detail-bar');
  if (!detailCard || !iconEl || !labelEl || !valueEl || !barEl) return;

  iconEl.textContent = ring.icon;
  labelEl.textContent = ring.label;

  const pct = Math.min((ring.value / ring.target) * 100, 100);
  if (ring.key === 'water') {
    valueEl.innerHTML = `<span style="color:${ring.colorStart}; font-size: 1.15rem;">${ring.value.toFixed(1)}</span><span style="font-size:0.75rem; color: var(--text-secondary);">/${ring.target.toFixed(1)} ${ring.unit}</span>`;
  } else {
    valueEl.innerHTML = `<span style="color:${ring.colorStart}; font-size: 1.15rem;">${ring.value}</span><span style="font-size:0.75rem; color: var(--text-secondary);">/${ring.target} ${ring.unit}</span>`;
  }

  barEl.style.background = `linear-gradient(90deg, ${ring.colorStart}, ${ring.colorEnd})`;
  barEl.style.width = '0%';
  detailCard.style.display = 'block';
  detailCard.style.borderColor = ring.colorStart + '33';

  // Animate bar
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      barEl.style.width = pct + '%';
    });
  });
}

function initializeDailyHistory() {
  if (!state.dailyHistory) {
    state.dailyHistory = {};
  }
}

function renderCalendarHistory() {
  const grid = document.getElementById('calendar-days-grid');
  if (!grid) return;
  grid.innerHTML = '';

  initializeDailyHistory();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const todayDayNum = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // Update title with current month
  const fitTitle = document.getElementById('fitness-title');
  if (fitTitle && !selectedHistoryDate) {
    fitTitle.innerText = `Histórico de Atividade (${monthNames[month]} ${year})`;
  }

  // Sync today's data into dailyHistory
  const todayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayDayNum).padStart(2, '0')}`;
  state.dailyHistory[todayDateStr] = {
    kcal: state.dailyMacros ? (state.dailyMacros.kcal || 0) : 0,
    kcalTarget: state.kcalTarget || 2500,
    water: state.waterDrank || 0,
    waterTarget: state.waterTarget || 3.0,
    workouts: state.workoutsThisWeek || 0,
    workoutTarget: state.weeklyTrainGoal || 4
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = state.dailyHistory[dateStr] || null;

    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';

    // Future days are disabled
    if (day > todayDayNum) {
      cell.classList.add('future-day');
    }

    // Highlight active selection
    if (selectedHistoryDate === dateStr) {
      cell.classList.add('active-selection');
    } else if (day === todayDayNum && !selectedHistoryDate) {
      cell.classList.add('today-highlight');
    } else if (day === todayDayNum) {
      cell.classList.add('today-highlight');
    }

    // Day number
    const numSpan = document.createElement('span');
    numSpan.className = 'calendar-day-number';
    numSpan.innerText = day.toString();
    cell.appendChild(numSpan);

    // Mini concentric rings SVG — only render if there's real data
    if (day <= todayDayNum && entry && !entry.isMock) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const miniSvg = document.createElementNS(svgNS, 'svg');
      miniSvg.setAttribute('width', '24');
      miniSvg.setAttribute('height', '24');
      miniSvg.setAttribute('viewBox', '0 0 24 24');
      miniSvg.setAttribute('id', 'fitness-mini-ring-svg');
      miniSvg.style.overflow = 'visible';

      const kcalProg = Math.min(1.0, Math.max(0.0, entry.kcal / entry.kcalTarget));
      const workoutProg = Math.min(1.0, Math.max(0.0, entry.workouts / entry.workoutTarget));
      const waterProg = Math.min(1.0, Math.max(0.0, entry.water / entry.waterTarget));

      const miniRings = [
        { r: 9, color: '#ff0055', prog: kcalProg, circ: 56.5, bg: 'rgba(255, 0, 85, 0.08)' },
        { r: 6.5, color: '#00ff66', prog: workoutProg, circ: 40.8, bg: 'rgba(0, 255, 102, 0.08)' },
        { r: 4, color: '#00f2fe', prog: waterProg, circ: 25.1, bg: 'rgba(0, 242, 254, 0.08)' }
      ];

      miniRings.forEach(ring => {
        const bgC = document.createElementNS(svgNS, 'circle');
        bgC.setAttribute('cx', '12');
        bgC.setAttribute('cy', '12');
        bgC.setAttribute('r', ring.r.toString());
        bgC.setAttribute('stroke', ring.bg);
        bgC.setAttribute('stroke-width', '2');
        bgC.setAttribute('fill', 'none');
        miniSvg.appendChild(bgC);

        const fgC = document.createElementNS(svgNS, 'circle');
        fgC.setAttribute('cx', '12');
        fgC.setAttribute('cy', '12');
        fgC.setAttribute('r', ring.r.toString());
        fgC.setAttribute('stroke', ring.color);
        fgC.setAttribute('stroke-width', '2');
        fgC.setAttribute('fill', 'none');
        fgC.setAttribute('stroke-linecap', 'round');
        fgC.setAttribute('transform', 'rotate(-90 12 12)');
        fgC.setAttribute('stroke-dasharray', ring.circ.toString());
        const offset = ring.circ * (1 - ring.prog);
        fgC.setAttribute('stroke-dashoffset', offset.toString());
        miniSvg.appendChild(fgC);
      });

      cell.appendChild(miniSvg);
    } else {
      // Empty placeholder so layout remains aligned
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.style.width = '24px';
      emptyPlaceholder.style.height = '24px';
      cell.appendChild(emptyPlaceholder);
    }

    // Click handler
    if (day <= todayDayNum) {
      cell.addEventListener('click', () => {
        selectHistoricalDay(dateStr);
      });
    }

    grid.appendChild(cell);
  }
}

// 17b. EQUIPAMENTOS RENDER & CONTROL SYSTEMS
function renderEquipment() {
  const tabEquipment = document.getElementById('tab-equipment');
  if (!tabEquipment) return;

  // 1. Render Active Slots
  const slots = ['head', 'aura', 'arms', 'waist', 'hands', 'legs', 'badge'];
  slots.forEach(slot => {
    const equippedItemId = state.equippedItems ? state.equippedItems[slot] : null;
    const slotEl = document.getElementById(`equip-slot-${slot}`);
    if (!slotEl) return;
    
    if (equippedItemId) {
      const item = EQUIPMENT_DATABASE.find(i => i.id === equippedItemId);
      if (item) {
        const iconHtml = item.icon.endsWith('.png') || item.icon.endsWith('.jpg') || item.icon.endsWith('.webp')
          ? `<img src="${item.icon}" alt="${item.name}" class="eq-icon-img" style="width: 28px; height: 28px; object-fit: contain; filter: drop-shadow(0 0 5px rgba(255,255,255,0.15)); flex-shrink: 0;" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'equip-slot-icon',textContent:'🖼️',title:'Arte pendente'}))" />`
          : `<span class="equip-slot-icon">${item.icon}</span>`;
        slotEl.innerHTML = `
          <div class="equip-slot-filled">
            ${iconHtml}
            <div class="equip-slot-info">
              <span class="equip-slot-name">${item.name}</span>
              <span class="equip-slot-type">${getSlotLabel(slot)}</span>
            </div>
            <button class="btn-unequip-slot" data-slot="${slot}" title="Desequipar">❌</button>
          </div>
        `;
        slotEl.querySelector('.btn-unequip-slot').addEventListener('click', (e) => {
          e.stopPropagation();
          unequipItem(slot);
        });
      } else {
        renderEmptySlot(slotEl, slot);
      }
    } else {
      renderEmptySlot(slotEl, slot);
    }
  });

  // 2. Render Attribute Buffs Summary
  const eff = getEffectiveAttributes();
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
  
  const attrSummaryEl = document.getElementById('equipment-attributes-summary');
  if (attrSummaryEl) {
    attrSummaryEl.innerHTML = `
      <div class="eq-attr-row"><span>✊ FORÇA (FOR):</span><strong>${eff.for} <span class="eq-attr-bonus">${getGearBonus('for') > 0 ? `(+${getGearBonus('for')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>🫁 RESISTÊNCIA (RES):</span><strong>${eff.res} <span class="eq-attr-bonus">${getGearBonus('res') > 0 ? `(+${getGearBonus('res')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>⚡ AGILIDADE (AGI):</span><strong>${eff.agi} <span class="eq-attr-bonus">${getGearBonus('agi') > 0 ? `(+${getGearBonus('agi')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>❤️ VIGOR (VIG):</span><strong>${eff.vig} <span class="eq-attr-bonus">${getGearBonus('vig') > 0 ? `(+${getGearBonus('vig')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>🎯 FOCO (FOC):</span><strong>${eff.foc} <span class="eq-attr-bonus">${getGearBonus('foc') > 0 ? `(+${getGearBonus('foc')})` : ''}</span></strong></div>
    `;
  }

  // 3. Render Inventory List
  const gridEl = document.getElementById('equipment-inventory-grid');
  if (gridEl) {
    gridEl.innerHTML = '';
    EQUIPMENT_DATABASE.forEach(item => {
      const unlocked = isItemUnlocked(item);
      const isEquipped = state.equippedItems && state.equippedItems[item.slot] === item.id;
      
      const card = document.createElement('div');
      card.className = `equipment-item-card glass-panel ${unlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}`;
      
      let statsText = '';
      for (const [stat, val] of Object.entries(item.stats)) {
        statsText += `+${val} ${stat.toUpperCase()} `;
      }
      
      const iconHtml = item.icon.endsWith('.png') || item.icon.endsWith('.jpg') || item.icon.endsWith('.webp')
        ? `<img src="${item.icon}" alt="${item.name}" class="eq-icon-img" style="width: 36px; height: 36px; object-fit: contain;" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'eq-card-icon',textContent:'🖼️',title:'Arte pendente'}))" />`
        : `<span class="eq-card-icon">${item.icon}</span>`;
      card.innerHTML = `
        <div class="eq-card-header">
          ${iconHtml}
          <span class="eq-card-badge">${getSlotLabel(item.slot)}</span>
        </div>
        <h4 class="eq-card-name">${item.name}</h4>
        <p class="eq-card-desc">${unlocked ? item.desc : `<span class="eq-card-locked-text">🔒 ${item.unlockDesc}</span>`}</p>
        <div class="eq-card-stats">${statsText}</div>
        <div class="eq-card-actions">
          ${unlocked 
            ? (isEquipped 
                ? `<button class="btn btn-sm btn-outline btn-block btn-equip-action" data-action="unequip" data-id="${item.id}">DESEQUIPAR</button>`
                : `<button class="btn btn-sm btn-accent btn-block btn-equip-action" data-action="equip" data-id="${item.id}">EQUIPAR</button>`
              )
            : `<button class="btn btn-sm btn-outline btn-block" disabled>BLOQUEADO</button>`
          }
        </div>
      `;
      
      gridEl.appendChild(card);
    });

    gridEl.querySelectorAll('.btn-equip-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playSound('click');
        const itemId = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const item = EQUIPMENT_DATABASE.find(i => i.id === itemId);
        if (item) {
          if (action === 'equip') {
            equipItem(item.slot, item.id);
          } else {
            unequipItem(item.slot);
          }
        }
      });
    });
  }

  // Update silhouette preview image and active aura glow
  const silPic = document.getElementById('eq-silhouette-pic');
  if (silPic) {
    silPic.src = getUserAvatarSrc();
  }
  const previewAura = document.getElementById('eq-preview-aura');
  if (previewAura) {
    // Determine preview aura color depending on equipped items
    let auraColor = 'var(--color-primary-glow)';
    if (state.equippedItems && state.equippedItems.aura) {
      if (state.equippedItems.aura === 'item_aura') auraColor = 'rgba(255, 140, 0, 0.6)'; // SSJ
      else if (state.equippedItems.aura === 'item_aurabroly') auraColor = 'rgba(57, 255, 20, 0.6)'; // Broly
      else if (state.equippedItems.aura === 'item_capa') auraColor = 'rgba(255, 255, 255, 0.4)'; // Saitama
    }
    previewAura.style.background = `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`;
  }
}

function getSlotLabel(slot) {
  const labels = {
    head: 'Cabeça', aura: 'Aura/Costas', arms: 'Braços', waist: 'Cintura',
    hands: 'Punhos', legs: 'Pernas', badge: 'Insígnia'
  };
  return labels[slot] || slot;
}

function renderEmptySlot(slotEl, slot) {
  const slotIcons = { head: '👑', aura: '✨', arms: '🦾', waist: '🏆', hands: '🥊', legs: '🦵', badge: '🎖️' };
  slotEl.innerHTML = `
    <div class="equip-slot-empty">
      <span class="equip-slot-icon-placeholder">${slotIcons[slot]}</span>
      <span class="equip-slot-empty-label">Vazio (${getSlotLabel(slot)})</span>
    </div>
  `;
}

function equipItem(slot, itemId) {
  if (!state.equippedItems) {
    state.equippedItems = { head: null, aura: null, arms: null, waist: null, hands: null, legs: null, badge: null };
  }
  state.equippedItems[slot] = itemId;
  saveState();
  updateUI();
}

function unequipItem(slot) {
  if (!state.equippedItems) {
    state.equippedItems = { head: null, aura: null, arms: null, waist: null, hands: null, legs: null, badge: null };
  }
  state.equippedItems[slot] = null;
  saveState();
  updateUI();
}

// ==========================================
