/* Selecao e progressao de mentores
 *
 * Parte 9/14 do antigo app.js (linhas 5193-5615 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 16. MENTORS SELECT SYSTEM
// ─────────────────────────────────────────────────────────────
// ORDEM DE EXIBIÇÃO DOS UNIVERSOS NA ABA DE MENTORES
// Para adicionar um novo universo: basta incluir o 'universe'
// no objeto do mentor em OFFICIAL_MENTORS — aparece automaticamente.
// ─────────────────────────────────────────────────────────────
const UNIVERSE_ORDER = ['Dragon Ball', 'Naruto', 'One Punch Man', 'Fisiculturistas', 'Coreaninhos', 'Jujutsu Kaisen', 'Spy x Family', 'Personalizados'];
const UNIVERSE_META = {
  'Dragon Ball':    { icon: '🐉', color: '#f97316', desc: 'O universo dos Saiyajins e do Ki infinito' },
  'Naruto':         { icon: '🥷', color: '#22c55e', desc: 'O caminho ninja do esforço e da garra' },
  'One Punch Man':  { icon: '👊', color: '#ef4444', desc: 'O herói que treinou até virar invencível' },
  'Fisiculturistas':{ icon: '💪', color: '#eab308', desc: 'Lendas reais do ferro e da disciplina' },
  'Coreaninhos':    { icon: '🎤', color: '#ff8fa3', desc: 'Ídolos coreanos com disciplina de aço' },
  'Jujutsu Kaisen': { icon: '👹', color: '#c1121f', desc: 'Feiticeiros amaldiçoados e poder absoluto' },
  'Spy x Family':   { icon: '🥜', color: '#ff6fb0', desc: 'Espiões, assassinas e telepatas disfarçados de família comum' },
  'Personalizados': { icon: '⚙️', color: '#8b5cf6', desc: 'Seus mentores criados por você' },
};

function MENTORS_LIST_FULL() {
  const officialWithCat = OFFICIAL_MENTORS.map(m => ({ ...m }));
  const customWithCat = state.customMentors.map(m => ({ ...m, universe: 'Personalizados', category: 'custom' }));
  return [...officialWithCat, ...customWithCat];
}

function getMentorRankTitle(lvl) {
  if (lvl >= 30) return { label: 'ETERNO', tier: 6, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  if (lvl >= 25) return { label: 'LENDA',  tier: 5, color: '#a855f7', bg: 'rgba(168,85,247,0.12)' };
  if (lvl >= 20) return { label: 'ELITE',  tier: 4, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
  if (lvl >= 15) return { label: 'VETERANO', tier: 3, color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
  if (lvl >= 10) return { label: 'GUERREIRO', tier: 2, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
  if (lvl >= 5)  return { label: 'DISCÍPULO', tier: 1, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
  return { label: 'APRENDIZ', tier: 0, color: '#78716c', bg: 'rgba(120,113,108,0.1)' };
}

function renderMentorsList() {
  const container = document.getElementById('mentors-list-container');
  container.innerHTML = '';

  const fullList = MENTORS_LIST_FULL();

  // Group by universe in the defined order
  const grouped = {};
  UNIVERSE_ORDER.forEach(u => { grouped[u] = []; });
  fullList.forEach(m => {
    const universe = m.universe || 'Personalizados';
    if (!grouped[universe]) grouped[universe] = [];
    grouped[universe].push(m);
  });

  UNIVERSE_ORDER.forEach(universeName => {
    const mentorsInGroup = grouped[universeName];
    if (!mentorsInGroup || mentorsInGroup.length === 0) return;

    const meta = UNIVERSE_META[universeName] || { icon: '🌐', color: 'var(--color-primary)', desc: '' };

    // ── Universe Header ──
    const universeHeader = document.createElement('div');
    universeHeader.className = 'mentor-universe-header';
    universeHeader.style.cssText = `
      display:flex; align-items:center; gap:10px;
      padding:12px 4px 8px; margin-top:16px;
      border-bottom: 1px solid ${meta.color}33;
    `;
    universeHeader.innerHTML = `
      <div style="width:32px;height:32px;border-radius:8px;background:${meta.color}22;border:1px solid ${meta.color}44;
           display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${meta.icon}</div>
      <div>
        <div style="font-family:var(--font-display);font-size:13px;font-weight:800;color:${meta.color};letter-spacing:0.06em;text-transform:uppercase">${universeName}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${meta.desc}</div>
      </div>
      <div style="margin-left:auto;font-size:10px;font-weight:700;color:${meta.color};background:${meta.color}18;
           border:1px solid ${meta.color}44;border-radius:99px;padding:2px 8px">${mentorsInGroup.length} ${mentorsInGroup.length === 1 ? 'mentor' : 'mentores'}</div>
    `;
    container.appendChild(universeHeader);

    mentorsInGroup.forEach(m => {
      const isActive = state.activeMentor === m.id;
      const mAff = (state.mentorAffinities && state.mentorAffinities[m.id]) || { level: 1, xp: 0, prestige: 0 };
      const mLvl = mAff.level;
      const mXp = mAff.xp;
      const mPrestige = mAff.prestige || 0;
      const mXpNeeded = 100 + (mLvl * 25);
      const xpPct = Math.min(100, Math.round((mXp / mXpNeeded) * 100));
      const rankInfo = getMentorRankTitle(mLvl);
      const mc = m.colorHex || 'var(--color-primary)';
      const prestigeSuffix = mPrestige > 0 ? ` · ⭐ Prestige ${'I'.repeat(Math.min(mPrestige, 5))}` : '';

      // Next reward to unlock
      const allRewards = MENTOR_REWARDS[m.id] || [];
      const nextReward = allRewards.find(r => r.lvl > mLvl);

      // Milestone dots (5, 10, 15, 20, 25, 30)
      const milestoneLevels = [5, 10, 15, 20, 25, 30];
      const milestoneDots = milestoneLevels.map(ml => {
        const met = mLvl >= ml;
        return `<div class="mentor-ms-dot ${met ? 'met' : ''}"
          onclick="previewMentorMilestone('${m.id}',${ml})"
          style="${met ? `background:${mc};border-color:${mc};box-shadow:0 0 6px ${mc}66` : ''}"
          title="Nível ${ml} — clique para ver">
          ${ml}
        </div>`;
      }).join('');

      const card = document.createElement('div');
      card.className = `mentor-card-new ${isActive ? 'mentor-card-active' : ''}`;
      card.setAttribute('data-tier', rankInfo.tier);
      card.style.cssText = `
        border-color: ${isActive ? mc : 'rgba(255,255,255,0.06)'};
        ${isActive ? `box-shadow: 0 0 20px ${mc}33, inset 0 0 0 1px ${mc}22;` : ''}
      `;

      card.innerHTML = `
        <div class="mcn-left">
          <div class="mcn-img-wrap" style="border-color:${mc}55">
            <img src="${getMentorAvatarSrc(m)}" alt="${m.name}"
              style="filter:${m.filterCSS || 'none'}"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="mcn-img-fallback" style="display:none;color:${mc}">${m.name.charAt(0)}</div>
            ${isActive ? `<div class="mcn-active-ring" style="border-color:${mc};box-shadow:0 0 12px ${mc}88"></div>` : ''}
          </div>
          <div class="mcn-rank-badge" style="background:${rankInfo.bg};color:${rankInfo.color};border-color:${rankInfo.color}44">
            ${rankInfo.label}
          </div>
          ${mPrestige > 0 ? `<div class="mcn-prestige" title="Prestige ${mPrestige}">⭐×${mPrestige}</div>` : ''}
        </div>

        <div class="mcn-right">
          <div class="mcn-top-row">
            <div class="mcn-name" style="color:${isActive ? mc : '#f3f4f6'}">${m.name}${isActive ? ' 👑' : ''}</div>
            <div class="mcn-level" style="color:${mc}">Nv ${mLvl}${prestigeSuffix}</div>
          </div>

          <div class="mcn-universe-tag" style="color:${meta.color};background:${meta.color}15;border-color:${meta.color}33">
            ${meta.icon} ${universeName}
          </div>

          <div class="mcn-quote">${m.quote.replace(/^"|"$/g, '')}</div>
          <div class="mcn-buff">⚡ ${m.buff}</div>

          <div class="mcn-xp-section">
            <div class="mcn-xp-row">
              <span style="font-size:10px;color:var(--text-muted)">XP: ${mXp} / ${mXpNeeded}</span>
              <span style="font-size:10px;font-weight:700;color:${mc}">${xpPct}%</span>
            </div>
            <div class="mcn-xp-track">
              <div class="mcn-xp-fill" style="width:${xpPct}%;background:linear-gradient(90deg,${mc},${mc}99)"></div>
            </div>
          </div>

          <div class="mcn-ms-row">${milestoneDots}</div>

          ${nextReward ? `
            <div class="mcn-next-reward">
              <span style="font-size:9px;color:var(--text-muted)">PRÓXIMA RECOMPENSA:</span>
              <span style="font-size:10px;font-weight:700;color:${mc}">${nextReward.icon} Nv${nextReward.lvl} — ${nextReward.name}</span>
            </div>
          ` : `<div class="mcn-next-reward"><span style="font-size:10px;color:#fbbf24;font-weight:700">🏆 Todas as recompensas desbloqueadas!</span></div>`}

          <div class="mcn-actions">
            ${isActive
              ? `<button class="mcn-btn mcn-btn-active" disabled>✓ ATIVO</button>`
              : `<button class="mcn-btn mcn-btn-choose" onclick="chooseMentor('${m.id}')">ATIVAR BASE</button>`
            }
            <button class="mcn-btn mcn-btn-preview" onclick="showAllMentorRewards('${m.id}')">VER RECOMPENSAS</button>
          </div>
        </div>
      `;

      // Ascension at level 50
      if (mLvl >= 50) {
        const ascBox = document.createElement('div');
        ascBox.className = 'mcn-ascension-box';
        ascBox.innerHTML = `
          <div style="font-size:11px;font-weight:800;color:#fbbf24">🌌 MISSÃO DE ASCENSÃO DISPONÍVEL</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:3px">Mentor no nível máximo. Transcenda para Prestige ${mPrestige + 1}!</div>
          <button class="mcn-btn mcn-btn-transcend" onclick="transcendMentor('${m.id}')">TRANSCENDER 🌌</button>
        `;
        card.appendChild(ascBox);
      }

      container.appendChild(card);
    });
  });
}

// Expose chooseMentor globally for inline onclick
window.chooseMentor = function(mentorId) {
  playSound('levelup');
  state.activeMentor = mentorId;
  state.mentorManuallyChosen = true;
  saveState();
  const banner = document.getElementById('pick-mentor-banner');
  if (banner) banner.classList.add('hidden');
  updateUI();
  const m = MENTORS_LIST_FULL().find(x => x.id === mentorId);
  if (m) triggerNeuralFlash(m);
};

// ── Filtro de universo: mostra/oculta seções na lista ──
function filterMentorsByUniverse(filter) {
  const container = document.getElementById('mentors-list-container');
  if (!container) return;
  const headers = container.querySelectorAll('.mentor-universe-header');
  const cards   = container.querySelectorAll('.mentor-card-new');

  if (filter === 'all') {
    headers.forEach(h => h.style.display = '');
    cards.forEach(c => c.style.display = '');
    return;
  }

  // Hide all, then show matching universe header + its cards
  headers.forEach(h => {
    const textNode = h.querySelector('[style*="text-transform: uppercase"]') || h;
    const universeLabel = textNode.textContent.trim().toLowerCase();
    h.style.display = universeLabel.includes(filter.toLowerCase()) ? '' : 'none';
  });

  cards.forEach(c => {
    const tag = c.querySelector('.mcn-universe-tag');
    const match = tag && tag.textContent.trim().toLowerCase().includes(filter.toLowerCase());
    c.style.display = match ? '' : 'none';
  });
}

window.previewMentorMilestone = function(mentorId, targetLvl) {
  playSound('click');
  const fullList = MENTORS_LIST_FULL();
  const mentor = fullList.find(m => m.id === mentorId);
  if (!mentor) return;

  const mentorName = mentor.name;
  const mAff = (state.mentorAffinities && state.mentorAffinities[mentorId]) || { level: 1, xp: 0 };
  const currentLvl = mAff.level;
  const allRewards = MENTOR_REWARDS[mentorId] || [];

  // Show all rewards for that mentor grouped by tier
  const TIERS = [
    { name: 'APRENDIZ', range: [1,5], color: '#78716c' },
    { name: 'DISCÍPULO', range: [6,10], color: '#94a3b8' },
    { name: 'GUERREIRO', range: [11,15], color: '#f59e0b' },
    { name: 'VETERANO', range: [16,20], color: '#10b981' },
    { name: 'ELITE', range: [21,25], color: '#3b82f6' },
    { name: 'LENDA', range: [26,30], color: '#a855f7' },
  ];

  // Find the specific reward at targetLvl, or show tier overview
  const exactReward = allRewards.find(r => r.lvl === targetLvl);

  if (exactReward) {
    const tier = TIERS.find(t => targetLvl >= t.range[0] && targetLvl <= t.range[1]);
    const isUnlocked = currentLvl >= targetLvl;
    const prefix = isUnlocked ? '✅ DESBLOQUEADO — ' : `🔒 Nível ${targetLvl} necessário — `;
    const info = getRewardDisplayInfo(exactReward);
    showItemAcquiredModal(
      info.icon,
      prefix + info.name,
      info.desc + (tier ? `\n\n📊 Tier: ${tier.name} (Nv ${tier.range[0]}–${tier.range[1]})` : ''),
      { subtitle: 'PRÉVIA DA RECOMPENSA', btnText: 'ENTENDI' }
    );
  } else {
    // Show closest reward above targetLvl
    const nextAbove = allRewards.filter(r => r.lvl >= targetLvl).sort((a,b) => a.lvl - b.lvl)[0];
    if (nextAbove) {
      const info = getRewardDisplayInfo(nextAbove);
      showItemAcquiredModal(
        info.icon,
        `Próxima recompensa: Nível ${nextAbove.lvl}`,
        info.desc,
        { subtitle: 'PRÉVIA DA RECOMPENSA', btnText: 'ENTENDI' }
      );
    } else {
      showItemAcquiredModal('🏆', `${mentorName} Masterizado!`, 'Você desbloqueou todas as recompensas deste mentor. Lendário!', { subtitle: 'PRÉVIA DA RECOMPENSA', btnText: 'SHOW!' });
    }
  }
};

// Lista COMPLETA das 23 recompensas de um mentor de uma vez só (botão "VER
// RECOMPENSAS") — diferente de previewMentorMilestone, que mostra uma de
// cada vez ao clicar num nível específico do trilho.
window.showAllMentorRewards = function(mentorId) {
  playSound('click');
  const fullList = MENTORS_LIST_FULL();
  const mentor = fullList.find(m => m.id === mentorId);
  if (!mentor) return;

  const mAff = (state.mentorAffinities && state.mentorAffinities[mentorId]) || { level: 1, xp: 0 };
  const currentLvl = mAff.level;
  const allRewards = (MENTOR_REWARDS[mentorId] || []).slice().sort((a, b) => a.lvl - b.lvl);

  const titleEl = document.getElementById('mrw-title');
  const subtitleEl = document.getElementById('mrw-subtitle');
  const listEl = document.getElementById('mentor-rewards-list');
  if (!titleEl || !listEl) return;

  titleEl.innerText = `⭐ Recompensas — ${mentor.name}`;
  subtitleEl.innerText = `Nível atual: ${currentLvl}/30 · ${allRewards.filter(r => currentLvl >= r.lvl).length}/${allRewards.length} desbloqueadas`;

  listEl.innerHTML = allRewards.map(r => {
    const unlocked = currentLvl >= r.lvl;
    const { icon, name, desc } = getRewardDisplayInfo(r);
    const isImg = icon && (icon.endsWith('.webp') || icon.endsWith('.png') || icon.endsWith('.jpg'));
    const iconHtml = isImg
      ? `<img src="${icon}" alt="" class="mrw-icon-img" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'mrw-icon-emoji',textContent:'🖼️',title:'Arte pendente'}))" />`
      : `<span class="mrw-icon-emoji">${icon}</span>`;
    return `
      <div class="mrw-row ${unlocked ? 'mrw-unlocked' : 'mrw-locked'}">
        <div class="mrw-icon-wrap">${iconHtml}</div>
        <div class="mrw-info">
          <span class="mrw-name">${name}</span>
          <span class="mrw-desc">${desc}</span>
        </div>
        <div class="mrw-lvl-badge">${unlocked ? '✅' : '🔒'} Nv${r.lvl}</div>
      </div>
    `;
  }).join('');

  document.getElementById('mentor-rewards-modal').classList.remove('hidden');
};

// Tributo: celebração visual da frase (sem áudio — apenas efeito visual)
window.celebrateTributeQuote = function(cardEl) {
  if (!cardEl) return;
  cardEl.classList.add('tq-celebrating');
  setTimeout(() => cardEl.classList.remove('tq-celebrating'), 600);
};

window.showTributeMilestoneHelp = function(milestoneId) {
  playSound('click');
  const milestones = {
    inicio: {
      icon: '🌟',
      name: 'O INÍCIO DE TUDO (2003)',
      desc: 'Nascido em 2003, Gabriel Ganley "Bebezinho" ingressou jovem no fisiculturismo e no levantamento de peso. Seu carisma sem tamanho cativou milhares de seguidores rapidamente nas redes sociais.'
    },
    pokemon: {
      icon: '🎮',
      name: 'CAMPEÃO DE POKÉMON TCG',
      desc: 'Bebezinho era um competidor nato. Além do levantamento de peso, ele dominou o Pokémon Card Game (TCG) competitivo, sendo campeão de diversos torneios de elite no Brasil e representando orgulhosamente a nação no campeonato mundial.'
    },
    legpress: {
      icon: '🏋️‍♂️',
      name: 'LEG PRESS DE 500KG',
      desc: 'O marco que quebrou a internet: Bebezinho chocou a comunidade fitness mundial ao carregar o aparelho de Leg Press com meia tonelada (500 kg) e executar repetições sólidas com técnica implacável.'
    },
    despedida: {
      icon: '🕊️',
      name: 'DESPEDIDA PRECOCE (2026)',
      desc: 'Em 23 de maio de 2026, Gabriel nos deixou muito cedo. Ele permaneceu constante até o último instante, e sua partida gerou homenagens profundas de todas as maiores lendas do esporte no Brasil.'
    }
  };
  
  const m = milestones[milestoneId] || { icon: '🕊️', name: 'Tributo ao Herói', desc: 'Sua lembrança vive em cada treino.' };
  showItemAcquiredModal(m.icon, m.name, m.desc, { subtitle: 'TRIBUTO', btnText: 'ENTENDI' });
};

window.triggerEternalFlameSpark = function() {
  playSound('potion');

  // Sem login: mantém a contagem local antiga como fallback (nada muda pra
  // quem não usa conta na nuvem). Logado: o toque soma pro contador global
  // de verdade — increment_eternal_flame() é atômico no banco, então dois
  // toques ao mesmo tempo de pessoas diferentes nunca se perdem.
  if (isCloudEnabled() && cloudUser) {
    supabaseClient.rpc('increment_eternal_flame').then(({ data, error }) => {
      if (!error && typeof data === 'number') {
        globalFlameCount = data;
        renderEternalFlameCount();
      }
    }).catch((e) => console.warn('Falha ao somar na Chama Eterna global', e));
  } else {
    state.eternalFlameClicks = (state.eternalFlameClicks || 0) + 1;
    saveState();
    renderEternalFlameCount();
  }

  const container = document.querySelector('.eternal-flame-container');
  if (container) {
    container.style.transform = 'scale(1.25)';
    container.style.boxShadow = '0 0 15px rgba(255, 183, 3, 0.7)';
    setTimeout(() => {
      container.style.transform = '';
      container.style.boxShadow = '';
    }, 300);
  }
  
  const appContainer = document.querySelector('.app-container');
  if (!appContainer) return;
  
  const sparks = [];
  for (let i = 0; i < 15; i++) {
    const sp = document.createElement('div');
    sp.className = 'bebezinho-sparkle';
    sp.style.position = 'absolute';
    sp.style.left = `${20 + Math.random() * 60}%`;
    sp.style.top = `${40 + Math.random() * 20}%`;
    sp.style.width = '6px';
    sp.style.height = '6px';
    sp.style.background = Math.random() > 0.5 ? '#ffe066' : '#9b5de5';
    sp.style.borderRadius = '50%';
    sp.style.boxShadow = '0 0 8px currentColor';
    sp.style.pointerEvents = 'none';
    sp.style.zIndex = '1000';
    sp.style.transition = 'all 1.2s cubic-bezier(0.1, 0.8, 0.2, 1)';
    
    appContainer.appendChild(sp);
    sparks.push(sp);
    
    setTimeout(() => {
      const destX = parseFloat(sp.style.left) + (Math.random() - 0.5) * 40;
      const destY = parseFloat(sp.style.top) - (30 + Math.random() * 40);
      sp.style.left = `${destX}%`;
      sp.style.top = `${destY}%`;
      sp.style.opacity = '0';
      sp.style.transform = 'scale(0.2)';
    }, 50);
  }
  
  setTimeout(() => {
    sparks.forEach(s => s.remove());
  }, 1300);
};

