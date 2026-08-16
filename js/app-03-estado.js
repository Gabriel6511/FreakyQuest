/* Motor de estado + helpers de treino, timer e reset diario/semanal
 *
 * Parte 3/14 do antigo app.js (linhas 2108-2647 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// ==========================================
// 5. APPLICATION STATE ENGINE
// ==========================================
let state = {
  charName: '',
  eternalFlameClicks: 0,
  charClass: 'bodybuilder',
  charWeight: 75,
  charHeight: 178,
  charGoal: 'engordar', // emagrecer, engordar, manter
  charFreq: 'medio',
  charExp: 'rato',
  charGender: 'masculino',
  charAge: 25,
  motivation: 'saude',
  focusMuscle: 'FullBody',
  injury: 'Nenhum',
  trainingDays: ['Seg', 'Ter', 'Qui', 'Sex'],
  weeklyTrainGoal: 4,
  notificationEnabled: true,
  notificationTime: '18:00',
  restTimerEnabled: true,
  baseRestTime: 90,
  dietTrackingEnabled: true,
  workoutsThisWeek: 0,
  lastWorkoutDate: '',
  lastNotificationDate: '',
  targetWeight: 75,
  level: 1,
  xp: 0,
  xpNeeded: 100,
  attributes: {
    for: 10,
    res: 10,
    agi: 10,
    vig: 10,
    foc: 10
  },
  attrPoints: 0,
  activeMentor: 'rocklee',
  mentorManuallyChosen: false,
  activeWorkoutDiv: 'A',
  workoutsCompleted: 0,
  waterIntake: 0, // LITRES E.g. 1, 2, 3
  waterDrank: 0,
  waterTarget: 3, // Target Litres
  cardioMinutesToday: 0,
  cardioMinutesTotal: 0,
  proteinIntake: 0, // gramas de proteína ingeridas hoje (recalculado na dieta)
  
  // Diet trackers
  kcalTarget: 2500,
  protTarget: 150,
  fiberTarget: 25,
  dailyMacros: { kcal: 0, prot: 0, fiber: 0, carbs: 0 },
  
  dailyQuests: [],
  unlockedTrophies: [],
  showcaseTrophies: [],
  soundEnabled: true,
  
  // Custom workouts system
  useCustomWorkout: false,
  customWorkouts: {
    A: { title: "Custom A", desc: "Sua ficha de treino customizada", exercises: [] },
    B: { title: "Custom B", desc: "Sua ficha de treino customizada", exercises: [] },
    C: { title: "Custom C", desc: "Sua ficha de treino customizada", exercises: [] },
    0: { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false },
    1: { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false },
    2: { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false },
    3: { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false },
    4: { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false },
    5: { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false },
    6: { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false }
  },

  // Logged meals today
  mealLogs: [],
  
  // Food items database (official + custom ones)
  foodsDb: [
    { id: 'frango', name: "Peito de Frango", kcal: 165, prot: 31.0, fiber: 0.0, isCustom: false },
    { id: 'arroz', name: "Arroz Branco Cozido", kcal: 130, prot: 2.7, fiber: 0.4, isCustom: false },
    { id: 'ovos', name: "Ovos Inteiros Cozidos", kcal: 155, prot: 13.0, fiber: 0.0, isCustom: false },
    { id: 'whey', name: "Whey Protein", kcal: 400, prot: 80.0, fiber: 1.0, isCustom: false },
    { id: 'banana', name: "Banana Prata", kcal: 89, prot: 1.1, fiber: 2.6, isCustom: false },
    { id: 'batatadoce', name: "Batata Doce Cozida", kcal: 86, prot: 1.6, fiber: 3.0, isCustom: false },
    { id: 'aveia', name: "Aveia em Flocos", kcal: 389, prot: 16.9, fiber: 10.6, isCustom: false },
    { id: 'feijao', name: "Feijão Carioca Cozido", kcal: 76, prot: 4.8, fiber: 8.5, isCustom: false }
  ],
  
  // Custom mentors created by the user
  customMentors: [],
  
  // Personal Records map for exercises: { "Supino Reto (Barra)": 40 }
  personalRecords: {},
  // Marcos de Força fixados pelo usuário no Cartão de Caçador (máx. 3 nomes de exercício)
  pinnedRecords: [],
  // Sequência de dias treinando (streak)
  currentStreak: 0,
  bestStreak: 0,

  // Tutorial and cosmetics
  tutorialCompleted: false,
  unlockedItems: [],
  profilePic: '',
  appMode: 'rpg',
  simpleModeSeen: false,
  messageTone: 'faithful', // faithful | brutal | buddy (ver MESSAGE_TONES)

  // --- NEW MENTOR PROGRESSION STATE ---
  mentorLevels: {
    bebezinho: 1,
    rocklee: 1,
    goku: 1,
    arnold: 1,
    ramondino: 1,
    brolyz: 1,
    saitama: 1,
    nickwalker: 1
  },
  mentorXP: {
    bebezinho: 0,
    rocklee: 0,
    goku: 0,
    arnold: 0,
    ramondino: 0,
    brolyz: 0,
    saitama: 0,
    nickwalker: 0
  },
  mentorXPNeeded: 100, // Fixo por nível
  
  // Custom features
  dailyChallenge: { id: 'dc_water', progress: 0, completed: false, claimed: false },
  weightHistory: [],
  strengthHistory: [],

  // Persistência de séries do treino (por dia)
  activeSetsTracker: {},
  
  // Equipamentos equipados atualmente nos slots
  equippedItems: { head: null, aura: null, arms: null, waist: null, hands: null, legs: null, badge: null }
};

// Cópia intacta do estado inicial, tirada antes de qualquer carregamento.
// Serve de "molde" pra completar estados vindos de fora (nuvem) que foram
// gravados por uma versão mais antiga do app e não têm os campos novos.
const DEFAULT_STATE_SHAPE = JSON.parse(JSON.stringify(state));

// Completa um estado externo com os campos que faltam, sem sobrescrever nada
// que já exista nele. Sem isso, um progresso salvo por uma versão antiga
// quebraria a tela ao ser aplicado (updateUI acessa campos que não existiriam).
function normalizeStateShape(raw) {
  const base = JSON.parse(JSON.stringify(DEFAULT_STATE_SHAPE));
  const merged = { ...base, ...(raw || {}) };
  // Objetos aninhados precisam de merge próprio: o spread acima troca o objeto
  // inteiro, então um "attributes" antigo sem alguma chave ficaria incompleto.
  ['attributes', 'dailyMacros', 'customWorkouts', 'personalRecords',
   'mentorLevels', 'mentorXP', 'dailyChallenge', 'activeSetsTracker',
   'equippedItems', 'dailyHistory'].forEach((key) => {
    if (base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      merged[key] = { ...base[key], ...((raw && raw[key]) || {}) };
    }
  });
  return merged;
}

const ACTIVITY_MULTIPLIERS = {
  pouco: 1.2,
  ativo: 1.375,
  moderado: 1.55,
  muito: 1.725
};

const EXP_SCALE = {
  novico: { weight: 0.75, sets: -1 },
  rato: { weight: 1.0, sets: 0 },
  oldschool: { weight: 1.15, sets: 1 }
};

const MENTOR_XP_BONUS = {
  bebezinho: 1.15,
  brolyz: 1.20,
  rocklee: 1.08,
  ramondino: 1.10,
  goku: 1.12,
  arnold: 1.18,
  saitama: 1.10,
  nickwalker: 1.22
};

const FOCUS_BONUS_EXERCISES = {
  Peito: { name: 'Crucifixo com Halteres (Foco Peito)', sets: 3, targetReps: '12-15', muscle: 'Peito', weight: 10 },
  Costas: { name: 'Remada Unilateral (Foco Costas)', sets: 3, targetReps: '10-12', muscle: 'Costas', weight: 12 },
  Ombros: { name: 'Elevação Frontal (Foco Ombros)', sets: 3, targetReps: '12-15', muscle: 'Ombros', weight: 8 },
  Braços: { name: 'Rosca Alternada (Foco Braços)', sets: 3, targetReps: '10-12', muscle: 'Braços', weight: 10 },
  Pernas: { name: 'Cadeira Extensora (Foco Pernas)', sets: 3, targetReps: '12-15', muscle: 'Pernas', weight: 30 },
  Abdômen: { name: 'Abdominal Supra (Foco Abdômen)', sets: 3, targetReps: '15-20', muscle: 'Abdômen', weight: 0 },
  Glúteos: { name: 'Elevação Pélvica (Foco Glúteos)', sets: 3, targetReps: '10-12', muscle: 'Glúteos', weight: 20 },
  FullBody: null
};

const MOTIVATION_FLAVOR = {
  saude: 'Longevidade e disposição no radar.',
  peso: 'Queimar calorias e secar o shape.',
  aura: 'Exalar aura máxima no espelho.',
  estresse: 'Canalizar a raiva em ferro puro.',
  filosofico: 'Redescobrir o melhor de si.',
  moral: 'Ficar fortinho pra quem importa.'
};

function getTodayKey() {
  return new Date().toDateString();
}

function buildSetKey(exIdx, setNum) {
  return `${state.useCustomWorkout ? 'cust' : 'std'}_${state.activeWorkoutDiv}_ex${exIdx}_set${setNum}_${getTodayKey()}`;
}

function normalizeSetEntry(entry) {
  if (!entry) return null;
  if (entry === true) return { completed: true, weight: 0, reps: 0 };
  return entry;
}

function isSetCompleted(entry) {
  const normalized = normalizeSetEntry(entry);
  return !!(normalized && normalized.completed);
}

function parseTargetReps(repsStr) {
  if (!repsStr) return 10;
  const match = String(repsStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 10;
}

function getMentorXPBonus() {
  return MENTOR_XP_BONUS[state.activeMentor] || 1.0;
}

function updateWaterTargetFromWeight() {
  const w = parseFloat(state.charWeight) || 70;
  state.waterTarget = Math.max(2, Math.min(6, Math.round(w * 0.035)));
}

function purgeOldSetTrackerKeys() {
  if (!state.activeSetsTracker) state.activeSetsTracker = {};
  const today = getTodayKey();
  Object.keys(state.activeSetsTracker).forEach((key) => {
    if (!key.endsWith(today)) delete state.activeSetsTracker[key];
  });
}

function getWeeklyDaysArray() {
  if (!state.trainingDays || state.trainingDays.length === 0) {
    state.trainingDays = ['Seg', 'Ter', 'Qui', 'Sex'];
  }
  return state.trainingDays;
}

function getActiveWorkoutIndex() {
  const days = getWeeklyDaysArray();
  let idx = parseInt(state.activeWorkoutDiv, 10);
  if (isNaN(idx) || idx < 0 || idx >= days.length) {
    idx = 0;
    state.activeWorkoutDiv = '0';
  }
  return idx;
}

function getDefaultWorkoutTitle(index, dayName) {
  const focuses = [
    "Peito e Bíceps",
    "Costas e Tríceps",
    "Pernas e Ombros",
    "Cardio e Core",
    "Treino Extra",
    "Braços e Abdômen",
    "Alongamento"
  ];
  return `${dayName} - ${focuses[index % focuses.length]}`;
}

function getResolvedWorkoutTemplate() {
  if (!state.workoutSetsOverrides) state.workoutSetsOverrides = {};

  const days = getWeeklyDaysArray();
  const activeIdx = getActiveWorkoutIndex();
  const dayName = days[activeIdx];

  if (state.useCustomWorkout) {
    const base = state.customWorkouts[activeIdx];
    let title = base.title;
    if (!base.isCustomized || !title) {
      title = getDefaultWorkoutTitle(activeIdx, dayName);
    }
    return {
      title: title,
      desc: base.desc,
      exercises: base.exercises.map((ex) => {
        const overriddenSets = state.workoutSetsOverrides[ex.name];
        return {
          ...ex,
          sets: (overriddenSets !== undefined) ? overriddenSets : ex.sets
        };
      })
    };
  }

  const divMap = ['A', 'B', 'C'];
  const divLetter = divMap[activeIdx % 3] || 'A';
  const classKey = WORKOUT_TEMPLATES[state.charClass] ? state.charClass : 'bodybuilder';
  const raw = WORKOUT_TEMPLATES[classKey][divLetter];
  const expCfg = EXP_SCALE[state.charExp] || EXP_SCALE.rato;
  const exercises = raw.exercises.map((ex) => {
    const defaultSets = Math.max(2, Math.min(6, ex.sets + expCfg.sets));
    const overriddenSets = state.workoutSetsOverrides[ex.name];
    return {
      ...ex,
      weight: Math.round((ex.weight || 0) * expCfg.weight),
      sets: (overriddenSets !== undefined) ? overriddenSets : defaultSets
    };
  });

  const focus = state.focusMuscle;
  if (focus) {
    const focusParts = typeof focus === 'string' ? focus.split(',').map(s => s.trim()) : (Array.isArray(focus) ? focus : [focus]);
    const uniqueFocus = [...new Set(focusParts.filter(f => f && f !== 'FullBody' && FOCUS_BONUS_EXERCISES[f]))];
    
    uniqueFocus.reverse().forEach(f => {
      const bonus = { ...FOCUS_BONUS_EXERCISES[f] };
      bonus.weight = Math.round((bonus.weight || 0) * expCfg.weight);
      
      const defaultSets = bonus.sets;
      const overriddenSets = state.workoutSetsOverrides[bonus.name];
      bonus.sets = (overriddenSets !== undefined) ? overriddenSets : defaultSets;
      
      exercises.unshift(bonus);
    });
  }

  const cleanFocusStr = focus ? (typeof focus === 'string' ? focus.split(',').map(s => s.trim()).filter(f => f && f !== 'FullBody').join(' + ') : '') : '';
  const focusNote = cleanFocusStr ? ` · Ênfase: ${cleanFocusStr}` : '';
  const expNote = state.charExp === 'novico' ? ' · Iniciante' : state.charExp === 'oldschool' ? ' · Avançado' : '';

  let displayTitle = raw.title;
  if (raw.title.includes(' - ')) {
    const parts = raw.title.split(' - ');
    displayTitle = `${dayName} - ${parts[1]}`;
  } else if (raw.title.includes(' – ')) {
    const parts = raw.title.split(' – ');
    displayTitle = `${dayName} - ${parts[1]}`;
  } else {
    displayTitle = `${dayName} - ${raw.title}`;
  }

  return {
    title: displayTitle,
    desc: raw.desc + focusNote + expNote,
    exercises
  };
}

function getWorkoutCompletionStats() {
  const template = getResolvedWorkoutTemplate();
  let totalSets = 0;
  let completedSets = 0;

  template.exercises.forEach((ex, exIdx) => {
    for (let s = 1; s <= ex.sets; s++) {
      totalSets++;
      if (isSetCompleted(state.activeSetsTracker[buildSetKey(exIdx, s)])) completedSets++;
    }
  });

  return {
    totalSets,
    completedSets,
    percent: totalSets ? (completedSets / totalSets) * 100 : 0
  };
}

function calculateSessionVolume() {
  const template = getResolvedWorkoutTemplate();
  let volume = 0;

  template.exercises.forEach((ex, exIdx) => {
    for (let s = 1; s <= ex.sets; s++) {
      const entry = normalizeSetEntry(state.activeSetsTracker[buildSetKey(exIdx, s)]);
      if (entry && entry.completed) {
        const weight = entry.weight || ex.weight || 0;
        const reps = entry.reps || parseTargetReps(ex.targetReps);
        volume += weight * reps;
      }
    }
  });

  return volume;
}

let restTimerInterval = null;

function startRestTimer(seconds) {
  const banner = document.getElementById('rest-timer-banner');
  const countdown = document.getElementById('rest-timer-countdown');
  const svgFill = document.getElementById('rest-timer-fill-circle');
  if (!banner || !countdown) return;

  // Rock Lee Cuts
  let leeCut = 0;
  if (state.activeMentor === 'rocklee') {
    const leeLvl = (state.mentorAffinities && state.mentorAffinities['rocklee'] && state.mentorAffinities['rocklee'].level) || state.mentorLevels['rocklee'] || 1;
    if (leeLvl >= 35) {
      leeCut = 10;
    } else if (leeLvl >= 15) {
      leeCut = 5;
    }
  }
  
  // Permanent baked buff check (Tier 3)
  if (state.bakedBuffs && state.bakedBuffs.includes('rocklee_t3_passive')) {
    leeCut = Math.max(leeCut, 15);
  }

  const adjusted = Math.max(5, seconds - leeCut);
  let remaining = adjusted;
  const circumference = 264; // 2π × 42

  if (restTimerInterval) clearInterval(restTimerInterval);
  banner.classList.remove('hidden');
  banner.classList.add('visible');
  countdown.innerText = remaining;
  if (svgFill) svgFill.style.strokeDashoffset = '0';

  restTimerInterval = setInterval(() => {
    remaining -= 1;
    countdown.innerText = remaining;
    if (svgFill) {
      const offset = circumference * (1 - remaining / adjusted);
      svgFill.style.strokeDashoffset = offset;
      svgFill.style.stroke = remaining <= 10 ? '#ef4444' : 'var(--color-primary)';
    }
    if (remaining <= 0) {
      clearInterval(restTimerInterval);
      restTimerInterval = null;
      banner.classList.remove('visible');
      banner.classList.add('hidden');
      playSound('alarm');
      
      // Screen shake effect
      document.body.classList.add('screen-shake');
      setTimeout(() => {
        document.body.classList.remove('screen-shake');
      }, 500);
    }
  }, 1000);

  // +15s button
  const addBtn = document.getElementById('btn-add-rest');
  if (addBtn) {
    addBtn.onclick = () => {
      remaining = Math.min(remaining + 15, 999);
    };
  }
}

function stopRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  const banner = document.getElementById('rest-timer-banner');
  if (banner) {
    banner.classList.remove('visible');
    banner.classList.add('hidden');
  }
}

function getWeekNumber(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return date.getFullYear() + '-W' + (1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7));
}

function checkWeeklyReset() {
  const today = new Date();
  const currentWeekId = getWeekNumber(today);

  if (state.lastWorkoutDate) {
    const lastDate = new Date(state.lastWorkoutDate);
    const lastWeekId = getWeekNumber(lastDate);

    if (currentWeekId !== lastWeekId) {
      state.workoutsThisWeek = 0;
      saveState();
    }
  }
}

function checkDailyReset() {
  const todayStr = new Date().toDateString();
  if (!state.lastDailyResetDate) {
    state.lastDailyResetDate = todayStr;
    saveState();
    return;
  }

  if (state.lastDailyResetDate !== todayStr) {
    state.waterDrank = 0;
    state.waterIntake = 0;
    state.proteinIntake = 0;
    state.mealLogs = [];
    state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
    state.cardioMinutesToday = 0;
    
    // Generate new randomized quests
    generateDailyQuests();
    
    state.lastDailyResetDate = todayStr;
    saveState();
  }
}

function showExtraWorkoutToast(current, target) {
  const toast = document.getElementById('overload-notification');
  const message = document.getElementById('overload-msg');
  if (message && toast) {
    message.innerText = `💥 AURA EXTRA! Treino extra ${current}/${target} concluído! (+30 XP Bônus)`;
    toast.classList.remove('hidden');
    playSound('quest');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3800);
  }
}

