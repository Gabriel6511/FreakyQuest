const CACHE_NAME = 'freakyquest-v35';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './vendor_supabase.js',
  './styles.css',
  './manifest.json',
  './logo.webp',
  './rocklee.webp',
  './goku.webp',
  './arnold.webp',
  './ramondino.webp',
  './brolyz.webp',
  './saitama.webp',
  './nickwalker.webp',
  './jin.webp',
  './namjoon.webp',
  './sukuna.webp',
  './anya.webp',
  './bebezinho_tribute.webp',
  './shape_engordar.webp',
  './shape_emagrecer.webp',
  './shape_estetico.webp',
  './shape_saude.webp',
  './capa_saitama_icon.webp',
  './aura_broly_icon.webp',
  './cinturao_ouro_icon.webp',
  './braceletes_aco_icon.webp',
  './faixa_lee_icon.webp',
  './aura_goku_icon.webp',
  './sorriso_jin_icon.webp',
  './coroa_lider_icon.webp',
  // Leva 2026-08-12 — 30 icones de itens novos (3 por mentor, 4 na Anya)
  './simbolo_kame_icon.webp',
  './punhos_kaioken_icon.webp',
  './coroa_paragus_icon.webp',
  './punhos_broly_icon.webp',
  './caneleiras_lee_icon.webp',
  './oitavo_portao_icon.webp',
  './luvas_saitama_icon.webp',
  './registro_heroi_icon.webp',
  './selo_allday_icon.webp',
  './legpress_500_icon.webp',
  './aura_freaky_icon.webp',
  './cinta_classic_icon.webp',
  './selo_olympia_icon.webp',
  './aura_dino_icon.webp',
  './luvas_arnold_icon.webp',
  './trofeu_sandow_icon.webp',
  './straps_mutante_icon.webp',
  './cinturao_classic_icon.webp',
  './aura_mutante_icon.webp',
  './medalha_jin_icon.webp',
  './luvas_jin_icon.webp',
  './fones_rm_icon.webp',
  './selo_rm_icon.webp',
  './dedo_sukuna_icon.webp',
  './quatro_bracos_icon.webp',
  './santuario_icon.webp',
  './estrela_stella_icon.webp',
  './lacos_anya_icon.webp',
  './aura_anya_icon.webp',
  './minduim_anya_icon.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  // Chamadas de API do Supabase (login/sync) sempre direto na rede — nunca
  // cacheadas, senão o app poderia devolver progresso desatualizado.
  if (url.includes('.supabase.co')) return;
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          // Só faz sentido devolver a página "Offline" para uma NAVEGAÇÃO.
          // Para script/css/imagem, devolver esse texto fazia o navegador
          // executar a string "Offline" no lugar do arquivo — foi assim que
          // o supabase-js sumia e o login quebrava sem erro visível.
          if (event.request.mode === 'navigate') {
            return new Response('Offline', { status: 503, statusText: 'Offline' });
          }
          return Response.error();
        });
      return cached || network;
    })
  );
});
