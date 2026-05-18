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

  const esc = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const repo = '/all-business-news/';
  function basePath(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : '/'; }
  function siteLink(path){ if(!path) return '#'; if(/^https?:|^mailto:|^viber:|^tel:/.test(path)) return path; return basePath()+String(path).replace(/^\/+/, ''); }
  async function getJson(path, fallback){ try{ const r = await fetch(siteLink(path)+'?v='+Date.now(), {cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }

  function addPolishStyles(){
    if(document.getElementById('wvFinalPolishStyles')) return;
    const s=document.createElement('style');
    s.id='wvFinalPolishStyles';
    s.textContent=`
      .hero-weather-slot{margin-top:22px;max-width:560px}.wv-weather-card{background:#fff!important;border:1px solid var(--line,#ded7c8)!important;border-radius:18px!important;padding:14px!important;margin:0!important;box-shadow:0 10px 24px rgba(17,17,17,.045)!important}.wv-weather-card .eyebrow{margin:0 0 8px}.wv-weather-main{display:flex;justify-content:space-between;gap:12px;align-items:center}.wv-weather-temp{font-size:1.85rem;font-weight:1000;color:#111!important;line-height:1}.wv-weather-desc{font-weight:900;color:#111!important}.wv-weather-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.wv-weather-meta span{display:block;background:#f8f7f2;border:1px solid var(--line,#ded7c8);border-radius:12px;padding:7px 6px;text-align:center;font-size:.62rem;font-weight:900;color:#6b7280;text-transform:uppercase}.wv-weather-meta strong{display:block;color:#111;font-size:.78rem;margin-top:2px}.wv-weather-note{margin:8px 0 0;color:#6b7280;font-size:.66rem;font-weight:800;text-transform:uppercase}
      .read-counter-card,.side-stat.read-counter-card{background:#fff!important;color:#111!important;border:1px solid var(--line,#ded7c8)!important}.read-counter-card *,.side-stat.read-counter-card *{color:#111!important}.read-counter-card span{color:#6b7280!important}.read-counter-card strong,#wvReadCounter{font-size:1.18rem!important;font-weight:1000!important;line-height:1.05!important;color:#111!important}
      .symbol-random-box{margin-top:14px}.symbol-spotlight{background:linear-gradient(180deg,#fff 0%,#fbfaf6 100%);border:1px solid #ddd4c3;border-radius:20px;padding:16px;box-shadow:0 10px 24px rgba(0,0,0,.05)}.symbol-spotlight-badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#111;color:#fff;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}.symbol-spotlight-body{display:flex;gap:14px;align-items:flex-start}.symbol-spotlight-cover{width:90px;height:122px;object-fit:cover;border-radius:12px;border:1px solid #d9cfbd;box-shadow:0 8px 18px rgba(0,0,0,.12);flex:0 0 auto}.symbol-spotlight-title{font-size:1rem;font-weight:1000;line-height:1.2;color:#111;margin:0 0 6px}.symbol-spotlight-meta{font-size:.82rem;color:#666;margin-bottom:8px;font-weight:800}.symbol-spotlight-desc{font-size:.84rem;line-height:1.4;color:#333;margin-bottom:10px}.symbol-spotlight-cta{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:999px;background:#c8a44d;color:#111!important;text-decoration:none;font-weight:1000;font-size:.76rem;letter-spacing:.04em}
      @media(max-width:1040px){.hero-weather-slot{max-width:100%;margin-bottom:14px}}@media(max-width:760px){.wv-weather-meta{grid-template-columns:1fr 1fr}.wv-weather-temp{font-size:1.45rem}.symbol-spotlight-body{gap:12px}.symbol-spotlight-cover{width:76px;height:104px}.symbol-spotlight-title{font-size:.94rem}}
    `;
    document.head.appendChild(s);
  }

  function ensureWeatherLeft(){
    const heroLeft=document.querySelector('.hero > div:first-child');
    if(!heroLeft) return null;
    let slot=document.getElementById('leftWeatherSlot');
    if(!slot){ slot=document.createElement('div'); slot.id='leftWeatherSlot'; slot.className='hero-weather-slot'; const actions=heroLeft.querySelector('.hero-actions'); if(actions) actions.insertAdjacentElement('afterend', slot); else heroLeft.appendChild(slot); }
    let host=document.getElementById('weatherWidget');
    if(!host){ host=document.createElement('section'); host.id='weatherWidget'; host.className='wv-weather-card'; }
    if(host.parentElement!==slot){ slot.innerHTML=''; slot.appendChild(host); }
    return host;
  }
  function weatherDescription(code){ const map={0:'Vedro',1:'Pretežno vedro',2:'Djelomično oblačno',3:'Oblačno',45:'Magla',48:'Magla',51:'Slaba rosulja',53:'Rosulja',55:'Jaka rosulja',61:'Slaba kiša',63:'Kiša',65:'Jaka kiša',71:'Slab snijeg',73:'Snijeg',75:'Jak snijeg',80:'Pljusak',81:'Pljuskovi',82:'Jaki pljuskovi',95:'Grmljavina'}; return map[Number(code)] || 'Prognoza'; }
  async function loadWeatherLeft(){
    const host=ensureWeatherLeft(); if(!host) return;
    host.innerHTML='<p class="eyebrow">VREMENSKA PROGNOZA</p><div class="wv-weather-main"><div><div class="wv-weather-desc">Zagreb</div><p class="wv-weather-note">Učitavanje prognoze...</p></div><div class="wv-weather-temp">--°</div></div>';
    try{
      const url='https://api.open-meteo.com/v1/forecast?latitude=45.815&longitude=15.982&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=Europe%2FZagreb';
      const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(r.status); const data=await r.json(); const c=data.current||{};
      const temp=Math.round(Number(c.temperature_2m)); const feel=Math.round(Number(c.apparent_temperature)); const wind=Math.round(Number(c.wind_speed_10m)); const hum=Math.round(Number(c.relative_humidity_2m)); const pop=Array.isArray(data.hourly?.precipitation_probability)?data.hourly.precipitation_probability.slice(0,6).filter(x=>x!=null):[]; const rain=pop.length?Math.max(...pop):null;
      host.innerHTML=`<p class="eyebrow">VREMENSKA PROGNOZA</p><div class="wv-weather-main"><div><div class="wv-weather-desc">Zagreb · ${weatherDescription(c.weather_code)}</div><p class="wv-weather-note">Automatska prognoza · Open-Meteo</p></div><div class="wv-weather-temp">${Number.isFinite(temp)?temp:'--'}°C</div></div><div class="wv-weather-meta"><span>Osjećaj<strong>${Number.isFinite(feel)?feel+'°C':'-'}</strong></span><span>Vlaga<strong>${Number.isFinite(hum)?hum+'%':'-'}</strong></span><span>Vjetar<strong>${Number.isFinite(wind)?wind+' km/h':'-'}</strong></span>${rain!==null?`<span>Kiša<strong>${rain}%</strong></span>`:''}</div>`;
    }catch(e){ host.innerHTML='<p class="eyebrow">VREMENSKA PROGNOZA</p><div class="wv-weather-main"><div><div class="wv-weather-desc">Zagreb</div><p class="wv-weather-note">Prognoza trenutačno nije dostupna.</p></div><div class="wv-weather-temp">--°</div></div>'; }
  }

  async function renderSymbolArchive(){
    const host=document.getElementById('symbolArchiveCard')||document.getElementById('symbolRandomBox'); if(!host) return;
    const editions=(await getJson('data/editions.json',[])).filter(e=>e && e.category==='symbol');
    if(!editions.length){ host.hidden=true; return; }
    const index=Math.floor(Date.now()/(15*60*1000))%editions.length; const item=editions[index]; host.hidden=false;
    host.innerHTML=`<section class="symbol-spotlight"><div class="symbol-spotlight-badge">SYMBOL ARHIVA</div><div class="symbol-spotlight-body"><img class="symbol-spotlight-cover" loading="lazy" decoding="async" src="${esc(siteLink(item.cover||''))}" alt="${esc(item.title||'SYMBOL')}"><div><h3 class="symbol-spotlight-title">${esc(item.title||'SYMBOL')}</h3><div class="symbol-spotlight-meta">${esc(item.date||'')} · ${esc(item.pages||'')} str.</div><div class="symbol-spotlight-desc">${esc(item.description||'Digitalno izdanje časopisa Symbol.')}</div><a class="symbol-spotlight-cta" href="${esc(siteLink(item.url||item.pdf||'symbol/index.html'))}">OTVORI IZDANJE</a></div></div></section>`;
  }

  function bootFinalPolish(){
    addPolishStyles();
    loadWeatherLeft();
    renderSymbolArchive();
    setInterval(renderSymbolArchive, 15*60*1000);
    setInterval(loadWeatherLeft, 15*60*1000);
    setTimeout(loadWeatherLeft, 900);
    setTimeout(renderSymbolArchive, 1100);
  }

  resetCaches();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bootFinalPolish); else bootFinalPolish();
})();