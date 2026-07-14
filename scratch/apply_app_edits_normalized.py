import os

filepath = r'c:\Users\SAMSUNG\.gemini\antigravity\scratch\freakyquest\app.js'
with open(filepath, 'rb') as f:
    content = f.read()

# 1. Normalize line endings to \n
content = content.replace(b'\r\n', b'\n')

# 2. Convert CP1252 'B\xedceps' to UTF-8 'B\xc3\xadceps'
content = content.replace(b'B\xedceps', b'B\xc3\xadceps')

# 3. Decode as UTF-8
try:
    text = content.decode('utf-8')
    print("Successfully decoded app.js as UTF-8.")
except Exception as e:
    print(f"Decoded failed: {e}")
    # Let's locate the decoding error if any
    content.decode('utf-8', errors='replace')
    os._exit(1)

# 4. Standard string replacements (with simple \n and UTF-8 characters)
target_1 = """const FOCUS_BONUS_EXERCISES = {
  Peito: { name: 'Crucifixo com Halteres (Foco Peito)', sets: 3, targetReps: '12-15', muscle: 'Peito', weight: 10 },
  Costas: { name: 'Remada Unilateral (Foco Costas)', sets: 3, targetReps: '10-12', muscle: 'Costas', weight: 12 },
  Ombros: { name: 'Elevação Frontal (Foco Ombros)', sets: 3, targetReps: '12-15', muscle: 'Ombros', weight: 8 },
  Braços: { name: 'Rosca Alternada (Foco Braços)', sets: 3, targetReps: '10-12', muscle: 'Braços', weight: 10 },
  Pernas: { name: 'Cadeira Extensora (Foco Pernas)', sets: 3, targetReps: '12-15', muscle: 'Pernas', weight: 30 },
  FullBody: null
};"""

replace_1 = """const FOCUS_BONUS_EXERCISES = {
  Peito: { name: 'Crucifixo com Halteres (Foco Peito)', sets: 3, targetReps: '12-15', muscle: 'Peito', weight: 10 },
  Costas: { name: 'Remada Unilateral (Foco Costas)', sets: 3, targetReps: '10-12', muscle: 'Costas', weight: 12 },
  Ombros: { name: 'Elevação Frontal (Foco Ombros)', sets: 3, targetReps: '12-15', muscle: 'Ombros', weight: 8 },
  Braços: { name: 'Rosca Alternada (Foco Braços)', sets: 3, targetReps: '10-12', muscle: 'Braços', weight: 10 },
  Pernas: { name: 'Cadeira Extensora (Foco Pernas)', sets: 3, targetReps: '12-15', muscle: 'Pernas', weight: 30 },
  Abdômen: { name: 'Abdominal Supra (Foco Abdômen)', sets: 3, targetReps: '15-20', muscle: 'Abdômen', weight: 0 },
  Glúteos: { name: 'Elevação Pélvica (Foco Glúteos)', sets: 3, targetReps: '10-12', muscle: 'Glúteos', weight: 20 },
  FullBody: null
};"""

target_2 = """const focus = state.focusMuscle;
  if (focus && focus !== 'FullBody' && FOCUS_BONUS_EXERCISES[focus]) {
    const bonus = { ...FOCUS_BONUS_EXERCISES[focus] };
    bonus.weight = Math.round((bonus.weight || 0) * expCfg.weight);
    
    const defaultSets = bonus.sets;
    const overriddenSets = state.workoutSetsOverrides[bonus.name];
    bonus.sets = (overriddenSets !== undefined) ? overriddenSets : defaultSets;
    
    exercises.unshift(bonus);
  }

  const focusNote = focus && focus !== 'FullBody' ? ` · Ênfase: ${focus}` : '';"""

replace_2 = """const focus = state.focusMuscle;
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
  const focusNote = cleanFocusStr ? ` · Ênfase: ${cleanFocusStr}` : '';"""

target_3 = """  // Option selection handlers
  const optionContainers = [
    { step: '2', selector: '[data-step="2"] .option-select-card', field: 'sex' },
    { step: '3', selector: '[data-step="3"] .option-select-card', field: 'mainObjective' },
    { step: '4', selector: '[data-step="4"] .option-select-card', field: 'motivation' },
    { step: '5', selector: '[data-step="5"] .option-select-card', field: 'focusArea' },
    { step: '6', selector: '[data-step="6"] .option-select-card', field: 'class' },
    { step: '7', selector: '[data-step="7"] .option-select-card', field: 'experienceLevel' },
    { step: '8', selector: '[data-step="8"] .option-select-card', field: 'activityLevel' }
  ];"""

replace_3 = """  // Option selection handlers
  const optionContainers = [
    { step: '2', selector: '[data-step="2"] .option-select-card', field: 'sex' },
    { step: '3', selector: '[data-step="3"] .option-select-card', field: 'mainObjective' },
    { step: '4', selector: '[data-step="4"] .option-select-card', field: 'motivation' },
    { step: '6', selector: '[data-step="6"] .option-select-card', field: 'class' },
    { step: '7', selector: '[data-step="7"] .option-select-card', field: 'experienceLevel' },
    { step: '8', selector: '[data-step="8"] .option-select-card', field: 'activityLevel' }
  ];"""

target_4 = """  // Set up option click listeners with auto-advance for fluid UX
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
  });"""

replace_4 = """  // Set up option click listeners with auto-advance for fluid UX
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
  });"""

target_5 = """    const activeFocus = document.querySelector('[data-step="5"] .option-select-card.active');
    userProfile.focusArea = activeFocus ? activeFocus.getAttribute('data-value') : 'FullBody';"""

replace_5 = """    const activeFocusCards = document.querySelectorAll('[data-step="5"] .option-select-card.active');
    const selectedFocus = Array.from(activeFocusCards).map(c => c.getAttribute('data-value'));
    userProfile.focusArea = selectedFocus.join(',') || 'FullBody';"""

target_6 = """let suffix = "do Ginásio";
    if (focus === 'Peito') suffix = "do Supino";
    else if (focus === 'Costas') suffix = "das Asas Gigantes";
    else if (focus === 'Ombros') suffix = "dos Ombros de Aço";
    else if (focus === 'Braços') suffix = "dos Bíceps Mutantes";
    else if (focus === 'Pernas') suffix = "do Agachamento Monstro";"""

replace_6 = """let suffix = "do Ginásio";
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
  else if (focus === 'Glúteos') suffix = "dos Glúteos de Ferro";"""

# Apply replacements
def apply_rep(content, target, replace, desc):
    count = content.count(target)
    if count != 1:
        print(f"ERROR: {desc} match count is {count}, expected 1.")
        os._exit(1)
    content = content.replace(target, replace)
    print(f"Replacement {desc} succeeded.")
    return content

text = apply_rep(text, target_1, replace_1, "1. FOCUS_BONUS_EXERCISES")
text = apply_rep(text, target_2, replace_2, "2. getResolvedWorkoutTemplate")
text = apply_rep(text, target_3, replace_3, "3. optionContainers definition")
text = apply_rep(text, target_4, replace_4, "4. optionContainers loop")
text = apply_rep(text, target_5, replace_5, "5. activeFocus serialization")
text = apply_rep(text, target_6, replace_6, "6. Suffix assignment")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
print("All app.js edits applied successfully and normalized to UTF-8.")
