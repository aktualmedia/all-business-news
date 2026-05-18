(() => {
  function registerSW(){
    if(!('serviceWorker' in navigator)) return;
    const base = location.pathname.includes('/all-business-news/') ? '/all-business-news/' : '/';
    navigator.serviceWorker.register(base + 'sw.js', {scope: base}).catch(() => null);
  }
  function addResourceHints(){
    const origins = ['https://picsum.photos','https://i.ytimg.com','https://www.youtube-nocookie.com'];
    for(const href of origins){
      if(document.head.querySelector(`link[href="${href}"]`)) continue;
      const pre = document.createElement('link'); pre.rel = 'preconnect'; pre.href = href; pre.crossOrigin = 'anonymous'; document.head.appendChild(pre);
      const dns = document.createElement('link'); dns.rel = 'dns-prefetch'; dns.href = href; document.head.appendChild(dns);
    }
  }
  function lazyBackgrounds(){
    const els = [...document.querySelectorAll('[style*="background-image"]')];
    if(!('IntersectionObserver' in window) || !els.length) return;
    const io = new IntersectionObserver(entries => {
      for(const e of entries){ if(e.isIntersecting){ e.target.classList.add('wv-bg-visible'); io.unobserve(e.target); } }
    }, {rootMargin:'300px'});
    els.forEach(el => io.observe(el));
  }
  document.addEventListener('DOMContentLoaded', () => {
    addResourceHints();
    lazyBackgrounds();
    setTimeout(registerSW, 1000);
  });
})();
