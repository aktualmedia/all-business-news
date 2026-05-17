(() => {
  const BASE_KEYWORDS = [
    'WEB VIJESTI','All Business News','Aktual Media','Aktual Media d.o.o.','Nermin Sefić','Nermin Sefic','Nermin','Sefić','Sefic',
    'vijesti','agregator vijesti','objave','ekonomija','business','poduzetništvo','poslovanje','financije','tržišta','kapital',
    'tehnologija','znanost','kultura','umjetnost','muzeji','galerije','umjetnici','film','dizajn','arhitektura','lifestyle','Symbol','Symbol galerija','digitalna izdanja'
  ];
  const PAGE = {
    home:['naslovnica','portal vijesti','Aktual Media vijesti'],
    news:['najnovije vijesti','RSS izvori','vijesti s fotografijom'],
    gallery:['galerija fotografija','muzeji','umjetnine','film'],
    'symbol-gallery':['Symbol galerija','vizuali iz PDF izdanja','kultura i umjetnost'],
    posts:['autorski tekstovi','Nermin Sefić objave','ekonomski komentar'],
    editions:['Symbol','digitalna izdanja','kultura i umjetnost'],
    radio:['radio uživo','glazba','vijesti radio'],
    sources:['izvori vijesti','RSS izvori','status izvora'],
    calendar:['kalendar događanja','muzeji','kazališta','izložbe','film','kultura']
  };
  function pageType(){return window.WV_PAGE || document.body?.dataset?.page || 'home';}
  function canonical(){return location.href.split('#')[0].split('?')[0];}
  function basePath(){ const p=location.pathname; const marker='/all-business-news/'; const i=p.indexOf(marker); return i>=0 ? p.slice(0,i+marker.length) : '/'; }
  function siteLink(path){ if(/^https?:|^mailto:|^viber:|^tel:/.test(path)) return path; return basePath()+String(path).replace(/^\/+/, ''); }
  function meta(sel, key, val, content){let el=document.head.querySelector(sel); if(!el){el=document.createElement('meta'); el.setAttribute(key,val); document.head.appendChild(el);} el.content=content;}
  function link(rel, href){let el=document.head.querySelector(`link[rel="${rel}"]`); if(!el){el=document.createElement('link'); el.rel=rel; document.head.appendChild(el);} el.href=href;}
  function ensureNav(){
    document.querySelectorAll('.top-nav').forEach(nav=>{
      if(!nav.querySelector('a[href$="symbol-galerija/index.html"]') && !nav.querySelector('a[href="../symbol-galerija/index.html"]')){
        const a=document.createElement('a');
        const inSub = location.pathname.split('/').filter(Boolean).length > 2;
        a.href = inSub ? '../symbol-galerija/index.html' : 'symbol-galerija/index.html';
        a.textContent='SYMBOL GALERIJA';
        const symbol=[...nav.querySelectorAll('a')].find(x=>x.textContent.trim().toUpperCase()==='SYMBOL');
        if(symbol) symbol.insertAdjacentElement('afterend',a); else nav.appendChild(a);
      }
      if(!nav.querySelector('a[href$="kalendar/index.html"]') && !nav.querySelector('a[href="../kalendar/index.html"]')){
        const a=document.createElement('a');
        const inSub = location.pathname.split('/').filter(Boolean).length > 2;
        a.href = inSub ? '../kalendar/index.html' : 'kalendar/index.html';
        a.textContent='KALENDAR DOGAĐANJA';
        const radio=[...nav.querySelectorAll('a')].find(x=>x.textContent.trim().toUpperCase()==='RADIO');
        if(radio) radio.insertAdjacentElement('beforebegin',a); else nav.appendChild(a);
      }
    });
  }
  function ensureFloatingHome(){
    if(document.getElementById('floatingHomeBtn')) return;
    const a=document.createElement('a');
    a.id='floatingHomeBtn';
    a.href=siteLink('index.html');
    a.setAttribute('aria-label','Povratak na početnu stranicu');
    a.textContent='⌂';
    document.body.appendChild(a);
    if(!document.getElementById('floatingHomeStyle')){
      const s=document.createElement('style');
      s.id='floatingHomeStyle';
      s.textContent='#floatingHomeBtn{position:fixed;right:18px;bottom:82px;z-index:99999;width:46px;height:46px;display:grid;place-items:center;border-radius:999px;background:#111;color:#c8a44d;border:1px solid #c8a44d;text-decoration:none;font-size:1.35rem;font-weight:900;box-shadow:0 14px 32px rgba(0,0,0,.22)}#floatingHomeBtn:hover{background:#c8a44d;color:#111}@media(max-width:700px){#floatingHomeBtn{right:12px;bottom:72px;width:40px;height:40px;font-size:1.15rem}}';
      document.head.appendChild(s);
    }
  }
  function run(){
    ensureNav();
    ensureFloatingHome();
    const p=pageType();
    const h1=document.querySelector('h1')?.innerText || 'WEB VIJESTI / All Business News';
    const title=document.title || h1;
    const desc='WEB VIJESTI / All Business News je agregator vijesti Aktual Media d.o.o. s poslovnim, ekonomskim, kulturnim, tehnološkim i autorskim objavama. Autor objava: Nermin Sefić.';
    const keywords=[...(PAGE[p]||[]),...BASE_KEYWORDS].filter((v,i,a)=>a.indexOf(v)===i).join(', ');
    meta('meta[name="description"]','name','description',desc);
    meta('meta[name="keywords"]','name','keywords',keywords);
    meta('meta[name="author"]','name','author','Nermin Sefić, Nermin Sefic, Aktual Media d.o.o.');
    meta('meta[name="publisher"]','name','publisher','Aktual Media d.o.o.');
    meta('meta[name="robots"]','name','robots','index, follow, max-image-preview:large, max-snippet:-1');
    meta('meta[property="og:title"]','property','og:title',title);
    meta('meta[property="og:description"]','property','og:description',desc);
    meta('meta[property="og:site_name"]','property','og:site_name','WEB VIJESTI / All Business News');
    meta('meta[property="article:author"]','property','article:author','Nermin Sefić');
    meta('meta[name="twitter:title"]','name','twitter:title',title);
    meta('meta[name="twitter:description"]','name','twitter:description',desc);
    link('canonical', canonical());
    let s=document.head.querySelector('script[data-seo-json="1"]'); if(!s){s=document.createElement('script'); s.type='application/ld+json'; s.dataset.seoJson='1'; document.head.appendChild(s);} 
    s.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:h1,url:canonical(),inLanguage:'hr-HR',author:{'@type':'Person',name:'Nermin Sefić',alternateName:['Nermin Sefic','Nermin','Sefić','Sefic']},publisher:{'@type':'Organization',name:'Aktual Media d.o.o.'},keywords});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',run):run();
})();