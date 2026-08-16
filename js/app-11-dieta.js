/* Nutricao e comida
 *
 * Parte 11/14 do antigo app.js (linhas 6674-6749 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
// 18. NUTRITION & FOOD SYSTEMS
// ==========================================
function populateFoodSelector() {
  const select = document.getElementById('diet-select-food');
  select.innerHTML = '';
  
  state.foodsDb.forEach(f => {
    const option = document.createElement('option');
    option.value = f.id;
    // Show short name for official foods, add macros for custom foods
    if (f.isCustom) {
      option.innerText = `${f.name} (${f.prot}g P, ${f.kcal} kcal)`;
    } else {
      option.innerText = f.name;
    }
    select.appendChild(option);
  });
}

function getFoodIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('frango')) return '🍗';
  if (n.includes('arroz')) return '🍚';
  if (n.includes('ovo')) return '🥚';
  if (n.includes('whey')) return '🥛';
  if (n.includes('banana')) return '🍌';
  if (n.includes('batata')) return '🍠';
  if (n.includes('aveia')) return '🌾';
  if (n.includes('feij')) return '🍲';
  if (n.includes('marmita')) return '🍱';
  return '🍴';
}

function renderMealLogs() {
  const container = document.getElementById('diet-history-list');
  container.innerHTML = '';

  if (state.mealLogs.length === 0) {
    container.innerHTML = `
      <div style="padding:16px; text-align:center; font-size:0.75rem; color:var(--text-secondary);">
        Nenhum alimento registrado hoje. Abasteça o shape!
      </div>
    `;
    return;
  }

  state.mealLogs.forEach((m, idx) => {
    const card = document.createElement('div');
    card.className = 'diet-food-card';

    card.innerHTML = `
      <div class="dfc-icon">${getFoodIcon(m.name)}</div>
      <div class="dfc-info">
        <div class="dfc-name">${escapeHtml(m.name)}</div>
        <div class="dfc-weight">${m.weight}g consumidos</div>
      </div>
      <div class="dfc-macros">
        <span class="prot">+${m.prot.toFixed(1)}g P</span>
        <span class="kcal">+${Math.round(m.kcal)} kcal</span>
      </div>
      <button class="dfc-delete" title="Deletar Refeição">✕</button>
    `;

    // Wire delete button
    card.querySelector('.dfc-delete').addEventListener('click', () => {
      playSound('click');
      state.mealLogs.splice(idx, 1);
      saveState();
      updateUI();
    });

    container.appendChild(card);
  });
}

// ==========================================
