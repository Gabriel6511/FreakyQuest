"""
Apply ALL remaining updates to FreakyQuest:
1. index.html: Add Hunter Card modal (before settings-modal)
2. styles.css: Add Hunter Card CSS (after .btn-attr-add:active)
3. app.js: Replace MENTOR_REWARDS with template system, add streak, add Hunter Card functions
"""
import sys, os

BASE = r'c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest'

def read(name):
    with open(os.path.join(BASE, name), 'r', encoding='utf-8') as f:
        return f.read()

def write(name, text):
    with open(os.path.join(BASE, name), 'w', encoding='utf-8') as f:
        f.write(text)

errors = []

# ═══════════════════════════════════════════════════════════════
# 1. INDEX.HTML — Add Hunter Card modal before settings-modal
# ═══════════════════════════════════════════════════════════════
print("=" * 60)
print("STEP 1: index.html — Hunter Card modal")
print("=" * 60)

html = read('index.html')

# Check if already applied
if 'profile-card-modal' in html:
    print("  [SKIP] profile-card-modal already exists in index.html")
else:
    target = '    <!-- ========================================== -->\n    <!-- MODAL: SETTINGS / EDIT PROFILE             -->\n    <!-- ========================================== -->'
    idx = html.find(target)
    if idx == -1:
        # Try with \r\n
        target = '    <!-- ========================================== -->\r\n    <!-- MODAL: SETTINGS / EDIT PROFILE             -->\r\n    <!-- ========================================== -->'
        idx = html.find(target)
    
    if idx == -1:
        errors.append("Could not find SETTINGS modal comment block in index.html")
        print(f"  [ERROR] {errors[-1]}")
    else:
        hunter_modal = """    <!-- ========================================== -->
    <!-- CARTÃO DE CAÇADOR — Perfil do Jogador        -->
    <!-- ========================================== -->
    <div id="profile-card-modal" class="modal-overlay hidden">
      <div class="custom-modal-card glass-panel fade-in pcm-card">
        <div class="pcm-header">
          <h3>🪪 Cartão de Caçador</h3>
          <button type="button" id="btn-close-profile-card" class="pcm-close-btn">✕</button>
        </div>

        <div class="pcm-identity">
          <div class="pcm-avatar-wrap">
            <img id="pcm-avatar" src="" alt="Avatar do jogador" onerror="this.style.opacity='0.2'">
          </div>
          <div class="pcm-identity-info">
            <p class="pcm-name" id="pcm-name">Hunter</p>
            <p class="pcm-sub" id="pcm-sub">Hunter Rank E · Bodybuilder</p>
          </div>
        </div>
        <span class="pcm-title-badge" id="pcm-title-badge">Aprendiz</span>

        <div class="pcm-stats-grid">
          <div class="pcm-stat">
            <span class="pcm-stat-icon">🔥</span>
            <span class="pcm-stat-val" id="pcm-stat-streak">0</span>
            <span class="pcm-stat-lbl">Sequência</span>
          </div>
          <div class="pcm-stat">
            <span class="pcm-stat-icon">⚡</span>
            <span class="pcm-stat-val" id="pcm-stat-xp">0</span>
            <span class="pcm-stat-lbl">XP Total</span>
          </div>
          <div class="pcm-stat">
            <span class="pcm-stat-icon">🏋️</span>
            <span class="pcm-stat-val" id="pcm-stat-workouts">0</span>
            <span class="pcm-stat-lbl">Treinos</span>
          </div>
          <div class="pcm-stat">
            <span class="pcm-stat-icon">🏆</span>
            <span class="pcm-stat-val" id="pcm-stat-trophies">0</span>
            <span class="pcm-stat-lbl">Conquistas</span>
          </div>
        </div>

        <div class="pcm-section">
          <p class="pcm-section-title">Marcos de Força <span class="pcm-section-hint">toque para fixar até 3</span></p>
          <div id="pcm-records-list" class="pcm-records-list"></div>
        </div>

        <div class="pcm-section">
          <p class="pcm-section-title">Mentores em Destaque</p>
          <div id="pcm-mentors-mini" class="pcm-mentors-mini-row"></div>
        </div>

        <div class="pcm-section">
          <p class="pcm-section-title">Troféus Fixados</p>
          <div id="pcm-trophies-preview" class="pcm-trophies-preview-row"></div>
        </div>

        <div class="pcm-compare-teaser" title="Em breve você vai poder comparar seu progresso com amigos">
          <span class="pcm-compare-icon">👥</span>
          <span class="pcm-compare-text">Comparar com amigos</span>
          <span class="pcm-compare-badge">Em breve</span>
        </div>
      </div>
    </div>

"""
        html = html[:idx] + hunter_modal + html[idx:]
        write('index.html', html)
        print(f"  [OK] Hunter Card modal inserted before settings-modal")

# ═══════════════════════════════════════════════════════════════
# 2. STYLES.CSS — Add Hunter Card CSS after .btn-attr-add:active
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 2: styles.css — Hunter Card CSS")
print("=" * 60)

css = read('styles.css')

if '.pcm-card' in css:
    print("  [SKIP] Hunter Card CSS already exists in styles.css")
else:
    target_css = '.btn-attr-add:active {\n  transform: scale(0.9);\n}'
    idx_css = css.find(target_css)
    if idx_css == -1:
        target_css = '.btn-attr-add:active {\r\n  transform: scale(0.9);\r\n}'
        idx_css = css.find(target_css)
    
    if idx_css == -1:
        # Try finding just the selector
        idx_css = css.find('.btn-attr-add:active')
        if idx_css != -1:
            # Find the closing brace
            close = css.find('}', idx_css)
            if close != -1:
                idx_css = close + 1
            else:
                idx_css = -1
    else:
        idx_css = idx_css + len(target_css)

    if idx_css == -1:
        errors.append("Could not find .btn-attr-add:active in styles.css")
        print(f"  [ERROR] {errors[-1]}")
    else:
        hunter_css = """

/* ══════════════════════════════════════════════
   CARTÃO DE CAÇADOR — botão de abertura + modal
   ══════════════════════════════════════════════ */
.btn-open-profile-card-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  border-radius: 14px;
  border: 1px solid var(--color-primary-glow);
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  transition: all 0.18s ease;
  text-align: left;
}
.btn-open-profile-card-trigger:hover {
  background: rgba(255,255,255,0.06);
  box-shadow: 0 0 14px var(--color-primary-glow);
}
.btn-open-profile-card-trigger:active { transform: scale(0.98); }
.bopc-icon { font-size: 22px; flex-shrink: 0; }
.bopc-text { flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.bopc-title {
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--color-primary);
}
.bopc-sub { font-size: 0.62rem; color: var(--text-secondary); }
.bopc-arrow { font-size: 18px; color: var(--text-muted); flex-shrink: 0; }

/* Modal */
.pcm-card { gap: 10px; max-width: 380px; }
.pcm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 8px;
}
.pcm-header h3 {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 800;
  border-bottom: none;
  padding-bottom: 0;
}
.pcm-close-btn {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.pcm-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pcm-avatar-wrap {
  width: 56px; height: 56px;
  border-radius: 14px;
  overflow: hidden;
  border: 2px solid var(--color-primary);
  box-shadow: 0 0 14px var(--color-primary-glow);
  background: rgba(0,0,0,0.4);
  flex-shrink: 0;
}
.pcm-avatar-wrap img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
.pcm-identity-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pcm-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 900;
  color: #fff;
}
.pcm-sub { font-size: 0.68rem; color: var(--text-secondary); }
.pcm-title-badge {
  align-self: flex-start;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--color-accent);
  background: var(--color-accent-glow);
  border: 1px solid var(--color-accent);
  padding: 3px 10px;
  border-radius: 99px;
}

.pcm-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.pcm-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 2px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
}
.pcm-stat-icon { font-size: 14px; }
.pcm-stat-val {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 900;
  color: var(--color-primary);
}
.pcm-stat-lbl { font-size: 0.52rem; color: var(--text-muted); text-align: center; }

.pcm-section { display: flex; flex-direction: column; gap: 6px; }
.pcm-section-title {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.pcm-section-hint { font-size: 0.55rem; color: var(--text-muted); font-weight: 500; }

.pcm-records-list { display: flex; flex-direction: column; gap: 5px; }
.pcm-record-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 9px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.pcm-record-row.filled { border-color: var(--color-primary-glow); }
.pcm-record-row:active { transform: scale(0.98); }
.pcm-record-name { flex: 1; font-size: 0.72rem; color: var(--text-primary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pcm-record-val { font-size: 0.78rem; font-weight: 800; color: var(--color-primary); font-family: var(--font-display); }
.pcm-record-empty { font-size: 0.68rem; color: var(--text-muted); flex: 1; }

.pcm-record-picker {
  position: fixed;
  inset: 0;
  background: rgba(3,4,6,0.9);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.pcm-record-picker-card {
  background: rgba(14,16,28,0.98);
  border: 1px solid var(--border-glass);
  border-radius: 14px;
  padding: 14px;
  width: 100%;
  max-width: 320px;
  max-height: 70vh;
  overflow-y: auto;
}
.pcm-record-picker-title { font-size: 0.78rem; font-weight: 800; margin-bottom: 8px; }
.pcm-record-picker-item {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.72rem;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 4px;
  background: rgba(255,255,255,0.03);
}
.pcm-record-picker-item:active { transform: scale(0.97); }
.pcm-record-picker-close {
  width: 100%; margin-top: 6px; padding: 8px;
  border-radius: 8px; border: 1px solid var(--border-glass);
  background: transparent; color: var(--text-secondary); font-size: 0.7rem; cursor: pointer;
}

.pcm-mentors-mini-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pcm-mentor-mini {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.06);
}
.pcm-mentor-mini-name { font-size: 0.74rem; font-weight: 700; color: var(--text-primary); }
.pcm-mentor-mini-lvl { font-size: 0.6rem; color: var(--color-primary); margin-top: 1px; }
.pcm-mentor-mini-empty { font-size: 0.68rem; color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 8px; }

.pcm-trophies-preview-row { display: flex; gap: 8px; flex-wrap: wrap; }
.pcm-trophy-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px;
  border-radius: 99px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  font-size: 0.65rem;
}
.pcm-trophies-empty { font-size: 0.68rem; color: var(--text-muted); }

.pcm-compare-teaser {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px dashed rgba(255,255,255,0.12);
  margin-top: 2px;
}
.pcm-compare-icon { font-size: 16px; }
.pcm-compare-text { flex: 1; font-size: 0.7rem; color: var(--text-secondary); }
.pcm-compare-badge {
  font-size: 0.58rem; font-weight: 700;
  color: var(--text-muted);
  background: rgba(255,255,255,0.05);
  padding: 2px 8px;
  border-radius: 99px;
}
"""
        css = css[:idx_css] + hunter_css + css[idx_css:]
        write('styles.css', css)
        print(f"  [OK] Hunter Card CSS inserted after .btn-attr-add:active")

# ═══════════════════════════════════════════════════════════════
# 3. APP.JS — Multiple changes
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
print("STEP 3: app.js — Template rewards, streak, Hunter Card functions")
print("=" * 60)

js = read('app.js')

# 3a. Replace MENTOR_REWARDS with template system
if 'generateMentorRewards' in js:
    print("  [SKIP] generateMentorRewards already exists in app.js")
else:
    old_start = js.find("const MENTOR_REWARDS = {")
    if old_start == -1:
        errors.append("Could not find 'const MENTOR_REWARDS = {' in app.js")
        print(f"  [ERROR] {errors[-1]}")
    else:
        # Find the comment block above
        comment_start = old_start
        search_back = js[:old_start].rstrip()
        line_start = search_back.rfind('\n') + 1
        line_text = js[line_start:old_start].strip()
        if line_text.startswith('//'):
            pos = line_start
            while pos > 0:
                prev_line_end = js[:pos-1].rfind('\n')
                prev_line = js[prev_line_end+1:pos].strip()
                if prev_line.startswith('//'):
                    pos = prev_line_end + 1
                else:
                    break
            comment_start = pos

        # Find end of MENTOR_REWARDS object
        brace_count = 0
        found_first = False
        old_end = -1
        for i in range(old_start, len(js)):
            if js[i] == '{':
                brace_count += 1
                found_first = True
            elif js[i] == '}':
                brace_count -= 1
                if found_first and brace_count == 0:
                    j = i + 1
                    while j < len(js) and js[j] in ' \t\r\n':
                        j += 1
                    if j < len(js) and js[j] == ';':
                        old_end = j + 1
                    else:
                        old_end = i + 1
                    break

        if old_end == -1:
            errors.append("Could not find end of MENTOR_REWARDS")
            print(f"  [ERROR] {errors[-1]}")
        else:
            new_rewards = '''// 2b. MENTOR REWARDS — Sistema de progressão de Nível 1 ao 30
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
            js = js[:comment_start] + new_rewards + "\n" + js[old_end:]
            print(f"  [OK] Replaced MENTOR_REWARDS with template system ({old_end - comment_start} chars -> {len(new_rewards)} chars)")

# 3b. Add pinnedRecords / currentStreak / bestStreak to state
if 'pinnedRecords' in js:
    print("  [SKIP] pinnedRecords already exists in app.js state")
else:
    target_pr = "personalRecords: {},"
    idx_pr = js.find(target_pr)
    if idx_pr == -1:
        errors.append("Could not find 'personalRecords: {},' in state")
        print(f"  [ERROR] {errors[-1]}")
    else:
        insert_after_pr = "personalRecords: {},\n  pinnedRecords: [],\n  currentStreak: 0,\n  bestStreak: 0,"
        js = js[:idx_pr] + insert_after_pr + js[idx_pr + len(target_pr):]
        print("  [OK] Added pinnedRecords/currentStreak/bestStreak to state")

# 3c. Add fallbacks in loadState
if 'pinnedRecords' in js and 'state.pinnedRecords' not in js.split('loadState')[1].split('function')[0] if 'loadState' in js else True:
    target_load = "if (!state.personalRecords) state.personalRecords = {};"
    idx_load = js.find(target_load)
    if idx_load == -1:
        print("  [WARN] Could not find personalRecords check in loadState - may already be applied")
    else:
        # Check if pinnedRecords check already exists after this
        next_100 = js[idx_load:idx_load+300]
        if 'pinnedRecords' not in next_100:
            insert_after_load = target_load + "\n        if (!state.pinnedRecords) state.pinnedRecords = [];\n        if (state.currentStreak === undefined) state.currentStreak = 0;\n        if (state.bestStreak === undefined) state.bestStreak = 0;"
            js = js[:idx_load] + insert_after_load + js[idx_load + len(target_load):]
            print("  [OK] Added fallbacks in loadState")
        else:
            print("  [SKIP] loadState fallbacks already present")

# 3d. Add Hunter Card functions before unlockTrophy
if 'getHunterRankChar' in js:
    print("  [SKIP] Hunter Card functions already exist in app.js")
else:
    target_unlock = "function unlockTrophy(trophyId) {"
    idx_unlock = js.find(target_unlock)
    if idx_unlock == -1:
        errors.append("Could not find 'function unlockTrophy' in app.js")
        print(f"  [ERROR] {errors[-1]}")
    else:
        hunter_card_code = '''
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
    bodybuilder: 'Bodybuilder \\ud83d\\udcaa',
    powerlifter: 'Powerlifter \\ud83c\\udfcb\\ufe0f\\u200d\\u2642\\ufe0f',
    calistenia: 'Calist\\u00eanico \\ud83e\\udd38\\u200d\\u2642\\ufe0f',
    maratonista: 'Maratonista \\ud83c\\udfc3\\u200d\\u2642\\ufe0f'
  };

  const rankChar = getHunterRankChar(state.level);
  const subEl = document.getElementById('pcm-sub');
  if (subEl) subEl.innerText = 'Hunter Rank ' + rankChar + ' \\u00b7 ' + (classLabelsLocal[state.charClass] || state.charClass || '');

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
      row.innerHTML = '<span class="pcm-record-name">\\ud83c\\udfcb\\ufe0f ' + exName + '</span><span class="pcm-record-val">' + state.personalRecords[exName] + ' kg</span>';
      row.title = 'Toque para remover este marco';
      row.addEventListener('click', function() { togglePinnedRecord(exName); });
    } else {
      row.className = 'pcm-record-row';
      row.innerHTML = '<span class="pcm-record-empty">+ Fixar um marco de for\\u00e7a</span>';
      row.addEventListener('click', function() { openRecordPicker(); });
    }
    container.appendChild(row);
  }
}

window.togglePinnedRecord = function(exerciseName) {
  if (!state.pinnedRecords) state.pinnedRecords = [];
  if (state.pinnedRecords.includes(exerciseName)) {
    state.pinnedRecords = state.pinnedRecords.filter(function(n) { return n !== exerciseName; });
    playSound('click');
  } else {
    if (state.pinnedRecords.length < 3) {
      state.pinnedRecords.push(exerciseName);
      playSound('click');
    } else {
      showGenericNotification('Voc\\u00ea j\\u00e1 fixou 3 marcos! Remova um antes.');
      playSound('click');
    }
  }
  saveState();
  renderPinnedRecords();
};

function openRecordPicker() {
  var available = Object.keys(state.personalRecords || {}).filter(function(n) { return !(state.pinnedRecords || []).includes(n); });
  var overlay = document.createElement('div');
  overlay.className = 'pcm-record-picker';
  var card = document.createElement('div');
  card.className = 'pcm-record-picker-card';

  if (available.length === 0) {
    card.innerHTML = '<p class="pcm-record-picker-title">Nenhum recorde dispon\\u00edvel</p><p style="font-size:0.68rem;color:var(--text-secondary);margin-bottom:8px;">Registre cargas na Arena de Treino para poder fix\\u00e1-las aqui.</p><button class="pcm-record-picker-close">Fechar</button>';
  } else {
    card.innerHTML = '<p class="pcm-record-picker-title">Escolha um marco para fixar</p>';
    available.forEach(function(name) {
      var item = document.createElement('div');
      item.className = 'pcm-record-picker-item';
      item.innerHTML = '<span>' + name + '</span><span style="color:var(--color-primary);font-weight:800;">' + state.personalRecords[name] + ' kg</span>';
      item.addEventListener('click', function() {
        togglePinnedRecord(name);
        overlay.remove();
      });
      card.appendChild(item);
    });
    var closeBtn = document.createElement('button');
    closeBtn.className = 'pcm-record-picker-close';
    closeBtn.innerText = 'Cancelar';
    card.appendChild(closeBtn);
  }

  overlay.appendChild(card);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  card.querySelectorAll('.pcm-record-picker-close').forEach(function(b) { b.addEventListener('click', function() { overlay.remove(); }); });
}

function renderProfileMentorMinis() {
  var container = document.getElementById('pcm-mentors-mini');
  if (!container) return;
  container.innerHTML = '';

  var affinities = state.mentorAffinities || {};
  var ranked = Object.keys(affinities)
    .map(function(id) { return { id: id, level: affinities[id].level || 1 }; })
    .sort(function(a, b) { return b.level - a.level; })
    .slice(0, 2);

  if (ranked.length === 0) {
    container.innerHTML = '<div class="pcm-mentor-mini-empty">Treine com um mentor para ele aparecer aqui!</div>';
    return;
  }

  var fullList = MENTORS_LIST_FULL();
  ranked.forEach(function(r) {
    var m = fullList.find(function(x) { return x.id === r.id; });
    if (!m) return;
    var rankInfo = getMentorRankTitle(r.level);
    var cardEl = document.createElement('div');
    cardEl.className = 'pcm-mentor-mini';
    cardEl.innerHTML = '<div class="pcm-mentor-mini-name">' + m.name + '</div><div class="pcm-mentor-mini-lvl">Nv ' + r.level + ' \\u00b7 ' + rankInfo.label + '</div>';
    container.appendChild(cardEl);
  });
}

function renderProfileTrophiesPreview() {
  var container = document.getElementById('pcm-trophies-preview');
  if (!container) return;
  container.innerHTML = '';

  var showcased = (state.showcaseTrophies || []).filter(Boolean);
  if (showcased.length === 0) {
    container.innerHTML = '<span class="pcm-trophies-empty">Nenhum trof\\u00e9u fixado ainda \\u2014 v\\u00e1 em Status \\u2192 Vitrine de Conquistas.</span>';
    return;
  }
  showcased.forEach(function(tId) {
    var t = TROPHIES.find(function(item) { return item.id === tId; });
    if (!t) return;
    var chip = document.createElement('div');
    chip.className = 'pcm-trophy-chip';
    chip.innerHTML = '<span>' + t.icon + '</span><span>' + t.name + '</span>';
    container.appendChild(chip);
  });
}

'''
        js = js[:idx_unlock] + hunter_card_code + js[idx_unlock:]
        print("  [OK] Added Hunter Card functions before unlockTrophy")

# 3e. Add Hunter Card event listeners
if 'btn-open-profile-card' in js:
    print("  [SKIP] Hunter Card event listeners already exist in app.js")
else:
    # Find openSettingsModal listener to insert after
    target_settings = "openSettingsModal();"
    idx_settings = js.find(target_settings)
    if idx_settings == -1:
        errors.append("Could not find openSettingsModal() in app.js")
        print(f"  [ERROR] {errors[-1]}")
    else:
        # Find the closing }); of the click handler and the } of the if block
        close1 = js.find("});", idx_settings)
        if close1 != -1:
            close2 = js.find("}", close1 + 3)
            if close2 != -1:
                insert_pos = close2 + 1
                hunter_listeners = '''

  // Cartão de Caçador — abrir/fechar
  var btnOpenProfileCard = document.getElementById('btn-open-profile-card');
  if (btnOpenProfileCard) {
    btnOpenProfileCard.addEventListener('click', function() {
      playSound('click');
      renderProfileCard();
      document.getElementById('profile-card-modal').classList.remove('hidden');
    });
  }
  var btnCloseProfileCard = document.getElementById('btn-close-profile-card');
  if (btnCloseProfileCard) {
    btnCloseProfileCard.addEventListener('click', function() {
      playSound('click');
      document.getElementById('profile-card-modal').classList.add('hidden');
    });
  }
  var profileCardModalEl = document.getElementById('profile-card-modal');
  if (profileCardModalEl) {
    profileCardModalEl.addEventListener('click', function(e) {
      if (e.target === profileCardModalEl) profileCardModalEl.classList.add('hidden');
    });
  }
'''
                js = js[:insert_pos] + hunter_listeners + js[insert_pos:]
                print("  [OK] Added Hunter Card event listeners")
            else:
                errors.append("Could not find closing brace after openSettingsModal listener")
                print(f"  [ERROR] {errors[-1]}")
        else:
            errors.append("Could not find }); after openSettingsModal")
            print(f"  [ERROR] {errors[-1]}")

# 3f. Add streak calculation in completeActiveWorkout
if 'currentStreak' in js and 'yesterdayDateStr' in js:
    print("  [SKIP] Streak calculation already exists in app.js")
else:
    target_streak = "state.workoutsThisWeek = (state.workoutsThisWeek || 0) + 1;"
    idx_streak = js.find(target_streak)
    if idx_streak == -1:
        errors.append("Could not find workoutsThisWeek in completeActiveWorkout")
        print(f"  [ERROR] {errors[-1]}")
    else:
        # Find the lastWorkoutDate line right after
        after_streak = js[idx_streak + len(target_streak):]
        lwd_target = "state.lastWorkoutDate = new Date().toISOString();"
        lwd_idx = after_streak.find(lwd_target)
        if lwd_idx == -1:
            errors.append("Could not find lastWorkoutDate line after workoutsThisWeek")
            print(f"  [ERROR] {errors[-1]}")
        else:
            full_end = idx_streak + len(target_streak) + lwd_idx + len(lwd_target)
            streak_code = """state.workoutsThisWeek = (state.workoutsThisWeek || 0) + 1;
  // Sequência de dias treinando (streak)
  var todayDateStr = new Date().toDateString();
  var yesterdayDateStr = new Date(Date.now() - 86400000).toDateString();
  var prevWorkoutDateStr = state.lastWorkoutDate ? new Date(state.lastWorkoutDate).toDateString() : null;
  if (!state.currentStreak) state.currentStreak = 0;
  if (prevWorkoutDateStr !== todayDateStr) {
    state.currentStreak = (prevWorkoutDateStr === yesterdayDateStr) ? state.currentStreak + 1 : 1;
  }
  state.bestStreak = Math.max(state.bestStreak || 0, state.currentStreak);

  state.lastWorkoutDate = new Date().toISOString();"""
            js = js[:idx_streak] + streak_code + js[full_end:]
            print("  [OK] Added streak calculation in completeActiveWorkout")

# Write app.js
write('app.js', js)
print(f"\n  Final app.js: {len(js.splitlines())} lines, {len(js)} chars")

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
print("\n" + "=" * 60)
if errors:
    print(f"COMPLETED WITH {len(errors)} ERRORS:")
    for e in errors:
        print(f"  - {e}")
else:
    print("ALL UPDATES APPLIED SUCCESSFULLY!")
print("=" * 60)
