const CACHE_NAME = 'web-vijesti-cache-v3';
const CORE_ASSETS = [
  '/all-business-news/',
  '/all-business-news/index.html',
  '/all-business-news/assets/style.css',
  '/all-business-news/assets/editorial-redesign.css',
  '/all-business-news/assets/app.js',
  '/all-business-news/assets/seo-meta.js',
  '/all-business-news/assets/visitor-counter.js',
  '/all-business-news/site.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  if(!url.pathname.startsWith('/all-business-news/')) return;

  if(url.pathname.endsWith('.json')) {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => caches.match(req)));
    return;
  }

  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
    return res;
  }).catch(() => caches.match('/all-business-news/index.html'))));
});
