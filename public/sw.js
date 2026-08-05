const CACHE_NAME = 'gemclean-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/logo.svg',
  './assets/bg_48.png',
  './assets/bg_96.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first with cache fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
