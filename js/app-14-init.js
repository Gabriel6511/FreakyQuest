/* Eventos, inicializacao de formularios e boot do app
 *
 * Parte 14/14 do antigo app.js (linhas 7123-9756 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 21. EVENTS TRIGGERS AND FORM INITS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // Conta / sincronização na nuvem (Supabase)
  capturePendingInviteFromURL();
  initCloudAuth();
  fetchGlobalFlameCount();

  const sendCodeBtn = document.getElementById('account-send-magic-link');
  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('account-email-input');
      const statusEl = document.getElementById('account-status-msg');
      const email = (emailInput?.value || '').trim();
      if (!email || !email.includes('@')) {
        if (statusEl) statusEl.innerText = 'Digite um e-mail válido.';
        return;
      }
      playSound('click');
      sendCodeBtn.disabled = true;
      if (statusEl) statusEl.innerText = 'Enviando código...';
      const { error } = await sendLoginCode(email);
      sendCodeBtn.disabled = false;
      if (error) {
        if (statusEl) statusEl.innerText = `Erro: ${error}`;
        return;
      }
      if (statusEl) statusEl.innerText = 'Código enviado! Confira seu e-mail (e o spam).';
      document.getElementById('account-code-step').classList.remove('hidden');
      sendCodeBtn.innerText = 'Reenviar código';
      document.getElementById('account-code-input').focus();
    });
  }

  const verifyCodeBtn = document.getElementById('account-verify-code');
  if (verifyCodeBtn) {
    verifyCodeBtn.addEventListener('click', async () => {
      const statusEl = document.getElementById('account-status-msg');
      const email = (document.getElementById('account-email-input')?.value || '').trim();
      const code = document.getElementById('account-code-input')?.value || '';
      playSound('click');
      verifyCodeBtn.disabled = true;
      if (statusEl) statusEl.innerText = 'Verificando...';
      const { error } = await verifyLoginCode(email, code);
      verifyCodeBtn.disabled = false;
      if (error) {
        if (statusEl) statusEl.innerText = `Código inválido ou expirado. Peça um novo.`;
        return;
      }
      if (statusEl) statusEl.innerText = '';
      document.getElementById('account-code-step').classList.add('hidden');
      document.getElementById('account-code-input').value = '';
      sendCodeBtn.innerText = 'Enviar código';
    });
  }

  const signOutBtn = document.getElementById('account-sign-out');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      playSound('click');
      await signOutCloud();
    });
  }

  // Interruptores de privacidade — salva na hora do clique (não espera o
  // botão geral "Salvar Ajustes"), já que é um toggle único e a pessoa
  // espera feedback imediato numa configuração de privacidade.
  const privacyMap = { 'privacy-share-prs': 'share_prs', 'privacy-share-mentors': 'share_mentors',
    'privacy-share-trophies': 'share_trophies', 'privacy-share-schedule': 'share_schedule' };
  Object.entries(privacyMap).forEach(([elId, column]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.addEventListener('change', async () => {
      if (!cloudUser) return;
      playSound('click');
      await supabaseClient.from('public_profiles').update({ [column]: el.checked }).eq('id', cloudUser.id);
    });
  });

  const nicknameConfirmBtn = document.getElementById('nickname-confirm-btn');
  if (nicknameConfirmBtn) {
    nicknameConfirmBtn.addEventListener('click', () => {
      playSound('click');
      const input = document.getElementById('nickname-input');
      confirmNickname(input?.value || '');
    });
  }

  // Login antes do onboarding (tela inicial de seleção de modo) — pra quem
  // já tem conta não precisar refazer o onboarding num aparelho novo.
  const openEarlyLoginBtn = document.getElementById('btn-open-early-login');
  const earlyLoginModal = document.getElementById('early-login-modal');
  if (openEarlyLoginBtn && earlyLoginModal) {
    openEarlyLoginBtn.addEventListener('click', () => {
      playSound('click');
      earlyLoginModal.classList.remove('hidden');
    });
  }
  const earlyLoginCloseBtn = document.getElementById('early-login-close-btn');
  if (earlyLoginCloseBtn && earlyLoginModal) {
    earlyLoginCloseBtn.addEventListener('click', () => {
      playSound('click');
      earlyLoginModal.classList.add('hidden');
    });
  }
  const openFriendsBtn = document.getElementById('btn-open-friends-modal');
  const friendsModal = document.getElementById('friends-modal');
  if (openFriendsBtn && friendsModal) {
    openFriendsBtn.addEventListener('click', () => {
      playSound('click');
      openFriendsModal();
    });
  }
  // Entrada alternativa em Ajustes — a aba Status (onde fica o Cartão de
  // Caçador) é escondida no Modo Simples, então sem isso quem usa o modo
  // simples não conseguiria acessar amigos/ranking de jeito nenhum.
  const settingsFriendsBtn = document.getElementById('settings-open-friends');
  if (settingsFriendsBtn) {
    settingsFriendsBtn.addEventListener('click', () => {
      playSound('click');
      openFriendsModal();
    });
  }

  const replayTutorialBtn = document.getElementById('settings-replay-tutorial');
  if (replayTutorialBtn) {
    replayTutorialBtn.addEventListener('click', () => {
      playSound('click');
      startTutorial();
    });
  }

  const closeFriendsBtn = document.getElementById('btn-close-friends-modal');
  if (closeFriendsBtn && friendsModal) {
    closeFriendsBtn.addEventListener('click', () => {
      playSound('click');
      friendsModal.classList.add('hidden');
    });
  }

  // Card de amigo — delegação de evento porque as linhas (amigos e ranking)
  // são recriadas toda vez que a lista recarrega.
  const friendCardModalEl = document.getElementById('friend-card-modal');
  ['friends-list-container', 'ranking-list-container'].forEach(id => {
    const list = document.getElementById(id);
    if (!list) return;
    list.addEventListener('click', (e) => {
      const row = e.target.closest('.friend-row-clickable');
      if (row) openFriendCard(row.dataset.friendId);
    });
  });
  const closeFriendCardBtn = document.getElementById('btn-close-friend-card');
  if (closeFriendCardBtn && friendCardModalEl) {
    closeFriendCardBtn.addEventListener('click', () => {
      playSound('click');
      friendCardModalEl.classList.add('hidden');
    });
    friendCardModalEl.addEventListener('click', (e) => {
      if (e.target === friendCardModalEl) friendCardModalEl.classList.add('hidden');
    });
  }
  const copyInviteCodeBtn = document.getElementById('btn-copy-invite-code');
  if (copyInviteCodeBtn) {
    copyInviteCodeBtn.addEventListener('click', async () => {
      playSound('click');
      try {
        await navigator.clipboard.writeText(getMyInviteCode());
        copyInviteCodeBtn.innerText = 'Copiado!';
        setTimeout(() => { copyInviteCodeBtn.innerText = 'Código'; }, 1500);
      } catch (e) {
        // clipboard API pode falhar em contexto não-seguro; ignora silenciosamente
      }
    });
  }
  const copyInviteLinkBtn = document.getElementById('btn-copy-invite-link');
  if (copyInviteLinkBtn) {
    copyInviteLinkBtn.addEventListener('click', async () => {
      playSound('click');
      const link = `${window.location.origin}${window.location.pathname}?invite=${getMyInviteCode()}`;
      try {
        await navigator.clipboard.writeText(link);
        const original = copyInviteLinkBtn.innerText;
        copyInviteLinkBtn.innerText = 'Link copiado!';
        setTimeout(() => { copyInviteLinkBtn.innerText = original; }, 1500);
      } catch (e) {
        // clipboard API pode falhar em contexto não-seguro; ignora silenciosamente
      }
    });
  }
  const friendsViewFriendsBtn = document.getElementById('friends-view-toggle-friends');
  if (friendsViewFriendsBtn) {
    friendsViewFriendsBtn.addEventListener('click', () => {
      playSound('click');
      showFriendsView('friends');
    });
  }
  const friendsViewRankingBtn = document.getElementById('friends-view-toggle-ranking');
  if (friendsViewRankingBtn) {
    friendsViewRankingBtn.addEventListener('click', () => {
      playSound('click');
      showFriendsView('ranking');
    });
  }
  const addFriendBtn = document.getElementById('btn-add-friend');
  if (addFriendBtn) {
    addFriendBtn.addEventListener('click', () => {
      playSound('click');
      const input = document.getElementById('add-friend-code-input');
      addFriendByCode(input?.value || '');
    });
  }

  const openCardioBtn = document.getElementById('btn-open-cardio-modal');
  const cardioModal = document.getElementById('cardio-modal');
  if (openCardioBtn && cardioModal) {
    openCardioBtn.addEventListener('click', () => {
      playSound('click');
      document.getElementById('cardio-modal-error').innerText = '';
      cardioModal.classList.remove('hidden');
    });
  }
  const cardioCloseBtn = document.getElementById('cardio-close-btn');
  if (cardioCloseBtn && cardioModal) {
    cardioCloseBtn.addEventListener('click', () => {
      playSound('click');
      cardioModal.classList.add('hidden');
    });
  }
  const cardioConfirmBtn = document.getElementById('cardio-confirm-btn');
  if (cardioConfirmBtn) {
    cardioConfirmBtn.addEventListener('click', () => {
      const errEl = document.getElementById('cardio-modal-error');
      const type = document.getElementById('cardio-type-select').value;
      const minutes = parseInt(document.getElementById('cardio-duration-input').value, 10);
      if (!minutes || minutes <= 0 || minutes > 300) {
        errEl.innerText = 'Digite uma duração válida (1 a 300 minutos).';
        return;
      }
      playSound('click');
      errEl.innerText = '';
      cardioModal.classList.add('hidden');
      logCardioSession(type, minutes);
    });
  }

  const earlyLoginSendBtn = document.getElementById('early-login-send-btn');
  if (earlyLoginSendBtn) {
    earlyLoginSendBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('early-login-email-input');
      const statusEl = document.getElementById('early-login-status-msg');
      const email = (emailInput?.value || '').trim();
      if (!email || !email.includes('@')) {
        if (statusEl) statusEl.innerText = 'Digite um e-mail válido.';
        return;
      }
      playSound('click');
      earlyLoginSendBtn.disabled = true;
      if (statusEl) statusEl.innerText = 'Enviando código...';
      const { error } = await sendLoginCode(email);
      earlyLoginSendBtn.disabled = false;
      if (error) {
        if (statusEl) statusEl.innerText = `Erro: ${error}`;
        return;
      }
      if (statusEl) statusEl.innerText = 'Código enviado! Confira seu e-mail (e o spam).';
      document.getElementById('early-login-code-step').classList.remove('hidden');
      document.getElementById('early-login-verify-btn').classList.remove('hidden');
      earlyLoginSendBtn.innerText = 'Reenviar código';
      document.getElementById('early-login-code-input').focus();
    });
  }

  const earlyLoginVerifyBtn = document.getElementById('early-login-verify-btn');
  if (earlyLoginVerifyBtn) {
    earlyLoginVerifyBtn.addEventListener('click', async () => {
      const statusEl = document.getElementById('early-login-status-msg');
      const email = (document.getElementById('early-login-email-input')?.value || '').trim();
      const code = document.getElementById('early-login-code-input')?.value || '';
      playSound('click');
      earlyLoginVerifyBtn.disabled = true;
      if (statusEl) statusEl.innerText = 'Verificando...';
      const { error } = await verifyLoginCode(email, code);
      earlyLoginVerifyBtn.disabled = false;
      if (error) {
        if (statusEl) statusEl.innerText = 'Código inválido ou expirado. Peça um novo.';
        return;
      }
      if (statusEl) statusEl.innerText = '';
      document.getElementById('early-login-modal').classList.add('hidden');
    });
  }

  // Drag-to-scroll com mouse para carrosséis horizontais (filtro de universo
  // de mentor, tiles de série do treino) — no touch já rola por swipe nativo,
  // mas no desktop (sem touch) não tinha nenhum jeito de alcançar o conteúdo
  // fora da tela, já que a barra de rolagem é escondida por design.
  (function setupDragScroll() {
    const DRAG_SCROLL_SELECTOR = '.mentor-universe-filter, .exc-sets-row';
    let drag = null;

    document.addEventListener('mousedown', (e) => {
      const container = e.target.closest(DRAG_SCROLL_SELECTOR);
      if (!container) return;
      drag = { container, startX: e.pageX, scrollLeft: container.scrollLeft, moved: false };
      container.classList.add('drag-scrolling');
    });

    document.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = e.pageX - drag.startX;
      if (Math.abs(dx) > 3) drag.moved = true;
      if (drag.moved) drag.container.scrollLeft = drag.scrollLeft - dx;
    });

    function endDrag() {
      if (!drag) return;
      const { container, moved } = drag;
      container.classList.remove('drag-scrolling');
      if (moved) {
        // Suprime o click que viria logo em seguida, pra um arrasto não
        // acabar selecionando o card/tile que está embaixo do cursor.
        const suppressClick = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        container.addEventListener('click', suppressClick, { capture: true, once: true });
      }
      drag = null;
    }
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('mouseleave', endDrag);
  })();

  applyNumericSanitizer('#water-target-input', 1);
  applyNumericSanitizer('#settings-weight', 3);
  applyNumericSanitizer('#settings-target-weight', 3);
  applyNumericSanitizer('#settings-weekly-days', 0);
  applyNumericSanitizer('#cust-ex-sets', 1);
  applyNumericSanitizer('#cust-ex-weight', 3);
  applyNumericSanitizer('#cust-food-kcal', 2);
  applyNumericSanitizer('#cust-food-prot', 2);
  applyNumericSanitizer('#cust-food-fiber', 2);

  const hasSave = loadState();

  // Pausa animações e persiste estado ao ir para background (economia de bateria / perda de dados)
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('app-paused', document.hidden);
    if (document.hidden) {
      saveState();
      // saveState() só AGENDA o envio pra nuvem (debounce de 4s). Se o app for
      // fechado/minimizado antes disso, o progresso recente ficaria só no
      // aparelho. Aqui a página ainda está viva, então dá pra enviar na hora.
      flushCloudSync();
    }
  });
  window.addEventListener('pagehide', saveState);
  window.addEventListener('beforeunload', saveState);

  // Aplica o tamanho de fonte salvo (escala o rem base do documento)
  document.documentElement.style.setProperty('--font-scale', (typeof state.fontScale === 'number' && !isNaN(state.fontScale)) ? state.fontScale : 1);

  // Wire tutorial buttons (always, regardless of save state)
  document.getElementById('btn-tutorial-next').addEventListener('click', () => {
    playSound('click');
    const steps = getTutorialSteps();
    if (tutorialStep < steps.length - 1) {
      tutorialStep++;
      renderTutorialStep(tutorialStep);
    } else {
      closeTutorial();
    }
  });
  document.getElementById('btn-tutorial-skip').addEventListener('click', () => {
    playSound('click');
    closeTutorial();
  });
  document.getElementById('btn-tutorial-prev').addEventListener('click', () => {
    playSound('click');
    if (tutorialStep > 0) {
      tutorialStep--;
      renderTutorialStep(tutorialStep);
    }
  });

  if (hasSave && state.charName) {
    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    if (state.appMode === 'simple') {
      document.body.classList.add('mode-simple');
    }
    updateUI();
    if (!state.tutorialCompleted) {
      tutorialTimeoutId = setTimeout(startTutorial, 900);
    }
  } else {
    const introContainer = document.getElementById('onboarding-intro');
    if (introContainer && !introContainer.querySelector('.mode-selection-cards')) {
      const loaderFill = document.getElementById('intro-loader-fill');
      loaderFill.classList.add('animate');
      
      const statusTexts = [
        "[ SINAL SINÁPTICO ESTÁVEL... ]",
        "[ CONECTANDO NEURO-RECEPTORES... ]",
        "[ RECRUTA DETECTADO... ]",
        "[ ANALISANDO NÍVEL DE SHAPE... ]",
        "[ LIMPANDO STATUS DE FRANGO... ]",
        "[ INJETANDO ENERGIA MUTANTE... 100% ]"
      ];
      const statusEl = document.getElementById('intro-loader-status');
      if (statusEl) {
        let cycleIdx = 0;
        statusEl.innerText = statusTexts[0];
        const cycleInterval = setInterval(() => {
          cycleIdx++;
          if (cycleIdx < statusTexts.length) {
            statusEl.innerText = statusTexts[cycleIdx];
          } else {
            clearInterval(cycleInterval);
          }
        }, 350);
      }
      
      setTimeout(() => {
        const btnStart = document.getElementById('btn-start-neural');
        if (btnStart) btnStart.classList.remove('hidden');
      }, 2200);
    }
  }

  // MODE SELECTION
  const modeCards = document.querySelectorAll('.mode-card');
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      const mode = card.getAttribute('data-mode');
      if (mode === 'simple') {
        state.appMode = 'simple';
        state.simpleModeSeen = true;
      } else {
        state.appMode = 'rpg';
        state.simpleModeSeen = true;
      }
      saveState();
      startOnboardingForMode(mode);
    });
  });

  function startOnboardingForMode(mode) {
    const introEl = document.getElementById('onboarding-intro');
    const wizardEl = document.getElementById('onboarding-wizard');
    const flashOverlay = document.getElementById('glitch-flash-overlay');

    if (flashOverlay) {
      flashOverlay.classList.add('flash-active');
      setTimeout(() => {
        flashOverlay.classList.remove('flash-active');
        revealWizard(mode);
      }, 300);
    } else {
      revealWizard(mode);
    }

    function revealWizard(mode) {
      const introEl = document.getElementById('onboarding-intro');
      const rpgWizard = document.getElementById('onboarding-wizard');
      const simpleWizard = document.getElementById('simple-onboarding-wizard');
      
      if (introEl) introEl.classList.add('hidden');
      if (rpgWizard) rpgWizard.classList.add('hidden');
      if (simpleWizard) simpleWizard.classList.add('hidden');
      
      document.body.classList.add(`mode-${mode}`);

      if (mode === 'simple') {
        if (simpleWizard) simpleWizard.classList.remove('hidden');
        simpleCurrentStepIdx = 0;
        updateSimpleWizardStep();
      } else {
        if (rpgWizard) rpgWizard.classList.remove('hidden');
        currentStepIdx = 0;
        updateWizardStep();
      }
    }
  }

  // ==========================================
  // SIMPLE MODE WIZARD
  // ==========================================
  const simpleSteps = ['s1', 's2', 's3', 's4', 's5', 's6'];
  let simpleCurrentStepIdx = 0;
  let simpleDays = ['Seg', 'Ter', 'Qui', 'Sex'];
  let simpleHeight = 170;
  let simpleWeight = 70;
  let simpleTargetWeight = 70;

  function updateSimpleWizardStep() {
    const stepId = simpleSteps[simpleCurrentStepIdx];
    document.querySelectorAll('#simple-onboarding-wizard .onboarding-step').forEach(div => {
      div.classList.toggle('active', div.getAttribute('data-step') === stepId);
    });
    const progressPct = (simpleCurrentStepIdx / (simpleSteps.length - 1)) * 100;
    const progressFill = document.getElementById('simple-progress-fill');
    if (progressFill) progressFill.style.width = `${progressPct}%`;

    const backBtn = document.getElementById('simple-wiz-btn-back');
    if (backBtn) backBtn.style.visibility = simpleCurrentStepIdx === 0 ? 'hidden' : 'visible';
  }

  function simpleWizNext() {
    const stepId = simpleSteps[simpleCurrentStepIdx];
    if (stepId === 's1') {
      const nameVal = document.getElementById('simple-wiz-name').value.trim();
      if (!nameVal) {
        const toast = document.getElementById('overload-notification');
        const message = document.getElementById('overload-msg');
        if (toast && message) {
          message.innerText = 'Informe um nome para continuar.';
          toast.classList.remove('hidden');
          setTimeout(() => toast.classList.add('hidden'), 3000);
        }
        return;
      }
    }
    if (simpleCurrentStepIdx < simpleSteps.length - 1) {
      simpleCurrentStepIdx++;
      updateSimpleWizardStep();
    } else {
      concludeSimpleOnboarding();
    }
  }

  function simpleWizBack() {
    if (simpleCurrentStepIdx > 0) {
      simpleCurrentStepIdx--;
      updateSimpleWizardStep();
    }
  }

  function concludeSimpleOnboarding() {
    const nameEl = document.getElementById('simple-wiz-name');
    const nameVal = nameEl ? nameEl.value.trim() : '';
    const activeSex = document.querySelector('#simple-onboarding-wizard [data-step="s2"] .option-select-card.active');
    const activeGoal = document.querySelector('#simple-onboarding-wizard [data-step="s3"] .option-select-card.active');
    const activeActivity = document.querySelector('#simple-onboarding-wizard [data-step="s4"] .option-select-card.active');

    userProfile.name = nameVal || 'Usuário';
    userProfile.sex = activeSex ? activeSex.getAttribute('data-value') : 'masculino';
    userProfile.mainObjective = activeGoal ? activeGoal.getAttribute('data-value') : 'manter';
    userProfile.activityLevel = activeActivity ? activeActivity.getAttribute('data-value') : 'pouco';
    userProfile.height = simpleHeight;
    userProfile.currentWeight = simpleWeight;
    userProfile.targetWeight = simpleTargetWeight;
    userProfile.age = 25;
    userProfile.jointPain = ['Nenhum'];
    userProfile.trainingDays = simpleDays.length ? simpleDays : ['Seg', 'Ter', 'Qui', 'Sex'];
    userProfile.weeklyDaysGoal = userProfile.trainingDays.length;
    userProfile.notificationsEnabled = document.getElementById('simple-wiz-notif-enable') ? document.getElementById('simple-wiz-notif-enable').checked : true;
    userProfile.notificationTime = document.getElementById('simple-wiz-notif-time') ? document.getElementById('simple-wiz-notif-time').value : '18:00';
    userProfile.attributes = { FOR: 10, RES: 10, AGI: 10, VIG: 10, FOC: 10 };
    userProfile.experienceLevel = 'rato';
    userProfile.focusArea = 'FullBody';
    userProfile.motivation = 'saude';
    userProfile.class = 'bodybuilder';
    userProfile.profilePic = '';

    localStorage.setItem('freaky_quest_user', JSON.stringify(userProfile));

    state.charName = userProfile.name;
    state.charClass = userProfile.class;
    state.charWeight = userProfile.currentWeight;
    state.charHeight = userProfile.height;
    state.charAge = userProfile.age || 25;
    state.charGoal = userProfile.mainObjective;
    state.charFreq = userProfile.activityLevel;
    state.charExp = userProfile.experienceLevel;
    state.charGender = userProfile.sex;
    state.motivation = userProfile.motivation;
    state.focusMuscle = userProfile.focusArea;
    state.injury = userProfile.jointPain;
    state.profilePic = userProfile.profilePic || '';
    state.trainingDays = userProfile.trainingDays || ['Seg', 'Ter', 'Qui', 'Sex'];
    state.weeklyTrainGoal = state.trainingDays.length;
    state.useCustomWorkout = true;
    state.notificationEnabled = userProfile.notificationsEnabled;
    state.notificationTime = userProfile.notificationTime;
    state.level = 1;
    state.xp = 0;
    state.xpNeeded = 100;
    state.workoutsCompleted = 0;
    state.waterIntake = 0;
    state.waterTargetManual = false;
    state.unlockedTrophies = [];
    state.showcaseTrophies = [];
    state.activeMentor = 'rocklee';
    state.mealLogs = [];
    state.personalRecords = {};
    state.attributes = { for: 10, res: 10, agi: 10, vig: 10, foc: 10 };
    state.mentorLevels = { bebezinho: 1, rocklee: 1, goku: 1, arnold: 1, ramondino: 1, brolyz: 1, saitama: 1, nickwalker: 1, jin: 1, namjoon: 1 };
    state.mentorXP = { bebezinho: 0, rocklee: 0, goku: 0, arnold: 0, ramondino: 0, brolyz: 0, saitama: 0, nickwalker: 0, jin: 0, namjoon: 0 };
    state.mentorXPNeeded = 100;
    state.unlockedItems = [];
    state.appMode = 'simple';

    recalculateMacrosTargets();
    updateWaterTargetFromWeight();
    generateDailyQuests();
    saveState();

    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.body.classList.add('mode-simple');
    updateUI();
    setTimeout(() => { if (!state.tutorialCompleted) tutorialTimeoutId = setTimeout(startTutorial, 2200); }, 2200);
  }

  document.getElementById('simple-wiz-btn-next').addEventListener('click', () => {
    playSound('click');
    simpleWizNext();
  });
  document.getElementById('simple-wiz-btn-back').addEventListener('click', () => {
    playSound('click');
    simpleWizBack();
  });

  document.querySelectorAll('#simple-onboarding-wizard [data-step="s2"] .option-select-card').forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('#simple-onboarding-wizard [data-step="s2"] .option-select-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      setTimeout(() => simpleWizNext(), 250);
    });
  });
  document.querySelectorAll('#simple-onboarding-wizard [data-step="s3"] .option-select-card').forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('#simple-onboarding-wizard [data-step="s3"] .option-select-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      setTimeout(() => simpleWizNext(), 250);
    });
  });
  document.querySelectorAll('#simple-onboarding-wizard [data-step="s4"] .option-select-card').forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      document.querySelectorAll('#simple-onboarding-wizard [data-step="s4"] .option-select-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      setTimeout(() => simpleWizNext(), 250);
    });
  });

  const simpleDayBtns = document.querySelectorAll('.simple-day-btn');
  simpleDayBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const day = btn.getAttribute('data-day');
      const idx = simpleDays.indexOf(day);
      if (idx > -1) {
        simpleDays.splice(idx, 1);
        btn.classList.remove('active');
      } else {
        simpleDays.push(day);
        btn.classList.add('active');
      }
    });
  });

  function setupSimpleSlider(sliderId, displayId, btnDecId, btnIncId, step, decimals) {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    const dec = document.getElementById(btnDecId);
    const inc = document.getElementById(btnIncId);
    if (!slider || !display) return;
    const update = () => {
      const val = parseFloat(slider.value);
      display.innerText = decimals ? (val / 10).toFixed(1) : val;
      if (sliderId === 'simple-slider-height') simpleHeight = parseInt(slider.value, 10);
      if (sliderId === 'simple-slider-weight') simpleWeight = parseFloat((val / 10).toFixed(1));
      if (sliderId === 'simple-slider-tweight') simpleTargetWeight = parseFloat((val / 10).toFixed(1));
    };
    slider.addEventListener('input', update);
    if (dec) dec.addEventListener('click', () => { playSound('click'); slider.value = Math.max(parseFloat(slider.min), parseFloat(slider.value) - step); update(); });
    if (inc) inc.addEventListener('click', () => { playSound('click'); slider.value = Math.min(parseFloat(slider.max), parseFloat(slider.value) + step); update(); });
    update();
  }
  setupSimpleSlider('simple-slider-height', 'simple-display-height', 'simple-btn-dec-height', 'simple-btn-inc-height', 1, false);
  setupSimpleSlider('simple-slider-weight', 'simple-display-weight', 'simple-btn-dec-weight', 'simple-btn-inc-weight', 5, true);
  setupSimpleSlider('simple-slider-tweight', 'simple-display-tweight', 'simple-btn-dec-tweight', 'simple-btn-inc-tweight', 5, true);

  // Settings tab wiring
  const settingsSaveBtn = document.getElementById('settings-save-btn');
  if (settingsSaveBtn) {
    settingsSaveBtn.addEventListener('click', () => {
      playSound('click');
      const nameEl = document.getElementById('settings-char-name');
      const newName = nameEl ? nameEl.value.trim() : '';
      if (newName) {
        state.charName = newName;
        userProfile.name = newName;
      }
      const weight = parseFloat(document.getElementById('settings-weight').value);
      const height = parseFloat(document.getElementById('settings-height').value);
      const goal = document.getElementById('settings-goal').value;
      const weeklyDays = parseInt(document.getElementById('settings-weekly-days').value, 10);
      const notifEnable = document.getElementById('settings-notif-enable').checked;
      const notifTime = document.getElementById('settings-notif-time').value;
      const selectedMode = document.getElementById('settings-app-mode').value;
      const toneEl = document.getElementById('settings-message-tone');
      if (toneEl && MESSAGE_TONES[toneEl.value]) state.messageTone = toneEl.value;
      const dietCheckEl = document.getElementById('settings-diet-enable');
      const dietEnable = dietCheckEl ? dietCheckEl.checked : true;
      // Campos que vieram do antigo modal "Editar Perfil & Metas"
      const targetWeight = parseFloat(document.getElementById('settings-target-weight').value);
      const injuryVal = document.getElementById('settings-injury').value || 'Nenhum';
      const fontSel = document.getElementById('settings-font-size');
      const restEnable = document.getElementById('settings-rest-enable').checked;
      let baseRestTimeVal = parseInt(document.getElementById('settings-rest-time').value, 10) || 90;
      if (baseRestTimeVal > 99) baseRestTimeVal = 99;

      if (!isNaN(weight) && weight > 0) {
        userProfile.currentWeight = weight;
        state.charWeight = weight;
      }
      if (!isNaN(height) && height > 0) {
        userProfile.height = height;
        state.charHeight = height;
      }
      if (!isNaN(targetWeight) && targetWeight > 0) {
        state.targetWeight = targetWeight;
        userProfile.targetWeight = targetWeight;
      }
      userProfile.mainObjective = goal;
      state.charGoal = goal;
      if (!isNaN(weeklyDays) && weeklyDays > 0) {
        state.weeklyTrainGoal = weeklyDays;
        userProfile.weeklyDaysGoal = weeklyDays;
      }
      userProfile.trainingDays = state.trainingDays;
      state.notificationEnabled = notifEnable;
      state.notificationTime = notifTime;
      state.injury = [injuryVal];
      userProfile.jointPain = state.injury;
      state.restTimerEnabled = restEnable;
      state.baseRestTime = baseRestTimeVal;
      userProfile.restTimerEnabled = restEnable;
      userProfile.baseRestTime = baseRestTimeVal;
      if (fontSel) {
        const fs = parseFloat(fontSel.value) || 1;
        state.fontScale = fs;
        document.documentElement.style.setProperty('--font-scale', fs);
      }
      if (state.notificationEnabled && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
      if (!state.waterTargetManual) updateWaterTargetFromWeight();

      // Se a dieta foi ligada/desligada agora, as quests de hoje (geradas na
      // virada do dia, antes dessa mudança) ainda tem a missão de proteína/
      // volume do estado ANTIGO. Sem regenerar, o usuário via a missão de
      // comida mesmo com "Rastrear dieta" desligado. Preserva o progresso das
      // quests que não mudam (água, treino) ao regenerar.
      const dietSettingChanged = dietEnable !== (state.dietTrackingEnabled !== false);
      state.dietTrackingEnabled = dietEnable;
      if (dietSettingChanged) {
        const oldQuests = state.dailyQuests || [];
        generateDailyQuests();
        state.dailyQuests.forEach(q => {
          const old = oldQuests.find(o => o.id === q.id);
          if (old) q.completed = old.completed;
        });
      }

      const modeChanged = selectedMode !== state.appMode;
      state.appMode = selectedMode;
      state.simpleModeSeen = true;

      localStorage.setItem('freaky_quest_user', JSON.stringify(userProfile));
      saveState();
      recalculateMacrosTargets();
      updateUI();

      if (modeChanged) {
        alert(`Modo alterado para ${selectedMode === 'simple' ? 'Simples' : 'RPG'}. A mudança será aplicada no próximo acesso.`);
      } else {
        alert('Ajustes salvos!');
      }
    });
  }

  const settingsResetBtn = document.getElementById('settings-reset-progress');
  if (settingsResetBtn) {
    settingsResetBtn.addEventListener('click', async () => {
      playSound('click');
      const ok = await confirmAndResetProgress();
      if (ok) {
        _isResetting = true; // impede que pagehide/beforeunload re-salvem o estado antigo antes do reload
        localStorage.removeItem('freakyquest_state_v2');
        localStorage.removeItem('freaky_quest_user');
        location.reload();
      }
    });
  }

  const deleteCloudBtn = document.getElementById('account-delete-cloud-data');
  if (deleteCloudBtn) {
    deleteCloudBtn.addEventListener('click', async () => {
      playSound('click');
      if (!cloudUser) return;
      if (confirm(`Apagar o progresso salvo na nuvem pra ${cloudUser.email}? Isso não afeta o que está salvo só neste aparelho.`)) {
        await deleteCloudData();
        alert('Dados da nuvem apagados. Você foi desconectado.');
      }
    });
  }

  // WIZARD CONFIG AND STEP DEFINITION
  const steps = ['1', '2', '3', '4', '5', '6', '7', '8', '8b', '9a', '9b', '9c', '10', '11'];
  let currentStepIdx = 0;

  // Option selection handlers
  const optionContainers = [
    { step: '2', selector: '[data-step="2"] .option-select-card', field: 'sex' },
    { step: '3', selector: '[data-step="3"] .option-select-card', field: 'mainObjective' },
    { step: '4', selector: '[data-step="4"] .option-select-card', field: 'motivation' },
    { step: '6', selector: '[data-step="6"] .option-select-card', field: 'class' },
    { step: '7', selector: '[data-step="7"] .option-select-card', field: 'experienceLevel' },
    { step: '8', selector: '[data-step="8"] .option-select-card', field: 'activityLevel' }
  ];

  // Name listener
  document.getElementById('wiz-name').addEventListener('input', (e) => {
    userProfile.name = e.target.value.trim();
  });

  // RPG Class Initial Attributes Map
  const CLASS_BASE_STATS = {
    bodybuilder: { FOR: 12, RES: 10, AGI: 9, VIG: 11, FOC: 10 },
    powerlifter: { FOR: 15, RES: 9, AGI: 7, VIG: 12, FOC: 9 },
    calistenia: { FOR: 10, RES: 11, AGI: 13, VIG: 9, FOC: 9 },
    maratonista: { FOR: 8, RES: 15, AGI: 10, VIG: 11, FOC: 8 }
  };

  // Default starting attributes for bodybuilder (since bodybuilder card is active by default in HTML)
  let wizAttrPool = 8;
  const wizAttrValues = { FOR: 12, RES: 10, AGI: 9, VIG: 11, FOC: 10 };
  userProfile.class = 'bodybuilder';
  userProfile.attributes = { ...wizAttrValues };

  function updateWizAttrDisplay() {
    const poolEl = document.getElementById('wiz-attr-pool-val');
    if (poolEl) poolEl.innerText = wizAttrPool;
    
    Object.keys(wizAttrValues).forEach(attr => {
      const valEl = document.getElementById(`wiz-val-${attr}`);
      if (valEl) valEl.innerText = wizAttrValues[attr];
    });
  }

  function updateClassPreview(className) {
    const previewEl = document.getElementById('class-preview-stats');
    if (!previewEl) return;
    
    const stats = {
      bodybuilder: { title: "Foco: Hipertrofia & Pump", desc: "Equilibrado para ganho de massa muscular com bom volume e pump insano.", attributes: "✊ FOR: 12  ·  🫁 RES: 10  ·  ⚡ AGI: 9  ·  ❤️ VIG: 11  ·  🎯 FOC: 10" },
      powerlifter: { title: "Foco: Força Bruta", desc: "Especialista em erguer cargas extremas nos três levantamentos competitivos (Supino, Agachamento, Terra).", attributes: "✊ FOR: 15  ·  🫁 RES: 9  ·  ⚡ AGI: 7  ·  ❤️ VIG: 12  ·  🎯 FOC: 9" },
      calistenia: { title: "Foco: Controle Corporal", desc: "Domínio total do próprio peso contra a gravidade em barras, paralelas e posições estáticas.", attributes: "✊ FOR: 10  ·  🫁 RES: 11  ·  ⚡ AGI: 13  ·  ❤️ VIG: 9  ·  🎯 FOC: 9" },
      maratonista: { title: "Foco: Endurance & Fôlego", desc: "Resistência cardiovascular infinita para longas distâncias, corrida e treinos de alta duração.", attributes: "✊ FOR: 8  ·  🫁 RES: 15  ·  ⚡ AGI: 10  ·  ❤️ VIG: 11  ·  🎯 FOC: 8" }
    };
    
    const current = stats[className];
    if (!current) return;
    
    previewEl.innerHTML = `
      <strong style="color: var(--color-primary); font-size: 0.82rem; font-family: var(--font-display);">${current.title}</strong>
      <p style="color: var(--text-secondary); margin: 3px 0; line-height: 1.3;">${current.desc}</p>
      <span style="font-weight: 800; color: var(--color-accent); font-family: var(--font-display); margin-top: 2px;">Atributos Iniciais: ${current.attributes}</span>
    `;
  }

  // Initialize class preview content
  updateClassPreview('bodybuilder');

  // Set up option click listeners with auto-advance for fluid UX
  optionContainers.forEach(opt => {
    const cards = document.querySelectorAll(opt.selector);
    cards.forEach(card => {
      card.addEventListener('click', () => {
        // Trigger neon border flash animation
        card.classList.add('neon-card-flash');
        setTimeout(() => card.classList.remove('neon-card-flash'), 400);

        playSound('click');
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const val = card.getAttribute('data-value');
        userProfile[opt.field] = val;

        // Custom action for class step: update attributes
        if (opt.field === 'class') {
          const bases = CLASS_BASE_STATS[val];
          Object.keys(bases).forEach(attr => {
            wizAttrValues[attr] = bases[attr];
            userProfile.attributes = userProfile.attributes || {};
            userProfile.attributes[attr] = bases[attr];
          });
          wizAttrPool = 8;
          updateWizAttrDisplay();
          updateClassPreview(val);
        }
        
        // Auto advance except for attributes page (which is step 7 now)
        if (opt.step !== '7' || val === 'rato' || val === 'novico' || val === 'oldschool') {
          setTimeout(() => {
            wizNext();
          }, 250);
        }
      });
    });
  });

  // Acessibilidade de teclado: cards de seleção do onboarding (RPG e Simples)
  // eram <div> só com onclick, sem role/tabindex nem resposta a Enter/Espaço.
  document.querySelectorAll('.option-select-card').forEach(card => {
    if (!card.hasAttribute('role')) card.setAttribute('role', 'button');
    if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Custom Step 5: Multi-select Focus Area with Cybernetic SVG map sync
  const step5Cards = document.querySelectorAll('[data-step="5"] .option-select-card');
  const svgMuscleGroups = document.querySelectorAll('#body-focus-svg .muscle-group');
  const activeFocusMuscles = new Set(['FullBody', 'Ombros', 'Braços', 'Peito', 'Abdômen', 'Costas', 'Glúteos', 'Pernas']);

  // Sync userProfile.focusArea initially since all are selected by default
  userProfile.focusArea = Array.from(activeFocusMuscles).join(',');

  function updateStep5Selection() {
    // 1. Sync list cards
    step5Cards.forEach(card => {
      const val = card.getAttribute('data-value');
      if (activeFocusMuscles.has(val)) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // 2. Sync SVG muscle paths
    svgMuscleGroups.forEach(path => {
      const muscle = path.getAttribute('data-muscle');
      if (activeFocusMuscles.has('FullBody') || activeFocusMuscles.has(muscle)) {
        path.classList.add('active');
      } else {
        path.classList.remove('active');
      }
    });

    // 3. Update profile focusArea
    userProfile.focusArea = Array.from(activeFocusMuscles).join(',');
  }

  // Card click event listeners
  step5Cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.add('neon-card-flash');
      setTimeout(() => card.classList.remove('neon-card-flash'), 400);
      playSound('click');

      const val = card.getAttribute('data-value');
      if (val === 'FullBody') {
        const isCurrentlyActive = activeFocusMuscles.has('FullBody');
        if (isCurrentlyActive) {
          activeFocusMuscles.clear();
        } else {
          step5Cards.forEach(c => {
            activeFocusMuscles.add(c.getAttribute('data-value'));
          });
        }
      } else {
        if (activeFocusMuscles.has(val)) {
          activeFocusMuscles.delete(val);
          activeFocusMuscles.delete('FullBody');
        } else {
          activeFocusMuscles.add(val);
          // Check if all individual muscles are selected to auto-enable FullBody
          const individualMuscles = Array.from(step5Cards)
            .map(c => c.getAttribute('data-value'))
            .filter(v => v !== 'FullBody');
          const allActive = individualMuscles.every(v => activeFocusMuscles.has(v));
          if (allActive) {
            activeFocusMuscles.add('FullBody');
          }
        }
      }
      updateStep5Selection();
    });
  });

  // SVG muscle click event listeners
  svgMuscleGroups.forEach(path => {
    path.addEventListener('click', () => {
      const muscle = path.getAttribute('data-muscle');
      playSound('click');

      // Flash corresponding card
      const card = document.querySelector(`[data-step="5"] .option-select-card[data-value="${muscle}"]`);
      if (card) {
        card.classList.add('neon-card-flash');
        setTimeout(() => card.classList.remove('neon-card-flash'), 400);
      }

      if (activeFocusMuscles.has(muscle)) {
        activeFocusMuscles.delete(muscle);
        activeFocusMuscles.delete('FullBody');
      } else {
        activeFocusMuscles.add(muscle);
        // Check if all individual muscles are selected
        const individualMuscles = Array.from(step5Cards)
          .map(c => c.getAttribute('data-value'))
          .filter(v => v !== 'FullBody');
        const allActive = individualMuscles.every(v => activeFocusMuscles.has(v));
        if (allActive) {
          activeFocusMuscles.add('FullBody');
        }
      }
      updateStep5Selection();
    });
  });

  // Atributos Roller Click Handlers
  document.querySelectorAll('.btn-attr-roll-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const attr = btn.getAttribute('data-roll-attr');
      if (wizAttrPool > 0) {
        wizAttrPool--;
        wizAttrValues[attr]++;
        playSound('click');
        updateWizAttrDisplay();
        
        // Sync to userProfile
        userProfile.attributes = userProfile.attributes || {};
        userProfile.attributes[attr] = wizAttrValues[attr];
      }
    });
  });

  document.querySelectorAll('.btn-attr-roll-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const attr = btn.getAttribute('data-roll-attr');
      const selectedClass = userProfile.class || 'bodybuilder';
      const baseLimit = CLASS_BASE_STATS[selectedClass][attr];
      
      if (wizAttrValues[attr] > baseLimit) {
        wizAttrPool++;
        wizAttrValues[attr]--;
        playSound('click');
        updateWizAttrDisplay();
        
        // Sync to userProfile
        userProfile.attributes = userProfile.attributes || {};
        userProfile.attributes[attr] = wizAttrValues[attr];
      }
    });
  });

  updateWizAttrDisplay();

  // Multiple injury selection (Step 10) click listeners (NO auto-advance)
  const injuryCards = document.querySelectorAll('[data-step="10"] .option-select-card');
  injuryCards.forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      const val = card.getAttribute('data-value');
      
      if (!Array.isArray(userProfile.jointPain)) {
        userProfile.jointPain = [];
      }

      if (val === 'Nenhum') {
        userProfile.jointPain = ['Nenhum'];
      } else {
        userProfile.jointPain = userProfile.jointPain.filter(x => x !== 'Nenhum');
        const idx = userProfile.jointPain.indexOf(val);
        if (idx > -1) {
          userProfile.jointPain.splice(idx, 1);
        } else {
          userProfile.jointPain.push(val);
        }
        if (userProfile.jointPain.length === 0) {
          userProfile.jointPain.push('Nenhum');
        }
      }

      // Update active state visuals
      injuryCards.forEach(c => {
        const cVal = c.getAttribute('data-value');
        if (userProfile.jointPain.includes(cVal)) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    });
  });

  // Height Controls
  const heightSlider = document.getElementById('slider-height');
  const heightDisplay = document.getElementById('display-height');
  function updateHeightVal(val) {
    heightSlider.value = val;
    heightDisplay.innerText = val;
    userProfile.height = val;
  }
  heightSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    heightDisplay.innerText = val;
    userProfile.height = val;
  });
  document.getElementById('btn-dec-height').addEventListener('click', () => {
    playSound('click');
    const val = Math.max(120, parseInt(heightSlider.value) - 1);
    updateHeightVal(val);
  });
  document.getElementById('btn-inc-height').addEventListener('click', () => {
    playSound('click');
    const val = Math.min(220, parseInt(heightSlider.value) + 1);
    updateHeightVal(val);
  });

  // Age Controls
  const ageSlider = document.getElementById('slider-age');
  const ageDisplay = document.getElementById('display-age');
  function updateAgeVal(val) {
    ageSlider.value = val;
    ageDisplay.innerText = val;
    userProfile.age = val;
  }
  ageSlider.addEventListener('input', (e) => {
    const val = Math.max(7, Math.min(90, parseInt(e.target.value) || 7));
    ageDisplay.innerText = val;
    userProfile.age = val;
  });
  document.getElementById('btn-dec-age').addEventListener('click', () => {
    playSound('click');
    const val = Math.max(7, parseInt(ageSlider.value) - 1);
    updateAgeVal(val);
  });
  document.getElementById('btn-inc-age').addEventListener('click', () => {
    playSound('click');
    const val = Math.min(90, parseInt(ageSlider.value) + 1);
    updateAgeVal(val);
  });

  // Weight Controls
  const weightSlider = document.getElementById('slider-weight');
  const weightDisplay = document.getElementById('display-weight');
  function updateWeightVal(val) {
    weightSlider.value = val;
    const computedVal = parseFloat((val / 10).toFixed(1));
    weightDisplay.innerText = computedVal;
    userProfile.currentWeight = computedVal;
  }
  weightSlider.addEventListener('input', (e) => {
    const raw = Math.max(200, Math.min(2000, parseInt(e.target.value, 10) || 200));
    const computedVal = parseFloat((raw / 10).toFixed(1));
    weightDisplay.innerText = computedVal;
    userProfile.currentWeight = computedVal;
  });
  document.getElementById('btn-dec-weight').addEventListener('click', () => {
    playSound('click');
    const val = Math.max(200, parseInt(weightSlider.value) - 5);
    updateWeightVal(val);
  });
  document.getElementById('btn-inc-weight').addEventListener('click', () => {
    playSound('click');
    const val = Math.min(2000, parseInt(weightSlider.value) + 5);
    updateWeightVal(val);
  });

  // Target Weight Controls
  const tweightSlider = document.getElementById('slider-tweight');
  const tweightDisplay = document.getElementById('display-tweight');
  function updateTWeightVal(val) {
    tweightSlider.value = val;
    const computedVal = parseFloat((val / 10).toFixed(1));
    tweightDisplay.innerText = computedVal;
    userProfile.targetWeight = computedVal;
  }
  tweightSlider.addEventListener('input', (e) => {
    const val = parseFloat((e.target.value / 10).toFixed(1));
    tweightDisplay.innerText = val;
    userProfile.targetWeight = val;
  });
  document.getElementById('btn-dec-tweight').addEventListener('click', () => {
    playSound('click');
    const val = Math.max(400, parseInt(tweightSlider.value) - 5);
    updateTWeightVal(val);
  });
  document.getElementById('btn-inc-tweight').addEventListener('click', () => {
    playSound('click');
    const val = Math.min(1800, parseInt(tweightSlider.value) + 5);
    updateTWeightVal(val);
  });

  // Days Weekly Target Controls
  const daysDisplay = document.getElementById('display-days');
  userProfile.trainingDays = ['Seg', 'Ter', 'Qui', 'Sex'];
  userProfile.weeklyDaysGoal = 4;
  if (daysDisplay) daysDisplay.innerText = 4;

  const wizDayButtons = document.querySelectorAll('.wizard-days-selector .day-toggle-btn');
  wizDayButtons.forEach(btn => {
    const day = btn.getAttribute('data-day');
    // Sync initial state
    if (userProfile.trainingDays.includes(day)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      playSound('click');
      const dayVal = btn.getAttribute('data-day');
      if (userProfile.trainingDays.includes(dayVal)) {
        if (userProfile.trainingDays.length > 1) {
          userProfile.trainingDays = userProfile.trainingDays.filter(d => d !== dayVal);
          btn.classList.remove('active');
        }
      } else {
        userProfile.trainingDays.push(dayVal);
        btn.classList.add('active');
      }
      const order = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
      userProfile.trainingDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));

      userProfile.weeklyDaysGoal = userProfile.trainingDays.length;
      if (daysDisplay) daysDisplay.innerText = userProfile.trainingDays.length;
    });
  });

  // Notification time container hide/show
  const notifCheck = document.getElementById('wiz-notif-enable');
  const notifTimeContainer = document.getElementById('wiz-notif-time-container');
  notifCheck.addEventListener('change', () => {
    playSound('click');
    userProfile.notificationsEnabled = notifCheck.checked;
    if (notifCheck.checked) {
      notifTimeContainer.style.display = 'flex';
    } else {
      notifTimeContainer.style.display = 'none';
    }
  });

  const notifTimeInput = document.getElementById('wiz-notif-time');
  if (notifTimeInput) {
    notifTimeInput.addEventListener('input', (e) => {
      userProfile.notificationTime = e.target.value;
    });
  }

  // Navigation Logic
  function wizNext() {
    if (steps[currentStepIdx] === '1') {
      const nameVal = document.getElementById('wiz-name').value.trim();
      if (!nameVal) {
        const toast = document.getElementById('overload-notification');
        const message = document.getElementById('overload-msg');
        if (toast && message) {
          message.innerText = "Calma lá paizão! Você acha que eu tenho bola de cristal para adivinhar seu nick? 🔮";
          toast.classList.remove('hidden');
          setTimeout(() => {
            toast.classList.add('hidden');
          }, 5000);
        }
        return;
      }
    }

    if (currentStepIdx < steps.length - 1) {
      currentStepIdx++;
      updateWizardStep();
    } else {
      concluirShape();
    }
  }

  function wizBack() {
    if (currentStepIdx > 0) {
      currentStepIdx--;
      updateWizardStep();
    }
  }

  document.getElementById('wiz-btn-next').addEventListener('click', () => {
    playSound('click');
    wizNext();
  });
  document.getElementById('wiz-btn-back').addEventListener('click', () => {
    playSound('click');
    wizBack();
  });

  function renderWizSummary() {
    const summaryCard = document.getElementById('wiz-summary-card');
    if (!summaryCard) return;

    const name = userProfile.name || 'Recruta Sem Nome';
    const cls = userProfile.class || 'bodybuilder';
    const focus = userProfile.focusArea || 'FullBody';
    const motivation = userProfile.motivation || 'saude';

    let adjective = "Determinado";
    if (motivation === 'aura') adjective = "Exalador de Aura";
    else if (motivation === 'estresse') adjective = "Indestrutível";
    else if (motivation === 'filosofico') adjective = "Sábio";
    else if (motivation === 'moral') adjective = "Fiel";
    else if (motivation === 'peso') adjective = "Definido";

    let suffix = "do Ginásio";
  if (focus.includes('FullBody')) {
    suffix = "do Ginásio";
  } else if (focus.includes(',')) {
    const parts = focus.split(',').map(s => s.trim());
    const formatted = parts.slice(0, 2).map(p => {
      if (p === 'Peito') return 'Supino';
      if (p === 'Costas') return 'Asas';
      if (p === 'Ombros') return 'Ombros';
      if (p === 'Braços') return 'Braços';
      if (p === 'Pernas') return 'Pernas';
      if (p === 'Abdômen') return 'Abdômen';
      if (p === 'Glúteos') return 'Glúteos';
      return p;
    }).join(' & ');
    suffix = `do Foco em ${formatted}`;
  } else if (focus === 'Peito') suffix = "do Supino";
  else if (focus === 'Costas') suffix = "das Asas Gigantes";
  else if (focus === 'Ombros') suffix = "dos Ombros de Aço";
  else if (focus === 'Braços') suffix = "dos Bíceps Mutantes";
  else if (focus === 'Pernas') suffix = "do Agachamento Monstro";
  else if (focus === 'Abdômen') suffix = "do Core Blindado";
  else if (focus === 'Glúteos') suffix = "dos Glúteos de Ferro";

    const classNames = {
      bodybuilder: 'Bodybuilder',
      powerlifter: 'Powerlifter',
      calistenia: 'Guerreiro Calistênico',
      maratonista: 'Velocista Maratonista'
    };

    const finalTitle = `${adjective} ${classNames[cls]} ${suffix}`;
    const weight = userProfile.currentWeight || 75;
    const height = userProfile.height || 170;
    const targetW = userProfile.targetWeight || 75;

    summaryCard.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
          <h3 style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 800; color: var(--color-primary);">🎴 Carta do Caçador</h3>
          <span style="font-size: 0.65rem; color: var(--color-accent); font-weight: bold; background: rgba(0,0,0,0.4); padding: 2px 6px; border-radius: 4px;">Lvl 1</span>
        </div>
        <div style="font-family: var(--font-display); font-size: 0.85rem; font-weight: 900; color: #fff; margin-bottom: 2px;">
          ${name}
        </div>
        <div style="font-size: 0.68rem; font-style: italic; color: #ffb703; margin-top: -6px; margin-bottom: 4px;">
          "${finalTitle}"
        </div>
        <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 4px 8px; font-size: 0.65rem; color: var(--text-secondary);">
          <div>📏 Altura: <strong>${height} cm</strong></div>
          <div>🎂 Idade: <strong>${userProfile.age || 25} anos</strong></div>
          <div>⚖️ Peso Inicial: <strong>${weight} kg</strong></div>
          <div>🎯 Meta: <strong>${targetW} kg</strong></div>
          <div>🏋️‍♂️ Freq: <strong>${userProfile.trainingDays ? userProfile.trainingDays.length : 4}x/semana</strong></div>
        </div>
        <div style="margin-top: 4px; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 6px;">
          <span style="font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 2px;">Atributos Iniciais:</span>
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; color: var(--color-primary); background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px;">
            <span>FOR: ${wizAttrValues.FOR}</span>
            <span>RES: ${wizAttrValues.RES}</span>
            <span>AGI: ${wizAttrValues.AGI}</span>
            <span>VIG: ${wizAttrValues.VIG}</span>
            <span>FOC: ${wizAttrValues.FOC}</span>
          </div>
        </div>
      </div>
    `;
  }

  function updateWizardStep() {
    const stepId = steps[currentStepIdx];
    const stepsDivs = document.querySelectorAll('.onboarding-step');
    
    stepsDivs.forEach(div => {
      if (div.getAttribute('data-step') === stepId) {
        div.classList.add('active');
      } else {
        div.classList.remove('active');
      }
    });

    // Update progress bar
    const progressPercent = (currentStepIdx / (steps.length - 1)) * 100;
    document.getElementById('onboarding-progress-fill').style.width = `${progressPercent}%`;

    // Toggle Back button visibility
    const btnBack = document.getElementById('wiz-btn-back');
    if (currentStepIdx === 0) {
      btnBack.style.visibility = 'hidden';
    } else {
      btnBack.style.visibility = 'visible';
    }

    // Toggle Forward button text
    const btnNext = document.getElementById('wiz-btn-next');
    if (currentStepIdx === steps.length - 1) {
      btnNext.innerText = 'CONCLUIR SHAPE 😈';
    } else {
      btnNext.innerText = 'AVANÇAR';
    }

    // Show/Hide summary card at final step
    if (stepId === '11') {
      renderWizSummary();
      const summaryCard = document.getElementById('wiz-summary-card');
      if (summaryCard) summaryCard.classList.remove('hidden');
    } else {
      const summaryCard = document.getElementById('wiz-summary-card');
      if (summaryCard) summaryCard.classList.add('hidden');
    }
  }

  function concluirShape() {
    const nameVal = document.getElementById('wiz-name').value.trim();
    if (!nameVal) {
      const toast = document.getElementById('overload-notification');
      const message = document.getElementById('overload-msg');
      if (toast && message) {
        message.innerText = "Calma lá paizão! Você acha que eu tenho bola de cristal para adivinhar seu nick? 🔮";
        toast.classList.remove('hidden');
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 5000);
      }
      return;
    }

    playSound('levelup');

    userProfile.name = nameVal;
    
    const activeGender = document.querySelector('[data-step="2"] .option-select-card.active');
    userProfile.sex = activeGender ? activeGender.getAttribute('data-value') : 'masculino';

    const activeGoal = document.querySelector('[data-step="3"] .option-select-card.active');
    userProfile.mainObjective = activeGoal ? activeGoal.getAttribute('data-value') : 'engordar';

    const activeMotivation = document.querySelector('[data-step="4"] .option-select-card.active');
    userProfile.motivation = activeMotivation ? activeMotivation.getAttribute('data-value') : 'saude';

    const activeFocusCards = document.querySelectorAll('[data-step="5"] .option-select-card.active');
    const selectedFocus = Array.from(activeFocusCards).map(c => c.getAttribute('data-value'));
    userProfile.focusArea = selectedFocus.join(',') || 'FullBody';

    const activeClass = document.querySelector('[data-step="6"] .option-select-card.active');
    userProfile.class = activeClass ? activeClass.getAttribute('data-value') : 'bodybuilder';

    const activeExp = document.querySelector('[data-step="7"] .option-select-card.active');
    userProfile.experienceLevel = activeExp ? activeExp.getAttribute('data-value') : 'rato';

    const activeFreq = document.querySelector('[data-step="8"] .option-select-card.active');
    userProfile.activityLevel = activeFreq ? activeFreq.getAttribute('data-value') : 'pouco';

    userProfile.height = parseInt(document.getElementById('display-height').innerText) || 170;
    userProfile.currentWeight = parseFloat(document.getElementById('display-weight').innerText) || 70;
    userProfile.targetWeight = parseFloat(document.getElementById('display-tweight').innerText) || 70;
    userProfile.age = parseInt(document.getElementById('display-age').innerText) || 25;

    if (!userProfile.jointPain || userProfile.jointPain.length === 0) {
      userProfile.jointPain = ['Nenhum'];
    }

    userProfile.weeklyDaysGoal = userProfile.trainingDays ? userProfile.trainingDays.length : 4;
    userProfile.notificationsEnabled = notifCheck.checked;
    userProfile.notificationTime = document.getElementById('wiz-notif-time').value || '18:00';

    userProfile.attributes = {
      FOR: wizAttrValues.FOR,
      RES: wizAttrValues.RES,
      AGI: wizAttrValues.AGI,
      VIG: wizAttrValues.VIG,
      FOC: wizAttrValues.FOC
    };

    localStorage.setItem('freaky_quest_user', JSON.stringify(userProfile));

    // Synchronize to the core state engine
    state.charName = userProfile.name;
    state.charClass = userProfile.class;
    state.charWeight = userProfile.currentWeight;
    state.charHeight = userProfile.height;
    state.charAge = userProfile.age || 25;
    state.charGoal = userProfile.mainObjective;
    state.charFreq = userProfile.activityLevel;
    state.charExp = userProfile.experienceLevel;
    state.charGender = userProfile.sex;
    state.motivation = userProfile.motivation;
    state.focusMuscle = userProfile.focusArea;
    state.injury = userProfile.jointPain;
    state.profilePic = userProfile.profilePic || '';
    state.trainingDays = userProfile.trainingDays || ['Seg', 'Ter', 'Qui', 'Sex'];
    state.weeklyTrainGoal = state.trainingDays.length;
    state.useCustomWorkout = false;
    state.notificationEnabled = userProfile.notificationsEnabled;
    state.notificationTime = userProfile.notificationTime;

    state.level = 1;
    state.xp = 0;
    state.xpNeeded = 100;
    state.workoutsCompleted = 0;
    state.waterIntake = 0;
    state.waterTargetManual = false;
    state.unlockedTrophies = [];
    state.showcaseTrophies = [];
    state.activeMentor = 'rocklee';
    state.mealLogs = [];
    state.personalRecords = {};

    state.attributes = {
      for: userProfile.attributes.FOR,
      res: userProfile.attributes.RES,
      agi: userProfile.attributes.AGI,
      vig: userProfile.attributes.VIG,
      foc: userProfile.attributes.FOC
    };
    // Pontos de atributo que sobraram na alocação inicial ficam guardados
    // pra alocar depois em Status, em vez de somem no ar.
    state.attrPoints = wizAttrPool > 0 ? wizAttrPool : 0;

    recalculateMacrosTargets();
    updateWaterTargetFromWeight();
    generateDailyQuests();

    if (state.notificationEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }

    saveState();

    document.getElementById('screen-onboarding').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');

    const starterMentor = OFFICIAL_MENTORS.find(m => m.id === state.activeMentor);
    if (starterMentor) triggerNeuralFlash(starterMentor);

    updateUI();
    if (!state.tutorialCompleted) {
      tutorialTimeoutId = setTimeout(startTutorial, 2200);
    }
  }

  // Onboarding Class Cards choice clickers
  const classCards = document.querySelectorAll('.class-card');
  classCards.forEach(card => {
    card.addEventListener('click', () => {
      playSound('click');
      classCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // SPA navigation switcher
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Mostra a descrição do tom escolhido + uma amostra real da fala,
  // pra pessoa entender a diferença antes de salvar.
  function renderToneHint(toneId) {
    const meta = MESSAGE_TONES[toneId];
    const descEl = document.getElementById('settings-message-tone-desc');
    const sampleEl = document.getElementById('settings-message-tone-sample');
    if (descEl) descEl.innerText = meta ? meta.desc : '';
    if (!sampleEl) return;
    let sample = '';
    if (toneId === 'faithful') {
      const lines = MENTOR_VOICE_LINES[state.activeMentor];
      const mentor = MENTORS_LIST_FULL().find(x => x.id === state.activeMentor);
      if (lines && lines.workoutDone) {
        sample = `${mentor ? mentor.name : 'Mentor'}: "${lines.workoutDone}"`;
      }
    } else {
      const pool = (TONE_LINES[toneId] || {}).workoutDone || [];
      if (pool.length) sample = `"${pool[0]}"`;
    }
    sampleEl.innerText = sample ? `Ao terminar um treino → ${sample}` : '';
  }

  // Settings tab preload
  function openSettingsTab() {
    const nameInput = document.getElementById('settings-char-name');
    if (nameInput) nameInput.value = state.charName || '';
    const modeSelect = document.getElementById('settings-app-mode');
    if (modeSelect) modeSelect.value = state.appMode || 'rpg';
    const toneSelect = document.getElementById('settings-message-tone');
    if (toneSelect) {
      toneSelect.value = state.messageTone || 'faithful';
      renderToneHint(toneSelect.value);
      // onchange (e não addEventListener) pra não empilhar handler a cada
      // vez que a aba Ajustes é aberta.
      toneSelect.onchange = () => renderToneHint(toneSelect.value);
    }
    const weightInput = document.getElementById('settings-weight');
    if (weightInput) weightInput.value = userProfile.currentWeight || state.charWeight || 70;
    const heightInput = document.getElementById('settings-height');
    if (heightInput) heightInput.value = userProfile.height || state.charHeight || 170;
    const goalSelect = document.getElementById('settings-goal');
    if (goalSelect) goalSelect.value = userProfile.mainObjective || state.charGoal || 'manter';
    const weeklyInput = document.getElementById('settings-weekly-days');
    if (weeklyInput) weeklyInput.value = userProfile.weeklyDaysGoal || state.weeklyTrainGoal || 4;
    const notifCheck = document.getElementById('settings-notif-enable');
    if (notifCheck) notifCheck.checked = state.notificationEnabled !== false;
    const notifTime = document.getElementById('settings-notif-time');
    if (notifTime) notifTime.value = state.notificationTime || '18:00';
    const dietCheck = document.getElementById('settings-diet-enable');
    if (dietCheck) dietCheck.checked = state.dietTrackingEnabled !== false;
    const soundCheck = document.getElementById('settings-sound-enable');
    if (soundCheck) soundCheck.checked = state.soundEnabled !== false;

    // Campos que vieram do antigo modal "Editar Perfil & Metas" (unificado
    // com Ajustes pra não ter dois lugares editando a mesma coisa).
    const targetWeightInput = document.getElementById('settings-target-weight');
    if (targetWeightInput) targetWeightInput.value = state.targetWeight || state.charWeight || 70;

    document.querySelectorAll('.settings-days-selector .settings-day-btn').forEach(btn => {
      const day = btn.getAttribute('data-day');
      btn.classList.toggle('active', !!(state.trainingDays && state.trainingDays.includes(day)));
    });

    const injurySelect = document.getElementById('settings-injury');
    if (injurySelect) {
      injurySelect.value = Array.isArray(state.injury) ? (state.injury[0] || 'Nenhum') : (state.injury || 'Nenhum');
    }

    const fontSel = document.getElementById('settings-font-size');
    if (fontSel) fontSel.value = (typeof state.fontScale === 'number' && !isNaN(state.fontScale)) ? String(state.fontScale) : '1';

    const restEnableCb = document.getElementById('settings-rest-enable');
    const restTimeInput = document.getElementById('settings-rest-time');
    if (restEnableCb) restEnableCb.checked = state.restTimerEnabled !== false;
    if (restTimeInput) restTimeInput.value = state.baseRestTime || 90;
    if (window.toggleRestSettingsVisibility) toggleRestSettingsVisibility();

    const picPreview = document.getElementById('settings-profile-pic-preview');
    const removePicBtn = document.getElementById('btn-remove-profile-pic');
    if (picPreview) {
      if (state.profilePic) {
        picPreview.src = state.profilePic;
        picPreview.style.display = 'block';
        if (removePicBtn) removePicBtn.classList.remove('hidden');
      } else {
        picPreview.src = '';
        picPreview.style.display = 'none';
        if (removePicBtn) removePicBtn.classList.add('hidden');
      }
    }
    const picInput = document.getElementById('settings-profile-pic');
    if (picInput) picInput.value = '';
  }

  // Só os itens que ainda tem data-tab entram no ciclo de troca de aba — o
  // botão de baixo de "Amigos" foi remodelado pra abrir um modal, não uma
  // aba, e tem o próprio listener mais abaixo.
  const tabNavItems = document.querySelectorAll('.bottom-nav .nav-item[data-tab]');
  tabNavItems.forEach(item => {
    item.addEventListener('click', () => {
      playSound('click');
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(i => { i.classList.remove('active'); i.setAttribute('aria-selected', 'false'); });
      tabContents.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      item.setAttribute('aria-selected', 'true');
      const target = document.getElementById(`tab-${targetTab}`);
      if (target) target.classList.add('active');

      if (targetTab === 'settings') {
        openSettingsTab();
      }
    });
  });

  // Vai pra aba Ajustes sem precisar de um item na barra de baixo (usado
  // pelo atalho da engrenagem no topo e por outros botões "editar" no app).
  function goToSettingsTab() {
    navItems.forEach(i => { i.classList.remove('active'); i.setAttribute('aria-selected', 'false'); });
    tabContents.forEach(t => t.classList.remove('active'));
    const target = document.getElementById('tab-settings');
    if (target) target.classList.add('active');
    openSettingsTab();
  }

  // Header settings shortcut
  const headerSettingsBtn = document.getElementById('header-settings-btn');
  if (headerSettingsBtn) {
    headerSettingsBtn.addEventListener('click', () => {
      playSound('click');
      goToSettingsTab();
    });
  }

  // Measures edit shortcut
  const editMeasuresBtn = document.getElementById('btn-edit-measures-shortcut');
  if (editMeasuresBtn) {
    editMeasuresBtn.addEventListener('click', () => {
      playSound('click');
      goToSettingsTab();
    });
  }

  // Botão "Amigos" na barra de baixo (era o de Ajustes)
  const friendsShortcutBtn = document.getElementById('navtab-friends-shortcut');
  if (friendsShortcutBtn) {
    friendsShortcutBtn.addEventListener('click', () => {
      playSound('click');
      openFriendsModal();
    });
  }

  // Sound toggler button (ícone flutuante) + checkbox em Ajustes — os dois
  // controlam o mesmo state.soundEnabled e ficam sincronizados entre si.
  const soundBtn = document.getElementById('toggle-sound');
  const soundOnIcon = soundBtn.querySelector('.sound-on-icon');
  const soundOffIcon = soundBtn.querySelector('.sound-off-icon');
  const soundCheckbox = document.getElementById('settings-sound-enable');

  function applySoundEnabledUI() {
    if (state.soundEnabled) {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
    } else {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
    }
    if (soundCheckbox) soundCheckbox.checked = state.soundEnabled !== false;
  }

  soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    applySoundEnabledUI();
    if (state.soundEnabled) playSound('click');
    saveState();
  });

  if (soundCheckbox) {
    soundCheckbox.addEventListener('change', () => {
      state.soundEnabled = soundCheckbox.checked;
      applySoundEnabledUI();
      if (state.soundEnabled) playSound('click');
      saveState();
    });
  }

  // DOCK NUTRITION LINK TAB REDIRECT
  document.getElementById('go-to-diet-btn').addEventListener('click', () => {
    const dietNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="diet"]');
    if (dietNavBtn) dietNavBtn.click();
  });

  // WATER LITRE BUTTON CLICK
  const addWaterClick = () => {
    playSound('water');
    
    const target = state.waterTarget || 3;
    state.waterDrank = (state.waterDrank || 0) + 1;
    state.waterIntake = state.waterDrank;

    // Mentor affinity XP on daily actions: 1L water (+5 XP)
    addMentorXP(state.activeMentor, 5);

    // Check if exceeding goal for EXTRA XP!
    if (state.waterDrank > target) {
      // VIG (Vigor) multiplies extra water XP — +2% per point above 10
      const vigMulti = 1 + Math.max(0, (getEffectiveAttributes().vig - 10) * 0.02);
      addXP(Math.round(10 * vigMulti)); // Base 10 XP, boosted by VIG
    } else {
      checkQuestRequirements();
    }
    
    updateDailyChallengeProgress('water', state.waterIntake);
    saveState();
    updateUI();

    const pct = Math.min(100, Math.round((state.waterDrank / target) * 100));
    triggerWaterAnimation(pct);
  };

  const btnAddWater = document.getElementById('add-water-btn');
  if (btnAddWater) {
    btnAddWater.addEventListener('click', addWaterClick);
  }

  // WATER CUSTOM TARGET CHANGE INPUT
  document.getElementById('water-target-input').addEventListener('change', (e) => {
    const newTarget = parseInt(e.target.value) || 3;
    state.waterTarget = Math.max(1, Math.min(10, newTarget));
    state.waterTargetManual = true;
    
    // regenerate water quests descriptions
    const waterQuest = state.dailyQuests.find(q => q.id === 'quest_water');
    if (waterQuest) {
      waterQuest.desc = `Beber pelo menos ${state.waterTarget}L de água hoje`;
    }
    
    saveState();
    updateUI();
  });

  // DIET FORM LOG FOOD SUBMIT
  const dietForm = document.getElementById('diet-food-form');
  dietForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const foodId = document.getElementById('diet-select-food').value;
    const foodGrams = parseFloat(document.getElementById('diet-food-weight').value) || 100;
    
    const foodObj = state.foodsDb.find(f => f.id === foodId);
    
    if (foodObj) {
      // Math portions
      const ratio = foodGrams / 100;
      const meal = {
        id: Date.now(),
        name: foodObj.name,
        weight: foodGrams,
        kcal: foodObj.kcal * ratio,
        prot: foodObj.prot * ratio,
        fiber: foodObj.fiber * ratio
      };

      state.mealLogs.push(meal);
      playSound('quest');
      
      checkQuestRequirements();
      saveState();
      updateUI();
      
      // Reset portion to default 100g
      document.getElementById('diet-food-weight').value = 100;
    }
  });

  // WORKOUT SHEETS TOGGLES (Mentor vs Custom)
  document.getElementById('toggle-workout-std').addEventListener('click', () => {
    playSound('click');
    state.useCustomWorkout = false;
    saveState();
    updateUI();
  });
  
  document.getElementById('toggle-workout-cust').addEventListener('click', () => {
    playSound('click');
    state.useCustomWorkout = true;
    saveState();
    updateUI();
  });

  // WORKOUT DIVISIONS SELECTORS (A, B, C) - Now handled dynamically in renderWorkoutRoutine
  // ADD CUSTOM EXERCISE SUBMISSION
  const addExForm = document.getElementById('add-exercise-form');
  addExForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('cust-ex-name').value.trim();
    const muscle = document.getElementById('cust-ex-muscle').value;
    const sets = parseInt(document.getElementById('cust-ex-sets').value) || 4;
    const reps = document.getElementById('cust-ex-reps').value.trim() || "8-12";
    const initialWeight = parseFloat(document.getElementById('cust-ex-weight').value) || 0;

    const newEx = {
      name: name,
      muscle: muscle,
      sets: sets,
      targetReps: reps,
      weight: initialWeight
    };

    // Push into active division custom workouts using resolved activeIdx
    const activeIdx = getActiveWorkoutIndex();
    state.customWorkouts[activeIdx].exercises.push(newEx);
    
    playSound('quest');
    saveState();
    
    // Close modal
    document.getElementById('add-exercise-modal').classList.add('hidden');
    addExForm.reset();
    document.getElementById('cust-ex-sets').value = 4;
    document.getElementById('cust-ex-weight').value = 10;
    document.getElementById('cust-ex-reps').value = "8-12";
    
    updateUI();
  });

  // ADD CUSTOM FOOD SUBMISSION
  const addFoodForm = document.getElementById('add-custom-food-form');
  addFoodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('cust-food-name').value.trim();
    const kcal = parseInt(document.getElementById('cust-food-kcal').value) || 150;
    const prot = parseFloat(document.getElementById('cust-food-prot').value) || 10;
    const fiber = parseFloat(document.getElementById('cust-food-fiber').value) || 2;

    const customId = `cust_food_${Date.now()}`;
    const newFood = {
      id: customId,
      name: name,
      kcal: kcal,
      prot: prot,
      fiber: fiber,
      isCustom: true
    };

    state.foodsDb.push(newFood);
    playSound('quest');
    saveState();

    // Close modal
    document.getElementById('add-custom-food-modal').classList.add('hidden');
    addFoodForm.reset();
    document.getElementById('cust-food-kcal').value = 150;
    document.getElementById('cust-food-prot').value = 10;
    document.getElementById('cust-food-fiber').value = 2;

    updateUI();
  });

  // COMPLETE WORKOUT ROUTINE ACTION
  document.getElementById('btn-finish-workout').addEventListener('click', () => {
    const completion = getWorkoutCompletionStats();

    if (completion.totalSets === 0) {
      alert('Adicione exercícios à ficha antes de finalizar o treino.');
      return;
    }

    if (completion.percent < 50) {
      const proceed = confirm(
        `Você completou apenas ${completion.completedSets}/${completion.totalSets} séries (${Math.round(completion.percent)}%).\n\nFinalizar mesmo assim? (XP reduzido)`
      );
      if (!proceed) return;
    }

    playSound('click');
    if (state.appMode === 'simple') {
      // Modo Simples não tem XP/mentor — pula direto pro registro do treino,
      // sem a avaliação de intensidade (que é 100% flavor de RPG).
      completeActiveWorkout(0);
    } else {
      document.getElementById('rpe-modal').classList.remove('hidden');
    }
  });

  // RPE MODAL OPTIONS WIRING
  const rpeOptions = document.querySelectorAll('.rpe-option-card');
  rpeOptions.forEach(card => {
    card.addEventListener('click', () => {
      const rpeModal = document.getElementById('rpe-modal');
      if (rpeModal.classList.contains('hidden')) return; // já processado (evita XP duplicado em duplo clique/toque)

      const rpeType = card.getAttribute('data-rpe');
      const rpeXp = parseInt(card.getAttribute('data-xp')) || 10;

      // Close RPE Modal
      rpeModal.classList.add('hidden');

      // Mentor XP based on RPE submission rating selected
      let affinityXP = 15;
      if (rpeType === 'intenso') affinityXP = 40;
      else if (rpeType === 'freaky') affinityXP = 60;
      addMentorXP(state.activeMentor, affinityXP);

      // FX triggers for Freaky
      if (rpeType === 'freaky') {
        document.body.classList.add('screen-shake');
        playSound('brolyki');
        setTimeout(() => {
          document.body.classList.remove('screen-shake');
        }, 600);
      } else {
        playSound('levelup');
      }

      // Execute actual workout completion
      completeActiveWorkout(rpeXp);
    });
  });

  // WHEAT ARSENAL PICKER PANEL WIRING
  const btnOpenArsenal = document.getElementById('btn-open-arsenal');
  const arsenalPanel = document.getElementById('arsenal-panel');
  if (btnOpenArsenal && arsenalPanel) {
    btnOpenArsenal.addEventListener('click', () => {
      playSound('click');
      arsenalPanel.classList.toggle('hidden');
      arsenalPanel.classList.toggle('open');
    });
  }

  const filterBtns = document.querySelectorAll('.btn-arsenal-filter');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const filterValue = btn.getAttribute('data-filter');
      const items = document.querySelectorAll('.arsenal-item');
      
      items.forEach(item => {
        const itemType = item.getAttribute('data-type');
        if (filterValue === 'all' || itemType === filterValue) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });
      
      const groups = document.querySelectorAll('.arsenal-group');
      groups.forEach(group => {
        const visibleItems = group.querySelectorAll('.arsenal-item:not(.hidden)');
        if (visibleItems.length > 0) {
          group.classList.remove('hidden');
        } else {
          group.classList.add('hidden');
        }
      });
    });
  });

  const arsenalItems = document.querySelectorAll('.arsenal-item');
  arsenalItems.forEach(item => {
    item.addEventListener('click', () => {
      playSound('click');
      const exName = item.getAttribute('data-name');
      const exMuscle = item.getAttribute('data-muscle');
      
      document.getElementById('cust-ex-name').value = exName;
      document.getElementById('cust-ex-muscle').value = exMuscle;
      
      if (arsenalPanel) {
        arsenalPanel.classList.add('hidden');
        arsenalPanel.classList.remove('open');
      }
    });
  });

  // DISTRIBUTE STATS POINTS
  const addAttrBtns = document.querySelectorAll('.btn-attr-add');
  addAttrBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.attrPoints > 0) {
        const attrKey = btn.getAttribute('data-attr');
        state.attributes[attrKey] += 1;
        state.attrPoints -= 1;
        
        playSound('point_allocation');
        spawnAttrFloatingText(attrKey);
        
        saveState();
        updateUI();
      }
    });
  });

  // MODAL SWITCH TRIGGER TOGGLES
  document.getElementById('btn-open-add-exercise-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-exercise-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-exercise-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-exercise-modal').classList.add('hidden');
  });

  document.getElementById('btn-open-custom-food-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-food-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-custom-food-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-food-modal').classList.add('hidden');
  });

  document.getElementById('btn-open-custom-mentor-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-mentor-modal').classList.remove('hidden');
  });
  document.getElementById('btn-close-custom-mentor-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('add-custom-mentor-modal').classList.add('hidden');
  });

  // LEVEL UP MODAL OK BUTTON
  document.getElementById('btn-close-level-up').addEventListener('click', () => {
    playSound('click');
    document.getElementById('level-up-modal').classList.add('hidden');
    const statusNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="status"]');
    if (statusNavBtn) statusNavBtn.click();
  });

  // ITEM ACQUIRED OK BUTTON
  document.getElementById('btn-close-item-modal').addEventListener('click', () => {
    playSound('click');
    document.getElementById('item-acquired-modal').classList.add('hidden');
  });

  const btnCloseMentorRewards = document.getElementById('btn-close-mentor-rewards');
  if (btnCloseMentorRewards) {
    btnCloseMentorRewards.addEventListener('click', () => {
      playSound('click');
      document.getElementById('mentor-rewards-modal').classList.add('hidden');
    });
  }
  const mentorRewardsModalEl = document.getElementById('mentor-rewards-modal');
  if (mentorRewardsModalEl) {
    mentorRewardsModalEl.addEventListener('click', (e) => {
      if (e.target === mentorRewardsModalEl) mentorRewardsModalEl.classList.add('hidden');
    });
  }

  // CLAIM DAILY FREAKY CHALLENGE REWARD
  const claimBtn = document.getElementById('btn-claim-challenge');
  if (claimBtn) {
    claimBtn.addEventListener('click', () => {
      claimDailyChallengeReward();
    });
  }

  // CLEAR DATA TRIGGER
  document.getElementById('btn-reset-data').addEventListener('click', async () => {
    const msg = cloudUser
      ? `Você está logado como ${cloudUser.email}. Apagar vai limpar Ranks, Alimentos, Treinos e Metas locais E o progresso salvo na nuvem dessa conta, e você será desconectado. Continuar?`
      : "Você quer apagar todo o seu progresso? Isso limpará seus Ranks, Alimentos criados, Treinos customizados e Metas.";
    if (confirm(msg)) {
      if (cloudUser) {
        await deleteCloudData();
      }
      _isResetting = true; // impede que pagehide/beforeunload re-salvem o estado
      localStorage.removeItem('freakyquest_state_v2');
      localStorage.removeItem('freaky_quest_user');
      // Remove também o perfil em memória para garantir um cadastro 100% limpo
      userProfile = { name: '', sex: '', mainObjective: '', motivation: '', focusArea: '', class: '', experienceLevel: '', activityLevel: '', height: 175, currentWeight: 75, targetWeight: 75, jointPain: [], profilePic: '', workoutHistory: {}, weeklyDaysGoal: 3, notificationsEnabled: true, notificationTime: '18:00', attributes: { FOR: 10, RES: 10, AGI: 10, VIG: 10, FOC: 10 } };
      location.reload();
    }
  });

  // SETTINGS MODAL HELPERS & CORE
  window.toggleRestSettingsVisibility = function() {
    const container = document.getElementById('settings-rest-time-container');
    const enableCb = document.getElementById('settings-rest-enable');
    if (container && enableCb) {
      container.style.display = enableCb.checked ? 'flex' : 'none';
    }
  };

  // Register settings-rest-enable change listener
  const settingsRestEnable = document.getElementById('settings-rest-enable');
  if (settingsRestEnable) {
    settingsRestEnable.addEventListener('change', toggleRestSettingsVisibility);
  }

  // "Editar Perfil & Metas" (aba Status) — unificado com a aba Ajustes,
  // não abre mais um modal próprio com campos duplicados.
  const btnOpenSettings = document.getElementById('btn-open-settings');
  if (btnOpenSettings) btnOpenSettings.addEventListener('click', () => {
    playSound('click');
    goToSettingsTab();
  });

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

  // Activity Details Modal — abrir/fechar
  const btnCloseActivityDetails = document.getElementById('btn-close-activity-details');
  if (btnCloseActivityDetails) {
    btnCloseActivityDetails.addEventListener('click', () => {
      playSound('click');
      document.getElementById('activity-details-modal').classList.add('hidden');
    });
  }
  const activityDetailsModalEl = document.getElementById('activity-details-modal');
  if (activityDetailsModalEl) {
    activityDetailsModalEl.addEventListener('click', (e) => {
      if (e.target === activityDetailsModalEl) activityDetailsModalEl.classList.add('hidden');
    });
  }


  // ── Hero do mentor: clique no avatar troca a quote ──
  const heroSection = document.getElementById('mentor-hero-section');
  if (heroSection) {
    heroSection.addEventListener('click', () => {
      playSound('click');
      const heroQuoteEl = document.getElementById('mentor-bubble-quote');
      const quote = getMentorIdleQuote();
      if (quote && heroQuoteEl) {
        heroQuoteEl.innerText = quote.replace(/^"|"$/g, '');
        heroSection.style.transform = 'scale(0.995)';
        setTimeout(() => { heroSection.style.transform = ''; }, 120);
      }
    });
  }

  // ── Filtro de universo na aba de mentores ──
  const filterContainer = document.getElementById('mentor-universe-filter');
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.muf-btn');
      if (!btn) return;
      filterContainer.querySelectorAll('.muf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      filterMentorsByUniverse(filter);
    });
  }

  function readImageAsResizedDataURL(file, maxDim, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try {
          callback(canvas.toDataURL('image/jpeg', 0.8));
        } catch (err) {
          callback(e.target.result);
        }
      };
      img.onerror = () => callback(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => callback(null);
    reader.readAsDataURL(file);
  }

  const wizProfilePic = document.getElementById('wiz-profile-pic');
  if (wizProfilePic) {
    wizProfilePic.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        readImageAsResizedDataURL(file, 256, (dataUrl) => {
          if (!dataUrl) return;
          userProfile.profilePic = dataUrl;
          const previewEl = document.getElementById('wiz-avatar-preview');
          if (previewEl) {
            previewEl.src = dataUrl;
            previewEl.classList.remove('hidden');
          }
          const runeEl = document.getElementById('wiz-avatar-rune');
          if (runeEl) {
            runeEl.classList.remove('hidden');
          }
        });
      }
    });
  }

  const settingsProfilePic = document.getElementById('settings-profile-pic');
  if (settingsProfilePic) {
    settingsProfilePic.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        readImageAsResizedDataURL(file, 256, (dataUrl) => {
          if (!dataUrl) return;
          state.profilePic = dataUrl;
          userProfile.profilePic = dataUrl;
          const preview = document.getElementById('settings-profile-pic-preview');
          if (preview) {
            preview.src = dataUrl;
            preview.style.display = 'block';
          }
          const removeBtn = document.getElementById('btn-remove-profile-pic');
          if (removeBtn) removeBtn.classList.remove('hidden');
        });
      }
    });
  }

  const btnRemoveProfilePic = document.getElementById('btn-remove-profile-pic');
  if (btnRemoveProfilePic) {
    btnRemoveProfilePic.addEventListener('click', () => {
      playSound('click');
      state.profilePic = '';
      userProfile.profilePic = '';
      const preview = document.getElementById('settings-profile-pic-preview');
      if (preview) {
        preview.src = '';
        preview.style.display = 'none';
      }
      btnRemoveProfilePic.classList.add('hidden');
      const settingsInput = document.getElementById('settings-profile-pic');
      if (settingsInput) settingsInput.value = '';
    });
  }

  const settingsDayButtons = document.querySelectorAll('.settings-days-selector .settings-day-btn');
  settingsDayButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      const dayVal = btn.getAttribute('data-day');
      if (!state.trainingDays) state.trainingDays = ['Seg', 'Ter', 'Qui', 'Sex'];
      if (state.trainingDays.includes(dayVal)) {
        if (state.trainingDays.length > 1) {
          state.trainingDays = state.trainingDays.filter(d => d !== dayVal);
          btn.classList.remove('active');
        }
      } else {
        state.trainingDays.push(dayVal);
        btn.classList.add('active');
      }
      const order = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
      state.trainingDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      
      const settingsWeeklyInput = document.getElementById('settings-weekly-days');
      if (settingsWeeklyInput) settingsWeeklyInput.value = state.trainingDays.length;
    });
  });

  const btnSkipRest = document.getElementById('btn-skip-rest');
  if (btnSkipRest) {
    btnSkipRest.addEventListener('click', () => {
      playSound('click');
      stopRestTimer();
    });
  }

  // Sincronizar e escutar alterações rápidas do temporizador de descanso na aba Treinos
  const quickRestEnable = document.getElementById('quick-rest-enable');
  if (quickRestEnable) {
    quickRestEnable.addEventListener('change', (e) => {
      state.restTimerEnabled = e.target.checked;
      const wrap = document.getElementById('quick-rest-time-wrap');
      if (wrap) wrap.style.display = e.target.checked ? 'flex' : 'none';

      // Manter o campo espelho em Ajustes sincronizado
      const globEnable = document.getElementById('settings-rest-enable');
      if (globEnable) globEnable.checked = e.target.checked;
      toggleRestSettingsVisibility();

      saveState();
    });
  }

  const quickRestTime = document.getElementById('quick-rest-time');
  if (quickRestTime) {
    quickRestTime.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10) || 90;
      if (val > 99) val = 99;
      state.baseRestTime = val;

      // Manter o campo espelho em Ajustes sincronizado
      const globTime = document.getElementById('settings-rest-time');
      if (globTime) globTime.value = val;

      saveState();
    });
    quickRestTime.addEventListener('input', (e) => {
      if (e.target.value.length > 2) {
        e.target.value = e.target.value.slice(0, 2);
      }
    });
  }

  const settingsRestTime = document.getElementById('settings-rest-time');
  if (settingsRestTime) {
    settingsRestTime.addEventListener('input', (e) => {
      if (e.target.value.length > 2) {
        e.target.value = e.target.value.slice(0, 2);
      }
    });
  }

  // QUICK DIET INVENTORY LOGS WIRING
  function spawnDietFloatingText(elementId, text) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const parent = document.body;
    
    const span = document.createElement('span');
    span.className = 'diet-floating-text';
    span.innerText = text;
    span.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    span.style.top = `${rect.top + window.scrollY}px`;
    
    parent.appendChild(span);
    setTimeout(() => {
      span.remove();
    }, 850);
  }

  window.logQuickMeal = function(name, kcal, prot, carbs, fiber, elementId) {
    if (name.includes("Elixir")) {
      playSound('potion');
    } else {
      playSound('crunch');
    }
    
    if (elementId) {
      let ft = `+${kcal} Kcal! 🍗`;
      if (prot > 5) {
        ft = `+${prot}g Prot! ⚡`;
      } else if (fiber > 2) {
        ft = `+${fiber}g Fibras! 🥗`;
      }
      spawnDietFloatingText(elementId, ft);
    }
    
    if (!state.dailyMacros) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
    state.dailyMacros.kcal += kcal;
    state.dailyMacros.prot += prot;
    state.dailyMacros.fiber += fiber;
    state.dailyMacros.carbs += carbs;

    state.mealLogs.push({
      id: Date.now(),
      name: name,
      weight: 100,
      kcal: kcal,
      prot: prot,
      carbs: carbs,
      fiber: fiber
    });

    checkQuestRequirements();
    saveState();
    updateUI();
  };

  const btnMarmita = document.getElementById('btn-quick-marmita');
  if (btnMarmita) {
    btnMarmita.addEventListener('click', () => {
      window.logQuickMeal("Marmita Monstro 🍗", 450, 35, 50, 4, 'btn-quick-marmita');
    });
  }
  const btnWhey = document.getElementById('btn-quick-whey');
  if (btnWhey) {
    btnWhey.addEventListener('click', () => {
      window.logQuickMeal("Elixir de Whey ⚡", 140, 26, 3, 0, 'btn-quick-whey');
    });
  }
  const btnFibra = document.getElementById('btn-quick-fibra');
  if (btnFibra) {
    btnFibra.addEventListener('click', () => {
      window.logQuickMeal("Ração de Fibra 🥗", 80, 2, 15, 8, 'btn-quick-fibra');
    });
  }

  // TRAINING NOTIFICATION CHECKER AND TIMER
  function triggerTrainingNotification() {
    const reminderVoice = resolveVoiceLine('reminder', { name: state.charName });
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('FREAKYQUEST: Hora do Treino!', {
          body: reminderVoice,
          icon: 'logo.webp'
        });
      } catch (e) {
        console.warn('Native notification failed', e);
      }
    }

    // In-game simulated alert/banner
    const toast = document.getElementById('overload-notification');
    const message = document.getElementById('overload-msg');
    if (message && toast) {
      message.innerText = reminderVoice;
      toast.classList.remove('hidden');
      playSound('quest');
      
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 5000);
    }
  }

  // Poll every 15 seconds to see if it's time to train
  setInterval(() => {
    if (!state.notificationEnabled || !state.notificationTime || !state.charName) return;
    
    const now = new Date();
    const currentHourMin = now.toTimeString().substring(0, 5); // Format: "18:00"
    const todayStr = now.toDateString(); // Format: "Sat May 23 2026"
    
    if (currentHourMin === state.notificationTime && state.lastNotificationDate !== todayStr) {
      state.lastNotificationDate = todayStr;
      saveState();
      triggerTrainingNotification();
    }
  }, 15000);

});

function completeActiveWorkout(rpeBonusXp) {
  const completion = getWorkoutCompletionStats();
  state.workoutsCompleted += 1;

  // Check weekly date changes and reset if new week
  checkWeeklyReset();

  // Track weekly count
  state.workoutsThisWeek = (state.workoutsThisWeek || 0) + 1;
  // Sequência de dias treinando (streak) — calculada antes de sobrescrever lastWorkoutDate
  const todayDateStr = new Date().toDateString();
  const yesterdayDateStr = new Date(Date.now() - 86400000).toDateString();
  const prevWorkoutDateStr = state.lastWorkoutDate ? new Date(state.lastWorkoutDate).toDateString() : null;
  if (!state.currentStreak) state.currentStreak = 0;
  if (prevWorkoutDateStr !== todayDateStr) {
    state.currentStreak = (prevWorkoutDateStr === yesterdayDateStr) ? state.currentStreak + 1 : 1;
  }
  state.bestStreak = Math.max(state.bestStreak || 0, state.currentStreak);
  if (state.currentStreak >= 7) unlockTrophy('sequencia_ferro');
  if (state.currentStreak >= 30) unlockTrophy('mes_disciplina');

  // Fala do tom/mentor. "Voltou depois de sumir" tem prioridade sobre o
  // "terminou o treino" normal — é o momento de maior peso emocional, e é
  // onde os 3 tons mais se diferenciam. Calculado ANTES de sobrescrever
  // lastWorkoutDate logo abaixo.
  let daysAway = 0;
  if (prevWorkoutDateStr && prevWorkoutDateStr !== todayDateStr) {
    daysAway = Math.floor((Date.now() - new Date(state.lastWorkoutDate).getTime()) / 86400000);
  }
  const finishVoice = daysAway >= 3
    ? resolveVoiceLine('comeback', { days: daysAway })
    : resolveVoiceLine('workoutDone', {});
  if (finishVoice) showGenericNotification(finishVoice);

  state.lastWorkoutDate = new Date().toISOString();

  // Resistência (RES) increases base workout XP
  let xpGained = 50 + getEffectiveAttributes().res + rpeBonusXp;
  if (completion.percent < 50) xpGained = Math.round(xpGained * 0.5);
  else if (completion.percent < 100) xpGained = Math.round(xpGained * 0.85);

  // Agilidade (AGI) increases workout completion XP (+1% per point > 10)
  const agiBonus = 1 + Math.max(0, (getEffectiveAttributes().agi - 10) * 0.01);
  xpGained = Math.round(xpGained * agiBonus);

  // Apply dynamic visual badge bonus (+10% Treino XP) if anabolic is active
  if (state.anabolicActive) {
    xpGained = Math.round(xpGained * 1.10);
  }

  let extraXP = false;

  // Check if training target is exceeded for EXTRA XP!
  if (state.workoutsThisWeek > state.weeklyTrainGoal) {
    xpGained += 30;
    extraXP = true;
  }
  
  addXP(xpGained);
  
  if (state.workoutsCompleted === 1) unlockTrophy('primeiro_passo');
  if (state.workoutsCompleted >= 25) unlockTrophy('gym_legend');

  const classQuest = state.dailyQuests.find(q => q.id === 'quest_class');
  if (classQuest && !classQuest.completed && completion.percent >= 50) {
    classQuest.completed = true;
    const focBonus = 1 + (getEffectiveAttributes().foc * 0.01);
    addXP(Math.round(classQuest.xpReward * focBonus));
    playSound('quest');
  }

  // Save current weight and strength to history (volume real do treino)
  if (!state.weightHistory) state.weightHistory = [];
  if (!state.strengthHistory) state.strengthHistory = [];

  state.weightHistory.push(parseFloat(state.charWeight) || 80);
  const sessionVolume = calculateSessionVolume();
  const prMax = Object.values(state.personalRecords || {}).reduce((max, val) => Math.max(max, val || 0), 0);
  state.strengthHistory.push(sessionVolume > 0 ? sessionVolume : prMax || 50);

  // Limit history length to 8 points
  if (state.weightHistory.length > 8) state.weightHistory.shift();
  if (state.strengthHistory.length > 8) state.strengthHistory.shift();

  // Trigger daily challenge workout progress
  if (completion.percent >= 50) {
    updateDailyChallengeProgress('workout', 1);
  }

  saveState();
  updateUI();

  // Show toast for extra workout bonus
  if (extraXP) {
    setTimeout(() => {
      showExtraWorkoutToast(state.workoutsThisWeek, state.weeklyTrainGoal);
    }, 1200);
  }

  // Scroll to dashboard
  const dashboardNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="dashboard"]');
  if (dashboardNavBtn) dashboardNavBtn.click();
}
