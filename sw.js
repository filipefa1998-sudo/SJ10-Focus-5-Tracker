// Focus 5 Tracker — South Jordan 10th Tongan Ward
// Minimal service worker: makes the app installable on Android (persistent
// WebAPK icon) and gives a basic offline fallback. Network-first so the app
// code and Firebase data always stay fresh; cross-origin (Firebase) passes through.

const CACHE = 'focus5-sj10-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon-32.png',
  './icon-120.png',
  './icon-152.png',
  './icon-167.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin GETs. Let Firebase and other cross-origin
  // requests go straight to the network untouched.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(event.request).then((m) => m || caches.match('./index.html')))
  );
});
