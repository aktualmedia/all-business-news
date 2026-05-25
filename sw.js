const CACHE='web-vijesti-live-20260525-mobile-layout-icon-v8';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  if(!request.url.includes('/all-business-news/'))return;
  const url=new URL(request.url);
  const dynamic=url.pathname.endsWith('.html')||url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.json')||url.pathname.endsWith('.webmanifest')||url.pathname.endsWith('/')||url.search.includes('v=');
  if(dynamic){
    event.respondWith(fetch(new Request(request,{cache:'reload'})).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
      return response;
    }).catch(()=>caches.match(request)));
    return;
  }
  event.respondWith(fetch(request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(request,copy));
    return response;
  }).catch(()=>caches.match(request)));
});
