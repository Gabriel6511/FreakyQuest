/* Cloud sync (Supabase), login por codigo, amigos e ranking
 *
 * Parte 1/14 do antigo app.js (linhas 1-754 do arquivo original).
 * NAO e um modulo ES: estes arquivos compartilham o mesmo escopo global e
 * SAO CARREGADOS NA ORDEM declarada no index.html. Nao reordene as tags
 * <script> e nao adicione `type="module"` — as funcoes se chamam entre si
 * livremente, como antes.
 */
/* ==========================================================================
   FREAKYQUEST - RPG FITNESS STATE & LOGIC ENGINE (UPGRADED VERSION)
   ========================================================================== */

// Escapa texto vindo do usuário (nomes de exercício/comida custom) antes de injetar via innerHTML
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ==========================================
// CLOUD SYNC (SUPABASE) — login por código enviado por e-mail + sync de progresso
// Login: e-mail sem senha. 1º login = sobe o progresso local atual pra nuvem.
// Logins seguintes (outro aparelho/navegador) = puxa o progresso da nuvem
// e substitui o local (a nuvem vira a fonte da verdade depois do 1º login).
// ==========================================
const SUPABASE_URL = 'https://mhzrmtxaoaipmjlpedvg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IF_vgdgV-aF9XOKkvE3Zng_Ym4Z4l7q';

const supabaseClient = (typeof window !== 'undefined' && window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

let cloudUser = null; // { id, email }
let cloudNickname = null; // apelido salvo em public_profiles.nickname (null = ainda não definido)
let cloudSyncTimer = null;
let cloudSyncing = false;
let cloudSyncDirty = false;
let cloudSyncFailures = 0;
const CLOUD_SYNC_MAX_RETRIES = 4;

// Contador global e cooperativo da Chama Eterna — null até a primeira busca
// no Supabase completar (leitura é pública, não precisa estar logado).
// Enquanto for null, a UI mostra o contador local antigo como fallback.
let globalFlameCount = null;

function isCloudEnabled() {
  return !!supabaseClient;
}

async function initCloudAuth() {
  if (!isCloudEnabled()) return;

  const { data } = await supabaseClient.auth.getSession();
  if (data && data.session && data.session.user) {
    await onCloudLogin(data.session.user);
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session && session.user) {
      onCloudLogin(session.user);
    } else if (event === 'SIGNED_OUT') {
      onCloudLogout();
    }
  });
}

// Busca o contador global da Chama Eterna — leitura é pública (RLS permite
// select pra qualquer um), funciona mesmo deslogado. Só a função de
// incrementar (increment_eternal_flame) exige login, ver triggerEternalFlameSpark.
async function fetchGlobalFlameCount() {
  if (!isCloudEnabled()) return;
  try {
    const { data, error } = await supabaseClient
      .from('eternal_flame')
      .select('clicks')
      .eq('id', 1)
      .maybeSingle();
    if (!error && data) {
      globalFlameCount = data.clicks;
      renderEternalFlameCount();
    }
  } catch (e) {
    console.warn('Falha ao buscar contador global da Chama Eterna', e);
  }
}

// Único lugar que escreve o texto do contador — usado tanto pelo fetch
// inicial quanto pelo clique, pra manter os dois em sincronia.
function renderEternalFlameCount() {
  const flameCountEl = document.getElementById('eternal-flame-count');
  if (!flameCountEl) return;
  const count = globalFlameCount !== null ? globalFlameCount : (state.eternalFlameClicks || 0);
  const label = globalFlameCount !== null ? 'toques de respeito (todo mundo)' : 'toques de respeito';
  flameCountEl.innerText = `${count.toLocaleString('pt-BR')} ${label}`;
}

async function onCloudLogin(user) {
  cloudUser = { id: user.id, email: user.email };
  cloudSyncFailures = 0; // sessão nova começa com o contador de falhas zerado
  updateAccountUI();

  const { data: publicProfile } = await supabaseClient
    .from('public_profiles')
    .select('nickname')
    .eq('id', cloudUser.id)
    .maybeSingle();

  cloudNickname = publicProfile ? publicProfile.nickname : null;

  // Sincroniza SEMPRE (mesmo em conta nova): pullStateFromCloud sabe subir o
  // progresso local quando a nuvem está vazia, puxar quando só a nuvem tem
  // história, e perguntar quando os dois lados têm progresso diferente.
  await pullStateFromCloud();

  if (!cloudNickname) {
    // Só depois de resolver o progresso é que pedimos o apelido, pra os dois
    // modais não aparecerem empilhados.
    const modal = document.getElementById('nickname-modal');
    if (modal) modal.classList.remove('hidden');
  } else {
    await consumePendingInvite();
  }
}

function onCloudLogout() {
  cloudUser = null;
  cloudNickname = null;
  updateAccountUI();
}

// Login por CÓDIGO enviado por e-mail, não por link.
// Motivo: um link aberto a partir do e-mail costuma cair no navegador PADRÃO
// do celular, que pode não ser o mesmo em que a pessoa estava jogando. Como o
// progresso não sincronizado vive no localStorage (que é por navegador), ela
// terminava logada num navegador diferente, com outro progresso — parecendo
// que o salvamento "não funcionou". Com código, a sessão é criada na MESMA
// aba onde a pessoa já está, e o progresso dela sobe certinho.
async function sendLoginCode(email) {
  if (!isCloudEnabled()) return { error: 'Não foi possível carregar o login. Feche e abra o app de novo (ou puxe a tela pra baixo pra recarregar).' };
  const { error } = await supabaseClient.auth.signInWithOtp({ email });
  return { error: error ? error.message : null };
}

async function verifyLoginCode(email, token) {
  if (!isCloudEnabled()) return { error: 'Não foi possível carregar o login. Feche e abra o app de novo (ou puxe a tela pra baixo pra recarregar).' };
  const clean = (token || '').replace(/\D/g, '');
  // O tamanho do código quem define é o painel do Supabase, não o app — nao
  // fixar um numero exato aqui (ja causou bug: o Supabase manda 8 digitos,
  // nao 6). So valida que nao esta vazio/curto demais.
  if (clean.length < 4) return { error: 'Digite o código que chegou no seu e-mail.' };
  const { error } = await supabaseClient.auth.verifyOtp({ email, token: clean, type: 'email' });
  return { error: error ? error.message : null };
}

async function signOutCloud() {
  if (!isCloudEnabled()) return;
  await supabaseClient.auth.signOut();
}

// Apaga o progresso salvo na nuvem pra conta logada (usado pelo botão "Apagar
// dados da nuvem" e pelo reset de progresso, pra não deixar lixo de conta de teste)
async function deleteCloudData() {
  if (!isCloudEnabled() || !cloudUser) return;
  const id = cloudUser.id;
  await supabaseClient.from('friendships').delete().eq('user_id', id);
  await supabaseClient.from('public_profiles').delete().eq('id', id);
  await supabaseClient.from('profiles').delete().eq('id', id);
  await signOutCloud();
}

// Filtro básico de apelido — o apelido aparece no ranking público pra todo
// mundo, então vale barrar o óbvio. Não é moderação completa, só um primeiro
// obstáculo (checa a versão sem acento/repetição pra pegar "pÔrrrra" etc.).
const NICKNAME_BLOCKLIST = [
  'caralho', 'porra', 'buceta', 'bucet', 'foder', 'fuder', 'fodase', 'puta', 'puta',
  'viado', 'viadinho', 'bicha', 'cuzao', 'cuzinho', 'arrombado', 'corno', 'pinto',
  'piroca', 'rola', 'xoxota', 'penis', 'vagina', 'merda', 'bosta', 'fdp', 'pqp',
  'macaco', 'preto', 'nazi', 'nazista', 'hitler', 'estupr', 'pedofil', 'nigg',
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'rape', 'admin', 'moderador'
];

const LEET_MAP = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', '$': 's', '7': 't' };

function nicknameLooksAbusive(nickname) {
  const normalized = nickname
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // tira acentos
    .replace(/[4@31!05$7]/g, (c) => LEET_MAP[c] || c)  // desfaz leetspeak básico
    .replace(/[^a-z]/g, '')                            // tira o resto (números/símbolos)
    .replace(/(.)\1+/g, '$1');                         // colapsa letras repetidas
  return NICKNAME_BLOCKLIST.some(bad => normalized.includes(bad.replace(/(.)\1+/g, '$1')));
}

window.confirmNickname = async function(nickname) {
  const errEl = document.getElementById('nickname-error-msg');
  const clean = (nickname || '').trim().replace(/\s+/g, ' ');
  if (clean.length < 2) {
    if (errEl) errEl.innerText = 'Escolhe um apelido com pelo menos 2 letras.';
    return;
  }
  if (clean.length > 20) {
    if (errEl) errEl.innerText = 'Apelido muito longo (máximo 20 caracteres).';
    return;
  }
  if (nicknameLooksAbusive(clean)) {
    if (errEl) errEl.innerText = 'Escolhe outro apelido — esse não passa no filtro.';
    return;
  }
  if (!cloudUser) return;

  const { error } = await supabaseClient.from('public_profiles').upsert({
    id: cloudUser.id,
    nickname: clean,
    xp: state.xp || 0,
    level: state.level || 1,
    active_mentor: state.activeMentor || null,
    current_streak: state.currentStreak || 0,
    updated_at: new Date().toISOString()
  });

  if (error) {
    if (errEl) errEl.innerText = 'Não deu pra salvar o apelido. Tenta de novo.';
    return;
  }

  cloudNickname = clean;
  errEl.innerText = '';
  const modal = document.getElementById('nickname-modal');
  if (modal) modal.classList.add('hidden');
  await pushStateToCloud(true);
  await consumePendingInvite();
};

// Um progresso é "relevante" quando a pessoa já jogou de verdade — só ter
// passado pelo onboarding não conta como algo que valha a pena disputar.
function progressIsMeaningful(s) {
  if (!s || !s.charName) return false;
  return (s.level || 1) > 1 || (s.xp || 0) > 0 || (s.workoutsCompleted || 0) > 0 ||
         (s.cardioMinutesTotal || 0) > 0 || (s.unlockedTrophies || []).length > 0;
}

function describeProgress(s) {
  if (!s) return '';
  const nome = s.charName || 'Sem nome';
  return `${nome} · Nv ${s.level || 1} · ${s.xp || 0} XP · ${s.workoutsCompleted || 0} treinos`;
}

// Aplica um estado vindo da nuvem na tela (inclusive saindo do onboarding, se
// a conta já tiver personagem criado).
function applyStateFromCloud(cloudState) {
  state = normalizeStateShape(cloudState);
  saveState();
  if (state.charName) {
    const onboardingEl = document.getElementById('screen-onboarding');
    const mainAppEl = document.getElementById('main-app');
    if (onboardingEl) onboardingEl.classList.add('hidden');
    if (mainAppEl) mainAppEl.classList.remove('hidden');
    document.body.classList.toggle('mode-simple', state.appMode === 'simple');
  }
  updateUI();
}

async function pullStateFromCloud() {
  if (!isCloudEnabled() || !cloudUser) return;
  const statusEl = document.getElementById('account-sync-status');
  if (statusEl) statusEl.innerText = 'Sincronizando...';

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('state')
    .eq('id', cloudUser.id)
    .maybeSingle();

  const cloudState = (!error && data && data.state && Object.keys(data.state).length > 0) ? data.state : null;

  if (!cloudState) {
    // Conta sem progresso salvo: o que está no aparelho vira a fonte da verdade.
    if (statusEl) statusEl.innerText = 'Progresso sincronizado.';
    await pushStateToCloud(true);
    return;
  }

  // Os dois lados têm progresso de verdade e são diferentes: NUNCA sobrescrever
  // em silêncio — foi assim que dava pra perder o progresso local sem aviso.
  if (progressIsMeaningful(state) && progressIsMeaningful(cloudState) &&
      JSON.stringify(state) !== JSON.stringify(cloudState)) {
    await askSyncConflict(cloudState);
    if (statusEl) statusEl.innerText = 'Progresso sincronizado.';
    return;
  }

  // Só um dos lados tem progresso relevante: fica com o que tem mais história.
  if (progressIsMeaningful(cloudState) || !progressIsMeaningful(state)) {
    applyStateFromCloud(cloudState);
    if (statusEl) statusEl.innerText = 'Progresso sincronizado.';
  } else {
    await pushStateToCloud(true);
  }
}

function askSyncConflict(cloudState) {
  return new Promise((resolve) => {
    const modal = document.getElementById('sync-conflict-modal');
    if (!modal) { resolve('none'); return; }

    document.getElementById('sync-local-summary').innerText = describeProgress(state);
    document.getElementById('sync-cloud-summary').innerText = describeProgress(cloudState);

    const keepLocal = document.getElementById('sync-keep-local');
    const keepCloud = document.getElementById('sync-keep-cloud');

    // onclick (e não addEventListener) pra sempre sobrescrever o handler
    // anterior — assim não acumula listener se o modal abrir mais de uma vez.
    keepLocal.onclick = async () => {
      playSound('click');
      modal.classList.add('hidden');
      await pushStateToCloud(true); // o do aparelho vence e sobe pra nuvem
      resolve('local');
    };
    keepCloud.onclick = () => {
      playSound('click');
      modal.classList.add('hidden');
      applyStateFromCloud(cloudState);
      resolve('cloud');
    };

    modal.classList.remove('hidden');
  });
}

function scheduleCloudSync() {
  if (!isCloudEnabled() || !cloudUser) return;
  clearTimeout(cloudSyncTimer);
  cloudSyncTimer = setTimeout(() => pushStateToCloud(false), 4000);
}

// Envia imediatamente o que estiver pendente, sem esperar o debounce.
function flushCloudSync() {
  if (!isCloudEnabled() || !cloudUser) return;
  clearTimeout(cloudSyncTimer);
  pushStateToCloud(true);
}

async function pushStateToCloud(immediate) {
  if (!isCloudEnabled() || !cloudUser) return;
  // Se já tem um envio em andamento, marca que ficou coisa nova pra enviar em
  // vez de descartar silenciosamente (senão as últimas mudanças se perdiam).
  if (cloudSyncing) { cloudSyncDirty = true; return; }
  cloudSyncing = true;
  const statusEl = document.getElementById('account-sync-status');
  if (statusEl && !immediate) statusEl.innerText = 'Sincronizando...';

  try {
    const nowIso = new Date().toISOString();
    const { error: profileErr } = await supabaseClient.from('profiles').upsert({
      id: cloudUser.id,
      state: state,
      updated_at: nowIso
    });
    if (profileErr) throw profileErr;

    if (cloudNickname) {
      const { error: publicErr } = await supabaseClient.from('public_profiles').upsert({
        id: cloudUser.id,
        nickname: cloudNickname,
        xp: state.xp || 0,
        level: state.level || 1,
        active_mentor: state.activeMentor || null,
        current_streak: state.currentStreak || 0,
        updated_at: nowIso
      });
      if (publicErr) throw publicErr;
    }

    if (statusEl) {
      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      statusEl.innerText = `Progresso sincronizado às ${timeStr}`;
    }
    cloudSyncFailures = 0;
  } catch (e) {
    // Sem internet / erro do servidor: o progresso continua salvo no aparelho.
    // Tentamos de novo com espera crescente, mas com um limite — sem isso, um
    // erro permanente (sessão expirada, por ex.) viraria um laço infinito de
    // requisições a cada 4s, gastando bateria e rede à toa.
    cloudSyncFailures++;
    console.error('[sync] falha ao enviar progresso', e);
    if (statusEl) statusEl.innerText = 'Sem conexão — progresso salvo no aparelho.';
    if (cloudSyncFailures <= CLOUD_SYNC_MAX_RETRIES) {
      const backoff = Math.min(60000, 4000 * Math.pow(2, cloudSyncFailures - 1));
      clearTimeout(cloudSyncTimer);
      cloudSyncTimer = setTimeout(() => pushStateToCloud(false), backoff);
    }
    // Estourando o limite, paramos de insistir sozinhos: a próxima ação do
    // usuário chama saveState() → scheduleCloudSync() e a tentativa recomeça.
  } finally {
    cloudSyncing = false;
    if (cloudSyncDirty) {
      cloudSyncDirty = false;
      scheduleCloudSync();
    }
  }
}

// Confirma e executa o reset de progresso local. Se a conta estiver logada
// na nuvem, avisa que o progresso salvo lá também some (senão o próximo
// saveState() re-sincronizaria o estado zerado por cima do progresso real).
async function confirmAndResetProgress() {
  const msg = cloudUser
    ? `Você está logado como ${cloudUser.email}. Reiniciar vai apagar o progresso local E o que estava salvo na nuvem dessa conta, e você será desconectado. Continuar?`
    : 'Isso vai apagar todo o seu progresso e voltar ao onboarding. Continuar?';
  if (!confirm(msg)) return false;

  if (cloudUser) {
    await deleteCloudData();
  }
  return true;
}

function updateAccountUI() {
  const loggedOutEl = document.getElementById('account-logged-out');
  const loggedInEl = document.getElementById('account-logged-in');
  const emailEl = document.getElementById('account-user-email');
  if (!loggedOutEl || !loggedInEl) return;

  if (cloudUser) {
    loggedOutEl.classList.add('hidden');
    loggedInEl.classList.remove('hidden');
    if (emailEl) emailEl.innerText = cloudUser.email;
    loadPrivacyToggles();
  } else {
    loggedOutEl.classList.remove('hidden');
    loggedInEl.classList.add('hidden');
  }
}

// Busca os 4 interruptores de compartilhamento salvos e marca os checkboxes
// em Ajustes — chamado sempre que a tela de conta é atualizada (login,
// reabrir Ajustes), não só uma vez, pra nunca mostrar valor desatualizado.
async function loadPrivacyToggles() {
  if (!cloudUser) return;
  const { data, error } = await supabaseClient
    .from('public_profiles')
    .select('share_prs, share_mentors, share_trophies, share_schedule')
    .eq('id', cloudUser.id)
    .maybeSingle();
  if (error || !data) return;
  const map = { 'privacy-share-prs': data.share_prs, 'privacy-share-mentors': data.share_mentors,
    'privacy-share-trophies': data.share_trophies, 'privacy-share-schedule': data.share_schedule };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  });
}

// ==========================================
// AMIGOS & RANKING (usa public_profiles + friendships do Supabase)
// Código de convite = primeiros 8 caracteres do UUID do usuário (já é
// único por natureza, sem precisar de coluna/gerador extra no banco).
// ==========================================
function getMyInviteCode() {
  return cloudUser ? cloudUser.id.slice(0, 8).toUpperCase() : '';
}

function openFriendsModal() {
  const modal = document.getElementById('friends-modal');
  const loggedOutEl = document.getElementById('friends-modal-logged-out');
  const loggedInEl = document.getElementById('friends-modal-logged-in');
  if (!modal) return;

  if (!cloudUser) {
    loggedOutEl.classList.remove('hidden');
    loggedInEl.classList.add('hidden');
  } else {
    loggedOutEl.classList.add('hidden');
    loggedInEl.classList.remove('hidden');
    document.getElementById('my-invite-code').innerText = getMyInviteCode();
    showFriendsView('friends');
    renderFriendsList();
  }
  modal.classList.remove('hidden');
}

function showFriendsView(view) {
  const friendsBtn = document.getElementById('friends-view-toggle-friends');
  const rankingBtn = document.getElementById('friends-view-toggle-ranking');
  const friendsView = document.getElementById('friends-list-view');
  const rankingView = document.getElementById('ranking-list-view');
  const isFriends = view === 'friends';

  friendsBtn.classList.toggle('active', isFriends);
  rankingBtn.classList.toggle('active', !isFriends);
  friendsView.classList.toggle('hidden', !isFriends);
  rankingView.classList.toggle('hidden', isFriends);

  if (isFriends) {
    renderFriendsList();
  } else {
    renderRankingList();
  }
}

function friendRowHTML(p, extra) {
  const you = cloudUser && p.id === cloudUser.id;
  const mentorName = p.active_mentor ? (OFFICIAL_MENTORS.find(m => m.id === p.active_mentor)?.name || p.active_mentor) : '—';
  return `
    <div class="glass-panel friend-row-clickable" data-friend-id="${p.id}" style="padding: 10px 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; ${you ? 'border: 1px solid var(--color-primary);' : ''}">
      ${extra || ''}
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 800; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(p.nickname)}${you ? ' (você)' : ''}</div>
        <div style="font-size: 0.6rem; color: var(--text-secondary);">Nv ${p.level || 1} · ${mentorName} · 🔥 ${p.current_streak || 0}</div>
      </div>
      <div style="font-weight: 800; font-size: 0.75rem; color: var(--color-primary); white-space: nowrap;">${p.xp || 0} XP</div>
      <span style="color: var(--text-muted); font-size: 0.9rem;">›</span>
    </div>
  `;
}

// Abre o card detalhado de um amigo (ou o seu próprio, pra pré-visualizar o
// que os outros veem). Busca via get_friend_card() no banco — a checagem de
// amizade e os toggles de compartilhamento são conferidos DENTRO da função,
// nunca confiando em nada calculado no client.
async function openFriendCard(friendId) {
  if (!cloudUser) return;
  playSound('click');
  const modal = document.getElementById('friend-card-modal');
  modal.classList.remove('hidden');
  document.getElementById('fc-title').innerText = '🪪 Carregando…';

  const { data, error } = await supabaseClient.rpc('get_friend_card', { target_id: friendId });
  if (error || !data) {
    document.getElementById('fc-title').innerText = '🪪 Card do Amigo';
    document.getElementById('fc-name').innerText = 'Não foi possível carregar.';
    document.getElementById('fc-sub').innerText = error ? error.message : '';
    document.getElementById('fc-rpg-sections').classList.add('hidden');
    document.getElementById('fc-simple-sections').classList.add('hidden');
    return;
  }

  document.getElementById('fc-title').innerText = '🪪 Card do Amigo';
  document.getElementById('fc-name').innerText = data.nickname || '—';
  const mentorName = data.active_mentor ? (OFFICIAL_MENTORS.find(m => m.id === data.active_mentor)?.name || data.active_mentor) : null;
  document.getElementById('fc-sub').innerText = mentorName ? `Mentor ativo: ${mentorName}` : 'Sem mentor ativo';
  document.getElementById('fc-level').innerText = data.level || 1;
  document.getElementById('fc-streak').innerText = data.current_streak || 0;

  const isSimpleFriend = data.app_mode === 'simple';
  const rankStat = document.getElementById('fc-rank-stat');
  if (isSimpleFriend) {
    rankStat.classList.add('hidden');
  } else {
    rankStat.classList.remove('hidden');
    document.getElementById('fc-rank').innerText = getHunterRankChar(data.level || 1);
  }

  document.getElementById('fc-rpg-sections').classList.toggle('hidden', isSimpleFriend);
  document.getElementById('fc-simple-sections').classList.toggle('hidden', !isSimpleFriend);

  const prsHTML = (prsObj) => {
    const entries = Object.entries(prsObj || {});
    if (!entries.length) return '<p class="pcm-mentor-mini-empty">Nenhum recorde ainda.</p>';
    return entries.slice(0, 8).map(([ex, w]) => `
      <div class="pcm-record-slot" style="display:flex; justify-content:space-between; padding:6px 10px; background:rgba(0,0,0,0.2); border-radius:8px; margin-bottom:4px; font-size:0.72rem;">
        <span>${escapeHtml(ex)}</span><span style="font-weight:800; color:var(--color-primary);">${w}kg</span>
      </div>`).join('');
  };

  if (isSimpleFriend) {
    document.getElementById('fc-prs-simple').innerHTML = data.shares.prs
      ? prsHTML(data.prs)
      : '<p class="pcm-mentor-mini-empty">Essa pessoa não compartilha os recordes.</p>';

    const daysWrap = document.getElementById('fc-schedule-days');
    const workoutsWrap = document.getElementById('fc-schedule-workouts');
    if (data.shares.schedule && data.training_days) {
      daysWrap.innerHTML = data.training_days.map(d => `<span class="badge" style="background:var(--color-primary); color:#000; font-weight:800; padding:4px 10px; border-radius:8px; font-size:0.7rem;">${d}</span>`).join('');
      const workouts = data.custom_workouts || {};
      workoutsWrap.innerHTML = data.training_days.map((d, idx) => {
        const w = workouts[idx] || workouts[String(idx)];
        const exCount = w && Array.isArray(w.exercises) ? w.exercises.length : 0;
        const title = w && w.title ? w.title : `Ficha de ${d}`;
        return `<div style="padding:8px 10px; background:rgba(0,0,0,0.2); border-radius:8px; font-size:0.72rem;">
          <strong>${d}:</strong> ${escapeHtml(title)} <span style="color:var(--text-muted);">(${exCount} exercício${exCount === 1 ? '' : 's'})</span>
        </div>`;
      }).join('');
    } else {
      daysWrap.innerHTML = '<p class="pcm-mentor-mini-empty">Essa pessoa não compartilha os dias/fichas de treino.</p>';
      workoutsWrap.innerHTML = '';
    }
  } else {
    document.getElementById('fc-prs').innerHTML = data.shares.prs
      ? prsHTML(data.prs)
      : '<p class="pcm-mentor-mini-empty">Essa pessoa não compartilha os recordes.</p>';

    const mentorsWrap = document.getElementById('fc-mentors');
    if (data.shares.mentors && data.mentor_affinities) {
      const ranked = Object.entries(data.mentor_affinities)
        .map(([id, aff]) => ({ id, level: aff.level || 1 }))
        .sort((a, b) => b.level - a.level).slice(0, 2);
      mentorsWrap.innerHTML = ranked.length ? ranked.map(r => {
        const m = OFFICIAL_MENTORS.find(x => x.id === r.id);
        return `<div class="pcm-mentor-mini"><div class="pcm-mentor-mini-name">${m ? m.name : r.id}</div><div class="pcm-mentor-mini-lvl">Nv ${r.level}</div></div>`;
      }).join('') : '<p class="pcm-mentor-mini-empty">Nenhum mentor treinado ainda.</p>';
    } else {
      mentorsWrap.innerHTML = '<p class="pcm-mentor-mini-empty">Essa pessoa não compartilha os mentores.</p>';
    }

    const trophiesWrap = document.getElementById('fc-trophies');
    if (data.shares.trophies && data.showcase_trophies) {
      const shown = data.showcase_trophies.filter(Boolean);
      trophiesWrap.innerHTML = shown.length
        ? shown.map(tid => {
            const t = TROPHIES.find(x => x.id === tid);
            return `<span class="pcm-trophy-badge" title="${t ? escapeHtml(t.name) : tid}" style="font-size:1.4rem;">${t ? t.icon : '🏆'}</span>`;
          }).join('')
        : '<p class="pcm-mentor-mini-empty">Nenhum troféu fixado.</p>';
    } else {
      trophiesWrap.innerHTML = '<p class="pcm-mentor-mini-empty">Essa pessoa não compartilha os troféus.</p>';
    }
  }
}

async function renderFriendsList() {
  const container = document.getElementById('friends-list-container');
  if (!container || !cloudUser) return;
  container.innerHTML = '<p style="font-size:0.7rem; color:var(--text-secondary); text-align:center;">Carregando...</p>';

  // A amizade é guardada numa linha só (quem adicionou → quem foi adicionado),
  // mas vale para os dois lados: lemos nos dois sentidos pra que quem RECEBEU
  // o convite também veja a pessoa na lista dele. A policy de RLS de select já
  // permite ler linhas onde você é user_id OU friend_id.
  const { data: friendships, error: fErr } = await supabaseClient
    .from('friendships')
    .select('user_id, friend_id')
    .or(`user_id.eq.${cloudUser.id},friend_id.eq.${cloudUser.id}`);

  if (fErr || !friendships || friendships.length === 0) {
    container.innerHTML = '<p style="font-size:0.7rem; color:var(--text-secondary); text-align:center; padding: 12px 0;">Você ainda não adicionou nenhum amigo. Compartilha seu código!</p>';
    return;
  }

  const friendIds = [...new Set(
    friendships.map(f => (f.user_id === cloudUser.id ? f.friend_id : f.user_id))
  )];
  const { data: profiles } = await supabaseClient
    .from('public_profiles')
    .select('id, nickname, xp, level, active_mentor, current_streak')
    .in('id', friendIds)
    .order('xp', { ascending: false });

  if (!profiles || profiles.length === 0) {
    container.innerHTML = '<p style="font-size:0.7rem; color:var(--text-secondary); text-align:center; padding: 12px 0;">Você ainda não adicionou nenhum amigo. Compartilha seu código!</p>';
    return;
  }

  container.innerHTML = profiles.map(p => friendRowHTML(p)).join('');
}

async function renderRankingList() {
  const container = document.getElementById('ranking-list-container');
  if (!container || !cloudUser) return;
  container.innerHTML = '<p style="font-size:0.7rem; color:var(--text-secondary); text-align:center;">Carregando...</p>';

  const { data: profiles, error } = await supabaseClient
    .from('public_profiles')
    .select('id, nickname, xp, level, active_mentor, current_streak')
    .order('xp', { ascending: false })
    .limit(50);

  if (error || !profiles || profiles.length === 0) {
    container.innerHTML = '<p style="font-size:0.7rem; color:var(--text-secondary); text-align:center; padding: 12px 0;">Ranking vazio por enquanto.</p>';
    return;
  }

  container.innerHTML = profiles.map((p, i) => {
    const badge = `<span style="font-weight:900; font-size:0.75rem; color:var(--text-secondary); width:20px; text-align:center;">${i + 1}º</span>`;
    return friendRowHTML(p, badge);
  }).join('');
}

// Lógica compartilhada entre o campo manual de código e o link de convite
// automático. Retorna { ok, nickname, reason } sem tocar em UI nenhuma.
async function tryAddFriend(code) {
  const clean = (code || '').trim().toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(clean)) return { ok: false, reason: 'invalid' };
  if (!cloudUser) return { ok: false, reason: 'not_logged_in' };
  if (clean === getMyInviteCode()) return { ok: false, reason: 'self' };

  // `id` é uuid — não dá pra usar ilike (Postgres: "operator does not exist:
  // uuid ~~* unknown"). Como o código são os 8 primeiros dígitos hex do uuid,
  // buscamos pela FAIXA de uuids que começam com esse prefixo.
  const prefix = clean.toLowerCase();
  const { data: matches, error } = await supabaseClient
    .from('public_profiles')
    .select('id, nickname')
    .gte('id', `${prefix}-0000-0000-0000-000000000000`)
    .lte('id', `${prefix}-ffff-ffff-ffff-ffffffffffff`);

  if (error) return { ok: false, reason: 'query_failed', detail: error.message };
  if (!matches || matches.length === 0) return { ok: false, reason: 'not_found' };

  const friend = matches[0];
  const { error: insertError } = await supabaseClient
    .from('friendships')
    .upsert({ user_id: cloudUser.id, friend_id: friend.id }, { onConflict: 'user_id,friend_id' });

  if (insertError) return { ok: false, reason: 'insert_failed', detail: insertError.message };
  return { ok: true, nickname: friend.nickname };
}

async function addFriendByCode(code) {
  const statusEl = document.getElementById('add-friend-status-msg');
  statusEl.innerText = 'Procurando...';

  const result = await tryAddFriend(code);
  const messages = {
    invalid: 'Código inválido — são 8 caracteres (0-9 e A-F).',
    self: 'Esse é o seu próprio código!',
    not_found: 'Nenhum jogador encontrado com esse código.',
    query_failed: 'Erro ao buscar. Confira sua conexão e tente de novo.',
    insert_failed: 'Não deu pra adicionar. Tenta de novo.',
    not_logged_in: 'Você precisa estar logado.'
  };

  if (!result.ok) {
    statusEl.innerText = messages[result.reason] || 'Não deu pra adicionar. Tenta de novo.';
    if (result.detail) console.error('[amigos]', result.reason, result.detail);
    return;
  }

  statusEl.innerText = `${result.nickname} adicionado! 🎉`;
  document.getElementById('add-friend-code-input').value = '';
  renderFriendsList();
}

// Convite por link (?invite=CODIGO): guarda o código no aparelho assim que
// detectado e só processa depois que a pessoa efetivamente logar — ela pode
// precisar passar pelo onboarding/cadastro de e-mail antes disso.
const PENDING_INVITE_KEY = 'freakyquest_pending_invite';

function capturePendingInviteFromURL() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('invite');
  if (code) {
    localStorage.setItem(PENDING_INVITE_KEY, code.toUpperCase());
    params.delete('invite');
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '') + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
  }
}

async function consumePendingInvite() {
  const code = localStorage.getItem(PENDING_INVITE_KEY);
  if (!code || !cloudUser) return;
  localStorage.removeItem(PENDING_INVITE_KEY); // consome uma única vez, mesmo se falhar

  const result = await tryAddFriend(code);
  if (result.ok) {
    showItemAcquiredModal('🤝', 'AMIGO ADICIONADO!', `Você e ${result.nickname} agora podem comparar progresso e aparecer um pro outro na lista de amigos.`, { subtitle: 'CONVITE ACEITO', btnText: 'SHOW!' });
  }
  // reason 'self' ou 'not_found' etc. — falha silenciosa, não vale interromper o usuário com erro por um link.
}

