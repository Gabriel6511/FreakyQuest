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
  } else {
    loggedOutEl.classList.remove('hidden');
    loggedInEl.classList.add('hidden');
  }
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
    <div class="glass-panel" style="padding: 10px 12px; display: flex; align-items: center; gap: 10px; ${you ? 'border: 1px solid var(--color-primary);' : ''}">
      ${extra || ''}
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 800; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(p.nickname)}${you ? ' (você)' : ''}</div>
        <div style="font-size: 0.6rem; color: var(--text-secondary);">Nv ${p.level || 1} · ${mentorName} · 🔥 ${p.current_streak || 0}</div>
      </div>
      <div style="font-weight: 800; font-size: 0.75rem; color: var(--color-primary); white-space: nowrap;">${p.xp || 0} XP</div>
    </div>
  `;
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

// 1. SUB-CLASSES PROGRESSION SYSTEM (RANKS) - UPDATED LEVEL 1 TO "FIT 🤡"
const SUB_CLASSES = {
  bodybuilder: [
    { lvl: 1, name: "FIT 🤡" },
    { lvl: 5, name: "BETA 🐣" },
    { lvl: 10, name: "FRANGO EM CRESCIMENTO 🐓" },
    { lvl: 18, name: "FORTINHO DO BAIRRO 🦁" },
    { lvl: 25, name: "SHAPE LEGAL 🔥" },
    { lvl: 35, name: "GRANDE DA ACADEMIA 🐂" },
    { lvl: 45, name: "MONSTRO INTIMIDADOR 👹" },
    { lvl: 55, name: "ESTRANHO DE VERDADE 👽" },
    { lvl: 65, name: "IMENSO INCONTROLÁVEL 🌋" },
    { lvl: 75, name: "FREAKY SUPREMO 😈🔥" }
  ],
  powerlifter: [
    { lvl: 1, name: "PVC LIFTER 🥖" },
    { lvl: 5, name: "INICIANTE DE BARRA 🏋️" },
    { lvl: 10, name: "SUPINADOR DE 10KG 🥚" },
    { lvl: 18, name: "CAVALO DE CARGA 🐴" },
    { lvl: 25, name: "OGRO DAS ANILHAS 🦍" },
    { lvl: 35, name: "QUEBRADOR DE TERRA 🪨" },
    { lvl: 45, name: "TRATOR HUMANO 🚜" },
    { lvl: 55, name: "FORÇA HERCÚLEA 🏛️" },
    { lvl: 65, name: "TITÃ DE AÇO 🤖" },
    { lvl: 75, name: "FREAKY BEAST 🦖👹" }
  ],
  calistenia: [
    { lvl: 1, name: "GRAVIDADE ZERO 🕸️" },
    { lvl: 5, name: "FRANGO DE BARRA 🍗" },
    { lvl: 10, name: "PRANCHA INSTÁVEL 🤸" },
    { lvl: 18, name: "ACROBATA DE PARQUE 🐒" },
    { lvl: 25, name: "MESTRE DAS PARALELAS 🥷" },
    { lvl: 35, name: "HOMEM-ARANHA DO SHAPE 🕷️" },
    { lvl: 45, name: "REI DA ISOMETRIA 🧱" },
    { lvl: 55, name: "LEVITAÇÃO HUMANA 🛸" },
    { lvl: 65, name: "DESAFIADOR DA FÍSICA 🌀" },
    { lvl: 75, name: "FREAKY SHINOBI 🌀⚡" }
  ],
  maratonista: [
    { lvl: 1, name: "TARTARUGA MANCA 🐢" },
    { lvl: 5, name: "ANDARILHO DE ESTEIRA 🚶" },
    { lvl: 10, name: "CORREDOR RECREATIVO 👟" },
    { lvl: 18, name: "PAPA-LÉGUAS DA PISTA 🦤" },
    { lvl: 25, name: "PULMÃO DE FERRO 🫁" },
    { lvl: 35, name: "VELOCISTA DE ELITE 🐆" },
    { lvl: 45, name: "MARATONISTA LENDÁRIO 🏆" },
    { lvl: 55, name: "CYBORG DO CARDIO 🔌" },
    { lvl: 65, name: "MÁQUINA DE ENDURANCE 🏎️" },
    { lvl: 75, name: "FREAKY RUNNER ⚡🌀" }
  ]
};

// 2. OFFICIAL MENTORS DATABASE — ALL FREE FROM LEVEL 1!
// ─────────────────────────────────────────────────────────────
// GUIA PARA ADICIONAR NOVO MENTOR (ex: mentor #9, #20, #50...):
//   1. Copie um objeto abaixo e ajuste todos os campos
//   2. Adicione o tema CSS em styles.css (body.theme-<id>)
//   3. Adicione as quotes em MENTOR_DASHBOARD_QUOTES
//   4. Adicione uma entrada em MENTOR_REWARD_CONFIGS (ver linha ~405)
//      — NÃO escreva o array de recompensas à mão. O gerador
//      generateMentorRewards() monta as 23 etapas automaticamente
//      a partir desse config, garantindo que todo mentor novo nasça
//      com a MESMA profundidade de progressão que os outros.
//   5. Coloque a imagem na pasta do projeto (nome = avatar field)
//   6. filterCSS: filtro para imagem — 'anime' | 'real' | 'minimal'
//   7. universe: agrupa na aba de mentores (ex: 'Dragon Ball', 'Naruto', 'Fisiculturistas')
//      Para um universo novo (ex: 'Attack on Titan'), basta usar o nome aqui
//      e adicioná-lo em UNIVERSE_ORDER / UNIVERSE_META (ver função MENTORS_LIST_FULL)
// ─────────────────────────────────────────────────────────────
const OFFICIAL_MENTORS = [
  // ══════════════ DRAGON BALL ══════════════
  {
    id: 'goku',
    name: 'Son Goku',
    universe: 'Dragon Ball',
    category: 'anime',
    archetype: 'effort',       // effort | genetics | wisdom | beast | legend
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-goku',
    avatar: 'goku.webp',
    filterCSS: 'contrast(1.5) saturate(2.0) brightness(0.88)',
    quote: '"Oi, eu sou o Goku! Treinar na gravidade 100x vai te deixar insano. Vamos superar nossos limites hoje?"',
    buff: '+15% Força & +5% Foco',
    colorHex: '#f77f00',
    particleType: 'ki',
    isCustom: false
  },
  {
    id: 'brolyz',
    name: 'Broly (Saga Z)',
    universe: 'Dragon Ball',
    category: 'anime',
    archetype: 'beast',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-brolyz',
    avatar: 'brolyz.webp',
    filterCSS: 'contrast(1.6) saturate(1.8) brightness(0.85) hue-rotate(5deg)',
    quote: '"O meu poder é máximo! Kakarotooooo!"',
    buff: '+25% Força & +10% Resistência (Poder Supremo)',
    colorHex: '#adff2f',
    particleType: 'ki',
    isCustom: false
  },
  // ══════════════ NARUTO ══════════════
  {
    id: 'rocklee',
    name: 'Rock Lee',
    universe: 'Naruto',
    category: 'anime',
    archetype: 'effort',
    primaryStat: 'agi',
    levelReq: 1,
    theme: 'theme-rocklee',
    avatar: 'rocklee.webp',
    filterCSS: 'contrast(1.4) saturate(1.9) brightness(0.9)',
    quote: '"O trabalho duro vence o talento natural quando o talento natural não trabalha duro!"',
    buff: '+10% Agilidade & +10% Vigor',
    colorHex: '#38b000',
    particleType: 'leaves',
    isCustom: false
  },
  // ══════════════ ONE PUNCH MAN ══════════════
  {
    id: 'saitama',
    name: 'Saitama',
    universe: 'One Punch Man',
    category: 'anime',
    archetype: 'legend',
    primaryStat: 'res',
    levelReq: 1,
    theme: 'theme-saitama',
    avatar: 'saitama.webp',
    filterCSS: 'contrast(1.45) saturate(1.7) brightness(0.92)',
    quote: '"100 flexões, 100 agachamentos, 100 abdominais e 10 km de corrida todos os dias! Isso é tudo."',
    buff: '+30% Resistência & +30% Agilidade',
    colorHex: '#e63946',
    particleType: 'stars',
    isCustom: false
  },
  // ══════════════ FISICULTURISTAS ══════════════
  {
    id: 'bebezinho',
    name: 'Gabriel Ganley "Bebezinho"',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'legend',
    primaryStat: 'foc',
    levelReq: 1,
    theme: 'theme-bebezinho',
    avatar: 'bebezinho_tribute.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.2) brightness(0.95)',
    quote: '"Wake wake! Abre o olho big! Freaky Season! All Day Neguin!"',
    buff: '+15% Força & +15% Foco (Tributo Especial)',
    colorHex: '#9b5de5',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'ramondino',
    name: 'Ramon Dino',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'genetics',
    primaryStat: 'vig',
    levelReq: 1,
    theme: 'theme-ramondino',
    avatar: 'ramondino.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.2) brightness(0.95)',
    quote: '"Não tem segredo, irmão. É bater o peso certinho, treinar braço pesado e comer limpo! Acorda pro treino!"',
    buff: '+12% Vigor & +8% Força',
    colorHex: '#0077b6',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'arnold',
    name: 'Arnold S.',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'legend',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-arnold',
    avatar: 'arnold.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.25) brightness(0.92)',
    quote: '"Se você quer crescer, tem que passar pela dor. Sinta o pump e venha comigo se quiser ficar gigantesco!"',
    buff: '+20% Força e Hipertrofia Estética',
    colorHex: '#d4af37',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'nickwalker',
    name: 'Nick Walker "The Mutant"',
    universe: 'Fisiculturistas',
    category: 'real',
    archetype: 'genetics',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-nickwalker',
    avatar: 'nickwalker.webp',
    filterCSS: 'contrast(1.3) saturate(0.7) sepia(0.25) brightness(0.92)',
    quote: '"Foque em progredir a carga, treine com intensidade bizarra de verdade e seja um Mutante no ginásio!"',
    buff: '+25% Força & +10% Vigor (Hipertrofia Extrema)',
    colorHex: '#ff5e00',
    particleType: 'embers',
    isCustom: false
  },
  // ══════════════ COREANINHOS ══════════════
  {
    id: 'jin',
    name: 'Jin "Worldwide Handsome"',
    universe: 'Coreaninhos',
    category: 'real',
    archetype: 'genetics',
    primaryStat: 'vig',
    levelReq: 1,
    theme: 'theme-jin',
    avatar: 'jin.webp',
    filterCSS: 'contrast(1.25) saturate(0.7) sepia(0.25) brightness(0.95)',
    quote: '"Bora treinar, gente linda! Aqui quem manda é o mais bonito do mundo — e olha que ele também é o mais disciplinado!"',
    buff: '+15% Vigor & +10% Força',
    colorHex: '#ff8fa3',
    particleType: 'embers',
    isCustom: false
  },
  {
    id: 'namjoon',
    name: 'RM "Namjoon"',
    universe: 'Coreaninhos',
    category: 'real',
    archetype: 'wisdom',
    primaryStat: 'foc',
    levelReq: 1,
    theme: 'theme-namjoon',
    avatar: 'namjoon.webp',
    filterCSS: 'contrast(1.28) saturate(0.7) sepia(0.25) brightness(0.92)',
    quote: '"Treinar o corpo é treinar a mente. Cada série de hoje é um passo pra versão melhor de você amanhã."',
    buff: '+15% Foco & +10% Vigor',
    colorHex: '#5b5f97',
    particleType: 'embers',
    isCustom: false
  },
  // ══════════════ JUJUTSU KAISEN ══════════════
  {
    id: 'sukuna',
    name: 'Ryomen Sukuna',
    universe: 'Jujutsu Kaisen',
    category: 'anime',
    archetype: 'beast',
    primaryStat: 'for',
    levelReq: 1,
    theme: 'theme-sukuna',
    avatar: 'sukuna.webp',
    // Arte oficial (trono de caveiras) ja vem com contraste/saturacao fortes —
    // foge do preset "Anime" padrao pra nao estourar os tons rosa/vermelho.
    filterCSS: 'contrast(1.15) saturate(1.15) brightness(1.0)',
    quote: '"Você acaricia o ferro com medo de machucar as mãos. Ponha peso nessa barra ou aceite ser um inseto."',
    buff: '+30% Força & +15% Agilidade (Domínio Expandido)',
    colorHex: '#c1121f',
    particleType: 'curse',
    isCustom: false
  },
  // ══════════════ SPY X FAMILY ══════════════
  {
    id: 'anya',
    name: 'Anya Forger',
    universe: 'Spy x Family',
    category: 'anime',
    archetype: 'genetics',
    primaryStat: 'foc',
    levelReq: 1,
    theme: 'theme-anya',
    avatar: 'anya.webp',
    // Calibrado lado a lado contra a arte real: o preset "Anime" padrao
    // escurecia demais o rosto dela contra o fundo escuro da academia.
    filterCSS: 'contrast(1.25) saturate(1.45) brightness(0.98)',
    quote: '"Anya sabe... Anya sabe que você pode treinar mais! Waku waku!!"',
    buff: '+15% Foco & +10% Agilidade (Telepatia)',
    colorHex: '#ff6fb0',
    particleType: 'sparkle',
    isCustom: false
  }
];

const MENTOR_DASHBOARD_QUOTES = {
  bebezinho: [
    "Wake wake! Abre o olho big! Freaky Season! All Day Neguin!",
    "Tudo nosso, nada deles! O progresso não para!",
    "Vem com o bebê! Mais um dia de pura dedicação!",
    "Foca no pump, fecha a cara e vai!",
    "A constância é a chave para moldar o herói!"
  ],
  brolyz: [
    "O meu poder é máximo! Kakarotooooo!",
    "Sinta o poder transbordar do seu peitoral!",
    "Não há limites para a fúria dos seus treinos!",
    "Destrua cada barreira hoje!",
    "A força acumulada vai explodir nos pesos!"
  ],
  rocklee: [
    "O trabalho duro vence o talento natural quando o talento natural não trabalha duro!",
    "O fogo da juventude queima dentro de você hoje!",
    "Se você acredita no seu sonho, eu provarei que você pode com trabalho duro!",
    "Mais 100 repetições! Não desista antes do fim!",
    "Um fracassado pode superar um gênio com esforço!"
  ],
  ramondino: [
    "Não tem segredo, irmão. É bater o peso certinho, treinar braço pesado e comer limpo! Acorda pro treino!",
    "Cada grama na balança conta! Foco na dieta hoje!",
    "O Acre tem força bruta! Mostre sua garra!",
    "Não pula o treino de antebraço, hein big!",
    "O shape fala por si só!"
  ],
  goku: [
    "Oi, eu sou o Goku! Treinar na gravidade 100x vai te deixar insano. Vamos superar nossos limites hoje?",
    "Eu estou tão animado para treinar pesado hoje!",
    "Sinto um grande poder vindo de você!",
    "Coma bastante e treine ainda mais!",
    "A dor de hoje é a força de amanhã!"
  ],
  arnold: [
    "Se você quer crescer, tem que passar pela dor. Sinta o pump e venha comigo se quiser ficar gigantesco!",
    "No pain, no gain! Sem esforço não há glória!",
    "A última repetição é o que faz o músculo crescer!",
    "Mantenha a mente focada no músculo e sinta a contração!",
    "Descanse apenas o necessário e volte ao combate!"
  ],
  saitama: [
    "100 flexões, 100 agachamentos, 100 abdominais e 10 km de corrida todos os dias! Isso é tudo.",
    "Você já treinou tanto que está ficando careca?",
    "Apenas faça o que precisa ser feito.",
    "A força de verdade vem de dentro.",
    "Mais um treino normal concluído sem esforço."
  ],
  nickwalker: [
    "Foque em progredir a carga, treine com intensidade bizarra de verdade e seja um Mutante no ginásio!",
    "Cresça a cada treino! O pump é indescritível!",
    "Sem desculpas, coloque mais carga e esmague!",
    "Intensidade bizarra é o nosso padrão!",
    "Você quer ser comum ou quer ser um mutante?"
  ],
  jin: [
    "Bora treinar, gente linda! Aqui quem manda é o mais bonito do mundo!",
    "Disciplina é disciplina — treino não se pula, nem no serviço militar!",
    "Um sorriso confiante e a série de hoje está no bolso!",
    "Já treinou o suficiente pra ficar Worldwide Handsome hoje?",
    "Constância com bom humor: essa é a receita!"
  ],
  namjoon: [
    "Treinar o corpo é treinar a mente. Cada série é um passo à frente.",
    "Reflita, respire e ataque a próxima série com propósito.",
    "O crescimento de hoje é a sabedoria de amanhã.",
    "Equilíbrio: corpo forte, mente tranquila.",
    "Um bom líder também lidera o próprio treino."
  ],
  sukuna: [
    "Pouco peso? Tá indo treinar ou brincar?",
    "Você acaricia o ferro com medo de machucar as mãos.",
    "O músculo não cresce com carinho, ele é moldado quando você o esmaga.",
    "Vai falhar aqui também? Ou vai levantar esse peso e fazer mais uma repetição?",
    "Quem tem poder absoluto destrói os próprios limites. Ponha-se no seu lugar."
  ],
  anya: [
    "Anya sabe... você quer pular o treino hoje. Mas Anya não vai contar pro Chichi!",
    "Treinar deixa Anya waku waku! Vamos ganhar uma Estrela Stella juntos!",
    "Anya wa tensai! E você também pode ser, treinando todo dia!",
    "Se você desistir agora, isso pode causar GUERRA! Continue treinando!",
    "Depois do treino, Anya quer amendoim. Você também merece um prêmio!"
  ]
};

// ─────────────────────────────────────────────────────────────
// TOM DE VOZ DO APP — 3 modos escolhidos pelo usuário em Ajustes.
//
//   faithful → cada mentor fala com referências do próprio universo
//   brutal   → tom único de superioridade/deboche (Sukuna, Vegeta, Escanor)
//   buddy    → tom único acolhedor, sem cobrança de culpa
//
// Regra de escrita do "faithful": se der pra trocar o nome do mentor e a
// frase continuar fazendo sentido, ela está genérica demais — reescreva
// com um gancho que só existe naquele anime/carreira.
//
// Regra de escrita do "brutal": o insulto bate no ESFORÇO e na DESCULPA,
// nunca no corpo ou na aparência do usuário. "Preguiçoso" motiva a voltar;
// comentário sobre corpo faz desinstalar — e iniciante é justamente quem
// mais precisa aparecer no dia seguinte.
//
// Situações: reminder | workoutDone | newRecord | levelUp | comeback
// Placeholders: {exercise} {kg} {level} {days} {name}
// ─────────────────────────────────────────────────────────────
const MESSAGE_TONES = {
  faithful: { id: 'faithful', label: 'Fiel ao Personagem',
    desc: 'Cada mentor fala do jeito dele, com referências do próprio universo.' },
  brutal:   { id: 'brutal',   label: 'Ego Brutal',
    desc: 'Tom de superioridade e deboche. Nenhum elogio de graça.' },
  buddy:    { id: 'buddy',    label: 'Parceiro de Treino',
    desc: 'Tom amigável. Comemora junto e não cobra culpa quando você falha.' }
};

const MENTOR_VOICE_LINES = {
  goku: {
    reminder: 'Ei! Já tá na hora! Eu treinei a 100x a gravidade hoje — vem, quero ver do que você é capaz!',
    workoutDone: 'Uhul, isso foi divertido! Mas eu sei que você ainda tem mais. Amanhã a gente aumenta a gravidade!',
    newRecord: 'Uau, {exercise} com {kg}kg! Tá ficando forte de verdade — isso me deixa animado!',
    levelUp: 'Nível {level}! Sabe o que isso significa? Que agora eu posso treinar sério com você!',
    comeback: 'Você sumiu {days} dias! Tudo bem, o Mestre Kame também dava folga. Mas agora bora, tô ansioso!'
  },
  brolyz: {
    reminder: 'O ferro te chama. E eu... eu sou o diabo que veio te buscar.',
    workoutDone: 'Terminou? HAHAHA! Isso não foi treino. Isso foi aquecimento.',
    newRecord: '{kg}kg no {exercise}. ESMAGUE. Esmague até não sobrar nada. KAKAROT!',
    levelUp: 'Nível {level}. Seu poder cresce... mas ainda é uma fagulha diante do Lendário.',
    comeback: '{days} dias fugindo. Todos fogem. Volte pro ferro antes que eu perca a paciência.'
  },
  rocklee: {
    reminder: 'Você não tem talento? Ótimo — eu não sei usar nem ninjutsu. Só sei treinar. Levanta!',
    workoutDone: 'Terminou? Então tira as caneleiras de peso. Agora sente o quanto você ficou mais rápido!',
    newRecord: '{kg}kg no {exercise}! Isso é o Portão da Abertura cedendo. Faltam sete!',
    levelUp: 'Nível {level}! Guy-sensei estaria orgulhoso! Mas não relaxe, ou são 500 voltas na academia!',
    comeback: 'Faltou {days} dias? Então são 200 flexões de penitência. Eu faria 500. Começa agora!'
  },
  saitama: {
    reminder: 'Ah, hora do treino. 100 flexões, 100 abdominais, 100 agachamentos, 10km. Todo dia. Sem desculpa.',
    workoutDone: 'Ok. Terminou. Amanhã de novo. E depois de amanhã. É só isso mesmo.',
    newRecord: '{kg}kg no {exercise}? Legal. Continua fazendo todo dia por 3 anos e a gente conversa.',
    levelUp: 'Nível {level}. Eu fiquei careca no processo. Você foi avisado.',
    comeback: '{days} dias parado. O problema não é ter faltado — é que a rotina só funciona se for TODO dia.'
  },
  bebezinho: {
    reminder: 'WAKE WAKE! Abre o olho, big! Hoje é ALL DAY, bora pro ferro!',
    workoutDone: 'É ISSO, NEGUIN! Fechou o treino! Freaky Season não para nunca!',
    newRecord: '{kg}kg no {exercise}! Tá ficando FREAKY, big! Aí sim!',
    levelUp: 'Nível {level}! Cresceu, neguin! All day, todo dia — é assim que vira monstro!',
    comeback: 'Sumiu {days} dias, big? Relaxa. Wake wake e bora — o importante é voltar!'
  },
  ramondino: {
    reminder: 'Acorda pro treino, irmão! Não tem segredo: é aparecer todo dia.',
    workoutDone: 'Fechou, irmão! Treino batido é treino batido. Agora come limpo pra render.',
    newRecord: '{kg}kg no {exercise}! Ó o peso subindo certinho, irmão. É assim que constrói.',
    levelUp: 'Nível {level}! Eu saí do Acre pro Olympia batendo peso certinho todo dia. Continua!',
    comeback: '{days} dias fora, irmão? Acontece. Bora voltar hoje mesmo, não deixa pra amanhã.'
  },
  arnold: {
    reminder: 'Chegou a hora. Eu treinava 5 horas por dia no Gold’s Gym. Você consegue dar uma. Vamos!',
    workoutDone: 'Sentiu o pump? Não existe sensação melhor. Eu voltarei amanhã — e você também.',
    newRecord: '{kg}kg no {exercise}! É disso que eu falo. A última repetição é a única que conta.',
    levelUp: 'Nível {level}! Sete títulos de Mr. Olympia não vieram de sorte. Vieram de repetição.',
    comeback: '{days} dias fora? Eu disse que voltaria. Você voltou também. Agora pega o ferro.'
  },
  nickwalker: {
    reminder: 'Hora de treinar. Intensidade bizarra, ou nem apareça.',
    workoutDone: 'Treino fechado. Mas se você não tá tremendo, dava pra ter feito mais.',
    newRecord: '{kg}kg no {exercise}! Progressão de carga é o único caminho. Mutante!',
    levelUp: 'Nível {level}. Mutação em progresso. Não desacelera agora.',
    comeback: '{days} dias sumido. O mutante não descansa. Volta e recupera o tempo perdido.'
  },
  jin: {
    reminder: 'Bora treinar, gente linda! Se eu aguentei o exército, você aguenta uma hora de academia!',
    workoutDone: 'Terminou! E ainda continua bonito. Impressionante, né? Brincadeira... ou não!',
    newRecord: '{kg}kg no {exercise}! Agora é Worldwide Handsome E worldwide forte!',
    levelUp: 'Nível {level}! Como o mais velho aqui, eu autorizo oficialmente você a se orgulhar!',
    comeback: '{days} dias sem aparecer? Tudo bem, eu também já quis dormir até tarde. Bora recomeçar juntos!'
  },
  namjoon: {
    reminder: 'Hora do treino. Hoje não é sobre motivação — é sobre o compromisso que você assumiu ontem.',
    workoutDone: 'Treino concluído. Você não ficou só mais forte: ficou mais coerente com quem quer ser.',
    newRecord: '{kg}kg no {exercise}. Progresso é a prova física de que disciplina funciona.',
    levelUp: 'Nível {level}. Ame a si mesmo o suficiente pra continuar — não pra parar por aqui.',
    comeback: '{days} dias. Você não falhou, só pausou. Recomeçar também é uma forma de liderança.'
  },
  sukuna: {
    reminder: 'O ferro te espera. Não me faça descer até aí, verme.',
    workoutDone: 'Acabou. Não espere elogio por fazer o mínimo.',
    newRecord: '{kg}kg no {exercise}. Finalmente parou de acariciar o ferro.',
    levelUp: 'Nível {level}. Ficou menos patético. Orgulhe-se: você é forte. Para um inseto.',
    comeback: '{days} dias. Você fugiu como o verme que é. Ajoelhe-se e recomece.'
  },
  anya: {
    reminder: 'Anya sabe... Anya leu sua mente e viu que hoje é dia de treino! Waku waku!! Vai, ou pode começar a GUERRA!',
    workoutDone: 'Anya viu tudo escondida atrás do sofá — treino completo! Isso merece uma Estrela Stella! E amendoim 🥜',
    newRecord: '{kg}kg no {exercise}?! Anya wa tensai treinadora! Isso é papel de espiã nível S!',
    levelUp: 'Nível {level}! Chichi ficaria orgulhoso. Anya vai contar pro Bondman hoje à noite!',
    comeback: '{days} dias sumido... Anya quase chorou! Isso quase causou GUERRA. Volta, ou os Tonitrus Bolts vão cair!'
  }
};

const TONE_LINES = {
  brutal: {
    reminder: [
      'Chegou a hora. Ou você vai fingir de novo que "não deu tempo"? Patético. Levanta.',
      'O ferro está lá. Parado. Esperando alguém com coragem. Vai ser você hoje, ou continua sendo ninguém?',
      'Outro dia, outra chance de provar que você não é só conversa. Duvido.'
    ],
    workoutDone: [
      'Terminou. Não confunda cumprir obrigação com mérito. Ninguém aqui vai te aplaudir.',
      'Acabou. Fez o mínimo aceitável. Não se atreva a achar que foi impressionante.',
      'Pronto. Agora você está exatamente onde já deveria estar desde o começo. Nada demais.'
    ],
    newRecord: [
      '{kg}kg no {exercise}. Demorou tempo demais pra algo tão insignificante. Mas enfim parou de brincar.',
      '{kg}kg no {exercise}. Finalmente. Estava na hora de parar de acariciar o ferro.',
      '{exercise}: {kg}kg. Melhorou. Continua fraco, mas melhorou.'
    ],
    levelUp: [
      'Nível {level}. Você continua sendo lixo — só que um lixo levemente menos patético que ontem.',
      'Nível {level}. Não comemore. Isso só prova o quão baixo você começou.',
      'Nível {level}. Um degrau. Faltam mil. Anda.'
    ],
    comeback: [
      '{days} dias sumido. Você é exatamente o tipo que desiste. Provou que eu estava certo. Recomeça — se tiver coragem.',
      '{days} dias. Sua sequência morreu e ninguém sentiu falta. Senta e faz.',
      'Voltou depois de {days} dias. Que patético. Da próxima vez, aguenta.'
    ]
  },
  buddy: {
    reminder: [
      'Oi! Chegou a hora do seu treino 💪 Bora juntos — nem que hoje seja um treino leve.',
      'Passando pra lembrar do treino de hoje! Você consegue, um passo de cada vez 🙌',
      'Hora de se mexer! Lembra: treino feito é sempre melhor que treino perfeito ✨'
    ],
    workoutDone: [
      'Treino concluído! Orgulho de você por ter aparecido hoje 🙌',
      'Isso aí! Mais um treino na conta. Seu eu do futuro agradece 💛',
      'Fechou o treino! Aproveita pra alongar e beber água. Você merece ✨'
    ],
    newRecord: [
      'Olha isso! {kg}kg no {exercise}. Você tá evoluindo de verdade 🎉',
      'Novo recorde no {exercise}: {kg}kg! Tá vendo? O esforço aparece 💪',
      '{kg}kg no {exercise}! Semana passada isso parecia difícil. Olha você agora 🌟'
    ],
    levelUp: [
      'Nível {level}! Cada treino te trouxe até aqui. Bora pro próximo 💛',
      'Subiu pro nível {level}! Isso é constância, não sorte 🎉',
      'Nível {level} desbloqueado! Tô muito feliz por você ✨'
    ],
    comeback: [
      'Que bom te ver de volta! Faltar acontece — o que importa é que você voltou. Recomeçamos juntos 🌱',
      'Oi de novo! {days} dias não apagam o que você já construiu. Bora retomar com calma 💛',
      'Voltou! Sem culpa, tá? Hoje a gente recomeça e está tudo certo 🌱'
    ]
  }
};

// Devolve a fala certa para a situação, já com os placeholders trocados.
// Cai no tom "buddy" se o mentor ativo não tiver linha própria (ex.: mentor
// personalizado criado pelo usuário).
function resolveVoiceLine(situation, vars) {
  vars = vars || {};
  let tone = state.messageTone || 'faithful';
  // Modo Simples não mostra mentor em lugar nenhum — "Fiel" não faz sentido lá.
  if (state.appMode === 'simple' && tone === 'faithful') tone = 'buddy';

  let line = '';
  if (tone === 'faithful') {
    line = (MENTOR_VOICE_LINES[state.activeMentor] || {})[situation] || '';
  }
  if (!line) {
    const pool = (TONE_LINES[tone] || TONE_LINES.buddy)[situation] || [];
    if (pool.length) line = pool[Math.floor(Math.random() * pool.length)];
  }
  if (!line) return '';
  return line.replace(/\{(\w+)\}/g, (full, key) => (vars[key] !== undefined ? vars[key] : full));
}

// 2b. MENTOR REWARDS — Sistema de progressão de Nível 1 ao 30
// ─────────────────────────────────────────────────────────────
// TIER SYSTEM:
//   Nv 1-5   → APRENDIZ  (hook rápido, recompensas visuais básicas)
//   Nv 6-10  → DISCÍPULO (funcionalidades, áudio, protocolo de dieta)
//   Nv 11-15 → GUERREIRO (buffs de atributo, missão exclusiva)
//   Nv 16-20 → VETERANO  (transformações visuais avançadas)
//   Nv 21-25 → ELITE     (raros, title + aura especial)
//   Nv 26-30 → LENDA     (masterização, conteúdo eterno)
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// SISTEMA DE TEMPLATE DE RECOMPENSAS — escala para infinitos mentores
// ─────────────────────────────────────────────────────────────
// Os mentores de hoje são uma "beta". O plano é adicionar MUITOS mais,
// filtrados por anime/universo. Para que todo mentor novo nasça com a
// MESMA estrutura de progressão (23 marcos, do nível 2 ao 30), em vez
// de escrever na mão um array de 20+ linhas por mentor, preenchemos
// um pequeno objeto de "config" e o gerador monta o resto.
//
// COMO ADICIONAR UM MENTOR #9 (ou #50):
//   1. Adicione o mentor em OFFICIAL_MENTORS (id, name, universe, etc.)
//   2. Adicione uma entrada em MENTOR_REWARD_CONFIGS com o mesmo id,
//      preenchendo só as 8 partes realmente exclusivas dele:
//      colorLabel, particleLabel, primaryStat, secondaryStat,
//      tier1 (item nv5), tier2 (efeito nv10), mission (nv13),
//      tier4 (efeito nv20), leaderboardTitle (nv22), finalTitle (nv25),
//      easterDesc (nv29). Tudo o resto (nv 2,3,4,7,8,9,12,14,15,17,
//      18,19,23,27,28,30) é gerado automaticamente com o nome e a cor
//      do mentor — ninguém fica com progressão mais curta que outro.
//   3. generateMentorRewards() roda para todos e popula MENTOR_REWARDS.
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
    // ── APRENDIZ (nv 1-5) ──
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

    // ── DISCÍPULO (nv 6-10) ──
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

    // ── GUERREIRO (nv 11-15) ──
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

    // ── VETERANO (nv 16-20) ──
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

    // ── ELITE (nv 21-25) ──
    { lvl: 22, id: `m_${sc}_22`, type: 'css_class', value: `has-men-${sc}22`, icon: '🏆',
      name: 'Título no Leaderboard Global',
      desc: `Posição especial no ranking global: "${cfg.leaderboardTitle}". Poucos chegam aqui.` },
    { lvl: 23, id: `m_${sc}_23`, type: t5.type, value: t5.value, icon: t5.icon,
      name: t5.name,
      desc: t5.desc },
    { lvl: 25, id: `m_${sc}_25`, type: 'css_class', value: `has-men-${sc}25`, icon: '👑',
      name: `⭐ LENDA — "${cfg.finalTitle}"`,
      desc: `Milestone Lendário! Aura máxima de ${name}. Título ${cfg.finalTitle} desbloqueado para sempre.` },

    // ── LENDA (nv 26-30) ──
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

// ─────────────────────────────────────────────────────────────
// CONFIGS POR MENTOR — só as partes exclusivas de cada um.
// Todo o resto da progressão é gerado por generateMentorRewards().
// PARA ADICIONAR UM MENTOR NOVO: copie um bloco e troque os valores.
// ─────────────────────────────────────────────────────────────
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
  jin: {
    shortcode: 'jin', shortName: 'Jin', name: 'Jin "Worldwide Handsome"', colorLabel: 'Rosa Elegante', particleLabel: 'Brilho charmoso',
    primaryStat: 'vig', secondaryStat: 'for',
    tier1: { type: 'css_class', value: 'has-item-jin', icon: '💪', name: 'Sorriso Worldwide Handsome',
      desc: 'Um brilho charmoso e confiante contorna seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'worldwidehandsome', icon: '🎤', name: 'Risada Icônica',
      desc: 'A risada icônica do Jin ao completar quests. Brilho rosa no card.' },
    mission: { name: 'Disciplina de Sargento', desc: 'Missão semanal: complete todos os treinos da semana sem faltar um dia. Disciplina de quem passou pelo serviço militar!' },
    tier4: { type: 'css_class', value: 'has-men-jin20', icon: '✨', name: 'Aura Worldwide + Badge',
      desc: 'Brilho rosa elegante pulsando em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Worldwide', finalTitle: 'MUNDIALMENTE BONITO',
    easterDesc: 'Uma piada de pescaria do Jin foi resgatada dos bastidores — ele diria que essa foi a maior conquista de todas!'
  },
  namjoon: {
    shortcode: 'nam', shortName: 'RM', name: 'RM "Namjoon"', colorLabel: 'Índigo Reflexivo', particleLabel: 'Brilho contemplativo',
    primaryStat: 'foc', secondaryStat: 'vig',
    tier1: { type: 'css_class', value: 'has-item-namjoon', icon: '📖', name: 'Aura do Líder',
      desc: 'Uma aura índigo serena e ponderada envolve seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'selflove', icon: '🎤', name: 'Discurso Motivacional',
      desc: 'Uma frase de reflexão do RM ao completar quests. Brilho índigo no card.' },
    mission: { name: 'Corpo e Mente', desc: 'Missão semanal: registre uma reflexão e bata sua meta de água por 5 dias seguidos — equilíbrio entre corpo e mente.' },
    tier4: { type: 'css_class', value: 'has-men-nam20', icon: '✨', name: 'Aura do Líder Suprema + Badge',
      desc: 'Brilho índigo máximo pulsando em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Líder', finalTitle: 'LÍDER ETERNO',
    easterDesc: 'Uma citação inédita e filosófica do RM foi resgatada dos bastidores — puro autoconhecimento.'
  },
  sukuna: {
    shortcode: 'suk', shortName: 'Sukuna', name: 'Ryomen Sukuna', colorLabel: 'Vermelho Amaldiçoado', particleLabel: 'Energia amaldiçoada',
    primaryStat: 'for', secondaryStat: 'agi',
    tier1: { type: 'css_class', value: 'has-men-suk5', icon: '💀', name: 'Marca Amaldiçoada',
      desc: 'Uma marca vermelha amaldiçoada surge ao redor do seu avatar de perfil!' },
    tier2: { type: 'sound', value: 'domainexpansion', icon: '🔥', name: 'Eco do Domínio',
      desc: 'Um eco sombrio ao finalizar treino intenso. Aura vermelha máxima no card.' },
    mission: { name: 'Esmague o Limite', desc: 'Missão semanal: supere sua carga máxima em pelo menos 2 exercícios. Sem dó, sem carinho.' },
    tier4: { type: 'css_class', value: 'has-men-suk20', icon: '👹', name: 'Domínio Expandido + Badge',
      desc: 'Aura de Rei das Maldições em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Rei das Maldições', finalTitle: 'DOMÍNIO ABSOLUTO',
    easterDesc: 'Um dedo amaldiçoado foi encontrado escondido no seu inventário... melhor nem perguntar como.'
  },
  anya: {
    shortcode: 'any', shortName: 'Anya', name: 'Anya Forger', colorLabel: 'Rosa Waku Waku', particleLabel: 'Faíscas telepáticas',
    primaryStat: 'foc', secondaryStat: 'agi',
    tier1: { type: 'css_class', value: 'has-men-any5', icon: '🧠', name: 'Telepatia Desperta',
      desc: 'Um brilho rosa contorna seu nome — a Anya está de olho nos seus pensamentos!' },
    tier2: { type: 'sound', value: 'wakuwaku', icon: '🥜', name: '"Waku Waku!" ao Completar',
      desc: 'O grito de animação da Anya toca ao completar quests. Ela AMA ver você vencer!' },
    mission: { name: 'Operação Strix', desc: 'Missão semanal: treine 5 dias sem faltar — segundo a Anya, isso evita a Terceira Guerra Mundial!' },
    tier4: { type: 'css_class', value: 'has-men-any20', icon: '🕵️', name: 'Disfarce de Espiã + Badge',
      desc: 'Tema de espionagem ativado em toda a UI. Badge de elite no perfil.' },
    leaderboardTitle: 'Elite Operação Strix', finalTitle: 'ANYA WA TENSAI',
    easterDesc: 'Um pacote secreto de amendoins foi encontrado escondido no seu inventário... Anya jura que não foi ela quem comeu metade.'
  },
};

// MENTOR_REWARDS é construído automaticamente a partir dos configs acima.
// Mentores novos só precisam de uma entrada em MENTOR_REWARD_CONFIGS —
// nenhuma linha extra de array precisa ser escrita à mão.
const MENTOR_REWARDS = {};
Object.keys(MENTOR_REWARD_CONFIGS).forEach(mentorId => {
  MENTOR_REWARDS[mentorId] = generateMentorRewards(MENTOR_REWARD_CONFIGS[mentorId]);
});

// 2c. EQUIPMENT DATABASE & HELPERS
const EQUIPMENT_DATABASE = [
  {
    id: 'item_faixa',
    name: 'Faixa do Rock Lee',
    slot: 'head',
    icon: 'faixa_lee_icon.webp',
    desc: 'Sua agilidade foi notada. Ganha uma borda verde neon no seu avatar.',
    stats: { agi: 5 },
    unlockDesc: 'Desbloqueia no Nível Geral 5 ou Mentor Rock Lee Nível 5.',
    equivalentIds: ['item_faixa', 'has-item-faixa']
  },
  {
    id: 'item_bracelete',
    name: 'Braceletes de Aço',
    slot: 'arms',
    icon: 'braceletes_aco_icon.webp',
    desc: 'Braceletes de metal pesados equipados ao lado do seu nome.',
    stats: { res: 5 },
    unlockDesc: 'Desbloqueia no Nível Geral 10.',
    equivalentIds: ['item_bracelete', 'has-item-bracelete']
  },
  {
    id: 'item_aura',
    name: 'Aura de Super Saiyajin',
    slot: 'aura',
    icon: 'aura_goku_icon.webp',
    desc: 'Uma aura de chamas douradas brilha ao redor do seu avatar.',
    stats: { for: 8, foc: 4 },
    unlockDesc: 'Desbloqueia no Nível Geral 20 ou Mentor Goku Nível 5.',
    equivalentIds: ['item_aura', 'has-item-aura']
  },
  {
    id: 'item_cinturão',
    name: 'Cinturão de Ouro',
    slot: 'waist',
    icon: 'cinturao_ouro_icon.webp',
    desc: 'O Cinturão de Ouro de Arnold. Confere uma borda dourada nos seus cards.',
    stats: { for: 10 },
    equivalentIds: ['item_cinturão', 'has-item-cinturo', 'has-item-cinturão'],
    unlockDesc: 'Desbloqueia no Nível Geral 30 ou Mentor Arnold Nível 10.'
  },
  {
    id: 'item_aurabroly',
    name: 'Aura Lendária de Broly Z',
    slot: 'aura',
    icon: 'aura_broly_icon.webp',
    desc: 'Uma aura colossal de chamas verde néon brilha no seu avatar.',
    stats: { for: 12, res: 6 },
    unlockDesc: 'Desbloqueia no Nível Geral 40 ou Mentor Broly Nível 5.',
    equivalentIds: ['item_aurabroly', 'has-item-aurabroly']
  },
  {
    id: 'item_capa',
    name: 'Capa do Saitama',
    slot: 'aura',
    icon: 'capa_saitama_icon.webp',
    desc: 'A capa branca lendária flutua atrás do seu avatar.',
    stats: { res: 15, agi: 10 },
    unlockDesc: 'Desbloqueia no Nível Geral 50 ou Mentor Saitama Nível 5.',
    equivalentIds: ['item_capa', 'has-item-capa']
  },
  {
    id: 'item_jin',
    name: 'Sorriso Worldwide Handsome',
    slot: 'aura',
    icon: 'sorriso_jin_icon.webp',
    desc: 'Um brilho charmoso e confiante contorna seu avatar de perfil.',
    stats: { vig: 5 },
    unlockDesc: 'Desbloqueia no Mentor Jin Nível 5.',
    equivalentIds: ['item_jin', 'has-item-jin']
  },
  {
    id: 'item_namjoon',
    name: 'Aura do Líder',
    slot: 'aura',
    icon: 'coroa_lider_icon.webp',
    desc: 'Uma aura índigo serena e ponderada envolve seu avatar de perfil.',
    stats: { foc: 5 },
    unlockDesc: 'Desbloqueia no Mentor RM Nível 5.',
    equivalentIds: ['item_namjoon', 'has-item-namjoon']
  },

  // ─────────────────────────────────────────────────────────────
  // LEVA 2026-08-12 — 30 itens novos, 3 por mentor (4 na Anya).
  //
  // Os níveis usados (4/9/19/30) NÃO são arbitrários: são os níveis em que
  // generateMentorRewards() emite uma recompensa do tipo `css_class`, que é
  // o único tipo que checkMentorRewards() empurra pra state.unlockedItems.
  // Por isso cada item traz o `has-men-<shortcode><nível>` correspondente em
  // equivalentIds — é ele que destrava o item, não o texto de unlockDesc.
  // Ver docs/MENTOR_CRITERIA.md seção 7.
  // ─────────────────────────────────────────────────────────────

  // ══ GOKU ══
  { id: 'item_kame', name: 'Símbolo da Tartaruga', slot: 'badge', icon: 'simbolo_kame_icon.webp',
    desc: 'O kanji 亀 da Escola Tartaruga marcado no seu perfil. Treino do Mestre Kame validado.',
    stats: { foc: 8, for: 4 }, unlockDesc: 'Desbloqueia no Mentor Goku Nível 19.',
    equivalentIds: ['item_kame', 'has-men-gok19'] },
  { id: 'item_kaioken', name: 'Punhos do Kaioken', slot: 'hands', icon: 'punhos_kaioken_icon.webp',
    desc: 'Seus punhos queimam em chamas vermelhas. Kaioken multiplica tudo — inclusive o risco.',
    stats: { for: 12, foc: 6 }, unlockDesc: 'Desbloqueia no Mentor Goku Nível 30.',
    equivalentIds: ['item_kaioken', 'has-men-gok30'] },

  // ══ BROLY ══
  { id: 'item_paragus', name: 'Coroa de Paragus', slot: 'badge', icon: 'coroa_paragus_icon.webp',
    desc: 'A tiara de controle que segurava o Lendário. Você decide se ela te contém ou te liberta.',
    stats: { for: 8, res: 4 }, unlockDesc: 'Desbloqueia no Mentor Broly Nível 19.',
    equivalentIds: ['item_paragus', 'has-men-bro19'] },
  { id: 'item_punhosbroly', name: 'Punhos do Lendário', slot: 'hands', icon: 'punhos_broly_icon.webp',
    desc: 'Punhos colossais envoltos em energia verde. Não existe peso, só coisas a serem esmagadas.',
    stats: { for: 12, res: 6 }, unlockDesc: 'Desbloqueia no Mentor Broly Nível 30.',
    equivalentIds: ['item_punhosbroly', 'has-men-bro30'] },

  // ══ ROCK LEE ══
  { id: 'item_caneleiras', name: 'Caneleiras de Peso', slot: 'legs', icon: 'caneleiras_lee_icon.webp',
    desc: 'As caneleiras que o Lee treina o tempo todo. Quando você tirar, vai se assustar com a própria velocidade.',
    stats: { agi: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor Rock Lee Nível 19.',
    equivalentIds: ['item_caneleiras', 'has-men-lee19'] },
  { id: 'item_oitavoportao', name: 'Oitavo Portão', slot: 'aura', icon: 'oitavo_portao_icon.webp',
    desc: 'O último dos Oito Portões Internos. Poder absoluto ao custo do próprio corpo.',
    stats: { agi: 12, vig: 6 }, unlockDesc: 'Desbloqueia no Mentor Rock Lee Nível 30.',
    equivalentIds: ['item_oitavoportao', 'has-men-lee30'] },

  // ══ SAITAMA ══
  { id: 'item_luvassaitama', name: 'Luvas Vermelhas do Herói', slot: 'hands', icon: 'luvas_saitama_icon.webp',
    desc: 'As luvas vermelhas do Careca Capa. Simples, como tudo que funciona.',
    stats: { res: 8, agi: 4 }, unlockDesc: 'Desbloqueia no Mentor Saitama Nível 19.',
    equivalentIds: ['item_luvassaitama', 'has-men-sai19'] },
  { id: 'item_registroheroi', name: 'Registro de Herói', slot: 'badge', icon: 'registro_heroi_icon.webp',
    desc: 'Sua licença oficial da Associação de Heróis. O ranking não importa — a rotina importa.',
    stats: { res: 12, agi: 6 }, unlockDesc: 'Desbloqueia no Mentor Saitama Nível 30.',
    equivalentIds: ['item_registroheroi', 'has-men-sai30'] },

  // ══ BEBEZINHO ══
  { id: 'item_seloallday', name: 'Selo All Day', slot: 'badge', icon: 'selo_allday_icon.webp',
    desc: 'O selo da filosofia All Day. Wake wake, big — todo dia, sem exceção.',
    stats: { foc: 5 }, unlockDesc: 'Desbloqueia no Mentor Bebezinho Nível 9.',
    equivalentIds: ['item_seloallday', 'has-men-beb9'] },
  { id: 'item_legpress500', name: 'Leg Press 500kg', slot: 'legs', icon: 'legpress_500_icon.webp',
    desc: 'O feito que rodou o mundo. 500kg no leg press, tributo eterno ao Bebezinho.',
    stats: { for: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor Bebezinho Nível 19.',
    equivalentIds: ['item_legpress500', 'has-men-beb19'] },
  { id: 'item_aurafreaky', name: 'Aura Freaky Season', slot: 'aura', icon: 'aura_freaky_icon.webp',
    desc: 'Aura roxa e dourada em chamas. Freaky Season não tem data pra acabar.',
    stats: { foc: 12, for: 6 }, unlockDesc: 'Desbloqueia no Mentor Bebezinho Nível 30.',
    equivalentIds: ['item_aurafreaky', 'has-men-beb30'] },

  // ══ RAMON DINO ══
  { id: 'item_cintaclassic', name: 'Cinta Classic Physique', slot: 'waist', icon: 'cinta_classic_icon.webp',
    desc: 'A cinta fina de posing do Classic Physique. Cintura fina, dorsal larga.',
    stats: { vig: 5 }, unlockDesc: 'Desbloqueia no Mentor Ramon Dino Nível 9.',
    equivalentIds: ['item_cintaclassic', 'has-men-ram9'] },
  { id: 'item_seloolympia', name: 'Selo Olympia Classic', slot: 'badge', icon: 'selo_olympia_icon.webp',
    desc: 'A medalha do palco mais alto do mundo. Do Acre pro Olympia, batendo peso certinho.',
    stats: { vig: 8, for: 4 }, unlockDesc: 'Desbloqueia no Mentor Ramon Dino Nível 19.',
    equivalentIds: ['item_seloolympia', 'has-men-ram19'] },
  { id: 'item_auradino', name: 'Aura Verde-Amarela', slot: 'aura', icon: 'aura_dino_icon.webp',
    desc: 'Verde e amarelo pulsando ao seu redor. Representação brasileira de elite.',
    stats: { vig: 12, for: 6 }, unlockDesc: 'Desbloqueia no Mentor Ramon Dino Nível 30.',
    equivalentIds: ['item_auradino', 'has-men-ram30'] },

  // ══ ARNOLD ══
  { id: 'item_luvasarnold', name: 'Luvas da Golden Era', slot: 'hands', icon: 'luvas_arnold_icon.webp',
    desc: 'Luvas de couro sem dedo, direto do Gold\'s Gym de Venice Beach. Puro pump.',
    stats: { for: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor Arnold Nível 19.',
    equivalentIds: ['item_luvasarnold', 'has-men-arn19'] },
  { id: 'item_sandow', name: 'Troféu Sandow', slot: 'badge', icon: 'trofeu_sandow_icon.webp',
    desc: 'A estatueta do Mr. Olympia. Arnold levantou sete. Você está no caminho.',
    stats: { for: 12, vig: 6 }, unlockDesc: 'Desbloqueia no Mentor Arnold Nível 30.',
    equivalentIds: ['item_sandow', 'has-men-arn30'] },

  // ══ NICK WALKER ══
  { id: 'item_straps', name: 'Straps do Mutante', slot: 'arms', icon: 'straps_mutante_icon.webp',
    desc: 'Straps de levantamento. Quando a pegada falha antes do músculo, o problema é a pegada.',
    stats: { for: 5 }, unlockDesc: 'Desbloqueia no Mentor Nick Walker Nível 9.',
    equivalentIds: ['item_straps', 'has-men-nic9'] },
  { id: 'item_cinturaoclassic', name: 'Cinturão Arnold Classic', slot: 'waist', icon: 'cinturao_classic_icon.webp',
    desc: 'O cinturão de campeão do Arnold Classic 2021. Intensidade bizarra premiada.',
    stats: { for: 8, res: 4 }, unlockDesc: 'Desbloqueia no Mentor Nick Walker Nível 19.',
    equivalentIds: ['item_cinturaoclassic', 'has-men-nic19'] },
  { id: 'item_auramutante', name: 'Aura Mutante', slot: 'aura', icon: 'aura_mutante_icon.webp',
    desc: 'Chamas laranja irregulares te envolvem. A mutação está completa.',
    stats: { for: 12, res: 6 }, unlockDesc: 'Desbloqueia no Mentor Nick Walker Nível 30.',
    equivalentIds: ['item_auramutante', 'has-men-nic30'] },

  // ══ JIN ══
  { id: 'item_medalhajin', name: 'Medalha do Serviço Militar', slot: 'badge', icon: 'medalha_jin_icon.webp',
    desc: 'Disciplina comprovada em campo. Se aguentou o exército, aguenta o treino de hoje.',
    stats: { vig: 8, for: 4 }, unlockDesc: 'Desbloqueia no Mentor Jin Nível 19.',
    equivalentIds: ['item_medalhajin', 'has-men-jin19'] },
  { id: 'item_luvasjin', name: 'Luvas Rosa Elegantes', slot: 'hands', icon: 'luvas_jin_icon.webp',
    desc: 'Treinar pesado sem abrir mão do estilo. Worldwide Handsome até na série falha.',
    stats: { vig: 12, for: 6 }, unlockDesc: 'Desbloqueia no Mentor Jin Nível 30.',
    equivalentIds: ['item_luvasjin', 'has-men-jin30'] },

  // ══ RM (NAMJOON) ══
  { id: 'item_fonesrm', name: 'Fones de Estúdio', slot: 'head', icon: 'fones_rm_icon.webp',
    desc: 'O mundo lá fora silencia. Só existe você, o ferro e a próxima repetição.',
    stats: { foc: 8, vig: 4 }, unlockDesc: 'Desbloqueia no Mentor RM Nível 19.',
    equivalentIds: ['item_fonesrm', 'has-men-nam19'] },
  { id: 'item_selorm', name: 'Selo Speak Yourself', slot: 'badge', icon: 'selo_rm_icon.webp',
    desc: 'Treinar o corpo é treinar a mente. Ame a si mesmo o suficiente pra continuar.',
    stats: { foc: 12, vig: 6 }, unlockDesc: 'Desbloqueia no Mentor RM Nível 30.',
    equivalentIds: ['item_selorm', 'has-men-nam30'] },

  // ══ SUKUNA ══
  { id: 'item_dedosukuna', name: 'Dedo Amaldiçoado', slot: 'badge', icon: 'dedo_sukuna_icon.webp',
    desc: 'Um dos vinte dedos do Rei das Maldições. Guardá-lo já é um ato de coragem.',
    stats: { for: 5 }, unlockDesc: 'Desbloqueia no Mentor Sukuna Nível 9.',
    equivalentIds: ['item_dedosukuna', 'has-men-suk9'] },
  { id: 'item_quatrobracos', name: 'Quatro Braços do Rei', slot: 'arms', icon: 'quatro_bracos_icon.webp',
    desc: 'Quatro braços para dobrar o volume de treino. Nenhuma desculpa sobrevive a isso.',
    stats: { for: 8, agi: 4 }, unlockDesc: 'Desbloqueia no Mentor Sukuna Nível 19.',
    equivalentIds: ['item_quatrobracos', 'has-men-suk19'] },
  { id: 'item_santuario', name: 'Santuário Malevolente', slot: 'aura', icon: 'santuario_icon.webp',
    desc: 'Expansão de Domínio. Dentro dela, o único resultado possível é o corte.',
    stats: { for: 12, agi: 6 }, unlockDesc: 'Desbloqueia no Mentor Sukuna Nível 30.',
    equivalentIds: ['item_santuario', 'has-men-suk30'] },

  // ══ ANYA ══ (único mentor com 4 itens — o Minduim é bônus)
  { id: 'item_minduim', name: 'Minduim da Anya', slot: 'hands', icon: 'minduim_anya_icon.webp',
    desc: 'O amendoim favorito da Anya, guardado com carinho. Combustível oficial de quem treina waku waku.',
    stats: { vig: 3, foc: 2 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 4.',
    equivalentIds: ['item_minduim', 'has-men-any4'] },
  { id: 'item_stella', name: 'Estrela Stella', slot: 'badge', icon: 'estrela_stella_icon.webp',
    desc: 'A Estrela Stella da Eden Academy. A Anya passou o treino todo torcendo por essa.',
    stats: { foc: 5 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 9.',
    equivalentIds: ['item_stella', 'has-men-any9'] },
  { id: 'item_lacosanya', name: 'Laços Cor-de-Rosa', slot: 'head', icon: 'lacos_anya_icon.webp',
    desc: 'Os laços icônicos da Anya. Ninguém desconfia que são chifres de verdade.',
    stats: { foc: 8, agi: 4 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 19.',
    equivalentIds: ['item_lacosanya', 'has-men-any19'] },
  { id: 'item_bond', name: 'Bond ao seu Lado', slot: 'aura', icon: 'bond_anya_icon.webp',
    desc: 'Bond, o cão precognitivo da família Forger (batizado por causa do Bondman), aparece guardando seu treino. Ele já viu você terminando essa série.',
    stats: { foc: 12, agi: 6 }, unlockDesc: 'Desbloqueia no Mentor Anya Nível 30.',
    equivalentIds: ['item_bond', 'has-men-any30'] }
];

function getEffectiveAttributes() {
  const eff = {
    for: state.attributes.for || 10,
    res: state.attributes.res || 10,
    agi: state.attributes.agi || 10,
    vig: state.attributes.vig || 10,
    foc: state.attributes.foc || 10
  };
  
  if (state.equippedItems) {
    Object.values(state.equippedItems).forEach(itemId => {
      if (itemId) {
        const item = EQUIPMENT_DATABASE.find(i => i.id === itemId);
        if (item && item.stats) {
          for (const [stat, val] of Object.entries(item.stats)) {
            if (eff[stat] !== undefined) {
              eff[stat] += val;
            }
          }
        }
      }
    });
  }
  return eff;
}

function isItemUnlocked(item) {
  if (!state.unlockedItems) return false;
  return item.equivalentIds.some(id => state.unlockedItems.includes(id));
}

// Acha o item de EQUIPMENT_DATABASE que uma recompensa da progressão do
// mentor realmente desbloqueia (mesmo `value` presente em equivalentIds).
function findEquipmentItemForReward(reward) {
  if (!reward || reward.type !== 'css_class') return null;
  return EQUIPMENT_DATABASE.find(i => i.equivalentIds.includes(reward.value)) || null;
}

// Ícone + texto pra mostrar numa notificação/prévia de recompensa: troca os
// dois pelo do item real quando existe um, não só o ícone — senão a linha
// mistura o ícone certo com uma legenda genérica de outro milestone (ex.:
// ícone das Caneleiras do Lee do lado do texto "Animação cinemática ao
// treinar", que é sobre outra coisa).
//
// Só os níveis 5/10/20 (tier1/tier2/tier4 em generateMentorRewards) têm o
// nome escrito à mão pra já descrever o item vinculado — esses ficam como
// estão. Os "⭐ LENDA"/"⭐ ETERNO" de 25/30 são flavor de maestria genérico
// SEMPRE, mesmo quando o mesmo nível também libera um item de verdade
// (ex.: Bond da Anya no Nv30) — por isso não usar "nome começa com ⭐" como
// critério, e sim o nível exato.
function getRewardDisplayInfo(reward) {
  const item = findEquipmentItemForReward(reward);
  if (!item) return { icon: reward.icon, name: reward.name, desc: reward.desc };
  const isHandWrittenTierName = [5, 10, 20].includes(reward.lvl);
  return {
    icon: item.icon,
    name: isHandWrittenTierName ? reward.name : item.name,
    desc: isHandWrittenTierName ? reward.desc : item.desc
  };
}

// 3. EXERCISE TEMPLATES BY CLASS
const WORKOUT_TEMPLATES = {
  bodybuilder: {
    A: {
      title: "Treino A - Peito & Tríceps",
      desc: "Foco total na hipertrofia peitoral e pump insano de tríceps.",
      exercises: [
        { name: "Supino Reto (Barra)", sets: 4, targetReps: "8-12", muscle: "Peito", weight: 40 },
        { name: "Supino Inclinado (Halteres)", sets: 4, targetReps: "10-12", muscle: "Peito", weight: 18 },
        { name: "Crossover no Pulley", sets: 3, targetReps: "12-15", muscle: "Peito", weight: 20 },
        { name: "Tríceps Testa", sets: 3, targetReps: "10-12", muscle: "Tríceps", weight: 15 },
        { name: "Tríceps Corda (Pulley)", sets: 4, targetReps: "12-15", muscle: "Tríceps", weight: 25 }
      ]
    },
    B: {
      title: "Treino B - Costas & Bíceps",
      desc: "Expansão dorsal e contração máxima para braços gigantescos.",
      exercises: [
        { name: "Puxada Alta (Pulley)", sets: 4, targetReps: "10-12", muscle: "Costas", weight: 45 },
        { name: "Remada Curvada (Barra)", sets: 4, targetReps: "8-12", muscle: "Costas", weight: 35 },
        { name: "Rosca Direta W", sets: 4, targetReps: "8-12", muscle: "Bíceps", weight: 12 },
        { name: "Rosca Martelo Alternada", sets: 3, targetReps: "10-12", muscle: "Bíceps", weight: 14 },
        { name: "Encolhimento (Halteres)", sets: 3, targetReps: "12-15", muscle: "Trapezio", weight: 24 }
      ]
    },
    C: {
      title: "Treino C - Pernas & Ombros",
      desc: "Destruindo quadríceps e alargando ombros estilo armadura.",
      exercises: [
        { name: "Agachamento Livre", sets: 4, targetReps: "8-12", muscle: "Pernas", weight: 50 },
        { name: "Leg Press 45°", sets: 4, targetReps: "10-12", muscle: "Pernas", weight: 120 },
        { name: "Cadeira Flexora", sets: 3, targetReps: "12-15", muscle: "Pernas", weight: 35 },
        { name: "Desenvolvimento com Halteres", sets: 4, targetReps: "8-12", muscle: "Ombros", weight: 16 },
        { name: "Elevação Lateral", sets: 4, targetReps: "12-15", muscle: "Ombros", weight: 8 }
      ]
    }
  },
  powerlifter: {
    A: {
      title: "Treino A - Supino (Bench Press Day)",
      desc: "Trabalho de força máxima na barra horizontal.",
      exercises: [
        { name: "Supino Reto Competitivo", sets: 5, targetReps: "3-5", muscle: "Peito", weight: 60 },
        { name: "Supino Inclinado c/ Barra", sets: 3, targetReps: "5-6", muscle: "Peito", weight: 50 },
        { name: "Supino Fechado (Tríceps)", sets: 4, targetReps: "6-8", muscle: "Braços", weight: 45 },
        { name: "Desenvolvimento Militar (OHP)", sets: 4, targetReps: "5", muscle: "Ombros", weight: 30 }
      ]
    },
    B: {
      title: "Treino B - Levantamento Terra (Deadlift Day)",
      desc: "Força nas costas, glúteos e pegada esmagadora de aço.",
      exercises: [
        { name: "Levantamento Terra (Deadlift)", sets: 5, targetReps: "3", muscle: "Costas", weight: 80 },
        { name: "Remada Curvada Pesada", sets: 4, targetReps: "5", muscle: "Costas", weight: 55 },
        { name: "Barra Fixa com Carga", sets: 3, targetReps: "5", muscle: "Costas", weight: 5 },
        { name: "Prancha Abdominal com Anilha", sets: 3, targetReps: "60s", muscle: "Cardio", weight: 10 }
      ]
    },
    C: {
      title: "Treino C - Agachamento (Squat Day)",
      desc: "Força pura nas pernas para agachar até o chão.",
      exercises: [
        { name: "Agachamento Livre (Barra)", sets: 5, targetReps: "3-5", muscle: "Pernas", weight: 70 },
        { name: "Agachamento Pausado", sets: 3, targetReps: "5", muscle: "Pernas", weight: 55 },
        { name: "Good Morning (Bom Dia)", sets: 3, targetReps: "8", muscle: "Pernas", weight: 30 },
        { name: "Elevação de Gêmeos em Pé", sets: 4, targetReps: "12-15", muscle: "Pernas", weight: 40 }
      ]
    }
  },
  calistenia: {
    A: {
      title: "Treino A - Empurrar & Paralelas",
      desc: "Controle de empurrar usando peso corporal e gravidade.",
      exercises: [
        { name: "Dips (Paralelas)", sets: 4, targetReps: "8-12", muscle: "Braços", weight: 0 },
        { name: "Flexões Declinadas", sets: 4, targetReps: "12-15", muscle: "Peito", weight: 0 },
        { name: "Pike Pushups (Ombro)", sets: 3, targetReps: "8-10", muscle: "Ombros", weight: 0 },
        { name: "Tríceps no Banco", sets: 3, targetReps: "15", muscle: "Braços", weight: 0 }
      ]
    },
    B: {
      title: "Treino B - Puxar & Abdominais",
      desc: "Desenvolvimento de dorsal larga e abdômen trincado de pedra.",
      exercises: [
        { name: "Barra Fixa Pronada (Pull-ups)", sets: 4, targetReps: "6-10", muscle: "Costas", weight: 0 },
        { name: "Barra Fixa Supinada (Chin-ups)", sets: 4, targetReps: "8-10", muscle: "Costas", weight: 0 },
        { name: "Abdominal V-Up (Canivete)", sets: 4, targetReps: "15", muscle: "Cardio", weight: 0 },
        { name: "L-Sit Hold (Segurar na Barra)", sets: 3, targetReps: "20s", muscle: "Cardio", weight: 0 }
      ]
    },
    C: {
      title: "Treino C - Pernas & Equilíbrio",
      desc: "Pistols explosivos e controle de estabilização corporal.",
      exercises: [
        { name: "Pistol Squat (Agachamento Unilateral)", sets: 3, targetReps: "5 cada", muscle: "Pernas", weight: 0 },
        { name: "Jump Lunges (Passada Saltando)", sets: 4, targetReps: "16 totais", muscle: "Pernas", weight: 0 },
        { name: "Handstand Hold (Parada de Mão)", sets: 3, targetReps: "30s", muscle: "Ombros", weight: 0 },
        { name: "Elevação de Panturrilha Unilateral", sets: 4, targetReps: "15 cada", muscle: "Pernas", weight: 0 }
      ]
    }
  },
  maratonista: {
    A: {
      title: "Treino A - Velocidade & Explosão",
      desc: "Tiros intervalados de alta intensidade para fôlego extremo.",
      exercises: [
        { name: "Tiros na Pista (200m)", sets: 6, targetReps: "Tiro Máximo", muscle: "Cardio", weight: 0 },
        { name: "Burpees Explosivos", sets: 4, targetReps: "15", muscle: "Cardio", weight: 0 },
        { name: "Saltos na Caixa (Box Jumps)", sets: 4, targetReps: "12", muscle: "Pernas", weight: 0 },
        { name: "Polichinelos Velocidade", sets: 3, targetReps: "45s", muscle: "Cardio", weight: 0 }
      ]
    },
    B: {
      title: "Treino B - Corrida de Resistência",
      desc: "Volume aeróbico contínuo para expandir sua barreira de fadiga.",
      exercises: [
        { name: "Corrida Contínua", sets: 1, targetReps: "5 KM ou 30 min", muscle: "Cardio", weight: 0 },
        { name: "Agachamento Livre sem Carga", sets: 4, targetReps: "20", muscle: "Pernas", weight: 0 },
        { name: "Prancha Abdominal Isométrica", sets: 3, targetReps: "60s", muscle: "Cardio", weight: 0 }
      ]
    },
    C: {
      title: "Treino C - Subidas & Força no Cardio",
      desc: "Fortalecimento muscular específico para corrida em terrenos íngremes.",
      exercises: [
        { name: "Corrida na Subida / Inclinação", sets: 5, targetReps: "3 min", muscle: "Cardio", weight: 0 },
        { name: "Passada Caminhando (Lunges)", sets: 4, targetReps: "20 passos", muscle: "Pernas", weight: 0 },
        { name: "Corrida com Elevação de Joelho", sets: 4, targetReps: "40s", muscle: "Cardio", weight: 0 },
        { name: "Pular Corda", sets: 3, targetReps: "3 min", muscle: "Cardio", weight: 0 }
      ]
    }
  }
};

// 4. TROPHIES DATABASE
const TROPHIES = [
  { id: 'primeiro_passo', name: 'Primeiro Treino Concluído', icon: '🐣', desc: 'Saiu da inércia!' },
  { id: 'sequencia_ferro', name: 'Sequência de Ferro', icon: '🔥', desc: 'Treinou 7 dias seguidos.' },
  { id: 'mes_disciplina', name: 'Um Mês de Disciplina', icon: '👑', desc: 'Treinou 30 dias seguidos.' },
  { id: 'hidratacao_consistente', name: 'Hidratação Consistente', icon: '💧', desc: 'Bateu a meta de água 5 dias seguidos.' },
  { id: 'superacao_pessoal', name: 'Superação Pessoal', icon: '📈', desc: 'Bateu seu primeiro recorde pessoal em um exercício.' },
  { id: 'colecionador_recordes', name: 'Colecionador de Recordes', icon: '💎', desc: 'Bateu recorde pessoal em 5 exercícios diferentes.' },
  { id: 'limite_superado', name: 'Limite Superado', icon: '⚡', desc: 'Subiu para o Nível 5!' },
  { id: 'freaky_tier', name: 'Atingiu Shape Lendário', icon: '👑', desc: 'Chegou ao Nível 25!' },
  { id: 'mind_shield', name: 'Mente Blindada', icon: '🎯', desc: 'Concluiu todas as quests diárias do dia.' },
  { id: 'gym_legend', name: 'Lenda do Ginásio', icon: '🔱', desc: 'Completou 25 treinos no total.' },
  { id: 'insignia_mutante', name: 'Insígnia Mutante', icon: '🔥', desc: 'Resgatou a recompensa do Desafio Diário.' },
  { id: 'vinculo_forte', name: 'Vínculo Forte', icon: '🌟', desc: 'Atingiu Nível 10 com algum mentor.' }
];



let userProfile = {
  name: '',
  sex: '',
  mainObjective: '',
  motivation: '',
  focusArea: '',
  class: '',
  experienceLevel: '',
  activityLevel: '',
  height: 175,
  currentWeight: 75,
  targetWeight: 75,
  jointPain: [],
  profilePic: '',
  workoutHistory: {},
  weeklyDaysGoal: 3,
  notificationsEnabled: true,
  notificationTime: '18:00',
  attributes: {
    FOR: 10,
    RES: 10,
    AGI: 10,
    VIG: 10,
    FOC: 10
  }
};

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

// 6. HIGH-QUALITY AUDIO ENGINE (IA MP3 & Web Audio Fallbacks)
let audioCtx = null;

// Dynamic Water Animation (Jiggle and Bubbles)
function triggerWaterAnimation(waterPct) {
  const cylinder = document.querySelector('.water-cylinder');
  if (cylinder) {
    cylinder.classList.remove('cylinder-bounce');
    void cylinder.offsetWidth; // Force reflow
    cylinder.classList.add('cylinder-bounce');
    
    // Remove class after animation ends
    setTimeout(() => {
      cylinder.classList.remove('cylinder-bounce');
    }, 600);
  }

  if (waterPct > 0 && cylinder) {
    const bubblesCount = 6 + Math.floor(Math.random() * 5); // 6 to 10 bubbles
    const floatDist = (waterPct / 100) * 75; // cylinder height is 75px
    
    for (let i = 0; i < bubblesCount; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'water-bubble';
      
      const size = 3 + Math.floor(Math.random() * 5); // 3px to 7px
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      
      const leftVal = 10 + Math.random() * 80; // 10% to 90%
      bubble.style.left = `${leftVal}%`;
      
      const delay = Math.random() * 0.4;
      bubble.style.animationDelay = `${delay}s`;
      
      const duration = 0.5 + Math.random() * 0.4;
      bubble.style.animationDuration = `${duration}s`;
      
      bubble.style.setProperty('--float-distance', `${floatDist}px`);
      
      cylinder.appendChild(bubble);
      
      const cleanupTime = (duration + delay) * 1000 + 100;
      setTimeout(() => {
        bubble.remove();
      }, cleanupTime);
    }
  }
}

function playSound(type) {
  if (!state.soundEnabled) return;
  playSynthSound(type);
}

function speakMentor(mentorId) {
  // Vozes desativadas
}

function playSynthSound(type) {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  switch(type) {
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
      break;

    case 'quest':
      osc.type = 'square';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.setValueAtTime(0.05, now + 0.24);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.start(now);
      osc.stop(now + 0.38);
      break;

    case 'levelup':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.3); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.4); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.5); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.6); // C6
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);
      break;

    case 'water':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.16);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'alarm':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      osc.frequency.setValueAtTime(600, now + 0.2);
      osc.frequency.setValueAtTime(800, now + 0.3);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;

    case 'crunch':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(120, now + 0.08);
      osc.frequency.setValueAtTime(70, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.setValueAtTime(0.08, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
      break;

    case 'potion':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;

    case 'point_allocation':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
      break;

    case 'allday':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.5);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
      break;

    case 'abreoolho':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1100, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
      break;

    case 'ficafreaky':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      
      // Secondary oscillator for heavy chorus
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(92, now);
      osc2.frequency.exponentialRampToValueAtTime(46, now + 0.8);
      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now);
      osc2.stop(now + 0.9);
      
      osc.start(now);
      osc.stop(now + 0.9);
      break;
  }
}

// ==========================================
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
        if (!state.strengthHistory) state.strengthHistory = [50 + (getEffectiveAttributes().for || 10) * 1.5];
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

// 8. PROGRESSION SYSTEM
function getSubclassRank(charClass, lvl) {
  const list = SUB_CLASSES[charClass];
  let activeRank = list[0].name;
  for (let rank of list) {
    if (lvl >= rank.lvl) {
      activeRank = rank.name;
    }
  }
  return activeRank;
}

// XP addition helper - now levels up player level AND credits active mentor XP!
function addXP(amount) {
  const mentorBonus = getMentorXPBonus();
  amount = Math.round(amount * mentorBonus);
  state.xp += amount;
  
  // Add equivalent XP to the active mentor!
  addMentorXP(state.activeMentor, amount);

  // Dynamic floating combat text XP popup
  const floatingXp = document.createElement('div');
  floatingXp.className = 'floating-combat-xp';
  floatingXp.innerText = `+${amount} XP ⚔️`;
  floatingXp.style.left = `${40 + Math.random() * 20}%`;
  floatingXp.style.top = `${60 + Math.random() * 10}%`;
  document.body.appendChild(floatingXp);
  setTimeout(() => floatingXp.remove(), 1200);

  state.xpNeeded = 100 + (state.level * 25);

  while (state.xp >= state.xpNeeded) {
    const oldLevel = state.level;
    state.xp -= state.xpNeeded;
    state.level += 1;
    state.xpNeeded = 100 + (state.level * 25);
    state.attrPoints += 5; // Unlocks 5 points per lvl

    playSound('levelup');
    showLevelUpModal();

    if (state.level >= 5) unlockTrophy('limite_superado');
    if (state.level >= 25) unlockTrophy('freaky_tier');
    
    checkLevelRewards(oldLevel, state.level);
  }
  saveState();
  updateUI();
}

function checkLevelRewards(oldLvl, newLvl) {
  const rewards = [
    { lvl: 5, id: 'item_faixa', name: 'Faixa do Rock Lee', icon: 'faixa_lee_icon.webp', desc: 'Sua agilidade foi notada. Você equipou a faixa do Rock Lee! Ganha uma borda verde neon no seu avatar.' },
    { lvl: 10, id: 'item_bracelete', name: 'Braceletes de Aço', icon: 'braceletes_aco_icon.webp', desc: 'Seus braços estão se tornando resistentes. Braceletes de metal equipados ao lado do seu nome!' },
    { lvl: 20, id: 'item_aura', name: 'Aura de Super Saiyajin', icon: 'aura_goku_icon.webp', desc: 'Seu Ki despertou! Uma aura de chamas douradas agora brilha ao redor do seu avatar!' },
    { lvl: 30, id: 'item_cinturão', name: 'Cinturão de Ouro', icon: 'cinturao_ouro_icon.webp', desc: 'Estética inquestionável. O Cinturão de Ouro de Arnold foi equipado no fundo do seu Status!' },
    { lvl: 40, id: 'item_aurabroly', name: 'Aura Lendária de Broly Z', icon: 'aura_broly_icon.webp', desc: 'Seu poder é máximo! Uma aura colossal de chamas verde néon foi equipada no seu avatar!' },
    { lvl: 50, id: 'item_capa', name: 'Capa do Saitama', icon: 'capa_saitama_icon.webp', desc: 'Treino concluído. Você destravou a Capa do Saitama, que flutua atrás do seu avatar!' }
  ];

  if (!state.unlockedItems) state.unlockedItems = [];

  rewards.forEach(r => {
    if (newLvl >= r.lvl && !state.unlockedItems.includes(r.id)) {
      state.unlockedItems.push(r.id);
      setTimeout(() => {
        showItemAcquiredModal(r.icon, r.name, r.desc);
      }, 1500);
    }
  });
}

// 8b. MENTOR XP & REWARD SYSTEM
function addMentorXP(mentorId, amount) {
  if (!state.mentorAffinities) state.mentorAffinities = {};
  if (!state.mentorAffinities[mentorId]) {
    state.mentorAffinities[mentorId] = { level: 1, xp: 0, prestige: 0 };
  }
  
  let mData = state.mentorAffinities[mentorId];
  if (mData.level >= 50) {
    // Lock XP at level 50
    mData.level = 50;
    mData.xp = 0;
    state.mentorXP[mentorId] = 0;
    state.mentorLevels[mentorId] = 50;
    return;
  }
  
  mData.xp += amount;
  let requiredXP = 100 + (mData.level * 25);
  
  while (mData.xp >= requiredXP && mData.level < 50) {
    mData.xp -= requiredXP;
    const oldLvl = mData.level;
    mData.level += 1;
    requiredXP = 100 + (mData.level * 25);
    
    // Sync to legacy keys
    state.mentorLevels[mentorId] = mData.level;
    state.mentorXP[mentorId] = mData.xp;

    // Play level up sound for active mentor
    playSound('levelup');

    // Check level achievements for active mentor
    checkMentorRewards(mentorId, oldLvl, mData.level);

    if (mData.level >= 10) unlockTrophy('vinculo_forte');
  }
  
  // Sync to legacy keys
  state.mentorLevels[mentorId] = mData.level;
  state.mentorXP[mentorId] = mData.xp;
}

function checkMentorRewards(mentorId, oldLvl, newLvl) {
  const rewards = MENTOR_REWARDS[mentorId];
  if (!rewards) return;

  rewards.forEach(r => {
    if (newLvl >= r.lvl && oldLvl < r.lvl) {
      // Unlock item inside active unlocked items list if not custom (official items are added here)
      if (!state.unlockedItems) state.unlockedItems = [];
      
      // If it is a css_class, save it directly to state.unlockedItems
      if (r.type === 'css_class' && !state.unlockedItems.includes(r.value)) {
        state.unlockedItems.push(r.value);
      }

      // If it is a buff, apply attributes increases dynamically
      if (r.type === 'buff') {
        const parts = r.value.split('+');
        const attr = parts[0]; // e.g. "for", "res", "agi", "vig", "foc"
        const bonus = parseInt(parts[1]) || 5;
        if (state.attributes[attr] !== undefined) {
          state.attributes[attr] += bonus;
        }
      }

      // Play custom unlock sound
      if (r.type === 'sound') {
        setTimeout(() => {
          playSound(r.value);
        }, 1200);
      }

      // Trigger reward modal pop-up on screen
      setTimeout(() => {
        const opts = r.type === 'css_class' ? undefined : { subtitle: 'RECOMPENSA DESBLOQUEADA', btnText: 'SHOW DE BOLA!' };
        const info = getRewardDisplayInfo(r);
        showItemAcquiredModal(info.icon, info.name, `${info.desc} (Ganho ao subir nível do Mentor ${OFFICIAL_MENTORS.find(m => m.id === mentorId)?.name || mentorId}!)`, opts);
      }, 1600);
    }
  });
}

function transcendMentor(mentorId) {
  if (!state.mentorAffinities) state.mentorAffinities = {};
  if (!state.mentorAffinities[mentorId]) {
    state.mentorAffinities[mentorId] = { level: 1, xp: 0, prestige: 0 };
  }
  
  let mData = state.mentorAffinities[mentorId];
  if (mData.level < 50) return; // Must be at least level 50
  
  mData.level = 1;
  mData.xp = 0;
  mData.prestige = (mData.prestige || 0) + 1;
  
  // Sync to legacy keys
  state.mentorLevels[mentorId] = 1;
  state.mentorXP[mentorId] = 0;
  
  if (!state.bakedBuffs) state.bakedBuffs = [];
  const buffName = `${mentorId}_t3_passive`;
  if (!state.bakedBuffs.includes(buffName)) {
    state.bakedBuffs.push(buffName);
  }
  
  const mentor = OFFICIAL_MENTORS.find(m => m.id === mentorId);
  if (mentor) {
    triggerNeuralFlash(mentor);
  }
  playSound('levelup');
  showItemAcquiredModal('⭐', 'ASCENSÃO TRANSCENDIDA!', `O mentor ${OFFICIAL_MENTORS.find(m => m.id === mentorId)?.name || mentorId} atingiu Prestige ${mData.prestige}! Seu bônus passivo Tier 3 (+15s de redução de descanso) foi baked permanentemente na sua conta!`, { subtitle: 'PRESTÍGIO DESBLOQUEADO', btnText: 'MANDA VER!' });
  
  saveState();
  updateUI();
}

// ==========================================
// 8b. DAILY FREAKY CHALLENGE SYSTEM
// ==========================================
const DAILY_CHALLENGES = [
  { id: 'dc_water', title: '💧 Hidratação Absurda', desc: 'Beba 4 Litros de água hoje para purificar o organismo e ganhar poder.', target: 4, type: 'water', rewardXP: 120 },
  { id: 'dc_protein', title: '🥩 Hipertrofia Extrema', desc: 'Consuma 100% da sua meta de proteínas diárias na dieta.', target: 1, type: 'protein', rewardXP: 100 },
  { id: 'dc_workout', title: '🏋️ Volume Mutante', desc: 'Conclua seu treino diário com intensidade extrema.', target: 1, type: 'workout', rewardXP: 150 },
  { id: 'dc_quests', title: '⚔️ Conquista Total', desc: 'Complete todas as 3 missões diárias de hoje.', target: 3, type: 'quests', rewardXP: 130 }
];

function initDailyChallenge() {
  const todayStr = new Date().toDateString();

  // Se dieta está desativada, tira os desafios de tipo 'protein' do sorteio —
  // senão ficariam impossíveis de completar pra quem não registra refeições.
  const eligibleChallenges = state.dietTrackingEnabled === false
    ? DAILY_CHALLENGES.filter(c => c.type !== 'protein')
    : DAILY_CHALLENGES;

  // Select a challenge based on the date so it changes daily
  const dayIndex = Math.abs(todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % eligibleChallenges.length;
  const challenge = eligibleChallenges[dayIndex];
  
  if (!state.dailyChallenge || state.dailyChallenge.dateStr !== todayStr) {
    state.dailyChallenge = {
      id: challenge.id,
      progress: 0,
      completed: false,
      claimed: false,
      dateStr: todayStr
    };
    saveState();
  }
}

function updateDailyChallengeProgress(type, amount) {
  if (!state.dailyChallenge || state.dailyChallenge.claimed) return;
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge || challenge.type !== type) return;

  if (type === 'water') {
    state.dailyChallenge.progress = Math.min(challenge.target, state.waterIntake);
  } else if (type === 'protein') {
    const isTargetMet = state.proteinIntake >= state.protTarget;
    state.dailyChallenge.progress = isTargetMet ? 1 : 0;
  } else if (type === 'workout') {
    state.dailyChallenge.progress = 1;
  } else if (type === 'quests') {
    const completedCount = state.dailyQuests.filter(q => q.completed).length;
    state.dailyChallenge.progress = Math.min(challenge.target, completedCount);
  }

  if (state.dailyChallenge.progress >= challenge.target && !state.dailyChallenge.completed) {
    state.dailyChallenge.completed = true;
    playSound('quest');
  }

  saveState();
  updateUI();
}

function triggerCelebrationConfetti() {
  const canvas = document.getElementById('celebration-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#ff5e00', '#ffb703', '#9b5de5', '#38b000', '#0077b6', '#d4af37', '#e63946'];
  
  for (let i = 0; i < 28; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 40,
      y: canvas.height * 0.6 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 15 - 5,
      radius: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.02 + 0.01,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    
    particles.forEach(p => {
      if (p.alpha > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.alpha -= p.decay;
        p.rotation += p.rotationSpeed;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
        ctx.restore();
      }
    });
    
    if (active) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  animate();
}

function claimDailyChallengeReward() {
  if (!state.dailyChallenge || !state.dailyChallenge.completed || state.dailyChallenge.claimed) return;
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge) return;

  state.dailyChallenge.claimed = true;
  
  const xpReward = challenge.rewardXP;
  addXP(xpReward);

  unlockTrophy('insignia_mutante');

  playSound('levelup');
  showItemAcquiredModal('🔥', 'RECOMPENSA RESGATADA!', `Você ganhou +${xpReward} XP e a Insígnia Mutante para seu Shape!`, { subtitle: 'DESAFIO DIÁRIO', btnText: 'SHOW DE BOLA!' });

  triggerCelebrationConfetti();

  saveState();
  updateUI();
}

function renderDailyChallenge() {
  initDailyChallenge();
  
  const challenge = DAILY_CHALLENGES.find(c => c.id === state.dailyChallenge.id);
  if (!challenge) return;

  // Refresh progress dynamically
  if (!state.dailyChallenge.claimed) {
    if (challenge.type === 'water') {
      state.dailyChallenge.progress = Math.min(challenge.target, state.waterIntake);
    } else if (challenge.type === 'protein') {
      state.dailyChallenge.progress = state.proteinIntake >= state.protTarget ? 1 : 0;
    } else if (challenge.type === 'quests') {
      const completedCount = state.dailyQuests.filter(q => q.completed).length;
      state.dailyChallenge.progress = Math.min(challenge.target, completedCount);
    }
    if (state.dailyChallenge.progress >= challenge.target) {
      state.dailyChallenge.completed = true;
    }
  }

  const titleEl = document.getElementById('daily-challenge-title');
  const descEl = document.getElementById('daily-challenge-desc');
  const progressFill = document.getElementById('daily-challenge-progress-fill');
  const progressText = document.getElementById('daily-challenge-progress-text');
  const rewardEl = document.getElementById('daily-challenge-reward');
  const claimBtn = document.getElementById('btn-claim-challenge');
  const badgeEl = document.getElementById('daily-challenge-badge');

  if (titleEl) titleEl.innerText = challenge.title;
  if (descEl) descEl.innerText = challenge.desc;

  const currentProg = state.dailyChallenge.progress;
  const targetProg = challenge.target;
  const pct = Math.round((currentProg / targetProg) * 100);

  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) {
    if (challenge.type === 'water') {
      progressText.innerText = `${currentProg} / ${targetProg} L`;
    } else if (challenge.type === 'protein') {
      progressText.innerText = currentProg >= targetProg ? 'CONCLUÍDO' : 'PENDENTE';
    } else if (challenge.type === 'workout') {
      progressText.innerText = currentProg >= targetProg ? 'CONCLUÍDO' : 'PENDENTE';
    } else if (challenge.type === 'quests') {
      progressText.innerText = `${currentProg} / ${targetProg}`;
    }
  }

  if (rewardEl) {
    rewardEl.innerText = `Recompensa: +${challenge.rewardXP} XP Mutante 👑`;
  }

  const dailySectionEl = document.querySelector('.daily-challenge-section');
  if (state.dailyChallenge.claimed) {
    if (dailySectionEl) dailySectionEl.classList.remove('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'CONCLUÍDO';
      badgeEl.style.background = '#4caf50';
    }
    if (claimBtn) {
      claimBtn.classList.add('hidden');
    }
  } else if (state.dailyChallenge.completed) {
    if (dailySectionEl) dailySectionEl.classList.add('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'CONCLUÍDO';
      badgeEl.style.background = '#4caf50';
    }
    if (claimBtn) {
      claimBtn.classList.remove('hidden');
    }
  } else {
    if (dailySectionEl) dailySectionEl.classList.remove('claimable');
    if (badgeEl) {
      badgeEl.innerText = 'ATIVO';
      badgeEl.style.background = 'var(--accent-orange, #ff5e00)';
    }
    if (claimBtn) {
      claimBtn.classList.add('hidden');
    }
  }
}

// ==========================================
// 9. DAILY QUEST GENERATOR
// ==========================================
function generateDailyQuests() {
  const quests = [];
  const todayStr = new Date().toDateString();
  const seed = Math.abs(todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));

  // 1. Water Quest Pool
  const waterPool = [
    { name: 'Hidratação Padrão', desc: `Beber pelo menos ${state.waterTarget}L de água hoje`, xpReward: 20 },
    { name: 'Cardio de H2O Supremo', desc: `Bater ou superar sua meta de água hoje (${state.waterTarget}L)`, xpReward: 25 },
    { name: 'Purificação Líquida', desc: `Consumir pelo menos ${state.waterTarget}L de água para máxima eliminação de toxinas`, xpReward: 20 },
    { name: 'Absorção Anabólica', desc: `Beber ${state.waterTarget}L de água hoje para otimizar síntese proteica`, xpReward: 25 }
  ];
  const waterChoice = waterPool[seed % waterPool.length];
  quests.push({
    id: 'quest_water',
    name: waterChoice.name,
    desc: waterChoice.desc,
    xpReward: waterChoice.xpReward,
    completed: false
  });

  // 2. Diet Quest Pool (ou missão de volume de treino, se dieta estiver desativada)
  if (state.dietTrackingEnabled === false) {
    const volumePool = [
      { name: 'Volume de Ferro', desc: 'Completar pelo menos 12 séries de treino hoje', xpReward: 25 },
      { name: 'Sequência Brutal', desc: 'Bater 12 séries concluídas na Arena de Treino hoje', xpReward: 25 },
      { name: 'Maratona de Séries', desc: 'Concluir 12 séries de treino em um único dia', xpReward: 30 },
      { name: 'Disciplina de Ferro', desc: 'Fechar pelo menos 12 séries de treino hoje', xpReward: 25 }
    ];
    const volumeChoice = volumePool[(seed + 1) % volumePool.length];
    quests.push({
      id: 'quest_volume',
      name: volumeChoice.name,
      desc: volumeChoice.desc,
      xpReward: volumeChoice.xpReward,
      completed: false
    });
  } else {
    const proteinPool = [
      { name: 'Meta Nutricional', desc: `Bater pelo menos 80% da sua meta de proteínas (${Math.round(state.protTarget * 0.8)}g)`, xpReward: 25 },
      { name: 'Hipertrofia Ativada', desc: `Consumir pelo menos 80% de proteínas hoje (${Math.round(state.protTarget * 0.8)}g) para anabolismo`, xpReward: 25 },
      { name: 'Combustível Fibroso', desc: `Registrar pelo menos 80% da meta de proteínas (${Math.round(state.protTarget * 0.8)}g) nas refeições`, xpReward: 30 },
      { name: 'Síntese de Caçador', desc: `Garantir aporte proteico diário de pelo menos (${Math.round(state.protTarget * 0.8)}g)`, xpReward: 25 }
    ];
    const proteinChoice = proteinPool[(seed + 1) % proteinPool.length];
    quests.push({
      id: 'quest_protein',
      name: proteinChoice.name,
      desc: proteinChoice.desc,
      xpReward: proteinChoice.xpReward,
      completed: false
    });
  }

  // 3. Class Quest Pool
  let classPool = [];
  switch(state.charClass) {
    case 'bodybuilder':
      classPool = [
        { name: 'Pump Máximo', desc: 'Finalizar um treino completo na arena de treino', xpReward: 30 },
        { name: 'Exaustão Muscular', desc: 'Finalizar um treino completo com foco em contração extrema', xpReward: 30 },
        { name: 'Volume Anabólico', desc: 'Completar seu treino diário com esforço máximo', xpReward: 35 }
      ];
      break;
    case 'powerlifter':
      classPool = [
        { name: 'Batalha de Cargas', desc: 'Registrar cargas pesadas com postura perfeita', xpReward: 30 },
        { name: 'Tensão Extrema', desc: 'Completar um treino pesado com técnica perfeita e alta carga', xpReward: 35 },
        { name: 'Levantamento de Ferro', desc: 'Registrar um treino focado em exercícios compostos pesados', xpReward: 30 }
      ];
      break;
    case 'calistenia':
      classPool = [
        { name: 'Controle de Aço', desc: 'Completar rotina calistênica isométrica', xpReward: 30 },
        { name: 'Gravidade Desafiada', desc: 'Finalizar um treino completo usando apenas o peso corporal', xpReward: 30 },
        { name: 'Tensão Corporal', desc: 'Concluir treino focado em força isométrica e controle de core', xpReward: 35 }
      ];
      break;
    case 'maratonista':
      classPool = [
        { name: 'Cardio Violento', desc: 'Concluir treino de alta intensidade ou tiros rápidos', xpReward: 30 },
        { name: 'Ritmo de Caçador', desc: 'Finalizar treino de corrida ou cardio com alta frequência cardíaca', xpReward: 30 },
        { name: 'Resistência Extrema', desc: 'Completar uma sessão de condicionamento de alta performance', xpReward: 35 }
      ];
      break;
    default:
      classPool = [
        { name: 'Desafio do Aço', desc: 'Concluir sua atividade física diária com foco total', xpReward: 30 }
      ];
  }
  
  const classChoice = classPool[(seed + 2) % classPool.length];
  let classQuest = {
    id: 'quest_class',
    name: classChoice.name,
    desc: classChoice.desc,
    xpReward: classChoice.xpReward,
    completed: false
  };

  const motivationNote = MOTIVATION_FLAVOR[state.motivation];
  if (motivationNote) {
    classQuest.desc += ` · ${motivationNote}`;
  }
  quests.push(classQuest);
  
  state.dailyQuests = quests;
  saveState();
}

// ==========================================
// 10. DYNAMIC CSS STYLES FOR CUSTOM MENTORS
// ==========================================
function applyMentorVisualTheme(mentor) {
  if (!mentor) return;
  
  // Manage Bebezinho particles
  let particlesContainer = document.getElementById('bebezinho-particles');
  if (mentor.id === 'bebezinho') {
    if (!particlesContainer) {
      particlesContainer = document.createElement('div');
      particlesContainer.id = 'bebezinho-particles';
      particlesContainer.className = 'bebezinho-particles-container';
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'bebezinho-sparkle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.animationDelay = `${Math.random() * 3}s`;
        p.style.animationDuration = `${2 + Math.random() * 4}s`;
        particlesContainer.appendChild(p);
      }
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.appendChild(particlesContainer);
      }
    }
  } else {
    if (particlesContainer) {
      particlesContainer.remove();
    }
  }

  if (mentor.isCustom) {
    // Dynamic styles generation on fly!
    let styleTag = document.getElementById('custom-mentor-theme-style');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'custom-mentor-theme-style';
      document.head.appendChild(styleTag);
    }
    
    const h = mentor.hue;
    styleTag.innerHTML = `
      body.theme-custom-${mentor.id} {
        --primary-hue: ${h};
        --primary-sat: 90%;
        --primary-light: 50%;
        --accent-hue: ${(h + 150) % 360};
        --accent-sat: 95%;
        --accent-light: 50%;
      }
    `;
    
    const modeClass = (state.appMode === 'simple') ? 'mode-simple' : '';
    const dietClass = (state.dietTrackingEnabled === false) ? 'diet-disabled' : '';
    document.body.className = [modeClass, dietClass, `theme-custom-${mentor.id}`].filter(Boolean).join(' ');
  } else {
    const modeClass = (state.appMode === 'simple') ? 'mode-simple' : '';
    const dietClass = (state.dietTrackingEnabled === false) ? 'diet-disabled' : '';
    document.body.className = [modeClass, dietClass, mentor.theme].filter(Boolean).join(' ');
  }
}

// ==========================================
// Helper to get avatar source URL (handles URLs, paths, and converts emojis to SVG data URLs)
function getMentorAvatarSrc(mentor) {
  if (!mentor) return 'rocklee.webp';
  const avatar = mentor.avatar;
  if (!avatar) return 'rocklee.webp';
  
  if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.includes('.') || avatar.startsWith('/') || avatar.startsWith('assets/')) {
    return avatar;
  }
  
  // Encode emoji/text into a clean inline SVG data URL
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.82em" font-size="70" x="15">${avatar}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
}

function getUserAvatarSrc() {
  if (state.profilePic) {
    return state.profilePic;
  }
  // Fallback to active mentor avatar
  let activeMentorData = OFFICIAL_MENTORS.find(m => m.id === state.activeMentor);
  if (!activeMentorData) {
    activeMentorData = state.customMentors.find(m => m.id === state.activeMentor);
  }
  if (!activeMentorData) activeMentorData = OFFICIAL_MENTORS[0];
  return getMentorAvatarSrc(activeMentorData);
}

// 11. UI RENDERING SYSTEM
// ==========================================
// ==========================================
function updateUI() {
  checkDailyReset();
  recalculateMacrosTargets();
  document.body.classList.toggle('diet-disabled', state.dietTrackingEnabled === false);

  const isSimple = state.appMode === 'simple';
  const playerNameEl = document.getElementById('player-name');
  if (playerNameEl) playerNameEl.innerText = state.charName;

  const finishBtn = document.getElementById('btn-finish-workout');
  if (finishBtn) finishBtn.innerText = isSimple ? '✅ FINALIZAR TREINO' : '⚔️ FINALIZAR TREINO (+50 XP)';
  const cardioDescEl = document.getElementById('cardio-card-desc');
  if (cardioDescEl) cardioDescEl.innerText = isSimple
    ? 'Esteira, bike, corrida, natação — registre o tempo do seu cardio.'
    : 'Esteira, bike, corrida, natação — registre o tempo e ganhe XP (escala com Resistência).';
  const dietHeaderEl = document.querySelector('#tab-diet .section-title-wrapper h3');
  if (dietHeaderEl) dietHeaderEl.innerText = isSimple ? '🍎 Alimentação & Dieta' : '🍎 Alimentação & Dieta RPG';
  const inventoryHeaderEl = document.querySelector('.rpg-inventory-card h4');
  if (inventoryHeaderEl) inventoryHeaderEl.innerText = isSimple ? '🎒 Registro Rápido (Refeições Rápidas)' : '🎒 Inventário RPG (Refeições Rápidas)';

  if (!isSimple) {
    document.getElementById('player-level-badge').innerText = `Lvl ${state.level}`;
    const mhsLevel = document.getElementById('mhs-level-badge');
    if (mhsLevel) mhsLevel.innerText = state.level;
  } else {
    const levelBadge = document.getElementById('player-level-badge');
    if (levelBadge) levelBadge.innerText = '';
    const mhsLevel = document.getElementById('mhs-level-badge');
    if (mhsLevel) mhsLevel.innerText = '';
  }

  const classLabels = {
    bodybuilder: 'Bodybuilder 💪',
    powerlifter: 'Powerlifter 🏋️‍♂️',
    calistenia: 'Calistênico 🤸‍♂️',
    maratonista: 'Maratonista 🏃‍♂️'
  };
  if (!isSimple) {
    document.getElementById('player-class-name').innerText = classLabels[state.charClass] || state.charClass;
  } else {
    document.getElementById('player-class-name').innerText = '';
  }

  if (!isSimple) {
    const currentRank = getSubclassRank(state.charClass, state.level);
    document.getElementById('player-rank').innerText = currentRank;
  } else {
    document.getElementById('player-rank').innerText = '';
  }

  if (!isSimple) {
    document.getElementById('xp-text').innerText = `${state.xp} / ${state.xpNeeded} XP`;
    const xpPercent = Math.min(100, (state.xp / state.xpNeeded) * 100);
    document.getElementById('xp-fill').style.width = `${xpPercent}%`;
    const mhsXpText = document.getElementById('mhs-xp-text');
    if (mhsXpText) mhsXpText.innerText = `${state.xp} / ${state.xpNeeded}`;
    const mhsXpFill = document.getElementById('mhs-xp-fill');
    if (mhsXpFill) mhsXpFill.style.width = `${xpPercent}%`;
  } else {
    document.getElementById('xp-text').innerText = '';
    document.getElementById('xp-fill').style.width = '0%';
    const mhsXpText = document.getElementById('mhs-xp-text');
    if (mhsXpText) mhsXpText.innerText = '';
    const mhsXpFill = document.getElementById('mhs-xp-fill');
    if (mhsXpFill) mhsXpFill.style.width = '0%';
  }

  // Get active mentor data (Official or Custom)
  let activeMentorData = OFFICIAL_MENTORS.find(m => m.id === state.activeMentor);
  if (!activeMentorData) {
    activeMentorData = state.customMentors.find(m => m.id === state.activeMentor);
  }
  if (!activeMentorData) activeMentorData = OFFICIAL_MENTORS[0]; // fallback Lee

  // Set avatar pictures (using new helper for custom and official mentors)
  const userAvatarSrc = getUserAvatarSrc();
  const avatarSrc = getMentorAvatarSrc(activeMentorData);
  document.getElementById('header-avatar').src = userAvatarSrc;
  document.getElementById('status-avatar').src = userAvatarSrc;

  // Apply aura styles
  const headerAvatarWrapper = document.getElementById('header-avatar').parentElement;
  const statusAvatarWrapper = document.getElementById('status-avatar').parentElement;
  const auraClasses = ['aura-bebezinho', 'aura-brolyz', 'aura-rocklee', 'aura-ramondino', 'aura-goku', 'aura-arnold', 'aura-saitama', 'aura-nickwalker', 'aura-custom'];
  if (headerAvatarWrapper) {
    auraClasses.forEach(c => headerAvatarWrapper.classList.remove(c));
    headerAvatarWrapper.classList.add(activeMentorData.isCustom ? 'aura-custom' : `aura-${activeMentorData.id}`);
  }
  if (statusAvatarWrapper) {
    auraClasses.forEach(c => statusAvatarWrapper.classList.remove(c));
    statusAvatarWrapper.classList.add(activeMentorData.isCustom ? 'aura-custom' : `aura-${activeMentorData.id}`);
  }

  // ── Mentor Hero HUD (novo dashboard hero) ──
  const heroImg = document.getElementById('mentor-bubble-img');
  const heroName = document.getElementById('mentor-bubble-name');
  const heroSub = document.getElementById('mhs-mentor-sub');
  const heroQuote = document.getElementById('mentor-bubble-quote');
  const heroCharName = document.getElementById('mhs-char-name');

  if (heroImg) {
    heroImg.src = avatarSrc;
    if (activeMentorData.filterCSS) heroImg.style.filter = activeMentorData.filterCSS;
  }
  if (heroName) heroName.innerText = activeMentorData.name;
  if (heroSub) {
    const classLabel = classLabels[state.charClass] || state.charClass || '';
    const mAffHero = (state.mentorAffinities && state.mentorAffinities[activeMentorData.id]) || { level: 1 };
    const rankHero = getMentorRankTitle(mAffHero.level);
    heroSub.innerText = `${classLabel} · ${rankHero.label}`;
  }
  if (heroCharName) heroCharName.innerText = state.charName || 'Hunter';

  // Rings e orbs dinâmicos por cor do mentor
  const mc = activeMentorData.colorHex || 'var(--color-primary)';
  ['mhs-ring1','mhs-ring2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.borderColor = mc;
  });
  const orb1 = document.getElementById('mhs-orb1');
  const orb2 = document.getElementById('mhs-orb2');
  if (orb1) orb1.style.background = mc;
  if (orb2) orb2.style.background = activeMentorData.colorHex ? mc + 'bb' : 'var(--color-accent)';

  const avatarGlow = document.getElementById('mhs-avatar-glow');
  if (avatarGlow) avatarGlow.style.background = mc;

  // Atributos no HUD
  if (state.attributes) {
    const eff = getEffectiveAttributes();
    const attrMap = { for: 'dash-attr-for', res: 'dash-attr-res', agi: 'dash-attr-agi', vig: 'dash-attr-vig', foc: 'dash-attr-foc' };
    Object.entries(attrMap).forEach(([key, elId]) => {
      const el = document.getElementById(elId);
      if (el) el.innerText = eff[key] ?? '—';
    });
  }

  // Quote do mentor
  const motivationTip = MOTIVATION_FLAVOR[state.motivation];
  const quoteText = motivationTip ? `${activeMentorData.quote} (${motivationTip})` : activeMentorData.quote;
  if (heroQuote) heroQuote.innerText = quoteText.replace(/^"|"$/g, '');

  // ── Active Mentor Bar (aba de mentores) ──
  const ambImg = document.getElementById('amb-img');
  const ambName = document.getElementById('amb-name');
  const ambUniv = document.getElementById('amb-universe');
  const ambLvl = document.getElementById('amb-lvl');
  const ambRank = document.getElementById('amb-rank');
  if (ambImg) {
    // Zera a opacity antes de trocar o src — o onerror inline do HTML
    // (disparado no primeiro render, quando src="" ainda está vazio) deixa
    // opacity:0 preso mesmo depois que uma imagem válida carrega com sucesso.
    ambImg.style.opacity = '';
    ambImg.src = avatarSrc;
    if (activeMentorData.filterCSS) ambImg.style.filter = activeMentorData.filterCSS;
  }
  if (ambName) ambName.innerText = activeMentorData.name;
  if (ambUniv) ambUniv.innerText = activeMentorData.universe || '';
  if (ambLvl) {
    const mAffBar = (state.mentorAffinities && state.mentorAffinities[activeMentorData.id]) || { level: 1 };
    ambLvl.innerText = `Nv ${mAffBar.level}`;
    const rankBar = getMentorRankTitle(mAffBar.level);
    if (ambRank) { ambRank.innerText = rankBar.label; ambRank.style.color = rankBar.color; }
  }

  // Apply theme coloring
  applyMentorVisualTheme(activeMentorData);

  // ==========================================
  // TAB: PAINEL / DASHBOARD
  // ==========================================
  // Synchronize userProfile from localStorage 'freaky_quest_user' if available
  try {
    const storedUser = localStorage.getItem('freaky_quest_user');
    if (storedUser) {
      Object.assign(userProfile, JSON.parse(storedUser));
    }
  } catch (e) {}

  // Sync basic UI elements based on userProfile
  const pName = userProfile.name || state.charName || 'Nick';
  const playerNameEl2 = document.getElementById('player-name');
  if (playerNameEl2) {
    playerNameEl2.innerText = pName;
  }
  if (!isSimple) {
    document.getElementById('player-level-badge').innerText = `Nv ${state.level}`;
    const mhsLevel2 = document.getElementById('mhs-level-badge');
    if (mhsLevel2) mhsLevel2.innerText = state.level;

    const uClass = userProfile.class || state.charClass || 'bodybuilder';
    document.getElementById('player-class-name').innerText = classLabels[uClass] || uClass;

    const uRank = getSubclassRank(uClass, state.level);
    document.getElementById('player-rank').innerText = uRank;
  }

  // Hero quote (safe — element may be the new mhs strip or legacy)
  const heroQuoteEl = document.getElementById('mentor-bubble-quote');
  if (heroQuoteEl) {
    const uMotivationTip = MOTIVATION_FLAVOR[userProfile.motivation || state.motivation];
    const fullQuote = uMotivationTip
      ? `${activeMentorData.quote} (${uMotivationTip})`
      : activeMentorData.quote;
    heroQuoteEl.innerText = fullQuote.replace(/^"|"$/g, '');
  }

  // IMC Ficha indicators from userProfile
  const weight = parseFloat(userProfile.currentWeight) || parseFloat(state.charWeight) || 75;
  const height = parseFloat(userProfile.height) || parseFloat(state.charHeight) || 175;
  
  document.getElementById('eval-weight').innerText = `${weight} kg`;
  document.getElementById('eval-height').innerText = `${height} cm`;
  
  const hMeters = height / 100;
  const imc = weight / (hMeters * hMeters);
  document.getElementById('eval-imc').innerText = imc.toFixed(1);
  
  let imcCat = "Ideal";
  let imcRpgTip = "";
  if (imc < 18.5) {
    imcCat = "Abaixo do Peso";
    imcRpgTip = isSimple ? "Abaixo do peso. Considere aumentar a ingestão calórica com foco em proteínas e treino de força." : "🏹 <strong>Ectomorfo Ágil:</strong> Alta agilidade nativa! Foco em bater o <strong>Surplus de Calorias (Bulking)</strong> urgente para ganhar massa muscular.";
  } else if (imc < 25) {
    imcCat = "Peso Ideal";
    imcRpgTip = isSimple ? "Peso saudável. Mantenha a rotina de treinos e alimentação equilibrada." : "⚔️ <strong>Shape Equilibrado:</strong> Status corporais estáveis. Pronto para qualquer especialidade do ferro!";
  } else if (imc < 30) {
    imcCat = "Sobrepeso";
    imcRpgTip = isSimple ? "Sobrepeso. Um pequeno déficit calórico e atividade regular ajudam a evoluir." : "🛡️ <strong>Potencial Tanker:</strong> Força muscular acumulada! Ótimo para levantar cargas brutas e lapidar o shape.";
  } else {
    imcCat = "Obesidade";
    imcRpgTip = isSimple ? "Atenção: procure acompanhamento médico e nutricional para ajustes seguros." : "🌋 <strong>Titã Supremo:</strong> Enorme potencial de força bruta. Ajuste sua ingestão proteica e rotina semanal para lapidar essa muralha.";
  }
  document.getElementById('eval-imc-class').innerText = imcCat;
  document.getElementById('eval-rpg-tip').innerHTML = imcRpgTip;
  
  const goalsLabelsSimple = {
    emagrecer: "Perder peso",
    engordar: "Ganhar massa",
    manter: "Manter peso",
    estetico: "Estética",
    saude: "Saúde"
  };
  const goalsLabelsRpg = {
    emagrecer: "Secar (Cutting) ⚡",
    engordar: "Crescer (Bulking) 🌋",
    manter: "Lapidar (Recomp) ⚖️",
    estetico: "Ficar Estético 🏆",
    saude: "Melhorar Saúde 🧬"
  };
  const goalsLabels = isSimple ? goalsLabelsSimple : goalsLabelsRpg;
  document.getElementById('eval-goal-badge').innerText = goalsLabels[userProfile.mainObjective || state.charGoal] || state.charGoal || '—';

  // Meta semanal de treinos
  checkWeeklyReset();
  const weeklyCurrent = state.workoutsThisWeek || 0;
  const weeklyTarget = userProfile.weeklyDaysGoal || state.weeklyTrainGoal || 4;
  const weeklyPct = Math.min(100, Math.round((weeklyCurrent / weeklyTarget) * 100));
  const weeklyBadge = document.getElementById('weekly-goal-badge');
  const weeklyFill = document.getElementById('weekly-progress-fill');
  const weeklyText = document.getElementById('weekly-goal-text');
  if (weeklyBadge) weeklyBadge.innerText = `${weeklyCurrent}/${weeklyTarget}`;
  if (weeklyFill) weeklyFill.style.width = `${weeklyPct}%`;
  if (weeklyText) {
    if (weeklyCurrent >= weeklyTarget) {
      weeklyText.innerText = isSimple
        ? `🎯 Meta batida! ${weeklyCurrent - weeklyTarget > 0 ? `+${weeklyCurrent - weeklyTarget} treino(s) extra(s) esta semana.` : 'Constância!'}`
        : `🔥 Meta batida! ${weeklyCurrent - weeklyTarget > 0 ? `+${weeklyCurrent - weeklyTarget} treino(s) extra(s) esta semana.` : 'Constância de caçador!'}`;
    } else {
      weeklyText.innerText = `Faltam ${weeklyTarget - weeklyCurrent} treino(s) para completar sua meta semanal.`;
    }
  }

  // Progresso de séries do treino de hoje
  const workoutStats = getWorkoutCompletionStats();
  const workoutProgressEl = document.getElementById('workout-today-progress');
  if (workoutProgressEl) {
    workoutProgressEl.innerText = `${workoutStats.completedSets}/${workoutStats.totalSets} séries hoje (${Math.round(workoutStats.percent)}%)`;
  }

  const cardioTodayEl = document.getElementById('cardio-minutes-today');
  if (cardioTodayEl) cardioTodayEl.innerText = state.cardioMinutesToday || 0;

  // Water bottles rendering (litre by litre!)
  document.getElementById('water-target-input').value = state.waterTarget;
  const bottlesContainer = document.getElementById('water-bottles-container');
  bottlesContainer.innerHTML = '';
  
  const currentLitres = state.waterDrank || state.waterIntake || 0;
  const targetLitres = state.waterTarget;
  
  // Render target bottles
  for (let i = 1; i <= targetLitres; i++) {
    const b = document.createElement('div');
    b.className = `water-bottle-icon ${i <= currentLitres ? 'active' : ''}`;
    b.title = `${i} Litro`;
    b.addEventListener('click', () => {
      playSound('water');
      state.waterDrank = i;
      state.waterIntake = i;
      checkQuestRequirements();
      saveState();
      updateUI();
      const pct = Math.min(100, Math.round((i / targetLitres) * 100));
      triggerWaterAnimation(pct);
    });
    bottlesContainer.appendChild(b);
  }
  
  // Litres summary text
  document.getElementById('water-text').innerText = `${currentLitres} / ${state.waterTarget} L`;
  
  // Update water cylinder fill level
  const cylinderFill = document.getElementById('water-cylinder-fill');
  if (cylinderFill) {
    const waterPct = Math.min(100, Math.round((currentLitres / targetLitres) * 100));
    cylinderFill.style.height = `${waterPct}%`;
    if (waterPct === 0) {
      cylinderFill.classList.add('empty');
    } else {
      cylinderFill.classList.remove('empty');
    }
  }
  
  // Exceeding water litres calculation
  const extraWaterText = document.getElementById('water-extra-text');
  if (currentLitres > state.waterTarget) {
    const extraL = currentLitres - state.waterTarget;
    if (!isSimple) {
      const extraXp = extraL * 10;
      extraWaterText.classList.remove('hidden');
      extraWaterText.innerText = `🔥 +${extraL} Litros Extras! (+${extraXp} XP creditados)`;
    } else {
      extraWaterText.classList.remove('hidden');
      extraWaterText.innerText = `💧 +${extraL} Litro(s) extra(s) consumido(s) hoje.`;
    }
  } else {
    extraWaterText.classList.add('hidden');
  }

  // Linear Macro metrics on Dashboard dock
  // Eaten today sums
  let totalKcal = 0, totalProt = 0, totalFiber = 0, totalCarbs = 0;
  state.mealLogs.forEach(m => {
    totalKcal += (m.kcal || 0);
    totalProt += (m.prot || 0);
    totalFiber += (m.fiber || 0);
    totalCarbs += (m.carbs || 0);
  });
  
  // Float rounded
  totalKcal = Math.round(totalKcal);
  totalProt = Math.round(totalProt * 10) / 10;
  totalFiber = Math.round(totalFiber * 10) / 10;
  totalCarbs = Math.round(totalCarbs * 10) / 10;

  // Sync state values
  if (!state.dailyMacros) state.dailyMacros = { kcal: 0, prot: 0, fiber: 0, carbs: 0 };
  state.dailyMacros.kcal = totalKcal;
  state.dailyMacros.prot = totalProt;
  state.dailyMacros.fiber = totalFiber;
  state.dailyMacros.carbs = totalCarbs;

  state.kcalIntake = totalKcal;
  state.proteinIntake = totalProt;
  state.fiberIntake = totalFiber;

  // Render player active status badges based on macros
  const statusBadgesContainer = document.getElementById('player-status-badges');
  if (statusBadgesContainer && state.dietTrackingEnabled === false) {
    statusBadgesContainer.innerHTML = '';
    state.anabolicActive = false;
    state.catabolizandoActive = false;
  } else if (statusBadgesContainer) {
    statusBadgesContainer.innerHTML = '';

    // 🔥 Estado Anabólico Active check
    if (totalProt >= state.protTarget) {
      state.anabolicActive = true;
      const b = document.createElement('span');
      b.className = 'badge';
      b.style.background = 'linear-gradient(90deg, #ff5e00, #ffb703)';
      b.style.color = '#000';
      b.style.border = 'none';
      b.style.fontSize = '0.62rem';
      b.style.fontWeight = '800';
      b.style.padding = '2px 6px';
      b.style.borderRadius = '4px';
      b.innerText = '🔥 Estado Anabólico Active (+10% Treino XP)';
      statusBadgesContainer.appendChild(b);
    } else {
      state.anabolicActive = false;
    }

    // 💀 Catabolizando check
    const kcalPct = state.kcalTarget > 0 ? (totalKcal / state.kcalTarget) : 0;
    // Neglected kcal or carbs (< 30% of target) while fiber is 0 — só dispara se
    // a pessoa já registrou algo hoje; sem nenhum registro não é "má alimentação",
    // é só ausência de dados (não devia soar alarme pra quem ainda não logou nada).
    if (state.mealLogs.length > 0 && (kcalPct < 0.3 || totalCarbs < 20) && totalFiber === 0) {
      state.catabolizandoActive = true;
      const b = document.createElement('span');
      b.className = 'badge';
      b.style.background = '#e63946';
      b.style.color = '#fff';
      b.style.border = 'none';
      b.style.fontSize = '0.62rem';
      b.style.fontWeight = '800';
      b.style.padding = '2px 6px';
      b.style.borderRadius = '4px';
      b.innerText = '💀 Catabolizando';
      statusBadgesContainer.appendChild(b);
    } else {
      state.catabolizandoActive = false;
    }
  }

  document.getElementById('text-kcal').innerText = `${totalKcal}/${state.kcalTarget}`;
  document.getElementById('text-prot').innerText = `${totalProt}g/${state.protTarget}g`;
  document.getElementById('text-fiber').innerText = `${totalFiber}g/${state.fiberTarget}g`;
  
  const kcalBarPct = Math.min(100, (totalKcal / state.kcalTarget) * 100);
  const protBarPct = Math.min(100, (totalProt / state.protTarget) * 100);
  const fiberBarPct = Math.min(100, (totalFiber / state.fiberTarget) * 100);

  document.getElementById('bar-kcal').style.width = `${kcalBarPct}%`;
  document.getElementById('bar-prot').style.width = `${protBarPct}%`;
  document.getElementById('bar-fiber').style.width = `${fiberBarPct}%`;

  const dockPct = Math.min(100, Math.round((totalProt / state.protTarget) * 100));
  document.getElementById('protein-dock-percent').innerText = `Proteínas: ${dockPct}% da meta`;

  // Render daily quests
  renderDailyQuests();

  // ==========================================
  // TAB: TREINOS (WORKOUTS)
  // ==========================================
  // Standard vs Custom toggle styles
  const btnStd = document.getElementById('toggle-workout-std');
  const btnCust = document.getElementById('toggle-workout-cust');
  const btnAddEx = document.getElementById('btn-open-add-exercise-modal');

  if (state.useCustomWorkout) {
    btnStd.classList.remove('active');
    btnCust.classList.add('active');
    btnAddEx.classList.remove('hidden');
  } else {
    btnStd.classList.add('active');
    btnCust.classList.remove('active');
    btnAddEx.classList.add('hidden');
  }
  renderWorkoutRoutine();

  // ==========================================
  // TAB: DIETA (ALIMENTAÇÃO)
  // ==========================================
  document.getElementById('diet-kcal-summary').innerText = `${totalKcal} / ${state.kcalTarget} kcal`;
  document.getElementById('diet-prot-summary').innerText = `${totalProt} / ${state.protTarget} g`;
  document.getElementById('diet-fiber-summary').innerText = `${totalFiber} / ${state.fiberTarget} g`;
  
  const kcalPercent = Math.min(100, Math.floor((totalKcal / state.kcalTarget) * 100));
  document.getElementById('diet-kcal-percent').innerText = `${kcalPercent}%`;

  // Anel KCAL — r=44, circunferência = 276.46
  const kcalCirc = 276.46;
  document.getElementById('diet-kcal-ring-fill').style.strokeDashoffset = kcalCirc - (kcalPercent / 100) * kcalCirc;

  // Anel PROTEÍNA — r=28, circunferência = 175.93
  const protPercent = Math.min(100, Math.floor((totalProt / state.protTarget) * 100));
  const sideCirc = 175.93;
  const protRing = document.getElementById('diet-prot-ring-fill');
  if (protRing) protRing.style.strokeDashoffset = sideCirc - (protPercent / 100) * sideCirc;
  const protVal = document.getElementById('diet-prot-val');
  if (protVal) protVal.innerText = Math.round(totalProt);

  // Anel FIBRAS — mesmo raio
  const fiberPercent = Math.min(100, Math.floor((totalFiber / state.fiberTarget) * 100));
  const fiberRing = document.getElementById('diet-fiber-ring-fill');
  if (fiberRing) fiberRing.style.strokeDashoffset = sideCirc - (fiberPercent / 100) * sideCirc;
  const fiberVal = document.getElementById('diet-fiber-val');
  if (fiberVal) fiberVal.innerText = Math.round(totalFiber);

  const goalTextSimple = {
    emagrecer: "Perder peso",
    engordar: "Ganhar massa",
    manter: "Manter peso",
    estetico: "Estética",
    saude: "Saúde"
  };
  const goalTextRpg = {
    emagrecer: "Secar (Cutting)",
    engordar: "Crescer (Bulking)",
    manter: "Lapidar (Recomp)",
    estetico: "Ficar Estético",
    saude: "Melhorar Saúde"
  };
  const goalText = isSimple ? goalTextSimple : goalTextRpg;
  document.getElementById('diet-calorie-status').innerText = goalText[state.charGoal] || state.charGoal || '—';

  // Refresh dynamic food selectors
  populateFoodSelector();

  // Update diet buffs card
  const buffsCard = document.getElementById('diet-active-buffs-card');
  const buffsList = document.getElementById('diet-active-buffs-list');
  if (buffsCard && buffsList) {
    buffsList.innerHTML = '';
    let hasBuffs = false;

    if (state.anabolicActive) {
      hasBuffs = true;
      const card = document.createElement('div');
      card.className = 'active-buff-card anabolic';
      const title = isSimple ? 'Proteína suficiente ✅' : 'Estado Anabólico Ativo';
      const desc = isSimple
        ? 'Você atingiu a meta de proteínas de hoje. Continue mantendo o consumo para recuperação muscular.'
        : 'Meta de proteínas batida! Receba <strong>+10% XP</strong> em todos os treinos finalizados hoje.';
      card.innerHTML = `
        <span class="buff-icon">${isSimple ? '🥩' : '🔥'}</span>
        <div class="buff-details">
          <h5>${title}</h5>
          <p>${desc}</p>
        </div>
      `;
      buffsList.appendChild(card);
    }

    if (state.catabolizandoActive) {
      hasBuffs = true;
      const card = document.createElement('div');
      card.className = 'active-buff-card catabolizing';
      card.innerHTML = `
        <span class="buff-icon">⚠️</span>
        <div class="buff-details">
          <h5>Atenção à alimentação</h5>
          <p>Ingestão muito baixa de calorias ou carboidratos. Ajuste suas refeições para manter a energia.</p>
        </div>
      `;
      buffsList.appendChild(card);
    }

    if (hasBuffs) {
      buffsCard.classList.remove('hidden');
    } else {
      buffsCard.classList.add('hidden');
    }
  }

  // Render Food meal logs history
  renderMealLogs();

  // ==========================================
  // TAB: MENTORES
  // ==========================================
  renderMentorsList();

  // ==========================================
  // TAB: STATUS & ATRIBUTOS
  // ==========================================
  const currentRank = getSubclassRank(state.charClass, state.level);
  document.getElementById('stats-total-workouts').innerText = state.workoutsCompleted;
  document.getElementById('stats-level-num').innerText = state.level;
  document.getElementById('status-subclass').innerText = currentRank;
  document.getElementById('status-class').innerText = classLabels[state.charClass];

  let rankChar = 'E';
  if (state.level >= 75) rankChar = 'SSS';
  else if (state.level >= 60) rankChar = 'SS';
  else if (state.level >= 45) rankChar = 'S';
  else if (state.level >= 35) rankChar = 'A';
  else if (state.level >= 25) rankChar = 'B';
  else if (state.level >= 15) rankChar = 'C';
  else if (state.level >= 8) rankChar = 'D';
  document.getElementById('stats-rank-tier').innerText = rankChar;

  // Rank Tier Progress calculation
  let nextLvlReq = 8;
  let currentTierMin = 1;
  if (state.level >= 75) {
    currentTierMin = 75;
    nextLvlReq = 100;
  } else if (state.level >= 60) {
    currentTierMin = 60;
    nextLvlReq = 75;
  } else if (state.level >= 45) {
    currentTierMin = 45;
    nextLvlReq = 60;
  } else if (state.level >= 35) {
    currentTierMin = 35;
    nextLvlReq = 45;
  } else if (state.level >= 25) {
    currentTierMin = 25;
    nextLvlReq = 35;
  } else if (state.level >= 15) {
    currentTierMin = 15;
    nextLvlReq = 25;
  } else if (state.level >= 8) {
    currentTierMin = 8;
    nextLvlReq = 15;
  } else {
    currentTierMin = 1;
    nextLvlReq = 8;
  }
  
  let progressPct = 0;
  if (state.level >= 75) {
    progressPct = 100;
  } else {
    progressPct = Math.round(((state.level - currentTierMin) / (nextLvlReq - currentTierMin)) * 100);
  }
  
  const progressEl = document.getElementById('rank-tier-progress-fill');
  const valEl = document.getElementById('rank-tier-progress-val');
  const labelEl = document.getElementById('rank-tier-progress-label');
  
  if (progressEl && valEl && labelEl) {
    progressEl.style.width = `${progressPct}%`;
    valEl.innerText = `${progressPct}%`;
    if (state.level >= 75) {
      labelEl.innerText = `Rank Máximo Atingido (SSS)`;
    } else {
      const nextTierChar = state.level >= 60 ? 'SSS' :
                           state.level >= 45 ? 'SS' :
                           state.level >= 35 ? 'S' :
                           state.level >= 25 ? 'A' :
                           state.level >= 15 ? 'B' :
                           state.level >= 8 ? 'C' : 'D';
      labelEl.innerText = `Evolução para o Rank ${nextTierChar} (Nv. ${state.level}/${nextLvlReq})`;
    }
  }

  // Subclass Lore Updates
  const loreTitleEl = document.getElementById('lore-subclass-title');
  const loreDescEl = document.getElementById('lore-subclass-desc');
  if (loreTitleEl && loreDescEl) {
    loreTitleEl.innerText = currentRank;
    loreDescEl.innerText = getSubclassLore(state.charClass, currentRank);
  }

  // Attribute values (including gear bonuses)
  const getGearBonus = (stat) => {
    let bonus = 0;
    if (state.equippedItems) {
      Object.values(state.equippedItems).forEach(itemId => {
        if (itemId) {
          const item = EQUIPMENT_DATABASE.find(i => i.id === itemId);
          if (item && item.stats && item.stats[stat]) bonus += item.stats[stat];
        }
      });
    }
    return bonus;
  };

  const renderStat = (id, base, stat) => {
    const bonus = getGearBonus(stat);
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = bonus > 0 
        ? `${base + bonus} <span class="stat-gear-bonus" style="color: var(--color-accent); font-size: 0.8em; font-weight: bold;">(+${bonus} Equip.)</span>`
        : `${base}`;
    }
  };

  renderStat('val-for', state.attributes.for, 'for');
  renderStat('val-res', state.attributes.res, 'res');
  renderStat('val-agi', state.attributes.agi, 'agi');
  renderStat('val-vig', state.attributes.vig, 'vig');
  renderStat('val-foc', state.attributes.foc, 'foc');

  // Attribute Points Indicator
  const attrBox = document.getElementById('attr-points-box');
  const attrValText = document.getElementById('attr-points-value');
  const addBtnList = document.querySelectorAll('.btn-attr-add');

  if (state.attrPoints > 0) {
    attrBox.classList.remove('hidden');
    attrValText.innerText = state.attrPoints;
    addBtnList.forEach(btn => btn.classList.remove('hidden'));
  } else {
    attrBox.classList.add('hidden');
    addBtnList.forEach(btn => btn.classList.add('hidden'));
  }

  // Render trophies slots & showcase
  renderTrophies();
  renderShowcase();

  // Apply unlocked/equipped item visual classes to body so CSS selectors work globally
  const itemClassMap = {
    'item_faixa':     'has-item-faixa',
    'item_bracelete': 'has-item-bracelete',
    'item_aura':      'has-item-aura',
    'item_cinturão':  'has-item-cinturo',
    'item_aurabroly': 'has-item-aurabroly',
    'item_capa':      'has-item-capa',
    // Mentor unlocked cosmetics
    'has-men-beb10':  'has-men-beb10',
    'has-men-beb20':  'has-men-beb20',
    'has-men-beb25':  'has-men-beb25',
    'has-men-lee20':  'has-men-lee20',
    'has-men-lee25':  'has-men-lee25',
    'has-men-gok20':  'has-men-gok20',
    'has-men-arn5':   'has-men-arn5',
    'has-men-arn25':  'has-men-arn25',
    'has-men-ram5':   'has-men-ram5',
    'has-men-ram20':  'has-men-ram20',
    'has-men-bro20':  'has-men-bro20',
    'has-men-sai20':  'has-men-sai20',
    'has-men-sai25':  'has-men-sai25',
    'has-men-nic5':   'has-men-nic5',
    'has-men-nic20':  'has-men-nic20',
    'has-men-nic25':  'has-men-nic25'
  };
  
  // Strip all previous item classes from body
  Object.values(itemClassMap).forEach(cls => document.body.classList.remove(cls));

  // Re-apply currently equipped or non-equipable unlocked ones
  const equippedIds = state.equippedItems ? Object.values(state.equippedItems) : [];
  if (state.unlockedItems && state.unlockedItems.length > 0) {
    state.unlockedItems.forEach(id => {
      const isEquipable = ['item_faixa', 'item_bracelete', 'item_aura', 'item_cinturão', 'item_aurabroly', 'item_capa'].includes(id) 
                       || ['has-item-faixa', 'has-item-bracelete', 'has-item-aura', 'has-item-cinturo', 'has-item-aurabroly', 'has-item-capa'].includes(id);
                       
      if (isEquipable) {
        let stdId = id;
        if (id === 'has-item-faixa') stdId = 'item_faixa';
        if (id === 'has-item-bracelete') stdId = 'item_bracelete';
        if (id === 'has-item-aura') stdId = 'item_aura';
        if (id === 'has-item-cinturo' || id === 'has-item-cinturão') stdId = 'item_cinturão';
        if (id === 'has-item-aurabroly') stdId = 'item_aurabroly';
        if (id === 'has-item-capa') stdId = 'item_capa';

        const isEquipped = equippedIds.includes(stdId) || 
                           (stdId === 'item_faixa' && equippedIds.includes('has-item-faixa')) ||
                           (stdId === 'item_bracelete' && equippedIds.includes('has-item-bracelete')) ||
                           (stdId === 'item_aura' && equippedIds.includes('has-item-aura')) ||
                           (stdId === 'item_cinturão' && equippedIds.includes('has-item-cinturo')) ||
                           (stdId === 'item_aurabroly' && equippedIds.includes('has-item-aurabroly')) ||
                           (stdId === 'item_capa' && equippedIds.includes('has-item-capa'));

        if (isEquipped) {
          const cls = itemClassMap[stdId] || itemClassMap[id];
          if (cls) document.body.classList.add(cls);
        }
      } else {
        const cls = itemClassMap[id];
        if (cls) document.body.classList.add(cls);
      }
    });
  }

  // Sincronizar temporizador de descanso na interface de treinos
  const quickRestEnable = document.getElementById('quick-rest-enable');
  const quickRestTime = document.getElementById('quick-rest-time');
  if (quickRestEnable) {
    quickRestEnable.checked = state.restTimerEnabled !== false;
  }
  if (quickRestTime) {
    quickRestTime.value = state.baseRestTime || 90;
  }
  const quickRestTimeWrap = document.getElementById('quick-rest-time-wrap');
  if (quickRestTimeWrap) {
    quickRestTimeWrap.style.display = (state.restTimerEnabled !== false) ? 'flex' : 'none';
  }

  // Render Daily Challenge & Evolution SVG Chart & Equipment Tab
  renderDailyChallenge();
  renderEvolutionChart();
  renderCalendarHistory();
  if (getWaterStreak() >= 5) unlockTrophy('hidratacao_consistente');
  renderEquipment();

  // Update Eternal Flame Click Counter
  renderEternalFlameCount();
}

// 12. CHECK META COMPLETIONS (DAILY INTEGRATION)
function checkQuestRequirements() {
  let changed = false;
  const focBonus = 1 + (getEffectiveAttributes().foc * 0.01);
  state.dailyQuests.forEach(q => {
    if (!q.completed) {
      if (q.id === 'quest_water' && state.waterIntake >= state.waterTarget) {
        q.completed = true;
        addXP(Math.round(q.xpReward * focBonus));
        addMentorXP(state.activeMentor, 15); // Water Goal met (+15 XP)
        playSound('quest');
        changed = true;
      }
      if (q.id === 'quest_protein' && state.proteinIntake >= (state.protTarget * 0.8)) {
        q.completed = true;
        addXP(Math.round(q.xpReward * focBonus));
        playSound('quest');
        changed = true;
        if (state.proteinIntake >= state.protTarget) {
          addMentorXP(state.activeMentor, 20); // Protein Goal met (+20 XP)
        }
      }
      if (q.id === 'quest_volume') {
        const setsToday = Object.values(state.activeSetsTracker || {}).filter(isSetCompleted).length;
        if (setsToday >= 12) {
          q.completed = true;
          addXP(Math.round(q.xpReward * focBonus));
          playSound('quest');
          changed = true;
        }
      }
    }
  });

  // Check if all daily quests are completed for Mente Blindada
  if (state.dailyQuests && state.dailyQuests.length > 0) {
    const allDone = state.dailyQuests.every(q => q.completed);
    if (allDone && !state.unlockedTrophies.includes('mind_shield')) {
      unlockTrophy('mind_shield');
      changed = true;
    }
  }

  if (changed) {
    saveState();
  }
}

// 13. RENDER QUESTS ON SCREEN
function renderDailyQuests() {
  const container = document.getElementById('daily-quests-list');
  container.innerHTML = '';
  
  let completedCount = 0;
  state.dailyQuests.forEach(q => {
    if (q.completed) completedCount++;

    const card = document.createElement('div');
    card.className = `quest-item-card glass-panel ${q.completed ? 'completed' : ''}`;
    
    const checkDiv = document.createElement('div');
    checkDiv.className = 'quest-check';
    checkDiv.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    
    if (!q.completed) {
      checkDiv.addEventListener('click', () => {
        playSound('quest');
        q.completed = true;
        const focBonus = 1 + (getEffectiveAttributes().foc * 0.01);
        addXP(Math.round(q.xpReward * focBonus));
        saveState();
        updateUI();
      });
    }

    const info = document.createElement('div');
    info.className = 'quest-info-text';
    info.innerHTML = `
      <h4>${q.name}</h4>
      <p style="font-size: 0.65rem; color: var(--text-secondary);">${q.desc}</p>
    `;

    const rewards = document.createElement('div');
    rewards.className = 'quest-rewards';
    const focBonus = 1 + (getEffectiveAttributes().foc * 0.01);
    rewards.innerHTML = `<span class="reward-badge xp-reward">+${Math.round(q.xpReward * focBonus)} XP</span>`;

    const questDetail = document.createElement('div');
    questDetail.className = 'quest-detail';
    questDetail.appendChild(checkDiv);
    questDetail.appendChild(info);

    card.appendChild(questDetail);
    card.appendChild(rewards);
    container.appendChild(card);
  });

  document.getElementById('quests-completed-badge').innerText = `${completedCount}/${state.dailyQuests.length}`;
}

// ==========================================
// 14. EXERCISE PROGRESSION AND OVERLOAD ALERTS
// ==========================================
function showOverloadToast(exerciseName, oldWeight, newWeight) {
  const toast = document.getElementById('overload-notification');
  const message = document.getElementById('overload-msg');
  const voice = resolveVoiceLine('newRecord', { exercise: exerciseName, kg: newWeight });
  message.innerText = state.appMode === 'simple' ? voice : `${voice} (+15 XP)`;
  
  toast.classList.remove('hidden');
  playSound('quest');
  
  // Screen shake on overload toast!
  document.body.classList.add('screen-shake');
  setTimeout(() => {
    document.body.classList.remove('screen-shake');
  }, 500);

  // Slide up/fade out after 3.8s
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3800);
}

function showGenericNotification(msg) {
  const toast = document.getElementById('overload-notification');
  const message = document.getElementById('overload-msg');
  if (toast && message) {
    message.innerText = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

// Persist a new PR for an exercise to both state.personalRecords and freaky_quest_user.workoutHistory
function persistPR(exName, newWeight) {
  state.personalRecords[exName] = newWeight;
  if (!userProfile.workoutHistory) userProfile.workoutHistory = {};
  userProfile.workoutHistory[exName] = newWeight;

  // Patch freaky_quest_user in localStorage without overwriting other keys
  try {
    const raw = localStorage.getItem('freaky_quest_user');
    const userObj = raw ? JSON.parse(raw) : {};
    if (!userObj.workoutHistory) userObj.workoutHistory = {};
    userObj.workoutHistory[exName] = newWeight;
    localStorage.setItem('freaky_quest_user', JSON.stringify(userObj));
  } catch (_e) {}
}

// Check and handle a potential PR for an exercise given an input weight.
// Returns true if a new record was set.
// prBadgeEl: optional DOM element to animate the PR badge inside the exercise card.
function triggerPRSparkles(badgeEl) {
  if (!badgeEl) return;
  const rect = badgeEl.getBoundingClientRect();
  const parent = document.body;
  const colors = ['#ffb703', '#ff5e00', '#ffe494', '#ffffff'];
  
  for (let i = 0; i < 20; i++) {
    const s = document.createElement('div');
    s.className = 'pr-sparkle';
    s.style.left = `${rect.left + rect.width / 2 + window.scrollX}px`;
    s.style.top = `${rect.top + rect.height / 2 + window.scrollY}px`;
    s.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    s.style.setProperty('--tx', `${tx}px`);
    s.style.setProperty('--ty', `${ty}px`);
    
    parent.appendChild(s);
    
    setTimeout(() => {
      s.remove();
    }, 850);
  }
}

const CARDIO_TYPE_LABELS = {
  esteira: 'Esteira / Corrida',
  bike: 'Bike',
  eliptico: 'Elíptico',
  natacao: 'Natação',
  outro: 'Cardio'
};

// Teto diário de minutos de cardio que geram XP. Acima disso o tempo continua
// sendo registrado (o histórico é seu), mas não rende mais XP — sem isso dava
// pra spammar o botão e subir de nível em segundos, o que quebraria o ranking.
const CARDIO_XP_DAILY_CAP_MIN = 120;

// Registra uma sessão de cardio livre (esteira, bike, etc.) e concede XP
// proporcional aos minutos, escalado pelo atributo RES (Resistência).
function logCardioSession(type, minutes) {
  const alreadyToday = state.cardioMinutesToday || 0;
  const payableMinutes = Math.max(0, Math.min(minutes, CARDIO_XP_DAILY_CAP_MIN - alreadyToday));
  const xpPerMinute = 1 + Math.max(0, (getEffectiveAttributes().res - 10) * 0.02);
  const xpGained = Math.round(payableMinutes * xpPerMinute);

  if (xpGained > 0) addXP(xpGained);
  state.cardioMinutesToday = alreadyToday + minutes;
  state.cardioMinutesTotal = (state.cardioMinutesTotal || 0) + minutes;
  saveState();
  updateUI();

  const label = CARDIO_TYPE_LABELS[type] || CARDIO_TYPE_LABELS.outro;
  const isSimple = state.appMode === 'simple';
  let desc;
  if (isSimple) {
    // Modo simples esconde XP em toda a UI — não faz sentido citar aqui.
    desc = `${minutes} min de ${label} registrados. Bom trabalho!`;
  } else if (payableMinutes < minutes) {
    desc = `${minutes} min de ${label}. +${xpGained} XP (você bateu o teto diário de ${CARDIO_XP_DAILY_CAP_MIN} min de cardio com XP — o tempo extra fica registrado mesmo assim).`;
  } else {
    desc = `${minutes} min de ${label}. +${xpGained} XP!`;
  }

  showItemAcquiredModal('🏃', 'CARDIO REGISTRADO!', desc, {
    subtitle: 'REGISTRO DE CARDIO',
    btnText: 'BORA MAIS!'
  });
  playSound('quest');
}

function tryBreakPR(exName, inputWeight, prBadgeEl) {
  if (!inputWeight || inputWeight <= 0) return false;

  const prevBest = state.personalRecords[exName];
  const isNew = prevBest === undefined;
  const isBetter = !isNew && inputWeight > prevBest;

  if (!isNew && !isBetter) return false;

  // Award XP: +15 base, scaled by FOR attribute
  const forBonus = 15 + Math.round((getEffectiveAttributes().for || 10) * 0.5);
  addXP(forBonus);
  unlockTrophy('superacao_pessoal');

  if (isBetter) {
    // Show overload toast for weight increase
    showOverloadToast(exName, prevBest, inputWeight);
  }

  // Persist the new record
  persistPR(exName, inputWeight);

  if (Object.keys(state.personalRecords || {}).length >= 5) {
    unlockTrophy('colecionador_recordes');
  }

  // Animate the PR badge on the exercise card
  if (prBadgeEl) {
    prBadgeEl.innerText = isNew ? '⚡ PRIMEIRO REGISTRO!' : 'RECORD QUEBRADO! ⚔️';
    prBadgeEl.style.display = 'flex';
    prBadgeEl.classList.remove('pr-badge-animate');
    // Force reflow to re-trigger animation
    void prBadgeEl.offsetWidth;
    prBadgeEl.classList.add('pr-badge-animate');

    triggerPRSparkles(prBadgeEl);
  }

  return true;
}

// Helper to check for joint pain / injury warnings based on user profile selections.
// Reads state.injury which is always kept as an array (synced from userProfile.jointPain).
function checkExerciseInjuryWarning(exName, exMuscle) {
  // Normalise state.injury to a clean array regardless of legacy string format
  let injuries;
  if (!state.injury) {
    injuries = [];
  } else if (Array.isArray(state.injury)) {
    injuries = state.injury;
  } else {
    injuries = [state.injury];
  }

  // Filter out falsy entries and 'Nenhum' — no warnings when healthy
  injuries = injuries.filter(i => i && i.toUpperCase() !== 'NENHUM');
  if (injuries.length === 0) return null;

  const nameUpper = exName.toUpperCase();
  const muscleUpper = exMuscle.toUpperCase();

  for (const injItem of injuries) {
    const inj = injItem.toUpperCase();

    if (inj === 'JOELHO') {
      if (
        muscleUpper === 'PERNAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('LEG PRESS') ||
        nameUpper.includes('LUNGE') ||
        nameUpper.includes('AFUNDO') ||
        nameUpper.includes('PASSADA') ||
        nameUpper.includes('FLEXORA') ||
        nameUpper.includes('EXTENSORA') ||
        nameUpper.includes('PISTOL')
      ) {
        return '⚠️ Atenção: Carga nos joelhos. Reduza o peso ou evite dores.';
      }
    } else if (inj === 'QUADRIL') {
      if (
        muscleUpper === 'PERNAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('TERRA') ||
        nameUpper.includes('DEADLIFT') ||
        nameUpper.includes('LEG PRESS') ||
        nameUpper.includes('LUNGE') ||
        nameUpper.includes('PISTOL') ||
        nameUpper.includes('GOOD MORNING')
      ) {
        return '⚠️ Atenção: Flexão profunda do quadril. Vá com cautela.';
      }
    } else if (inj === 'COSTAS' || inj === 'COLUNA') {
      if (
        muscleUpper === 'COSTAS' ||
        nameUpper.includes('AGACHAMENTO') ||
        nameUpper.includes('TERRA') ||
        nameUpper.includes('DEADLIFT') ||
        nameUpper.includes('REMADA') ||
        nameUpper.includes('GOOD MORNING') ||
        nameUpper.includes('DESENVOLVIMENTO') ||
        nameUpper.includes('OHP') ||
        nameUpper.includes('MILITAR')
      ) {
        return '⚠️ Atenção: Carga axial na coluna. Cuidado com a lombar!';
      }
    } else if (inj === 'PULSO') {
      if (
        muscleUpper === 'BRAÇOS' ||
        muscleUpper === 'OMBROS' ||
        muscleUpper === 'PEITO' ||
        nameUpper.includes('ROSCA') ||
        nameUpper.includes('SUPINO') ||
        nameUpper.includes('TESTA') ||
        nameUpper.includes('TRÍCEPS') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('HANDSTAND')
      ) {
        return '⚠️ Atenção: Esforço nos punhos. Mantenha estabilizado.';
      }
    } else if (inj === 'OMBRO') {
      if (
        muscleUpper === 'OMBROS' ||
        muscleUpper === 'PEITO' ||
        nameUpper.includes('SUPINO') ||
        nameUpper.includes('DESENVOLVIMENTO') ||
        nameUpper.includes('OHP') ||
        nameUpper.includes('ELEVAÇÃO') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('PIKE') ||
        nameUpper.includes('HANDSTAND')
      ) {
        return '⚠️ Atenção: Articulação do ombro sob carga. Estabilize bem.';
      }
    } else if (inj === 'COTOVELO') {
      if (
        muscleUpper === 'BRAÇOS' ||
        nameUpper.includes('ROSCA') ||
        nameUpper.includes('TESTA') ||
        nameUpper.includes('TRÍCEPS') ||
        nameUpper.includes('DIPS') ||
        nameUpper.includes('PARALELAS') ||
        nameUpper.includes('PUXADA') ||
        nameUpper.includes('FLEXÃO') ||
        nameUpper.includes('PUSHUP')
      ) {
        return '⚠️ Atenção: Esforço nos cotovelos. Evite travar totalmente.';
      }
    }
  }

  return null;
}

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
      ? `<img src="${icon}" alt="" class="mrw-icon-img" />`
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

// 17. TROPHIES SLOTS RENDER
function renderTrophies() {
  const container = document.getElementById('trophies-list');
  if (!container) return;
  container.innerHTML = '';

  if (!state.showcaseTrophies) state.showcaseTrophies = [];
  if (!state.unlockedTrophies) state.unlockedTrophies = [];

  TROPHIES.forEach(t => {
    const isUnlocked = state.unlockedTrophies.includes(t.id);
    const isFeatured = state.showcaseTrophies.includes(t.id);
    
    const slot = document.createElement('div');
    slot.className = `trophy-slot ${isUnlocked ? 'unlocked' : ''} ${isFeatured ? 'featured' : ''}`;
    slot.innerHTML = isUnlocked ? t.icon : '❓';
    
    if (isUnlocked) {
      slot.title = `${t.name} - ${t.desc} (Toque para destacar/remover)`;
      slot.addEventListener('click', () => {
        toggleShowcaseTrophy(t.id);
      });
    } else {
      slot.title = `Bloqueado - ${t.desc}`;
    }
    container.appendChild(slot);
  });
}

function renderShowcase() {
  const container = document.getElementById('showcase-slots');
  if (!container) return;
  container.innerHTML = '';

  if (!state.showcaseTrophies) state.showcaseTrophies = [];

  for (let i = 0; i < 3; i++) {
    const slotId = state.showcaseTrophies[i];
    const slotEl = document.createElement('div');
    
    if (slotId) {
      const t = TROPHIES.find(item => item.id === slotId);
      if (t) {
        slotEl.className = 'showcase-slot active';
        slotEl.innerHTML = `
          <span class="showcase-icon">${t.icon}</span>
          <span class="showcase-name">${t.name}</span>
        `;
        slotEl.title = `Clique para remover "${t.name}" da vitrine`;
        slotEl.addEventListener('click', () => {
          toggleShowcaseTrophy(slotId);
        });
      } else {
        slotEl.className = 'showcase-slot';
        slotEl.innerHTML = `<span class="showcase-empty">+ Destacar</span>`;
      }
    } else {
      slotEl.className = 'showcase-slot';
      slotEl.innerHTML = `<span class="showcase-empty">+ Destacar</span>`;
    }
    container.appendChild(slotEl);
  }
}

function toggleShowcaseTrophy(trophyId) {
  if (!state.showcaseTrophies) state.showcaseTrophies = [];
  
  if (state.showcaseTrophies.includes(trophyId)) {
    state.showcaseTrophies = state.showcaseTrophies.filter(id => id !== trophyId);
    playSound('click');
  } else {
    if (state.showcaseTrophies.length < 3) {
      state.showcaseTrophies.push(trophyId);
      playSound('click');
    } else {
      showGenericNotification('Vitrine cheia! Remova um destaque antes.');
      playSound('click');
    }
  }
  saveState();
  renderTrophies();
  renderShowcase();
  updateUI();
}

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
  const classLabels = {
    bodybuilder: 'Bodybuilder 💪',
    powerlifter: 'Powerlifter 🏋️‍♂️',
    calistenia: 'Calistênico 🤸‍♂️',
    maratonista: 'Maratonista 🏃‍♂️'
  };

  const avatarEl = document.getElementById('pcm-avatar');
  // Mesmo bug do amb-img: onerror inline (disparado quando src="" no primeiro
  // render) deixa opacity presa mesmo depois de um avatar válido carregar.
  if (avatarEl) { avatarEl.style.opacity = ''; avatarEl.src = getUserAvatarSrc(); }

  const nameEl = document.getElementById('pcm-name');
  if (nameEl) nameEl.innerText = state.charName || 'Hunter';

  const isSimpleProfile = state.appMode === 'simple';
  const subEl = document.getElementById('pcm-sub');
  if (subEl) {
    if (isSimpleProfile) {
      subEl.innerText = classLabels[state.charClass] || state.charClass || '';
    } else {
      const rankChar = getHunterRankChar(state.level);
      subEl.innerText = `Hunter Rank ${rankChar} · ${classLabels[state.charClass] || state.charClass || ''}`;
    }
  }

  const titleEl = document.getElementById('pcm-title-badge');
  if (titleEl) titleEl.innerText = getSubclassRank(state.charClass, state.level);

  document.getElementById('pcm-stat-streak').innerText = state.currentStreak || 0;
  document.getElementById('pcm-stat-xp').innerText = state.xp + (state.level > 1 ? '' : '');
  document.getElementById('pcm-stat-workouts').innerText = state.workoutsCompleted || 0;
  document.getElementById('pcm-stat-trophies').innerText = (state.unlockedTrophies || []).length;
  document.getElementById('pcm-stat-cardio').innerText = state.cardioMinutesTotal || 0;

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
        <span class="pcm-record-name">🏋️ ${escapeHtml(exName)}</span>
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
      item.innerHTML = `<span>${escapeHtml(name)}</span><span style="color:var(--color-primary);font-weight:800;">${state.personalRecords[name]} kg</span>`;
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
    const card = document.createElement('div');
    card.className = 'pcm-mentor-mini';
    card.innerHTML = `
      <div class="pcm-mentor-mini-name">${m.name}</div>
      <div class="pcm-mentor-mini-lvl">Nv ${r.level} · ${rankInfo.label}</div>
    `;
    container.appendChild(card);
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

// Conta dias seguidos (até hoje) em que a meta de água foi batida, usando o histórico do calendário
function getWaterStreak() {
  if (!state.dailyHistory) return 0;
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const entry = state.dailyHistory[dateStr];
    if (entry && entry.waterTarget > 0 && entry.water >= entry.waterTarget) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function unlockTrophy(trophyId) {
  if (!state.unlockedTrophies) {
    state.unlockedTrophies = [];
  }
  if (!state.unlockedTrophies.includes(trophyId)) {
    state.unlockedTrophies.push(trophyId);
    saveState();
    renderTrophies();
    renderShowcase();
    
    const trophy = TROPHIES.find(t => t.id === trophyId);
    if (trophy) {
      playSound('levelup');
      showItemAcquiredModal(trophy.icon, `CONQUISTA DESBLOQUEADA!`, `${trophy.name}: ${trophy.desc}`, { subtitle: '🏆 TROFÉU', btnText: 'SHOW!' });
    }
  }
}

function renderEvolutionChart() {
  const svg = document.getElementById('evolution-svg');
  if (!svg) return;
  svg.innerHTML = '';

  const wHist = state.weightHistory || [];
  const sHist = state.strengthHistory || [];

  if (wHist.length === 0) wHist.push(parseFloat(state.charWeight) || 80);
  if (sHist.length === 0) sHist.push(50 + (getEffectiveAttributes().for || 10) * 1.5);

  const finalW = [...wHist];
  const finalS = [...sHist];

  if (finalW.length === 1) finalW.unshift(finalW[0]);
  if (finalS.length === 1) finalS.unshift(finalS[0]);

  const width = 400;
  const height = 150;
  const padding = 20;

  const minW = Math.min(...finalW) - 1;
  const maxW = Math.max(...finalW) + 1;
  const diffW = (maxW - minW) || 1;

  const minS = Math.min(...finalS) - 5;
  const maxS = Math.max(...finalS) + 5;
  const diffS = (maxS - minS) || 1;

  const pointsCount = finalW.length;

  for (let i = 0; i <= 3; i++) {
    const yVal = padding + ((height - 2 * padding) / 3) * i;
    const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    gridLine.setAttribute('x1', padding.toString());
    gridLine.setAttribute('y1', yVal.toString());
    gridLine.setAttribute('x2', (width - padding).toString());
    gridLine.setAttribute('y2', yVal.toString());
    gridLine.setAttribute('stroke', 'rgba(255, 255, 255, 0.05)');
    gridLine.setAttribute('stroke-width', '1');
    svg.appendChild(gridLine);
  }

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  const strengthPoints = [];
  const weightPoints = [];

  for (let idx = 0; idx < pointsCount; idx++) {
    const x = padding + ((width - 2 * padding) / (pointsCount - 1)) * idx;
    const yS = height - padding - ((finalS[idx] - minS) / diffS) * (height - 2 * padding);
    strengthPoints.push({ x, y: yS, val: finalS[idx] });

    const yW = height - padding - ((finalW[idx] - minW) / diffW) * (height - 2 * padding);
    weightPoints.push({ x, y: yW, val: finalW[idx] });
  }

  function drawLine(points, color, glowId, isDashed) {
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2.5');
    if (isDashed) {
      path.setAttribute('stroke-dasharray', '4,4');
    }
    path.setAttribute('filter', `url(#${glowId})`);
    svg.appendChild(path);
  }

  drawLine(strengthPoints, '#ff5e00', 'glow-orange', false);
  drawLine(weightPoints, '#00f2fe', 'glow-cyan', true);

  function drawDots(points, color, typeLabel, unit) {
    points.forEach((p, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x.toString());
      circle.setAttribute('cy', p.y.toString());
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', color);
      circle.setAttribute('class', 'chart-dot chart-node');
      
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${typeLabel}: ${Math.round(p.val * 10) / 10} ${unit}`;
      circle.appendChild(title);

      circle.addEventListener('click', () => {
        playSound('click');
        const desc = `Métrica de evolução histórica registrada:
        • Categoria: ${typeLabel}
        • Valor alcançado: ${Math.round(p.val * 10) / 10} ${unit}
        • Registro: Armazenado com sucesso na Forja do Destino.`;
        showItemAcquiredModal('📈', 'REGISTRO DE EVOLUÇÃO', desc, { subtitle: 'HISTÓRICO', btnText: 'ENTENDI' });
      });

      svg.appendChild(circle);

      if (idx === pointsCount - 1) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (p.x - 45).toString());
        text.setAttribute('y', (p.y - 8).toString());
        text.setAttribute('fill', color);
        text.setAttribute('font-size', '8px');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `${Math.round(p.val * 10) / 10} ${unit}`;
        svg.appendChild(text);
      }
    });
  }

  drawDots(strengthPoints, '#ff9f1c', 'Força Est.', 'XP');
  drawDots(weightPoints, '#00f2fe', 'Peso', 'kg');
}

// Calendar History Variables
let selectedHistoryDate = null;

function selectHistoricalDay(dateStr) {
  playSound('click');
  selectedHistoryDate = dateStr;

  const btnReset = document.getElementById('btn-reset-to-today');
  const fitTitle = document.getElementById('fitness-title');

  if (dateStr) {
    const dayPart = dateStr.split('-')[2];
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const monthIdx = parseInt(dateStr.split('-')[1]) - 1;
    if (fitTitle) fitTitle.innerText = `Histórico de Atividade (${parseInt(dayPart)} de ${monthNames[monthIdx]})`;
    if (btnReset) btnReset.style.display = 'inline-block';
    openActivityDetailsModal(dateStr);
  } else {
    const now = new Date();
    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    if (fitTitle) fitTitle.innerText = `Histórico de Atividade (${monthNames[now.getMonth()]} ${now.getFullYear()})`;
    if (btnReset) btnReset.style.display = 'none';
  }

  renderCalendarHistory();
}

function openActivityDetailsModal(dateStr) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dateStr === todayStr) {
    state.dailyHistory[todayStr] = {
      kcal: state.dailyMacros ? (state.dailyMacros.kcal || 0) : 0,
      kcalTarget: state.kcalTarget || 2500,
      water: state.waterDrank || 0,
      waterTarget: state.waterTarget || 3.0,
      workouts: state.workoutsThisWeek || 0,
      workoutTarget: state.weeklyTrainGoal || 4
    };
  }

  const entry = state.dailyHistory[dateStr] || {
    kcal: 0,
    kcalTarget: state.kcalTarget || 2500,
    water: 0,
    waterTarget: state.waterTarget || 3.0,
    workouts: 0,
    workoutTarget: state.weeklyTrainGoal || 4
  };

  const dayPart = dateStr.split('-')[2];
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const monthIdx = parseInt(dateStr.split('-')[1]) - 1;
  const formattedDate = `${parseInt(dayPart)} de ${monthNames[monthIdx]}`;

  const dateEl = document.getElementById('activity-details-date');
  if (dateEl) dateEl.innerText = formattedDate;

  // --- Draw Apple Fitness-style concentric rings ---
  const svgEl = document.getElementById('activity-rings-svg');
  if (!svgEl) return;
  svgEl.innerHTML = ''; // Clear previous

  const cx = 110, cy = 110;
  // Ring definitions: outer -> inner
  // Outer: Alimentação (red/pink), Middle: Treino (green), Inner: Água (cyan/blue)
  const rings = [
    {
      key: 'food',
      label: 'Alimentação',
      icon: '🍎',
      value: entry.kcal || 0,
      target: entry.kcalTarget || 2500,
      unit: 'kcal',
      radius: 95,
      strokeWidth: 18,
      colorStart: '#FF2D55',
      colorEnd: '#FF6B8A',
      bgColor: 'rgba(255, 45, 85, 0.15)',
      arrow: '→'
    },
    {
      key: 'workout',
      label: 'Treino',
      icon: '🏋️',
      value: entry.workouts || 0,
      target: entry.workoutTarget || 4,
      unit: 'treinos',
      radius: 72,
      strokeWidth: 18,
      colorStart: '#30D158',
      colorEnd: '#A8FF78',
      bgColor: 'rgba(48, 209, 88, 0.15)',
      arrow: '»'
    },
    {
      key: 'water',
      label: 'Consumo de Água',
      icon: '💧',
      value: entry.water || 0,
      target: entry.waterTarget || 3.0,
      unit: 'L',
      radius: 49,
      strokeWidth: 18,
      colorStart: '#00C7FC',
      colorEnd: '#5AC8FA',
      bgColor: 'rgba(0, 199, 252, 0.15)',
      arrow: '↑'
    }
  ];

  const ns = 'http://www.w3.org/2000/svg';

  // Add gradient definitions
  const defs = document.createElementNS(ns, 'defs');
  rings.forEach((ring, idx) => {
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', `ring-grad-${idx}`);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const stop1 = document.createElementNS(ns, 'stop');
    stop1.setAttribute('offset', '0%'); stop1.setAttribute('stop-color', ring.colorStart);
    const stop2 = document.createElementNS(ns, 'stop');
    stop2.setAttribute('offset', '100%'); stop2.setAttribute('stop-color', ring.colorEnd);
    grad.appendChild(stop1); grad.appendChild(stop2);
    defs.appendChild(grad);

    // Glow filter
    const filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', `ring-glow-${idx}`);
    filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
    const feGauss = document.createElementNS(ns, 'feGaussianBlur');
    feGauss.setAttribute('in', 'SourceGraphic');
    feGauss.setAttribute('stdDeviation', '3');
    filter.appendChild(feGauss);
    defs.appendChild(filter);
  });
  svgEl.appendChild(defs);

  rings.forEach((ring, idx) => {
    const circumference = 2 * Math.PI * ring.radius;
    const progress = ring.value / ring.target;
    
    // Background track circle
    const bgCircle = document.createElementNS(ns, 'circle');
    bgCircle.setAttribute('cx', cx); bgCircle.setAttribute('cy', cy);
    bgCircle.setAttribute('r', ring.radius);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', ring.bgColor);
    bgCircle.setAttribute('stroke-width', ring.strokeWidth);
    bgCircle.setAttribute('stroke-linecap', 'round');
    svgEl.appendChild(bgCircle);

    // 1. Draw base 100% progress if progress is >= 1.0, otherwise draw actual progress
    const baseProgress = Math.min(progress, 1.0);
    const baseDashLen = baseProgress * circumference;

    if (baseProgress > 0) {
      // Glow layer behind base progress
      const glowCircle = document.createElementNS(ns, 'circle');
      glowCircle.setAttribute('cx', cx); glowCircle.setAttribute('cy', cy);
      glowCircle.setAttribute('r', ring.radius);
      glowCircle.setAttribute('fill', 'none');
      glowCircle.setAttribute('stroke', ring.colorStart);
      glowCircle.setAttribute('stroke-width', ring.strokeWidth + 4);
      glowCircle.setAttribute('stroke-linecap', 'round');
      glowCircle.setAttribute('stroke-dasharray', `${baseDashLen} ${circumference}`);
      glowCircle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      glowCircle.setAttribute('filter', `url(#ring-glow-${idx})`);
      glowCircle.setAttribute('opacity', '0.35');
      svgEl.appendChild(glowCircle);

      // Progress arc circle
      const progCircle = document.createElementNS(ns, 'circle');
      progCircle.setAttribute('cx', cx); progCircle.setAttribute('cy', cy);
      progCircle.setAttribute('r', ring.radius);
      progCircle.setAttribute('fill', 'none');
      progCircle.setAttribute('stroke', `url(#ring-grad-${idx})`);
      progCircle.setAttribute('stroke-width', ring.strokeWidth);
      progCircle.setAttribute('stroke-linecap', 'round');
      progCircle.setAttribute('stroke-dasharray', `${baseDashLen} ${circumference}`);
      progCircle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      progCircle.style.transition = 'stroke-dasharray 0.6s ease';
      svgEl.appendChild(progCircle);
    }

    // 2. Draw overflow overlapping arc if progress > 1.0
    if (progress > 1.0) {
      const overflowProgress = Math.min(progress - 1.0, 0.98); // cap slightly below 2.0 to show overlapping end clearly
      const overflowDashLen = overflowProgress * circumference;

      // Glow layer behind overflow progress
      const glowOverflow = document.createElementNS(ns, 'circle');
      glowOverflow.setAttribute('cx', cx); glowOverflow.setAttribute('cy', cy);
      glowOverflow.setAttribute('r', ring.radius);
      glowOverflow.setAttribute('fill', 'none');
      glowOverflow.setAttribute('stroke', ring.colorEnd);
      glowOverflow.setAttribute('stroke-width', ring.strokeWidth + 4);
      glowOverflow.setAttribute('stroke-linecap', 'round');
      glowOverflow.setAttribute('stroke-dasharray', `${overflowDashLen} ${circumference}`);
      glowOverflow.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      glowOverflow.setAttribute('filter', `url(#ring-glow-${idx})`);
      glowOverflow.setAttribute('opacity', '0.45');
      svgEl.appendChild(glowOverflow);

      // Overflow arc circle
      const overflowCircle = document.createElementNS(ns, 'circle');
      overflowCircle.setAttribute('cx', cx); overflowCircle.setAttribute('cy', cy);
      overflowCircle.setAttribute('r', ring.radius);
      overflowCircle.setAttribute('fill', 'none');
      overflowCircle.setAttribute('stroke', `url(#ring-grad-${idx})`);
      overflowCircle.setAttribute('stroke-width', ring.strokeWidth);
      overflowCircle.setAttribute('stroke-linecap', 'round');
      overflowCircle.setAttribute('stroke-dasharray', `${overflowDashLen} ${circumference}`);
      overflowCircle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
      overflowCircle.style.transition = 'stroke-dasharray 0.6s ease';
      // Add subtle shadow to separate overlapping ring
      overflowCircle.setAttribute('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))');
      svgEl.appendChild(overflowCircle);
    }

    // Arrow/icon at the end of the arc
    const displayProgress = progress > 1.0 ? progress - 1.0 : progress;
    const endAngle = (displayProgress * 360) - 90;
    const endRad = (endAngle * Math.PI) / 180;
    const arrowX = cx + ring.radius * Math.cos(endRad);
    const arrowY = cy + ring.radius * Math.sin(endRad);
    if (progress > 0.02) {
      const arrowText = document.createElementNS(ns, 'text');
      arrowText.setAttribute('x', arrowX);
      arrowText.setAttribute('y', arrowY);
      arrowText.setAttribute('text-anchor', 'middle');
      arrowText.setAttribute('dominant-baseline', 'central');
      arrowText.setAttribute('font-size', '10');
      arrowText.setAttribute('font-weight', '900');
      arrowText.setAttribute('fill', '#fff');
      arrowText.textContent = ring.arrow;
      svgEl.appendChild(arrowText);
    }

    // Invisible clickable area for this ring
    const hitCircle = document.createElementNS(ns, 'circle');
    hitCircle.setAttribute('cx', cx); hitCircle.setAttribute('cy', cy);
    hitCircle.setAttribute('r', ring.radius);
    hitCircle.setAttribute('fill', 'none');
    hitCircle.setAttribute('stroke', 'transparent');
    hitCircle.setAttribute('stroke-width', ring.strokeWidth + 6);
    hitCircle.style.cursor = 'pointer';
    hitCircle.addEventListener('click', () => showRingDetail(ring));
    svgEl.appendChild(hitCircle);
  });

  // Hide detail card initially
  const detailCard = document.getElementById('activity-ring-detail');
  if (detailCard) detailCard.style.display = 'none';

  const modalEl = document.getElementById('activity-details-modal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function showRingDetail(ring) {
  const detailCard = document.getElementById('activity-ring-detail');
  const iconEl = document.getElementById('ring-detail-icon');
  const labelEl = document.getElementById('ring-detail-label');
  const valueEl = document.getElementById('ring-detail-value');
  const barEl = document.getElementById('ring-detail-bar');
  if (!detailCard || !iconEl || !labelEl || !valueEl || !barEl) return;

  iconEl.textContent = ring.icon;
  labelEl.textContent = ring.label;

  const pct = Math.min((ring.value / ring.target) * 100, 100);
  if (ring.key === 'water') {
    valueEl.innerHTML = `<span style="color:${ring.colorStart}; font-size: 1.15rem;">${ring.value.toFixed(1)}</span><span style="font-size:0.75rem; color: var(--text-secondary);">/${ring.target.toFixed(1)} ${ring.unit}</span>`;
  } else {
    valueEl.innerHTML = `<span style="color:${ring.colorStart}; font-size: 1.15rem;">${ring.value}</span><span style="font-size:0.75rem; color: var(--text-secondary);">/${ring.target} ${ring.unit}</span>`;
  }

  barEl.style.background = `linear-gradient(90deg, ${ring.colorStart}, ${ring.colorEnd})`;
  barEl.style.width = '0%';
  detailCard.style.display = 'block';
  detailCard.style.borderColor = ring.colorStart + '33';

  // Animate bar
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      barEl.style.width = pct + '%';
    });
  });
}

function initializeDailyHistory() {
  if (!state.dailyHistory) {
    state.dailyHistory = {};
  }
}

function renderCalendarHistory() {
  const grid = document.getElementById('calendar-days-grid');
  if (!grid) return;
  grid.innerHTML = '';

  initializeDailyHistory();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const todayDayNum = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // Update title with current month
  const fitTitle = document.getElementById('fitness-title');
  if (fitTitle && !selectedHistoryDate) {
    fitTitle.innerText = `Histórico de Atividade (${monthNames[month]} ${year})`;
  }

  // Sync today's data into dailyHistory
  const todayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayDayNum).padStart(2, '0')}`;
  state.dailyHistory[todayDateStr] = {
    kcal: state.dailyMacros ? (state.dailyMacros.kcal || 0) : 0,
    kcalTarget: state.kcalTarget || 2500,
    water: state.waterDrank || 0,
    waterTarget: state.waterTarget || 3.0,
    workouts: state.workoutsThisWeek || 0,
    workoutTarget: state.weeklyTrainGoal || 4
  };

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const entry = state.dailyHistory[dateStr] || null;

    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';

    // Future days are disabled
    if (day > todayDayNum) {
      cell.classList.add('future-day');
    }

    // Highlight active selection
    if (selectedHistoryDate === dateStr) {
      cell.classList.add('active-selection');
    } else if (day === todayDayNum && !selectedHistoryDate) {
      cell.classList.add('today-highlight');
    } else if (day === todayDayNum) {
      cell.classList.add('today-highlight');
    }

    // Day number
    const numSpan = document.createElement('span');
    numSpan.className = 'calendar-day-number';
    numSpan.innerText = day.toString();
    cell.appendChild(numSpan);

    // Mini concentric rings SVG — only render if there's real data
    if (day <= todayDayNum && entry && !entry.isMock) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const miniSvg = document.createElementNS(svgNS, 'svg');
      miniSvg.setAttribute('width', '24');
      miniSvg.setAttribute('height', '24');
      miniSvg.setAttribute('viewBox', '0 0 24 24');
      miniSvg.setAttribute('id', 'fitness-mini-ring-svg');
      miniSvg.style.overflow = 'visible';

      const kcalProg = Math.min(1.0, Math.max(0.0, entry.kcal / entry.kcalTarget));
      const workoutProg = Math.min(1.0, Math.max(0.0, entry.workouts / entry.workoutTarget));
      const waterProg = Math.min(1.0, Math.max(0.0, entry.water / entry.waterTarget));

      const miniRings = [
        { r: 9, color: '#ff0055', prog: kcalProg, circ: 56.5, bg: 'rgba(255, 0, 85, 0.08)' },
        { r: 6.5, color: '#00ff66', prog: workoutProg, circ: 40.8, bg: 'rgba(0, 255, 102, 0.08)' },
        { r: 4, color: '#00f2fe', prog: waterProg, circ: 25.1, bg: 'rgba(0, 242, 254, 0.08)' }
      ];

      miniRings.forEach(ring => {
        const bgC = document.createElementNS(svgNS, 'circle');
        bgC.setAttribute('cx', '12');
        bgC.setAttribute('cy', '12');
        bgC.setAttribute('r', ring.r.toString());
        bgC.setAttribute('stroke', ring.bg);
        bgC.setAttribute('stroke-width', '2');
        bgC.setAttribute('fill', 'none');
        miniSvg.appendChild(bgC);

        const fgC = document.createElementNS(svgNS, 'circle');
        fgC.setAttribute('cx', '12');
        fgC.setAttribute('cy', '12');
        fgC.setAttribute('r', ring.r.toString());
        fgC.setAttribute('stroke', ring.color);
        fgC.setAttribute('stroke-width', '2');
        fgC.setAttribute('fill', 'none');
        fgC.setAttribute('stroke-linecap', 'round');
        fgC.setAttribute('transform', 'rotate(-90 12 12)');
        fgC.setAttribute('stroke-dasharray', ring.circ.toString());
        const offset = ring.circ * (1 - ring.prog);
        fgC.setAttribute('stroke-dashoffset', offset.toString());
        miniSvg.appendChild(fgC);
      });

      cell.appendChild(miniSvg);
    } else {
      // Empty placeholder so layout remains aligned
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.style.width = '24px';
      emptyPlaceholder.style.height = '24px';
      cell.appendChild(emptyPlaceholder);
    }

    // Click handler
    if (day <= todayDayNum) {
      cell.addEventListener('click', () => {
        selectHistoricalDay(dateStr);
      });
    }

    grid.appendChild(cell);
  }
}

// 17b. EQUIPAMENTOS RENDER & CONTROL SYSTEMS
function renderEquipment() {
  const tabEquipment = document.getElementById('tab-equipment');
  if (!tabEquipment) return;

  // 1. Render Active Slots
  const slots = ['head', 'aura', 'arms', 'waist', 'hands', 'legs', 'badge'];
  slots.forEach(slot => {
    const equippedItemId = state.equippedItems ? state.equippedItems[slot] : null;
    const slotEl = document.getElementById(`equip-slot-${slot}`);
    if (!slotEl) return;
    
    if (equippedItemId) {
      const item = EQUIPMENT_DATABASE.find(i => i.id === equippedItemId);
      if (item) {
        const iconHtml = item.icon.endsWith('.png') || item.icon.endsWith('.jpg') || item.icon.endsWith('.webp')
          ? `<img src="${item.icon}" alt="${item.name}" class="eq-icon-img" style="width: 28px; height: 28px; object-fit: contain; filter: drop-shadow(0 0 5px rgba(255,255,255,0.15)); flex-shrink: 0;" />`
          : `<span class="equip-slot-icon">${item.icon}</span>`;
        slotEl.innerHTML = `
          <div class="equip-slot-filled">
            ${iconHtml}
            <div class="equip-slot-info">
              <span class="equip-slot-name">${item.name}</span>
              <span class="equip-slot-type">${getSlotLabel(slot)}</span>
            </div>
            <button class="btn-unequip-slot" data-slot="${slot}" title="Desequipar">❌</button>
          </div>
        `;
        slotEl.querySelector('.btn-unequip-slot').addEventListener('click', (e) => {
          e.stopPropagation();
          unequipItem(slot);
        });
      } else {
        renderEmptySlot(slotEl, slot);
      }
    } else {
      renderEmptySlot(slotEl, slot);
    }
  });

  // 2. Render Attribute Buffs Summary
  const eff = getEffectiveAttributes();
  const getGearBonus = (stat) => {
    let bonus = 0;
    if (state.equippedItems) {
      Object.values(state.equippedItems).forEach(itemId => {
        if (itemId) {
          const item = EQUIPMENT_DATABASE.find(i => i.id === itemId);
          if (item && item.stats && item.stats[stat]) bonus += item.stats[stat];
        }
      });
    }
    return bonus;
  };
  
  const attrSummaryEl = document.getElementById('equipment-attributes-summary');
  if (attrSummaryEl) {
    attrSummaryEl.innerHTML = `
      <div class="eq-attr-row"><span>✊ FORÇA (FOR):</span><strong>${eff.for} <span class="eq-attr-bonus">${getGearBonus('for') > 0 ? `(+${getGearBonus('for')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>🫁 RESISTÊNCIA (RES):</span><strong>${eff.res} <span class="eq-attr-bonus">${getGearBonus('res') > 0 ? `(+${getGearBonus('res')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>⚡ AGILIDADE (AGI):</span><strong>${eff.agi} <span class="eq-attr-bonus">${getGearBonus('agi') > 0 ? `(+${getGearBonus('agi')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>❤️ VIGOR (VIG):</span><strong>${eff.vig} <span class="eq-attr-bonus">${getGearBonus('vig') > 0 ? `(+${getGearBonus('vig')})` : ''}</span></strong></div>
      <div class="eq-attr-row"><span>🎯 FOCO (FOC):</span><strong>${eff.foc} <span class="eq-attr-bonus">${getGearBonus('foc') > 0 ? `(+${getGearBonus('foc')})` : ''}</span></strong></div>
    `;
  }

  // 3. Render Inventory List
  const gridEl = document.getElementById('equipment-inventory-grid');
  if (gridEl) {
    gridEl.innerHTML = '';
    EQUIPMENT_DATABASE.forEach(item => {
      const unlocked = isItemUnlocked(item);
      const isEquipped = state.equippedItems && state.equippedItems[item.slot] === item.id;
      
      const card = document.createElement('div');
      card.className = `equipment-item-card glass-panel ${unlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}`;
      
      let statsText = '';
      for (const [stat, val] of Object.entries(item.stats)) {
        statsText += `+${val} ${stat.toUpperCase()} `;
      }
      
      const iconHtml = item.icon.endsWith('.png') || item.icon.endsWith('.jpg') || item.icon.endsWith('.webp')
        ? `<img src="${item.icon}" alt="${item.name}" class="eq-icon-img" style="width: 36px; height: 36px; object-fit: contain;" />`
        : `<span class="eq-card-icon">${item.icon}</span>`;
      card.innerHTML = `
        <div class="eq-card-header">
          ${iconHtml}
          <span class="eq-card-badge">${getSlotLabel(item.slot)}</span>
        </div>
        <h4 class="eq-card-name">${item.name}</h4>
        <p class="eq-card-desc">${unlocked ? item.desc : `<span class="eq-card-locked-text">🔒 ${item.unlockDesc}</span>`}</p>
        <div class="eq-card-stats">${statsText}</div>
        <div class="eq-card-actions">
          ${unlocked 
            ? (isEquipped 
                ? `<button class="btn btn-sm btn-outline btn-block btn-equip-action" data-action="unequip" data-id="${item.id}">DESEQUIPAR</button>`
                : `<button class="btn btn-sm btn-accent btn-block btn-equip-action" data-action="equip" data-id="${item.id}">EQUIPAR</button>`
              )
            : `<button class="btn btn-sm btn-outline btn-block" disabled>BLOQUEADO</button>`
          }
        </div>
      `;
      
      gridEl.appendChild(card);
    });

    gridEl.querySelectorAll('.btn-equip-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        playSound('click');
        const itemId = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        const item = EQUIPMENT_DATABASE.find(i => i.id === itemId);
        if (item) {
          if (action === 'equip') {
            equipItem(item.slot, item.id);
          } else {
            unequipItem(item.slot);
          }
        }
      });
    });
  }

  // Update silhouette preview image and active aura glow
  const silPic = document.getElementById('eq-silhouette-pic');
  if (silPic) {
    silPic.src = getUserAvatarSrc();
  }
  const previewAura = document.getElementById('eq-preview-aura');
  if (previewAura) {
    // Determine preview aura color depending on equipped items
    let auraColor = 'var(--color-primary-glow)';
    if (state.equippedItems && state.equippedItems.aura) {
      if (state.equippedItems.aura === 'item_aura') auraColor = 'rgba(255, 140, 0, 0.6)'; // SSJ
      else if (state.equippedItems.aura === 'item_aurabroly') auraColor = 'rgba(57, 255, 20, 0.6)'; // Broly
      else if (state.equippedItems.aura === 'item_capa') auraColor = 'rgba(255, 255, 255, 0.4)'; // Saitama
    }
    previewAura.style.background = `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`;
  }
}

function getSlotLabel(slot) {
  const labels = {
    head: 'Cabeça', aura: 'Aura/Costas', arms: 'Braços', waist: 'Cintura',
    hands: 'Punhos', legs: 'Pernas', badge: 'Insígnia'
  };
  return labels[slot] || slot;
}

function renderEmptySlot(slotEl, slot) {
  const slotIcons = { head: '👑', aura: '✨', arms: '🦾', waist: '🏆', hands: '🥊', legs: '🦵', badge: '🎖️' };
  slotEl.innerHTML = `
    <div class="equip-slot-empty">
      <span class="equip-slot-icon-placeholder">${slotIcons[slot]}</span>
      <span class="equip-slot-empty-label">Vazio (${getSlotLabel(slot)})</span>
    </div>
  `;
}

function equipItem(slot, itemId) {
  if (!state.equippedItems) {
    state.equippedItems = { head: null, aura: null, arms: null, waist: null, hands: null, legs: null, badge: null };
  }
  state.equippedItems[slot] = itemId;
  saveState();
  updateUI();
}

function unequipItem(slot) {
  if (!state.equippedItems) {
    state.equippedItems = { head: null, aura: null, arms: null, waist: null, hands: null, legs: null, badge: null };
  }
  state.equippedItems[slot] = null;
  saveState();
  updateUI();
}

// ==========================================
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
// 19. MODALS UTILITIES
// ==========================================
function showLevelUpModal() {
  const modal = document.getElementById('level-up-modal');
  document.getElementById('modal-level-val').innerText = state.level;
  document.getElementById('modal-subclass-val').innerText = getSubclassRank(state.charClass, state.level);
  const descEl = modal.querySelector('.level-up-desc');
  if (descEl) {
    descEl.innerText = `${resolveVoiceLine('levelUp', { level: state.level })} Recebeu +5 Pontos de Atributos para alocar na aba de Status.`;
  }
  modal.classList.remove('hidden');
}

function showItemAcquiredModal(icon, name, desc, opts) {
  const { subtitle = 'NOVO ITEM ENCONTRADO', btnText = 'EQUIPAR NO SHAPE' } = opts || {};
  const modal = document.getElementById('item-acquired-modal');
  const iconEl = document.getElementById('modal-item-icon');
  document.getElementById('modal-item-subtitle').innerText = subtitle;
  document.getElementById('btn-close-item-modal').innerText = btnText;
  if (icon && (icon.endsWith('.png') || icon.endsWith('.jpg') || icon.endsWith('.webp'))) {
    iconEl.innerHTML = `<img src="${icon}" alt="${name}" style="width: 44px; height: 44px; object-fit: contain;" />`;
  } else {
    iconEl.innerText = icon;
  }
  document.getElementById('modal-item-name').innerText = name;
  document.getElementById('modal-item-desc').innerText = desc;
  modal.classList.remove('hidden');
}

function triggerNeuralFlash(mentor) {
  const container = document.getElementById('neural-transition-layer');
  if (!container) return;
  
  container.innerHTML = '';
  
  const flash = document.createElement('div');
  flash.className = 'mentor-flash-overlay';
  const color = mentor.colorHex || '#00f2fe';
  flash.style.setProperty('--flash-color', color);
  
  const alertBox = document.createElement('div');
  alertBox.className = 'neural-hacker-alert';
  alertBox.style.setProperty('--flash-color', color);
  alertBox.style.setProperty('--flash-color-glow', color + '55');
  alertBox.innerText = `[ BASE NEURAL SINCRONIZADA COM ${mentor.name.toUpperCase()} ]`;
  
  container.appendChild(flash);
  container.appendChild(alertBox);
  
  setTimeout(() => {
    if (flash.parentNode === container) {
      container.removeChild(flash);
    }
    if (alertBox.parentNode === container) {
      container.removeChild(alertBox);
    }
  }, 2000);
}

function getSubclassLore(charClass, rankName) {
  const lores = {
    bodybuilder: {
      "FIT 🤡": "Um recruta iniciante que acabou de pisar na academia. Seu shape é uma tela em branco. Força e foco trarão redenção!",
      "BETA 🐣": "Um pequeno frango que começou a entender o que é supino. Menos de 6 meses de treino, mas já tem determinação.",
      "FRANGO EM CRESCIMENTO 🐓": "O shape começou a responder! A manga da camiseta já aperta um pouco. Continue comendo limpo e treinando pesado.",
      "FORTINHO DO BAIRRO 🦁": "Já chama atenção na rua de regata. O pump do treino dura algumas horas. Você está evoluindo rápido!",
      "SHAPE LEGAL 🔥": "O shape clássico de praia. Definição muscular visível e peitoral desenhado. O caminho do gigante está logo ali.",
      "GRANDE DA ACADEMIA 🐂": "Quando você passa, a galera repara. Pega as anilhas pesadas sem esforço. Respeitado na academia.",
      "MONSTRO INTIMIDADOR 👹": "Braços gigantescos, costas em V. As pessoas evitam revezar aparelhos com você por puro respeito ao seu tamanho.",
      "ESTRANHO DE VERDADE 👽": "Proporções assustadoras, vascularização brutal. Um mutante estético incomparável.",
      "IMENSO INCONTROLÁVEL 🌋": "Uma montanha de músculos ambulante. Ninguém duvida de que você ultrapassou os limites genéticos normais.",
      "FREAKY SUPREMO 😈🔥": "Lendário! Você atingiu o ápice da hipertrofia mística. Um verdadeiro deus da musculação nascido do ferro!"
    },
    powerlifter: {
      "PVC LIFTER 🥖": "Levantando barras vazias ou tubos de PVC. O foco atual é inteiramente na postura e na técnica inicial.",
      "INICIANTE DE BARRA 🏋️": "A técnica de levantamento básico está se assentando. A barra olímpica de 20kg não te assusta mais.",
      "SUPINADOR DE 10KG 🥚": "Colocando anilhas pequenas nas pontas, mas a base de força está se solidificando. O terra de 100kg está próximo.",
      "CAVALO DE CARGA 🐴": "Você já levanta pesos que a maioria não consegue nem tirar do chão. O agachamento está ficando intimidador.",
      "OGRO DAS ANILHAS 🦍": "Seu aquecimento é o PR máximo dos iniciantes. Barulhento, bruto e extremamente forte.",
      "QUEBRADOR DE TERRA 🪨": "Quando você faz levantamento terra, o chão da academia treme. O ferro é seu melhor amigo.",
      "TRATOR HUMANO 🚜": "Cargas massivas em todos os três levantamentos básicos (Agachamento, Supino, Terra). Uma força da natureza.",
      "FORÇA HERCÚLEA 🏛️": "Poder mitológico. Suas articulações parecem feitas de titânio e seus músculos de rocha sólida.",
      "TITÃ DE AÇO 🤖": "Você dominou a biomecânica da força bruta. Nenhuma gravidade pode deter suas repetições de carga máxima.",
      "FREAKY BEAST 🦖👹": "O monstro supremo da força pura. Capaz de mover montanhas de anilhas. Um ser indomável e colossal!"
    },
    calistenia: {
      "GRAVIDADE ZERO 🕸️": "Lutando para completar 3 barras fixas consecutivas. A gravidade parece sua pior inimiga no momento.",
      "FRANGO DE BARRA 🍗": "As primeiras barras limpas saíram! A força nos braços e dorsais está começando a surgir.",
      "PRANCHA INSTÁVEL 🤸": "Seu abdômen e core estão se fortalecendo. Você já consegue manter uma postura decente por alguns segundos.",
      "ACROBATA DE PARQUE 🐒": "Fazendo pull-ups explosivas e brincando nas barras públicas. Seu corpo se move com leveza e precisão.",
      "MESTRE DAS PARALELAS 🥷": "Dips com peso adicional e controle muscular absurdo. A gravidade está perdendo o controle sobre você.",
      "HOMEM-ARANHA DO SHAPE 🕷️": "Controle total do corpo no espaço. Você faz movimentos que parecem desafiar o bom senso físico.",
      "REI DA ISOMETRIA 🧱": "Mantém o front lever e human flag com expressão serena. Seus tendões e core são inquebráveis.",
      "LEVITAÇÃO HUMANA 🛸": "Seus movimentos são tão limpos e controlados que parece que você está flutuando sobre as barras.",
      "DESAFIADOR DA FÍSICA 🌀": "Acrobacias colossais e controle estático absoluto em qualquer ângulo. Uma lenda do peso corporal.",
      "FREAKY SHINOBI 🌀⚡": "O ápice do ninja moderno. Seu corpo é uma arma de precisão e leveza absurda. Flutua como vento, bate como trovão!"
    },
    maratonista: {
      "TARTARUGA MANCA 🐢": "Falta ar depois de correr 400 metros na esteira. O pulmão arde, mas o espírito quer continuar.",
      "ANDARILHO DE ESTEIRA 🚶": "Alternando caminhada rápida e corrida leve. A resistência cardiovascular está se construindo.",
      "CORREDOR RECREATIVO 👟": "Completando os primeiros 5km sem parar! A respiração está controlada e as pernas estão fortes.",
      "PAPA-LÉGUAS DA PISTA 🦤": "O ritmo (pace) de corrida está caindo constantemente. 10km já virou corrida de rotina para você.",
      "PULMÃO DE FERRO 🫁": "Seu VO2 max está disparando. Você corre subidas e distâncias longas com vigor incomparável.",
      "VELOCISTA DE ELITE 🐆": "Passadas largas, ritmo absurdo e resistência mental inabalável. O cansaço é apenas um conceito distante.",
      "MARATONISTA LENDÁRIO 🏆": "Completou meias e maratonas inteiras com tempos dignos de atleta. Suas pernas são pistões incansáveis.",
      "CYBORG DO CARDIO 🔌": "Seu coração opera com eficiência perfeita. Você corre por horas a fio sem sofrer desgaste visível.",
      "MÁQUINA DE ENDURANCE 🏎️": "Resistência sem fim. Seu corpo consome oxigênio e gordura com eficiência termodinâmica brutal.",
      "FREAKY RUNNER ⚡🌀": "O corredor supremo. Você atravessa o horizonte em alta velocidade constante, um maratonista indestrutível!"
    }
  };
  return lores[charClass]?.[rankName] || "Uma classe em desenvolvimento contínuo em direção ao status Freaky.";
}

window.showAttributeHelp = function(attrKey) {
  playSound('click');
  const details = {
    for: {
      icon: '✊',
      name: 'FORÇA (FOR)',
      desc: 'Sua capacidade bruta de mover cargas. Cada ponto de Força aumenta o ganho de XP básico ao completar séries em exercícios de força de 0.5% a 1.5%.'
    },
    res: {
      icon: '🫁',
      name: 'RESISTÊNCIA (RES)',
      desc: 'Seu fôlego e resiliência biológica. Aumenta a capacidade de manter o volume de repetições e reduz a penalidade de cansaço quando treina sob RPE extremo.'
    },
    agi: {
      icon: '⚡',
      name: 'AGILIDADE (AGI)',
      desc: 'Aumenta a velocidade metabólica e a eficiência do treino. Cada ponto de Agilidade acima de 10 concede +1% de bônus de XP ao finalizar qualquer treino.'
    },
    vig: {
      icon: '❤️',
      name: 'VIGOR (VIG)',
      desc: 'Aumenta a eficácia de hidratação e recuperação de HP. Cada ponto de Vigor acima de 10 concede +2% de bônus de XP ao beber água no reservatório.'
    },
    foc: {
      icon: '🎯',
      name: 'FOCO (FOC)',
      desc: 'Sua clareza mental e disciplina no ginásio. Cada ponto adiciona um bônus multiplicador de +1% de XP em todas as Quests Diárias finalizadas.'
    }
  };
  
  const item = details[attrKey] || { icon: '❓', name: 'Atributo Desconhecido', desc: 'Atributo não cadastrado.' };
  showItemAcquiredModal(item.icon, item.name, item.desc, { subtitle: 'INFORMAÇÕES DO ATRIBUTO', btnText: 'ENTENDI' });
};

function spawnAttrFloatingText(attrKey) {
  const labelMap = {
    for: 'FORÇA ✊',
    res: 'RESISTÊNCIA 🫁',
    agi: 'AGILIDADE ⚡',
    vig: 'VIGOR ❤️',
    foc: 'FOCO 🎯'
  };
  
  const attrValueEl = document.getElementById(`val-${attrKey}`);
  if (!attrValueEl) return;
  const parent = attrValueEl.parentElement;
  if (!parent) return;
  
  const oldPopups = parent.querySelectorAll('.attr-floating-popup');
  oldPopups.forEach(p => p.remove());
  
  const popup = document.createElement('div');
  popup.className = 'attr-floating-popup';
  popup.innerText = `+1 ${labelMap[attrKey] || attrKey.toUpperCase()}!`;
  
  parent.appendChild(popup);
  
  setTimeout(() => {
    if (popup.parentNode === parent) {
      parent.removeChild(popup);
    }
  }, 1200);
}


// ==========================================
// 20. TUTORIAL SYSTEM
// ==========================================
const TUTORIAL_STEPS = [
  {
    title: 'Bem-vindo, Caçador! ⚔️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">🎯</div></div>',
    text: 'O FreakyQuest transforma seu treino de academia em um RPG de verdade. Suor virando XP, disciplina virando nível. Toque em "Avançar" pra ver o mapa rápido antes de começar a jornada.'
  },
  {
    title: 'Seu Painel é a Base de Operações 📋',
    illoHTML: '<div class="tutorial-anim-quests"><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Beber água</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Bater proteína</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Treino do dia</span></div></div>',
    text: 'No Painel você vê seu mentor, sua barra de XP e seus atributos em tempo real. Beba água, complete as Missões Diárias e o Desafio Freaky pra garantir XP extra todo santo dia.'
  },
  {
    title: 'Arena de Treino: Cada Série Conta 🏋️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">💪</div></div>',
    text: 'Registre a carga, toque nas séries pra completar e deixe o Cronômetro de Descanso cuidar do tempo entre elas. Supere seu próprio recorde e a Progressão de Carga te recompensa com XP bônus na hora.'
  },
  {
    title: 'Cardio Também Vale XP 🏃',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">🏃</div></div>',
    text: 'Esteira, bike, corrida ou natação: na aba Treinos, toque em "Registrar Cardio", escolha a atividade e o tempo. O XP é proporcional aos minutos e cresce junto com sua Resistência — quem prefere cardio a puxar ferro evolui igual.'
  },
  {
    title: 'Dieta: Três Anéis, Um Objetivo 🍗',
    illoHTML: '<div class="tutorial-anim-attributes"><div class="tutorial-attr-node node-n"></div><div class="tutorial-attr-node node-e"></div><div class="tutorial-attr-node node-w"></div><div class="tutorial-attr-core">🍗</div></div>',
    text: 'Calorias, proteína e fibra ganharam HUD próprio com três anéis. Registre suas refeições e veja eles se preencherem — sua meta calórica já é calculada automaticamente com base no seu objetivo.'
  },
  {
    title: 'Mentores: Todos Liberados desde o Nível 1 🐉',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-mentors">🐉</div></div>',
    text: 'Filtre por universo — Dragon Ball, Naruto, One Punch Man, Fisiculturistas, Coreaninhos — e escolha seu mentor base sem precisar destravar nada. Cada um sobe até o nível 30 com 23 recompensas próprias: a jornada é longa de propósito.'
  },
  {
    title: 'Equipamentos: Vista suas Conquistas 🛡️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-auras">🛡️</div></div>',
    text: 'Subindo de nível com um mentor, você destrava itens — auras, faixas, cinturões. Equipe-os na aba Itens e ganhe bônus reais de atributo, não é só visual!'
  },
  {
    title: 'Seu Cartão de Caçador 🪪',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-profile">🪪</div></div>',
    text: 'Na aba Status, abra o Cartão de Caçador pra ver seu Hunter Rank, fixar seus marcos de força favoritos e destacar troféus.'
  },
  {
    title: 'Amigos & Ranking 👥',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-mentors">👥</div></div>',
    text: 'Compartilhe seu link de convite e acompanhe a evolução da galera lado a lado. Tem também o Ranking Global, com os caçadores de mais XP. Você encontra tudo em Ajustes → Amigos & Ranking.'
  },
  {
    title: 'Salve seu Progresso na Nuvem ☁️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">☁️</div></div>',
    text: 'Em Ajustes → Conta, coloque seu e-mail e digite o código que chegar por e-mail (sem senha pra decorar). Assim seu progresso fica salvo e você continua de onde parou mesmo trocando de celular. Bora treinar?'
  }
];

const SIMPLE_TUTORIAL_STEPS = [
  {
    title: 'Bem-vindo! 👋',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">🎯</div></div>',
    text: 'Este é o modo simples: focado em treinos, dieta e água, sem complicações. Toque em "Avançar" para uma overview rápida.'
  },
  {
    title: 'Painel Diário 📋',
    illoHTML: '<div class="tutorial-anim-quests"><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Beber água</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Bater proteína</span></div><div class="tutorial-quest-row"><span class="tutorial-quest-check">✓</span><span style="font-size:10px;color:var(--text-secondary)">Treino do dia</span></div></div>',
    text: 'Acompanhe aqui sua água, suas metas de macros e o resumo do dia. Tudo calculado automaticamente a partir do seu objetivo.'
  },
  {
    title: 'Treinos 🏋️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">🏋️</div></div>',
    text: 'Marque as séries conforme conclui, acompanhe o progresso e finalize o treino. Sem XP, sem ranks — só registro.'
  },
  {
    title: 'Cardio 🏃',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-workout">🏃</div></div>',
    text: 'Fez esteira, bike ou corrida? Na aba Treinos, toque em "Registrar Cardio" e anote o tempo. Fica tudo registrado junto com o resto do seu dia.'
  },
  {
    title: 'Dieta 🍗',
    illoHTML: '<div class="tutorial-anim-attributes"><div class="tutorial-attr-node node-n"></div><div class="tutorial-attr-node node-e"></div><div class="tutorial-attr-node node-w"></div><div class="tutorial-attr-core">🍗</div></div>',
    text: 'Registre refeições e veja os anéis de calorias, proteína e fibra atualizados em tempo real. Seu objetivo já está configurado no onboarding.'
  },
  {
    title: 'Salve seu Progresso ☁️',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-rune-welcome">☁️</div></div>',
    text: 'Em Ajustes → Conta, coloque seu e-mail e digite o código que chegar por e-mail (sem senha pra decorar). Seu progresso fica salvo e você continua de onde parou mesmo trocando de celular.'
  },
  {
    title: 'Pronto para começar! ✅',
    illoHTML: '<div class="tutorial-illustration-container"><div class="tutorial-anim-profile">🚀</div></div>',
    text: 'Use o menu inferior para navegar entre Painel, Treinos e Dieta. Sem distrações, sem gamificação. Bora treinar?'
  }
];

let tutorialStep = 0;
let tutorialTimeoutId = null;

function getTutorialSteps() {
  return state.appMode === 'simple' ? SIMPLE_TUTORIAL_STEPS : TUTORIAL_STEPS;
}

function closeTutorial() {
  state.tutorialCompleted = true;
  saveState();
  const overlay = document.getElementById('tutorial-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (tutorialTimeoutId) {
    clearTimeout(tutorialTimeoutId);
    tutorialTimeoutId = null;
  }

  // Conta nova nunca escolheu mentor de verdade (o app só usa Rock Lee como
  // valor inicial padrão) — leva pra aba Mentores e destaca o convite pra
  // escolher, em vez de deixar o jogador com um mentor que ele nunca pediu.
  if (!state.mentorManuallyChosen) {
    const mentorsNavBtn = document.querySelector('.bottom-nav .nav-item[data-tab="mentors"]');
    if (mentorsNavBtn) mentorsNavBtn.click();
    const banner = document.getElementById('pick-mentor-banner');
    if (banner) banner.classList.remove('hidden');
  }
}

function startTutorial() {
  const overlay = document.getElementById('tutorial-overlay');
  // O overlay nasce com a classe "hidden" no HTML — checar por ela aqui
  // fazia o tutorial se marcar como concluído e nunca aparecer.
  if (!overlay) {
    state.tutorialCompleted = true;
    saveState();
    return;
  }
  tutorialStep = 0;
  renderTutorialStep(tutorialStep);
  overlay.classList.remove('hidden');
}

function renderTutorialStep(idx) {
  const steps = getTutorialSteps();
  const step = steps[idx];
  document.getElementById('tutorial-step-title').innerText = step.title;
  document.getElementById('tutorial-step-illustration').innerHTML = step.illoHTML;
  document.getElementById('tutorial-step-text').innerText = step.text;

  // Bolinhas geradas conforme o número real de passos do modo atual (RPG e
  // Simples têm quantidades diferentes).
  const dotsContainer = document.getElementById('tutorial-steps-dots');
  if (dotsContainer) {
    if (dotsContainer.children.length !== steps.length) {
      dotsContainer.innerHTML = steps.map((_, i) => `<span class="dot" data-step="${i}"></span>`).join('');
    }
    Array.from(dotsContainer.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  }
  const btnNext = document.getElementById('btn-tutorial-next');
  btnNext.innerText = (idx === steps.length - 1) ? 'VAMOS TREINAR! 💪' : 'AVANÇAR →';

  const btnSkip = document.getElementById('btn-tutorial-skip');
  const btnPrev = document.getElementById('btn-tutorial-prev');
  if (btnSkip && btnPrev) {
    if (idx === 0) {
      btnSkip.classList.remove('hidden');
      btnPrev.classList.add('hidden');
    } else {
      btnSkip.classList.add('hidden');
      btnPrev.classList.remove('hidden');
    }
  }
}

function applyNumericSanitizer(selector, decimals) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.type = 'text';
  el.inputMode = 'decimal';
  el.addEventListener('input', (e) => {
    let val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts.length === 2 && parts[1].length > decimals) {
      val = parts[0] + '.' + parts[1].substring(0, decimals);
    }
    e.target.value = val;
  });
  el.addEventListener('change', (e) => {
    let val = e.target.value;
    if (val.endsWith('.')) {
      e.target.value = val.slice(0, -1);
    }
  });
}

// ==========================================
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
      const mId = state.activeMentor || 'rocklee';
      const quotesList = MENTOR_DASHBOARD_QUOTES[mId] || [];
      const heroQuoteEl = document.getElementById('mentor-bubble-quote');
      if (quotesList.length > 0 && heroQuoteEl) {
        const randQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
        heroQuoteEl.innerText = randQuote.replace(/^"|"$/g, '');
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
