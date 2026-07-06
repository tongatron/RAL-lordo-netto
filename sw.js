/*
 * sw.js — Service worker per l'app installabile (PWA).
 * Strategia: cache-first sugli asset locali, con fallback a index.html per la navigazione.
 * Aggiornare CACHE ad ogni release per invalidare la cache vecchia.
 */
const CACHE = 'ral-netto-v1';

// Asset locali (percorsi relativi allo scope del service worker).
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/dati.js',
  './js/calcolo.js',
  './js/app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Navigazione: rete, con fallback a index.html dalla cache (per uso offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Altri GET: cache-first, poi rete (e memorizza le risposte valide).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
