/* Service worker El Ghanja
   - l'application s'ouvre même sans réseau (dernière version visitée) ;
   - notifications envoyées par le serveur (Web Push) : affichées dans la barre du téléphone, même application fermée. */
const CACHE = 'ghanja-v1';
const FICHIERS = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './img/logo.png', './img/maquillage.jpg', './icons/icon-192.png', './icons/icon-512.png', './icons/badge-96.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord (dernière version), cache si hors-ligne. L'API (/api/...) n'est jamais mise en cache : données personnelles.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { texte: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titre || 'El Ghanja', {
    body: d.texte || 'Nouvelle notification',
    icon: 'icons/icon-192.png',
    badge: 'icons/badge-96.png',
    tag: 'ghanja-' + Date.now(),
    data: { type: d.type || '' }
  }));
});

// Toucher la notification : ouvre l'application (ou la ramène au premier plan) sur la page Notifications
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(fenetres => {
    const f = fenetres.find(c => c.url.startsWith(self.registration.scope));
    if (f) { f.postMessage({ ouvrir: 'notifications' }); return f.focus(); }
    return self.clients.openWindow('./index.html#/notifications');
  }));
});
