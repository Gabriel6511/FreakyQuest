"""
Apply updates to app.js:
1. Replace static MENTOR_REWARDS with generateMentorRewards template system
2. Add pinnedRecords / currentStreak / bestStreak to state + loadState
3. Add Hunter Card functions (after toggleShowcaseTrophy / before unlockTrophy)
4. Add Hunter Card event listeners (after btn-settings openSettingsModal listener)
5. Add streak calculation in completeActiveWorkout
"""
import re, sys, os

filepath = r'c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\app.js'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

original_len = len(text)
print(f"Original app.js: {len(text.splitlines())} lines, {original_len} chars")

# ═══════════════════════════════════════════════════════════════
# 1. REPLACE MENTOR_REWARDS with template system
# ═══════════════════════════════════════════════════════════════
# Find the old static MENTOR_REWARDS block
old_start = text.find("const MENTOR_REWARDS = {")
if old_start == -1:
    print("ERROR: Could not find 'const MENTOR_REWARDS = {'")
    sys.exit(1)

# Find the end of the MENTOR_REWARDS object (matching closing brace + semicolon)
# We need to find the }; that closes the MENTOR_REWARDS object
brace_count = 0
i = old_start
found_first = False
old_end = -1
for i in range(old_start, len(text)):
    if text[i] == '{':
        brace_count += 1
        found_first = True
    elif text[i] == '}':
        brace_count -= 1
        if found_first and brace_count == 0:
            # Find the semicolon after
            j = i + 1
            while j < len(text) and text[j] in ' \t\r\n':
                j += 1
            if j < len(text) and text[j] == ';':
                old_end = j + 1
            else:
                old_end = i + 1
            break

if old_end == -1:
    print("ERROR: Could not find end of MENTOR_REWARDS")
    sys.exit(1)

# Also remove the comment block above it
comment_start = old_start
search_back = text[:old_start].rstrip()
# Go back to find // 2b. MENTOR REWARDS line
line_start = search_back.rfind('\n') + 1
line_text = text[line_start:old_start].strip()
if line_text.startswith('//'):
    # Keep going back to find the start of the comment block
    pos = line_start
    while pos > 0:
        prev_line_end = text[:pos-1].rfind('\n')
        prev_line = text[prev_line_end+1:pos].strip()
        if prev_line.startswith('//'):
            pos = prev_line_end + 1
        else:
            break
    comment_start = pos

new_rewards = r'''// 2b. MENTOR REWARDS — Sistema de progressão de Nível 1 ao 30
// ─────────────────────────────────────────────────────────────
// SISTEMA DE TEMPLATE DE RECOMPENSAS — escala para infinitos mentores
// ─────────────────────────────────────────────────────────────
const ATTR_LABELS = { for: 'Força', res: 'Resistência', agi: 'Agilidade', vig: 'Vigor', foc: 'Foco' };
const ATTR_CODES  = { for: 'FOR',   res: 'RES',          agi: 'AGI',      vig: 'VIG',   foc: 'FOC'  };

function generateMentorRewards(cfg) {
  const sc = cfg.shortcode;
  const p = cfg.primaryStat, s = cfg.secondaryStat;
  const pL = ATTR_LABELS[p], sL = ATTR_LABELS[s];
  const pC = ATTR_CODES[p], sC = ATTR_CODES[s];
  const name = cfg.name;
  const t5 = cfg.tier5Sound || {
    type: 'sound', value: `${sc}elite`, icon: '🎵',
    name: `Trilha de Elite de ${name}`,
    desc: `Trilha sonora ambiente exclusiva durante treinos com ${name} ativo.`
  };

  return [
    { lvl: 2, id: `m_${sc}_2`, type: 'css_class', value: `has-men-${sc}2`, icon: '🎨',
      name: `Tema ${cfg.colorLabel} Ativado`,
      desc: `O visual ${cfg.colorLabel.toLowerCase()} de ${name} domina o tema do app!` },
    { lvl: 3, id: `m_${sc}_3`, type: 'xpbonus', value: 'xp+3', icon: '⚡',
      name: '+3% XP nos treinos',
      desc: `A energia de ${name} aumenta o XP de todos os seus treinos.` },
    { lvl: 4, id: `m_${sc}_4`, type: 'css_class', value: `has-men-${sc}4`, icon: '✨',
      name: 'Borda animada no card',
      desc: `Borda ${cfg.colorLabel.toLowerCase()} néon animada aparece no card de ${name} na lista de mentores.` },
    { lvl: 5, id: `m_${sc}_5`, type: cfg.tier1.type, value: cfg.tier1.value, icon: cfg.tier1.icon,
      name: `⭐ DISCÍPULO — ${cfg.tier1.name}`,
      desc: `Milestone! ${cfg.tier1.desc}` },
    { lvl: 7, id: `m_${sc}_7`, type: 'xpbonus', value: 'xp+5', icon: '⚡',
      name: '+5% XP global',
      desc: `+5% XP em todos os treinos com ${name} ativo.` },
    { lvl: 8, id: `m_${sc}_8`, type: 'content', value: `diet_${sc}`, icon: '🥗',
      name: `Protocolo Nutricional de ${name}`,
      desc: `Plano de dieta específico de ${name} desbloqueado.` },
    { lvl: 9, id: `m_${sc}_9`, type: 'css_class', value: `has-men-${sc}9`, icon: '🌟',
      name: `Partículas de ${cfg.particleLabel}`,
      desc: `${cfg.particleLabel} flutuam no background do app quando ${name} estiver ativo.` },
    { lvl: 10, id: `m_${sc}_10`, type: cfg.tier2.type, value: cfg.tier2.value, icon: cfg.tier2.icon,
      name: `⭐ GUERREIRO — ${cfg.tier2.name}`,
      desc: `Milestone! ${cfg.tier2.desc}` },
    { lvl: 12, id: `m_${sc}_12`, type: 'buff', value: `${p}+3`, icon: '💪',
      name: `+3 ${pC} Permanente`,
      desc: `+3 pontos permanentes de ${pL} concedidos por ${name}.` },
    { lvl: 13, id: `m_${sc}_13`, type: 'mission', value: `mission_${sc}`, icon: '🎯',
      name: `Desafio Semanal: ${cfg.mission.name}`,
      desc: cfg.mission.desc },
    { lvl: 14, id: `m_${sc}_14`, type: 'css_class', value: `has-men-${sc}14`, icon: '💥',
      name: `Screen-shake personalizado de ${name}`,
      desc: `Ao finalizar treino, o screen-shake ganha o estilo de ${name}.` },
    { lvl: 15, id: `m_${sc}_15`, type: 'buff', value: `${p}+5`, icon: '💪',
      name: `⭐ VETERANO — +5 ${pC} + Fundo Especial`,
      desc: `Milestone! +5 ${pL} acumulado e fundo animado especial de ${name}.` },
    { lvl: 17, id: `m_${sc}_17`, type: 'buff', value: `${p}+5|${s}+3`, icon: '🌀',
      name: `+5 ${pC} + +3 ${sC} Permanentes`,
      desc: `${pL} e ${sL} evoluindo ao mesmo tempo, concedidos por ${name}.` },
    { lvl: 18, id: `m_${sc}_18`, type: 'content', value: `diet_${sc}_adv`, icon: '🥗',
      name: `Protocolo Avançado de ${name}`,
      desc: `Guia avançado de recuperação e nutrição no estilo de ${name}.` },
    { lvl: 19, id: `m_${sc}_19`, type: 'css_class', value: `has-men-${sc}19`, icon: '🎬',
      name: 'Animação cinemática ao treinar',
      desc: `Nova cutscene animada ao concluir treino com ${name} ativo.` },
    { lvl: 20, id: `m_${sc}_20`, type: cfg.tier4.type, value: cfg.tier4.value, icon: cfg.tier4.icon,
      name: `⭐ ELITE — ${cfg.tier4.name}`,
      desc: `Milestone! ${cfg.tier4.desc}` },
    { lvl: 22, id: `m_${sc}_22`, type: 'css_class', value: `has-men-${sc}22`, icon: '🏆',
      name: 'Título no Leaderboard Global',
      desc: `Posição especial no ranking global: "${cfg.leaderboardTitle}". Poucos chegam aqui.` },
    { lvl: 23, id: `m_${sc}_23`, type: t5.type, value: t5.value, icon: t5.icon,
      name: t5.name,
      desc: t5.desc },
    { lvl: 25, id: `m_${sc}_25`, type: 'css_class', value: `has-men-${sc}25`, icon: '👑',
      name: `⭐ LENDA — "${cfg.finalTitle}"`,
      desc: `Milestone Lendário! Aura máxima de ${name}. Título ${cfg.finalTitle} desbloqueado para sempre.` },
    { lvl: 27, id: `m_${sc}_27`, type: 'content', value: `quotes_${sc}_pers`, icon: '💬',
      name: 'Frases que referenciam seu progresso',
      desc: `${name} passa a citar seu histórico de treinos nas frases do dashboard!` },
    { lvl: 28, id: `m_${sc}_28`, type: 'css_class', value: `has-men-${sc}28`, icon: '🌅',
      name: `${name} na splash screen`,
      desc: `${name} aparece na tela de abertura do app como guardião do seu progresso.` },
    { lvl: 29, id: `m_${sc}_29`, type: 'easter', value: `easter_${sc}`, icon: '🥚',
      name: `Easter Egg Secreto de ${name}`,
      desc: cfg.easterDesc },
    { lvl: 30, id: `m_${sc}_30`, type: 'css_class', value: `has-men-${sc}30`, icon: '👑',
      name: `⭐ ETERNO — ${cfg.shortName} MASTERIZADO`,
      desc: `ETERNO! ${name} masterizado. UI com tema especial e Hall da Fama desbloqueado.` },
  ];
}

const MENTOR_REWARD_CONFIGS = {
  rocklee: {
    shortcode: 'lee', shortName: 'Lee', name: 'Rock Lee', colorLabel: 'Verde', particleLabel: 'Folhas de Konoha',
    primaryStat: 'agi', secondaryStat: 'vig',
    tier1: { type: 'css_class', value: 'has-item-faixa', icon: '🟢', name: 'Faixa do Rock Lee',
      desc: 'Borda verde néon equipada no avatar. A faixa do trabalho duro foi conquistada!' },
    tier2: { type: 'sound', value: 'ninja', icon: '🥷', name: 'Som Ninja ao treinar',
      desc: 'Som ninja exclusivo ao finalizar treino. A aura neon pulsa no card.' },
    mission: { name: '1000 Repetições', desc: 'Missão especial recorrente: 1000 repetições de qualquer exercício na semana. XP massivo!' },
    tier4: { type: 'css_class', value: 'has-men-lee20', icon: '🔴', name: 'Faixa Vermelha + Badge Dourado',
      desc: 'Faixa vermelha de elite equipada. Badge dourado no perfil.' },
    tier5Sound: { type: 'sound', value: 'ninjaelite', icon: '🎵', name: 'Trilha Shinobi de Elite',
      desc: 'Trilha sonora ambiente exclusiva durante treinos com o Rock Lee ativo.' },
    leaderboardTitle: 'Elite Shinobi', finalTitle: 'SHINOBI SUPREMO',
    easterDesc: 'Um segredo escondido do Rock Lee foi revelado... Algo muito especial te espera!'
  },
  goku: {
    shortcode: 'gok', shortName: 'Goku', name: 'Son Goku', colorLabel: 'Laranja SSJ', particleLabel: 'Ki dourado',
    primaryStat: 'for', secondaryStat: 'foc',
    tier1: { type: 'css_class', value: 'has-item-aura', icon: '⚡', name: 'Aura SSJ Dourada',
      desc: 'Aura Super Saiyajin dourada ao redor do seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'kicharge', icon: '🔋', name: 'Som de Ki Charge',
      desc: 'Som de carregamento de Ki ao subir de nível. Aura neon pulsante no card.' },
    mission: { name: 'Treino Gravidade 100x', desc: 'Missão recorrente: Complete um treino com 100% das séries. XP massivo de Saiyajin!' },
    tier4: { type: 'css_class', value: 'has-men-gok20', icon: '✨', name: 'Aura SSJ Suprema + Badge',
      desc: 'Aura dourada suprema pulsando em máxima potência. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Saiyajin', finalTitle: 'PODER SAIYAJIN',
    easterDesc: 'Uma fruta do poder Saiyajin foi encontrada escondida no seu inventário. Goku ficaria orgulhoso!'
  },
  brolyz: {
    shortcode: 'bro', shortName: 'Broly', name: 'Broly (Saga Z)', colorLabel: 'Verde Lendário', particleLabel: 'Energia verde colossal',
    primaryStat: 'for', secondaryStat: 'res',
    tier1: { type: 'css_class', value: 'has-item-aurabroly', icon: '🐉', name: 'Aura Lendária Verde',
      desc: 'Aura verde néon lendária de Broly ao redor do avatar de perfil!' },
    tier2: { type: 'sound', value: 'brolyki', icon: '💥', name: 'Explosão de Ki Lendária',
      desc: 'Explosão de Ki do Broly ao finalizar treino. Neon máximo no card.' },
    mission: { name: 'Poder Supremo', desc: 'Missão semanal: supere seu PR em pelo menos 3 exercícios. XP de Saiyajin Lendário!' },
    tier4: { type: 'css_class', value: 'has-men-bro20', icon: '🌿', name: 'Partículas Lendárias + Badge',
      desc: 'Partículas verdes lendárias em tudo e badge de elite no perfil.' },
    leaderboardTitle: 'Elite Lendário', finalTitle: 'LENDÁRIO INVENCÍVEL',
    easterDesc: 'Um fragmento de Ki ancestral de Broly pulsa em segredo no seu perfil. O poder lendário desperta!'
  },
  saitama: {
    shortcode: 'sai', shortName: 'Saitama', name: 'Saitama', colorLabel: 'Vermelho', particleLabel: 'Ondas de impacto',
    primaryStat: 'res', secondaryStat: 'agi',
    tier1: { type: 'css_class', value: 'has-item-capa', icon: '🦸', name: 'Capa do Saitama',
      desc: 'A capa branca lendária flutua atrás do avatar de perfil!' },
    tier2: { type: 'sound', value: 'ok', icon: '😐', name: '"OK" do Saitama',
      desc: 'O famoso OK do Saitama ao completar quests. Neon vermelho máximo.' },
    mission: { name: 'Rotina do Saitama', desc: '100 flexões + 100 agachamentos + 10km de corrida. Missão semanal épica!' },
    tier4: { type: 'css_class', value: 'has-men-sai20', icon: '⬜', name: 'Layout Cinza + Badge',
      desc: 'Layout minimalista cinza especial e badge dourado no perfil.' },
    leaderboardTitle: 'Elite Classe S', finalTitle: 'UM SOCO APENAS',
    easterDesc: 'Um cupom secreto de desconto na loja de heróis foi encontrado. Saitama aprovaria a economia!'
  },
  bebezinho: {
    shortcode: 'beb', shortName: 'Bebezinho', name: 'Gabriel Ganley "Bebezinho"', colorLabel: 'Roxo Tributo', particleLabel: 'Faíscas douradas',
    primaryStat: 'foc', secondaryStat: 'for',
    tier1: { type: 'sound', value: 'wakewake', icon: '🕊️', name: 'Som "Wake Wake!"',
      desc: 'Som especial do Bebezinho ao completar treino. Tributo sonoro!' },
    tier2: { type: 'css_class', value: 'has-men-beb10', icon: '✨', name: 'Partículas Tributo',
      desc: 'Faíscas douradas visíveis em todo o app. Homenagem máxima.' },
    mission: { name: 'All Day Challenge', desc: 'Missão semanal: 7 dias seguidos batendo a meta de água e proteína. XP tributo!' },
    tier4: { type: 'css_class', value: 'has-men-beb20', icon: '💜', name: 'Tema Lendário Tributo',
      desc: 'Header roxo/dourado máximo em homenagem ao Bebezinho. Badge tributo.' },
    leaderboardTitle: 'Elite Wake Wake', finalTitle: 'WAKE WAKE MASTER',
    easterDesc: 'Uma frase inédita do Bebezinho foi resgatada dos bastidores. Wake wake, para sempre!'
  },
  ramondino: {
    shortcode: 'ram', shortName: 'Ramon', name: 'Ramon Dino', colorLabel: 'Azul Oceano', particleLabel: 'Ondas oceânicas',
    primaryStat: 'vig', secondaryStat: 'for',
    tier1: { type: 'css_class', value: 'has-item-borda-azul', icon: '💙', name: 'Borda Azul Neon',
      desc: 'Borda azul/cyan néon ao redor do avatar. Estilo Ramon Dino!' },
    tier2: { type: 'sound', value: 'acorda', icon: '🇧🇷', name: '"Acorda pro Treino!"',
      desc: 'Som motivacional do Ramon ao iniciar treino. Neon azul máximo!' },
    mission: { name: 'Treino Braço Pesado', desc: 'Missão semanal do Ramon: 3 treinos de braço com carga máxima. XP explosivo!' },
    tier4: { type: 'css_class', value: 'has-men-ram20', icon: '🌊', name: 'Gradiente Oceano Máximo',
      desc: 'Gradiente azul oceano em toda a UI. Representação brasileira de elite!' },
    leaderboardTitle: 'Elite Acreano', finalTitle: 'CAMPEÃO BR',
    easterDesc: 'Uma receita secreta de frango com batata-doce do Ramon foi desbloqueada no seu caderno!'
  },
  arnold: {
    shortcode: 'arn', shortName: 'Arnold', name: 'Arnold S.', colorLabel: 'Dourado', particleLabel: 'Brilho dourado cinematográfico',
    primaryStat: 'for', secondaryStat: 'vig',
    tier1: { type: 'css_class', value: 'has-men-arn5', icon: '🏆', name: 'Badge Mr. Olympia',
      desc: 'Badge dourado de Mr. Olympia aparece ao lado do seu nome no perfil!' },
    tier2: { type: 'css_class', value: 'has-item-cinturo', icon: '🥇', name: 'Cinturão de Ouro',
      desc: 'O cinturão de ouro do Arnold equipado nos cards do status. Lenda!' },
    mission: { name: 'Pump Machine', desc: 'Missão semanal do Arnold: 5 exercícios de peito e braço com pump máximo!' },
    tier4: { type: 'sound', value: 'illbeback', icon: '🎬', name: 'Som Épico Arnold + Badge',
      desc: 'Som épico do Arnold ao finalizar treino e badge dourado no perfil.' },
    leaderboardTitle: 'Elite Golden Era', finalTitle: 'O GOVERNADOR',
    easterDesc: 'Uma foto rara da Golden Era de Arnold foi encontrada no arquivo secreto do app!'
  },
  nickwalker: {
    shortcode: 'nic', shortName: 'Nick Walker', name: 'Nick Walker "The Mutant"', colorLabel: 'Laranja Mutante', particleLabel: 'Chamas laranjas mutantes',
    primaryStat: 'for', secondaryStat: 'res',
    tier1: { type: 'css_class', value: 'has-men-nic5', icon: '🍊', name: 'Borda Laranja Mutante',
      desc: 'Borda laranja néon ao redor do avatar no estilo Nick Walker!' },
    tier2: { type: 'sound', value: 'freaky', icon: '🗣️', name: 'Som Mutante Bizarro',
      desc: 'Som de mutação ao finalizar treinos. Neon laranja máximo!' },
    mission: { name: 'Intensidade Bizarra', desc: 'Missão semanal: 3 treinos com 100% das séries em RPE "FREAKY". XP absurdo!' },
    tier4: { type: 'css_class', value: 'has-men-nic20', icon: '✨', name: 'Glow Mutante Extremo',
      desc: 'Visual com glow laranja pulsante em toda a UI. Badge de elite.' },
    leaderboardTitle: 'Elite Mutante', finalTitle: 'MUTANTE SUPREMO',
    easterDesc: 'Um vídeo raro de bastidores do treino mutante de Nick Walker foi desbloqueado!'
  },
};

const MENTOR_REWARDS = {};
Object.keys(MENTOR_REWARD_CONFIGS).forEach(mentorId => {
  MENTOR_REWARDS[mentorId] = generateMentorRewards(MENTOR_REWARD_CONFIGS[mentorId]);
});'''

text = text[:comment_start] + new_rewards + "\n" + text[old_end:]
print(f"Step 1 done: Replaced MENTOR_REWARDS ({old_end - comment_start} chars -> {len(new_rewards)} chars)")

# ═══════════════════════════════════════════════════════════════
# 2. ADD pinnedRecords / currentStreak / bestStreak to state
# ═══════════════════════════════════════════════════════════════
# Add after personalRecords: {},
target_pr = "personalRecords: {},"
idx_pr = text.find(target_pr)
if idx_pr == -1:
    print("WARNING: Could not find 'personalRecords: {},' in state - skipping")
else:
    insert_after_pr = target_pr + "\n  pinnedRecords: [],\n  currentStreak: 0,\n  bestStreak: 0,"
    text = text[:idx_pr] + insert_after_pr + text[idx_pr + len(target_pr):]
    print("Step 2a done: Added pinnedRecords/currentStreak/bestStreak to state")

# Add fallbacks in loadState after personalRecords check
target_load = "if (!state.personalRecords) state.personalRecords = {};"
idx_load = text.find(target_load)
if idx_load == -1:
    print("WARNING: Could not find personalRecords check in loadState - skipping")
else:
    insert_after_load = target_load + "\n        if (!state.pinnedRecords) state.pinnedRecords = [];\n        if (state.currentStreak === undefined) state.currentStreak = 0;\n        if (state.bestStreak === undefined) state.bestStreak = 0;"
    text = text[:idx_load] + insert_after_load + text[idx_load + len(target_load):]
    print("Step 2b done: Added fallbacks in loadState")

# ═══════════════════════════════════════════════════════════════
# 3. ADD Hunter Card functions before unlockTrophy
# ═══════════════════════════════════════════════════════════════
hunter_card_code = r'''
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
  const avatarEl = document.getElementById('pcm-avatar');
  if (avatarEl) avatarEl.src = getUserAvatarSrc();

  const nameEl = document.getElementById('pcm-name');
  if (nameEl) nameEl.innerText = state.charName || 'Hunter';

  const classLabelsLocal = {
    bodybuilder: 'Bodybuilder 💪',
    powerlifter: 'Powerlifter 🏋️‍♂️',
    calistenia: 'Calistênico 🤸‍♂️',
    maratonista: 'Maratonista 🏃‍♂️'
  };

  const rankChar = getHunterRankChar(state.level);
  const subEl = document.getElementById('pcm-sub');
  if (subEl) subEl.innerText = `Hunter Rank ${rankChar} · ${classLabelsLocal[state.charClass] || state.charClass || ''}`;

  const titleEl = document.getElementById('pcm-title-badge');
  if (titleEl) titleEl.innerText = getSubclassRank(state.charClass, state.level);

  const streakEl = document.getElementById('pcm-stat-streak');
  if (streakEl) streakEl.innerText = state.currentStreak || 0;
  const xpEl = document.getElementById('pcm-stat-xp');
  if (xpEl) xpEl.innerText = state.xp;
  const workoutsEl = document.getElementById('pcm-stat-workouts');
  if (workoutsEl) workoutsEl.innerText = state.workoutsCompleted || 0;
  const trophiesEl = document.getElementById('pcm-stat-trophies');
  if (trophiesEl) trophiesEl.innerText = (state.unlockedTrophies || []).length;

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
        <span class="pcm-record-name">🏋️ ${exName}</span>
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
      item.innerHTML = `<span>${name}</span><span style="color:var(--color-primary);font-weight:800;">${state.personalRecords[name]} kg</span>`;
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
    const cardEl = document.createElement('div');
    cardEl.className = 'pcm-mentor-mini';
    cardEl.innerHTML = `
      <div class="pcm-mentor-mini-name">${m.name}</div>
      <div class="pcm-mentor-mini-lvl">Nv ${r.level} · ${rankInfo.label}</div>
    `;
    container.appendChild(cardEl);
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

'''

target_unlock = "function unlockTrophy(trophyId) {"
idx_unlock = text.find(target_unlock)
if idx_unlock == -1:
    print("ERROR: Could not find 'function unlockTrophy' to insert Hunter Card code")
    sys.exit(1)

text = text[:idx_unlock] + hunter_card_code + text[idx_unlock:]
print("Step 3 done: Added Hunter Card functions before unlockTrophy")

# ═══════════════════════════════════════════════════════════════
# 4. ADD Hunter Card event listeners
# ═══════════════════════════════════════════════════════════════
# Find where openSettingsModal listener is registered
target_settings = "openSettingsModal();\n    });\n  }"
idx_settings = text.find(target_settings)
if idx_settings == -1:
    # Try alternate
    target_settings = "openSettingsModal();\r\n    });\r\n  }"
    idx_settings = text.find(target_settings)

if idx_settings == -1:
    print("WARNING: Could not find openSettingsModal listener block - trying alternate approach")
    # Try finding btn-settings-gear listener
    target_settings = "btn-settings-gear"
    idx_settings = text.find(target_settings)
    if idx_settings != -1:
        # Find the closing of this listener block
        search_from = idx_settings
        # Find the next });
        close_idx = text.find("});", search_from + 100)
        if close_idx != -1:
            # Find the } that closes the if block
            next_close = text.find("}", close_idx + 3)
            if next_close != -1:
                idx_settings = next_close
                target_settings = "}"
            else:
                print("WARNING: Could not find settings listener close")
                idx_settings = -1
        else:
            idx_settings = -1

hunter_listeners = '''

  // Cartão de Caçador — abrir/fechar
  const btnOpenProfileCard = document.getElementById('btn-open-profile-card');
  if (btnOpenProfileCard) {
    btnOpenProfileCard.addEventListener('click', () => {
      playSound('click');
      renderProfileCard();
      document.getElementById('profile-card-modal').classList.remove('hidden');
    });
  }
  const btnCloseProfileCard = document.getElementById('btn-close-profile-card');
  if (btnCloseProfileCard) {
    btnCloseProfileCard.addEventListener('click', () => {
      playSound('click');
      document.getElementById('profile-card-modal').classList.add('hidden');
    });
  }
  const profileCardModalEl = document.getElementById('profile-card-modal');
  if (profileCardModalEl) {
    profileCardModalEl.addEventListener('click', (e) => {
      if (e.target === profileCardModalEl) profileCardModalEl.classList.add('hidden');
    });
  }
'''

if idx_settings != -1:
    insert_pos = idx_settings + len(target_settings)
    text = text[:insert_pos] + hunter_listeners + text[insert_pos:]
    print("Step 4 done: Added Hunter Card event listeners")
else:
    print("WARNING: Could not insert Hunter Card event listeners - manual insertion needed")

# ═══════════════════════════════════════════════════════════════
# 5. ADD streak calculation in completeActiveWorkout
# ═══════════════════════════════════════════════════════════════
target_streak = "state.workoutsThisWeek = (state.workoutsThisWeek || 0) + 1;\n  state.lastWorkoutDate = new Date().toISOString();"
idx_streak = text.find(target_streak)
if idx_streak == -1:
    # Try with \r\n
    target_streak = "state.workoutsThisWeek = (state.workoutsThisWeek || 0) + 1;\r\n  state.lastWorkoutDate = new Date().toISOString();"
    idx_streak = text.find(target_streak)

if idx_streak == -1:
    print("WARNING: Could not find streak insertion point in completeActiveWorkout")
else:
    streak_code = """state.workoutsThisWeek = (state.workoutsThisWeek || 0) + 1;
  // Sequência de dias treinando (streak)
  const todayDateStr = new Date().toDateString();
  const yesterdayDateStr = new Date(Date.now() - 86400000).toDateString();
  const prevWorkoutDateStr = state.lastWorkoutDate ? new Date(state.lastWorkoutDate).toDateString() : null;
  if (!state.currentStreak) state.currentStreak = 0;
  if (prevWorkoutDateStr !== todayDateStr) {
    state.currentStreak = (prevWorkoutDateStr === yesterdayDateStr) ? state.currentStreak + 1 : 1;
  }
  state.bestStreak = Math.max(state.bestStreak || 0, state.currentStreak);

  state.lastWorkoutDate = new Date().toISOString();"""
    text = text[:idx_streak] + streak_code + text[idx_streak + len(target_streak):]
    print("Step 5 done: Added streak calculation in completeActiveWorkout")

# ═══════════════════════════════════════════════════════════════
# WRITE OUTPUT
# ═══════════════════════════════════════════════════════════════
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print(f"\nFinal app.js: {len(text.splitlines())} lines, {len(text)} chars")
print("All updates applied successfully!")
