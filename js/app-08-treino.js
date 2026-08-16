/* Render do treino atual
 *
 * Parte 8/14 do antigo app.js (linhas 4948-5192 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 15. RENDER CURRENT WORKOUT
function renderWorkoutRoutine() {
  purgeOldSetTrackerKeys();
  
  const days = getWeeklyDaysArray();
  const activeIdx = getActiveWorkoutIndex();
  const dayName = days[activeIdx];

  // Dynamically render the day selector tabs
  const selector = document.querySelector('.workout-division-selector');
  if (selector) {
    selector.innerHTML = '';
    selector.style.display = 'grid';
    if (days.length > 4) {
      selector.style.gridTemplateColumns = 'repeat(auto-fit, minmax(80px, 1fr))';
    } else {
      selector.style.gridTemplateColumns = `repeat(${days.length}, 1fr)`;
    }
    
    days.forEach((day, index) => {
      const btn = document.createElement('button');
      btn.className = `workout-div-btn${index === activeIdx ? ' active' : ''}`;
      btn.setAttribute('data-div', index.toString());
      btn.innerText = day;
      btn.addEventListener('click', () => {
        playSound('click');
        state.activeWorkoutDiv = index.toString();
        saveState();
        
        const exContainer = document.getElementById('exercises-list');
        if (exContainer) {
          exContainer.classList.remove('workout-slide-fade');
          void exContainer.offsetWidth; // trigger reflow
          exContainer.classList.add('workout-slide-fade');
        }
        
        renderWorkoutRoutine();
      });
      selector.appendChild(btn);
    });
  }

  const template = getResolvedWorkoutTemplate();

  if (state.useCustomWorkout) {
    const titleEl = document.getElementById('workout-title');
    titleEl.innerHTML = `<input type="text" class="workout-title-editable" id="custom-title-input" placeholder="Digite o título do treino (ex: Segunda: Peito de Titã 🦅)">`;
    const inputEl = titleEl.querySelector('#custom-title-input');
    if (inputEl) inputEl.value = template.title || '';
    inputEl.addEventListener('input', (e) => {
      const val = e.target.value;
      state.customWorkouts[activeIdx].title = val;
      state.customWorkouts[activeIdx].isCustomized = true;
      clearTimeout(inputEl._titleSaveTimer);
      inputEl._titleSaveTimer = setTimeout(saveState, 500);
    });

    document.getElementById('workout-category-badge').innerText = 'Estilo Próprio 😈';
    document.getElementById('workout-description').innerText = `Total: ${template.exercises.length} exercícios criados por você.`;
  } else {
    document.getElementById('workout-title').innerText = `${template.title}`;
    document.getElementById('workout-category-badge').innerText = `Estilo ${MENTORS_LIST_FULL().find(m => m.id === state.activeMentor)?.name || 'Rock Lee'}`;
    document.getElementById('workout-description').innerText = template.desc;
  }

  const container = document.getElementById('exercises-list');
  container.innerHTML = '';

  if (template.exercises.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 0.8rem;">
        Sua ficha está vazia! Clique em <strong>"Adicionar Exercício"</strong> acima para montar seu treino customizado.
      </div>
    `;
    return;
  }

  template.exercises.forEach((ex, exIdx) => {
    const card = document.createElement('div');
    card.className = 'exercise-card-new';

    const prevRecord = state.personalRecords[ex.name];
    const rival = userProfile.rivals && userProfile.rivals[ex.name];
    if (rival && (prevRecord === undefined || prevRecord < rival.weight)) {
      card.style.cssText += ';box-shadow:0 0 0 1.5px rgba(255,50,80,0.5),0 0 16px rgba(255,50,80,0.15)';
    }

    // ── Header ──
    const exNum = String(exIdx + 1).padStart(2, '0');
    card.innerHTML = `
      <div class="exc-header">
        <div class="exc-name-area">
          <div class="exc-number">${exNum}</div>
          <div class="exc-info">
            <h4 class="exc-name">${escapeHtml(ex.name)}</h4>
            <span class="exc-muscle">${ex.muscle}${rival ? ` · 🎯 Rival: ${rival.name} (${rival.weight}kg)` : ''}</span>
          </div>
        </div>
        <div class="exc-meta">
          <span class="exc-target">${ex.sets}×${ex.targetReps}</span>
          ${prevRecord !== undefined
            ? `<span class="exc-pr">🏆 ${prevRecord}kg</span>`
            : `<span class="exc-pr" style="color:var(--text-muted)">Sem record</span>`}
        </div>
      </div>`;

    // ── PR badge ──
    const prBadge = document.createElement('div');
    prBadge.className = 'exc-pr-badge';
    prBadge.style.display = 'none';
    prBadge.innerHTML = '⚡ RECORDE QUEBRADO! +15 XP';
    card.appendChild(prBadge);

    // ── Alerta lesão ──
    const warningText = checkExerciseInjuryWarning(ex.name, ex.muscle);
    if (warningText) {
      const warn = document.createElement('div');
      warn.className = 'exercise-warning-badge';
      warn.innerText = warningText;
      card.appendChild(warn);
    }

    // ── Botão excluir (modo custom) ──
    if (state.useCustomWorkout) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-exercise';
      delBtn.innerHTML = '✕';
      delBtn.title = 'Remover';
      delBtn.addEventListener('click', () => {
        if (confirm(`Remover "${ex.name}" da ficha?`)) {
          playSound('click');
          state.customWorkouts[activeIdx].exercises.splice(exIdx, 1);
          saveState(); updateUI();
        }
      });
      card.appendChild(delBtn);
    }

    // ── Carga input ──
    const loadRow = document.createElement('div');
    loadRow.className = 'exc-load-row';
    const initWeight = ex.weight !== undefined ? ex.weight : (state.personalRecords[ex.name] || 0);
    const hintTxt = prevRecord !== undefined ? `↑ supere ${prevRecord}kg = novo record!` : 'Digite a carga de hoje';
    loadRow.innerHTML = `
      <span class="exc-load-lbl">CARGA</span>
      <input type="number" class="exc-load-input max-weight-input" value="${initWeight}" placeholder="0" min="0" step="0.5">
      <span class="exc-load-unit">kg</span>
      <span class="exc-load-hint">${hintTxt}</span>`;
    card.appendChild(loadRow);

    const weightInput = loadRow.querySelector('.exc-load-input');
    weightInput.addEventListener('input', () => {
      const w = parseFloat(weightInput.value) || 0;
      ex.weight = w;
      const curRec = state.personalRecords[ex.name];
      if (w > 0 && (curRec === undefined || w > curRec)) {
        prBadge.innerHTML = curRec === undefined ? '⚡ PRIMEIRO REGISTRO!' : '⚡ RECORDE QUEBRADO! +15 XP';
        prBadge.style.display = 'flex';
      } else {
        prBadge.style.display = 'none';
      }
      saveState();
    });
    weightInput.addEventListener('change', () => {
      const w = parseFloat(weightInput.value) || 0;
      ex.weight = w;
      saveState();
      // PR/XP só é concedido ao marcar uma série como concluída (toggleFunc),
      // nunca só por digitar peso e sair do campo — evita farm de XP.
    });

    // ── Séries: header + controle de quantidade ──
    const setsHeader = document.createElement('div');
    setsHeader.className = 'exc-sets-header';
    setsHeader.innerHTML = `
      <span class="exc-sets-header-lbl">SÉRIES</span>
      <div class="exc-sets-count-wrap">
        <input type="number" class="exc-sets-count-input sets-count-input" value="${ex.sets}" min="1" max="10">
        <span style="font-size:9px;color:var(--text-muted)">séries</span>
      </div>`;
    card.appendChild(setsHeader);

    setsHeader.querySelector('.exc-sets-count-input').addEventListener('change', (e) => {
      const newSets = Math.max(1, Math.min(10, parseInt(e.target.value) || 4));
      ex.sets = newSets;
      if (state.useCustomWorkout) {
        const origEx = state.customWorkouts[activeIdx].exercises.find(x => x.name === ex.name);
        if (origEx) origEx.sets = newSets;
      }
      saveState(); renderWorkoutRoutine();
    });

    // ── Tiles de série ──
    const setsRow = document.createElement('div');
    setsRow.className = 'exc-sets-row';

    for (let s = 1; s <= ex.sets; s++) {
      const setKey = buildSetKey(exIdx, s);
      const setEntry = normalizeSetEntry(state.activeSetsTracker[setKey]);
      const isDone = !!(setEntry && setEntry.completed);
      const repsVal = setEntry && setEntry.reps
        ? setEntry.reps
        : (ex.targetReps.includes('-') ? ex.targetReps.split('-')[0] : parseInt(ex.targetReps) || 10);

      const tile = document.createElement('div');
      tile.className = `exc-set-tile${isDone ? ' est-done' : ''}`;
      tile.innerHTML = `<span class="est-label">S${s}</span><span class="est-check">✓</span>`;

      const repsInput = document.createElement('input');
      repsInput.type = 'number';
      repsInput.className = 'est-reps rep-input';
      repsInput.value = repsVal;
      repsInput.min = 1; repsInput.max = 99;
      tile.insertBefore(repsInput, tile.querySelector('.est-check'));

      const toggleFunc = (forceState) => {
        const next = forceState !== undefined ? forceState : !tile.classList.contains('est-done');
        const w = parseFloat(weightInput.value) || ex.weight || 0;
        const r = parseInt(repsInput.value, 10) || parseTargetReps(ex.targetReps);
        if (next) {
          state.activeSetsTracker[setKey] = { completed: true, weight: w, reps: r };
          if (state.restTimerEnabled !== false) {
            const baseRest = state.baseRestTime || 90;
            startRestTimer(baseRest);
          }
          if (w > 0) tryBreakPR(ex.name, w, prBadge);
        } else {
          delete state.activeSetsTracker[setKey];
        }
        tile.classList.toggle('est-done', next);
        playSound('click');
        checkQuestRequirements();
        saveState();
      };

      tile.addEventListener('click', (e) => { if (e.target !== repsInput) toggleFunc(); });
      repsInput.addEventListener('change', () => toggleFunc(true));
      setsRow.appendChild(tile);
    }

    card.appendChild(setsRow);
    container.appendChild(card);
  });
}

