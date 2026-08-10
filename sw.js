const CACHE_NAME = 'freakyquest-v17';
const ASSETS = [
  './',
  './index.html',
  './app.js',
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
  './aura_goku_icon.webp'
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
        .catch(() => cached || new Response('Offline', { status: 503, statusText: 'Offline' }));
      return cached || network;
    })
  );
});
