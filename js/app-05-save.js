/* Salvar/carregar do localStorage
 *
 * Parte 5/14 do antigo app.js (linhas 2866-3148 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 7. LOCAL STORAGE ENGINE
// ==========================================
// Flag usada durante o "reiniciar progresso" para impedir que os
// listeners de pagehide/beforeunload re-gravem o estado logo após a limpeza.
let _isResetting = false;

function saveState() {
  if (_isResetting) return;
  try {
    localStorage.setItem('freakyquest_state_v2', JSON.stringify(state));
    const raw = localStorage.getItem('freaky_quest_user');
    const userObj = raw ? JSON.parse(raw) : {};
    userObj.anabolicActive = !!state.anabolicActive;
    userObj.catabolizandoActive = !!state.catabolizandoActive;
    userObj.dailyMacros = state.dailyMacros;
    userObj.workoutHistory = userProfile.workoutHistory || userObj.workoutHistory || {};
    localStorage.setItem('freaky_quest_user', JSON.stringify(userObj));
  } catch (e) {
    console.error("localStorage save blocked or failed", e);
  }
  scheduleCloudSync();
}

function loadState() {
  try {
    const saved = localStorage.getItem('freakyquest_state_v2');
    if (saved) {
      try {
        state = JSON.parse(saved);
        // Fallback arrays
        if (state.eternalFlameClicks === undefined) state.eternalFlameClicks = 0;
        if (!state.mealLogs) state.mealLogs = [];
        if (!state.personalRecords) state.personalRecords = {};
        if (!state.pinnedRecords) state.pinnedRecords = [];
        if (state.currentStreak === undefined) state.currentStreak = 0;
        if (state.bestStreak === undefined) state.bestStreak = 0;
        if (!state.messageTone) state.messageTone = 'faithful';
        if (!state.customWorkouts) {
          state.customWorkouts = {};
        }
        if (!state.customWorkouts.A) state.customWorkouts.A = { title: "Custom A", desc: "Sua ficha de treino customizada", exercises: [] };
        if (!state.customWorkouts.B) state.customWorkouts.B = { title: "Custom B", desc: "Sua ficha de treino customizada", exercises: [] };
        if (!state.customWorkouts.C) state.customWorkouts.C = { title: "Custom C", desc: "Sua ficha de treino customizada", exercises: [] };
        for (let i = 0; i <= 6; i++) {
          if (!state.customWorkouts[i]) {
            state.customWorkouts[i] = { title: "", desc: "Sua ficha de treino customizada", exercises: [], isCustomized: false };
          }
        }
        if (state.activeWorkoutDiv === 'A' || state.activeWorkoutDiv === 'B' || state.activeWorkoutDiv === 'C') {
          state.activeWorkoutDiv = '0';
        }
        if (!state.foodsDb || state.foodsDb.length === 0) {
          state.foodsDb = [
            { id: 'frango', name: "Peito de Frango", kcal: 165, prot: 31.0, fiber: 0.0, isCustom: false },
            { id: 'arroz', name: "Arroz Branco Cozido", kcal: 130, prot: 2.7, fiber: 0.4, isCustom: false },
            { id: 'ovos', name: "Ovos Inteiros Cozidos", kcal: 155, prot: 13.0, fiber: 0.0, isCustom: false },
            { id: 'whey', name: "Whey Protein", kcal: 400, prot: 80.0, fiber: 1.0, isCustom: false },
            { id: 'banana', name: "Banana Prata", kcal: 89, prot: 1.1, fiber: 2.6, isCustom: false },
            { id: 'batatadoce', name: "Batata Doce Cozida", kcal: 86, prot: 1.6, fiber: 3.0, isCustom: false },
            { id: 'aveia', name: "Aveia em Flocos", kcal: 389, prot: 16.9, fiber: 10.6, isCustom: false },
            { id: 'feijao', name: "Feijão Carioca Cozido", kcal: 76, prot: 4.8, fiber: 8.5, isCustom: false }
          ];
        }
        if (!state.customMentors) state.customMentors = [];
        if (!state.workoutSetsOverrides) state.workoutSetsOverrides = {};
        
        // Fallback for new onboarding fields
        if (state.motivation === undefined) state.motivation = 'saude';
        if (state.focusMuscle === undefined) state.focusMuscle = 'FullBody';
        if (state.injury === undefined) state.injury = 'Nenhum';
        if (state.trainingDays === undefined) {
          const goal = state.weeklyTrainGoal || 4;
          const mapping = {
            1: ['Seg'],
            2: ['Seg', 'Qua'],
            3: ['Seg', 'Qua', 'Sex'],
            4: ['Seg', 'Ter', 'Qui', 'Sex'],
            5: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            6: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
            7: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
          };
          state.trainingDays = mapping[goal] || ['Seg', 'Ter', 'Qui', 'Sex'];
        }
        state.weeklyTrainGoal = state.trainingDays.length;
        if (state.useCustomWorkout === undefined) state.useCustomWorkout = true;
        if (state.notificationEnabled === undefined) state.notificationEnabled = true;
        if (state.notificationTime === undefined) state.notificationTime = '18:00';
        if (state.workoutsThisWeek === undefined) state.workoutsThisWeek = 0;
        if (state.appMode === 'simple') {
          state.useCustomWorkout = true;
        }
        if (state.lastWorkoutDate === undefined) state.lastWorkoutDate = '';
        if (state.lastNotificationDate === undefined) state.lastNotificationDate = '';
        if (state.fontScale === undefined) state.fontScale = 1;
        if (state.lastDailyResetDate === undefined) state.lastDailyResetDate = '';
        if (state.targetWeight === undefined) state.targetWeight = state.charWeight || 75;
        if (state.tutorialCompleted === undefined) state.tutorialCompleted = false;
        if (state.unlockedItems === undefined) state.unlockedItems = [];
        // renderDailyQuests() itera nisso sem checar; faltando, updateUI()
        // inteiro morre com TypeError (app em branco). O caminho da nuvem já
        // é coberto por normalizeStateShape() — aqui era o único furo.
        if (!Array.isArray(state.dailyQuests)) state.dailyQuests = [];
        if (state.unlockedTrophies === undefined) state.unlockedTrophies = [];
        if (state.showcaseTrophies === undefined) state.showcaseTrophies = [];
        if (state.profilePic === undefined) state.profilePic = '';
        // Save antigo pode ter só os 4 slots originais — completa os que faltam
        // sem apagar o que já estava equipado.
        if (state.equippedItems === undefined) {
          state.equippedItems = { head: null, aura: null, arms: null, waist: null, hands: null, legs: null, badge: null };
        } else {
          ['head', 'aura', 'arms', 'waist', 'hands', 'legs', 'badge'].forEach(s => {
            if (state.equippedItems[s] === undefined) state.equippedItems[s] = null;
          });
        }
        try {
          const userObj = JSON.parse(localStorage.getItem('freaky_quest_user'));
          if (userObj) {
            Object.keys(userObj).forEach(key => {
              userProfile[key] = userObj[key];
            });
            if (userObj.profilePic) {
              state.profilePic = userObj.profilePic;
            }
            if (userObj.jointPain) {
              state.injury = Array.isArray(userObj.jointPain)
                ? userObj.jointPain
                : [userObj.jointPain];
            }
            if (userObj.name) state.charName = userObj.name;
            if (userObj.currentWeight) state.charWeight = userObj.currentWeight;
            if (userObj.height) state.charHeight = userObj.height;
            if (userObj.mainObjective) state.charGoal = userObj.mainObjective;
            if (userObj.activityLevel) state.charFreq = userObj.activityLevel;
            if (userObj.sex) state.charGender = userObj.sex;
            if (userObj.notificationsEnabled !== undefined) state.notificationEnabled = userObj.notificationsEnabled;
            if (userObj.notificationTime) state.notificationTime = userObj.notificationTime;
            if (userObj.weeklyDaysGoal) state.weeklyTrainGoal = userObj.weeklyDaysGoal;
            if (userObj.trainingDays) state.trainingDays = userObj.trainingDays;
            if (userObj.class) state.charClass = userObj.class;
            if (userObj.experienceLevel) state.charExp = userObj.experienceLevel;
            if (userObj.focusArea) state.focusMuscle = userObj.focusArea;
            if (userObj.motivation) state.motivation = userObj.motivation;
            if (userObj.appMode) state.appMode = userObj.appMode;
            state.simpleModeSeen = !!userObj.simpleModeSeen;
            state.useCustomWorkout = state.appMode === 'simple' ? true : (state.useCustomWorkout !== undefined ? state.useCustomWorkout : true);
          }
        } catch (e) {}

        // Fallbacks for mentor progression state
        if (!state.mentorLevels) {
          state.mentorLevels = { bebezinho: 1, rocklee: 1, goku: 1, arnold: 1, ramondino: 1, brolyz: 1, saitama: 1, nickwalker: 1, jin: 1, namjoon: 1 };
        } else if (state.mentorLevels.nickwalker === undefined) {
          state.mentorLevels.nickwalker = 1;
        }
        if (!state.mentorXP) {
          state.mentorXP = { bebezinho: 0, rocklee: 0, goku: 0, arnold: 0, ramondino: 0, brolyz: 0, saitama: 0, nickwalker: 0, jin: 0, namjoon: 0 };
        } else if (state.mentorXP.nickwalker === undefined) {
          state.mentorXP.nickwalker = 0;
        }
        if (state.mentorXPNeeded === undefined) state.mentorXPNeeded = 100;
        
        if (state.dailyMacros === undefined) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
        if (!state.mentorAffinities) state.mentorAffinities = {};
        OFFICIAL_MENTORS.forEach(m => {
          if (!state.mentorAffinities[m.id]) {
            state.mentorAffinities[m.id] = {
              level: (state.mentorLevels && state.mentorLevels[m.id]) || 1,
              xp: (state.mentorXP && state.mentorXP[m.id]) || 0,
              prestige: 0
            };
          }
        });
        if (!state.bakedBuffs) state.bakedBuffs = [];
        
        // Custom features fallbacks
        if (!state.weightHistory) state.weightHistory = [parseFloat(state.charWeight) || 80];
        // 0 e honesto aqui: sem treino registrado ainda, volume real e zero —
        // nao inventa um numero baseado em atributo (era assim antes).
        if (!state.strengthHistory) state.strengthHistory = [0];
        if (!state.dailyChallenge) {
          state.dailyChallenge = { id: 'dc_water', progress: 0, completed: false, claimed: false };
        }
        if (!state.activeSetsTracker) state.activeSetsTracker = {};
        if (state.waterTargetManual === undefined) state.waterTargetManual = false;
        if (state.proteinIntake === undefined) state.proteinIntake = 0;
        if (state.waterDrank === undefined) state.waterDrank = state.waterIntake || 0;
        if (state.dailyMacros === undefined) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
        if (state.restTimerEnabled === undefined) state.restTimerEnabled = true;
        if (state.dietTrackingEnabled === undefined) state.dietTrackingEnabled = true;
        if (state.cardioMinutesToday === undefined) state.cardioMinutesToday = 0;
        if (state.cardioMinutesTotal === undefined) state.cardioMinutesTotal = 0;
        // Migração: quem já tinha save antes dessa flag existir já vem jogando
        // com um mentor (mesmo que nunca tenha "escolhido" formalmente) — não
        // forçar esse jogador antigo pra aba Mentores depois de reabrir o
        // tutorial. Só contas NOVAS (via `let state = {...}`) nascem com false.
        if (state.mentorManuallyChosen === undefined) state.mentorManuallyChosen = true;
        if (state.baseRestTime === undefined) state.baseRestTime = 90;
        if (state.appMode === undefined) state.appMode = 'rpg';
        if (state.simpleModeSeen === undefined) state.simpleModeSeen = false;

        // Sync workoutHistory from freaky_quest_user into userProfile on load
        if (!userProfile.workoutHistory) userProfile.workoutHistory = {};
        if (!userProfile.rivals) {
          userProfile.rivals = {
            "Supino Reto (Barra)": { name: "Gabriel ganley bebezinho", weight: 40 },
            "Agachamento Livre": { name: "Rock Lee", weight: 30 }
          };
        }
        try {
          const _fqu = JSON.parse(localStorage.getItem('freaky_quest_user'));
          if (_fqu) {
            if (_fqu.workoutHistory && typeof _fqu.workoutHistory === 'object') {
              userProfile.workoutHistory = _fqu.workoutHistory;
              // Back-fill state.personalRecords from workoutHistory for consistency
              Object.entries(_fqu.workoutHistory).forEach(([exName, maxW]) => {
                if (!state.personalRecords[exName] || maxW > state.personalRecords[exName]) {
                  state.personalRecords[exName] = maxW;
                }
              });
            }
            if (_fqu.rivals && typeof _fqu.rivals === 'object') {
              userProfile.rivals = _fqu.rivals;
            }
          }
        } catch (_e) {}

        purgeOldSetTrackerKeys();
        
        // Auto recalculate target numbers if weights or goals changed
        recalculateMacrosTargets();
        if (!state.waterTargetManual) updateWaterTargetFromWeight();
        return true;
      } catch(e) {
        console.error("Falha ao ler save do localStorage v2", e);
      }
    }
  } catch (e) {
    console.error("localStorage reading blocked or failed", e);
  }
  return false;
}

// Recalculates Target Kcal and Protein dynamically based on user profile weight, goal and activity!
function recalculateMacrosTargets() {
  const w = parseFloat(state.charWeight) || 70;
  const targetW = parseFloat(state.targetWeight) || w;
  const h = parseFloat(state.charHeight) || 170;
  const activityMult = ACTIVITY_MULTIPLIERS[state.charFreq] || ACTIVITY_MULTIPLIERS.moderado;

  let refWeight = w;
  if (state.charGoal === 'engordar' || state.charGoal === 'estetico') {
    refWeight = Math.max(w, targetW);
  } else if (state.charGoal === 'emagrecer') {
    refWeight = Math.min(w, targetW);
  }

  const hMeters = h / 100;
  const bmr = state.charGender === 'feminino'
    ? 655 + (9.6 * w) + (1.8 * h) - (4.7 * (state.charAge || 25))
    : 66 + (13.7 * w) + (5 * h) - (6.8 * (state.charAge || 25));

  let goalFactor = 1.0;
  if (state.charGoal === 'emagrecer') goalFactor = 0.85;
  else if (state.charGoal === 'engordar') goalFactor = 1.12;
  else if (state.charGoal === 'estetico') goalFactor = 1.0;
  else if (state.charGoal === 'saude') goalFactor = 0.95;

  state.kcalTarget = Math.round(bmr * activityMult * goalFactor);

  if (state.charGoal === 'emagrecer') {
    state.protTarget = Math.round(refWeight * 2.2);
  } else if (state.charGoal === 'engordar') {
    state.protTarget = Math.round(refWeight * 2.0);
  } else if (state.charGoal === 'estetico') {
    state.protTarget = Math.round(refWeight * 2.3);
  } else {
    state.protTarget = Math.round(refWeight * 1.8);
  }

  state.fiberTarget = Math.max(20, Math.round(refWeight * 0.35));
  if (!state.waterTargetManual) updateWaterTargetFromWeight();
}

