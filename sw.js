const CACHE_NAME = 'freakyquest-v32';
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
  './coroa_lider_icon.webp'
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
