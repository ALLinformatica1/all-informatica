const CACHE = 'all-informatica-v3';
const ASSETS = [
  './', './index.html', './vendas.html', './servicos.html', './ordens-servico.html',
  './style.css', './script.js', './logo-all.png', './manifest.webmanifest', './login.html', './sync.html', './sync.js', './auth-guard.js', './supabase-config.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

/* Rede primeiro para evitar que o celular fique preso em uma versão antiga.
   Se estiver sem internet, usa o cache como fallback. */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});
