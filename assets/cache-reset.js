(() => {
  async function resetCaches(){
    try{
      if('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if(!sessionStorage.getItem('wv_cache_reset_done')){
        sessionStorage.setItem('wv_cache_reset_done','1');
      }
    }catch(e){}
  }
  resetCaches();
})();
