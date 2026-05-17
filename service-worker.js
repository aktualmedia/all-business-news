const CACHE_NAME = 'web-vijesti-v20260517-02';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (!url.pathname.startsWith('/all-business-news/')) return;

  // Network-first for everything, so users get the new design without waiting for stale cache.
  event.respondWith(
    fetch(new Request(req, { cache: 'reload' }))
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
        return res;
      })
      .catch(() => caches.match(req))
  );
});
