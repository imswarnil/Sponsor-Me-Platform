// Minimal service worker — exists only to satisfy PWA installability heuristics.
// No caching strategy: every request just passes straight through to the network.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally a no-op — let the browser handle every request normally.
});
