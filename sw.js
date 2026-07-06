/*
 * sw.js — Service worker per l'app installabile (PWA).
 *
 * Strategia AUTO-AGGIORNANTE (nessun numero di versione da incrementare a mano):
 *   - navigazione (HTML): network-first, con fallback alla cache se offline;
 *   - altri asset locali: stale-while-revalidate — si serve subito la copia in
 *     cache (veloce, funziona offline) e in parallelo si scarica la versione
 *     aggiornata, che verrà mostrata al reload successivo.
 *
 * Così ogni deploy raggiunge gli utenti da solo: basta fare push.
 */
const CACHE = 'ral-netto';

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

  // Navigazione: sempre la versione più fresca quando si è online.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Solo risorse dello stesso dominio (gli asset CDN restano gestiti dal browser).
  if (new URL(req.url).origin !== self.location.origin) return;

  // Stale-while-revalidate: cache subito, aggiornamento in background.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
