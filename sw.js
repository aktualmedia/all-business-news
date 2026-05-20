const CACHE='web-vijesti-live-20260520-v4';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  if(!request.url.includes('/all-business-news/'))return;
  const url=new URL(request.url);
  const dynamic=url.pathname.endsWith('.html')||url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.json')||url.pathname.endsWith('/');
  if(dynamic){
    const fresh=new Request(request,{cache:'reload'});
    event.respondWith(fetch(fresh).catch(()=>fetch(request)));
    return;
  }
  event.respondWith(fetch(request).catch(()=>caches.match(request)));
});
