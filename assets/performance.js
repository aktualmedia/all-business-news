(() => {
  const repo = '/all-business-news/';
  const BUILD = '20260518-hero-align-cache-v7';
  function registerSW(){
    if(!('serviceWorker' in navigator)) return;
    const base = location.pathname.includes(repo) ? repo : '/';
    navigator.serviceWorker.register(base + 'sw.js?v=' + BUILD, {scope: base}).then(reg => reg.update()).catch(() => null);
  }
  async function clearOldCaches(){
    try{
      if('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => !k.includes(BUILD)).map(k => caches.delete(k)));
      }
    }catch(e){}
  }
  function addResourceHints(){
    const origins = ['https://picsum.photos','https://i.ytimg.com','https://www.youtube-nocookie.com','https://ipwho.is','https://api.open-meteo.com'];
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
  function syncHeroColumns(){
    const hero = document.querySelector('.hero');
    if(!hero) return;
    const left = hero.children[0];
    const right = hero.querySelector('aside') || hero.children[1];
    if(!left || !right) return;
    left.style.minHeight = '';
    right.style.minHeight = '';
    if(window.innerWidth <= 1040) return;
    requestAnimationFrame(() => {
      const target = Math.max(left.offsetHeight, right.offsetHeight);
      left.style.minHeight = target + 'px';
      right.style.minHeight = target + 'px';
    });
  }
  function installHeroAlignStyles(){
    if(document.getElementById('wvHeroAlignStyles')) return;
    const s=document.createElement('style'); s.id='wvHeroAlignStyles';
    s.textContent=`.hero{align-items:stretch!important}.hero>div:first-child{display:flex!important;flex-direction:column!important}.hero>aside{height:100%;display:flex!important;flex-direction:column!important}.hero>div:first-child #wvWeather{margin-top:auto!important}@media(max-width:1040px){.hero>div:first-child,.hero>aside{min-height:auto!important;height:auto!important}.hero>div:first-child #wvWeather{margin-top:22px!important}}`;
    document.head.appendChild(s);
  }
  function watchHero(){
    syncHeroColumns();
    [150,400,900,1600,2600,4200].forEach(ms => setTimeout(syncHeroColumns, ms));
    window.addEventListener('resize', syncHeroColumns, {passive:true});
    if('MutationObserver' in window){
      const hero=document.querySelector('.hero');
      if(hero){
        const mo=new MutationObserver(() => syncHeroColumns());
        mo.observe(hero,{childList:true,subtree:true,attributes:true});
      }
    }
  }
  function wIcon(code){
    if([0,1].includes(code)) return ['sun','Vedro'];
    if([2,3,45,48].includes(code)) return ['cloud','Oblačno'];
    if([51,53,55,56,57,61,63,65,66,67,80,81].includes(code)) return ['rain','Kiša'];
    if([71,73,75,77,85,86].includes(code)) return ['snow','Snijeg'];
    if([82,95,96,99].includes(code)) return ['storm','Oluja'];
    return ['cloud','Vrijeme'];
  }
  function installWeatherStyles(){
    if(document.getElementById('wvWeatherStyles')) return;
    const s=document.createElement('style'); s.id='wvWeatherStyles';
    s.textContent=`.wv-weather{margin-top:24px;background:linear-gradient(135deg,#fff 0%,#faf8f2 100%);border:1px solid #c8a44d;border-radius:24px;padding:18px;box-shadow:0 16px 38px rgba(17,17,17,.08);max-width:720px}.wv-weather-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.wv-weather-kicker{margin:0 0 6px!important;color:#9b7a24!important;font-size:.72rem!important;font-weight:1000!important;letter-spacing:.12em!important;text-transform:uppercase!important}.wv-weather h2{margin:0 0 5px!important;font-size:1.32rem!important;line-height:1.15!important;color:#111!important}.wv-weather p{margin:0;color:#4b5563}.wv-weather-now{display:flex;align-items:center;gap:12px}.wv-weather-temp{font-size:2.1rem;line-height:1;font-weight:1000;color:#111}.wv-weather-time{display:block;color:#6b7280;font-size:.82rem;font-weight:900}.wv-weather-meta,.wv-weather-days{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}.wv-weather-meta div,.wv-day{background:#fff;border:1px solid #ded7c8;border-radius:16px;padding:10px;text-align:center}.wv-weather-meta span,.wv-day span{display:block;color:#6b7280;font-size:.62rem;font-weight:900;text-transform:uppercase}.wv-weather-meta strong,.wv-day strong{display:block;color:#111;font-size:.94rem;font-weight:1000}.wv-day small{display:block;color:#4b5563;font-size:.72rem;min-height:28px;margin-top:4px}.wv-anim{position:relative;width:52px;height:52px;flex:0 0 52px}.wv-anim.small{width:36px;height:36px;margin:0 auto 4px}.wv-anim.sun:before{content:'';position:absolute;inset:10px;border-radius:50%;background:#f5c542;box-shadow:0 0 0 8px rgba(245,197,66,.18);animation:wvSun 2.5s infinite}.wv-anim.cloud:before,.wv-anim.rain:before,.wv-anim.storm:before,.wv-anim.snow:before{content:'';position:absolute;left:9px;top:18px;width:34px;height:18px;background:#cfd6df;border-radius:20px;box-shadow:-9px -7px 0 2px #d9e0e8,9px -9px 0 2px #d9e0e8;animation:wvCloud 3s infinite}.wv-anim.rain:after{content:'';position:absolute;left:14px;top:35px;width:4px;height:12px;background:#58a6ff;border-radius:999px;box-shadow:9px 2px 0 #58a6ff,18px 0 0 #58a6ff;animation:wvRain 1.1s infinite}.wv-anim.storm:after{content:'';position:absolute;left:22px;top:33px;border-left:7px solid transparent;border-right:4px solid transparent;border-top:17px solid #f5c542;animation:wvFlash 1.2s infinite}.wv-anim.snow:after{content:'• • •';position:absolute;left:11px;top:33px;color:#7aa6d9;font-size:15px;letter-spacing:3px;animation:wvSnow 1.4s infinite}@keyframes wvSun{50%{transform:scale(1.08)}}@keyframes wvCloud{50%{transform:translateX(4px)}}@keyframes wvRain{100%{transform:translateY(6px);opacity:.35}}@keyframes wvFlash{50%{opacity:.4}}@keyframes wvSnow{50%{transform:translateY(4px)}}@media(max-width:760px){.wv-weather-head{display:block}.wv-weather-now{margin-top:12px}.wv-weather-meta,.wv-weather-days{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
    document.head.appendChild(s);
  }
  async function geo(){
    try{ const c=localStorage.getItem('wv_geo_cache'); if(c){ const p=JSON.parse(c); if(Date.now()-p.ts<1800000) return p.data; } }catch(e){}
    try{ const r=await fetch('https://ipwho.is/'); const d=await r.json(); const g={city:d.city||'Zagreb',country:d.country||'Hrvatska',lat:d.latitude||45.815,lon:d.longitude||15.9819,tz:d.timezone?.id||'Europe/Zagreb'}; localStorage.setItem('wv_geo_cache',JSON.stringify({ts:Date.now(),data:g})); return g; }
    catch(e){ return {city:'Zagreb',country:'Hrvatska',lat:45.815,lon:15.9819,tz:'Europe/Zagreb'}; }
  }
  async function weather(g){
    const u=`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(g.tz)}&forecast_days=5`;
    const r=await fetch(u); return r.json();
  }
  function dayName(d,g){ return new Intl.DateTimeFormat('hr-HR',{weekday:'short',timeZone:g.tz}).format(new Date(d)); }
  function time(g){ return new Intl.DateTimeFormat('hr-HR',{hour:'2-digit',minute:'2-digit',timeZone:g.tz}).format(new Date()); }
  function insertWeatherBox(){
    const hero = document.querySelector('.hero > div:first-child'); if(!hero || document.getElementById('wvWeather')) return null;
    const box=document.createElement('section'); box.id='wvWeather'; box.className='wv-weather'; box.innerHTML=`<div class="wv-weather-head"><div><p class="wv-weather-kicker">VRIJEME DANAS</p><h2 id="wvWeatherLoc">Učitavanje...</h2><p id="wvWeatherText">Dohvaćam prognozu prema lokaciji.</p></div><div class="wv-weather-now"><div id="wvWeatherIcon" class="wv-anim cloud"></div><div><strong id="wvWeatherTemp" class="wv-weather-temp">--°C</strong><span id="wvWeatherTime" class="wv-weather-time">--:--</span></div></div></div><div id="wvWeatherMeta" class="wv-weather-meta"></div><div id="wvWeatherDays" class="wv-weather-days"></div>`;
    hero.appendChild(box); return box;
  }
  async function initWeather(){
    if(!document.body || document.body.dataset.page!=='home') return;
    installWeatherStyles(); const box=insertWeatherBox(); if(!box) return;
    try{
      const g=await geo(); const w=await weather(g); const cur=w.current||{}, daily=w.daily||{}; const [cls,txt]=wIcon(cur.weather_code);
      document.getElementById('wvWeatherLoc').textContent=`${g.city}, ${g.country}`;
      document.getElementById('wvWeatherText').textContent=txt;
      document.getElementById('wvWeatherTemp').textContent=`${Math.round(cur.temperature_2m||0)}°C`;
      document.getElementById('wvWeatherTime').textContent=time(g);
      document.getElementById('wvWeatherIcon').className='wv-anim '+cls;
      document.getElementById('wvWeatherMeta').innerHTML=`<div><span>Osjet</span><strong>${Math.round(cur.apparent_temperature||0)}°C</strong></div><div><span>Vlaga</span><strong>${Math.round(cur.relative_humidity_2m||0)}%</strong></div><div><span>Vjetar</span><strong>${Math.round(cur.wind_speed_10m||0)} km/h</strong></div><div><span>Danas</span><strong>${Math.round(daily.temperature_2m_max?.[0]||0)}° / ${Math.round(daily.temperature_2m_min?.[0]||0)}°</strong></div>`;
      let html=''; for(let i=1;i<Math.min(5,(daily.time||[]).length);i++){ const [ic,ds]=wIcon(daily.weather_code?.[i]); html+=`<article class="wv-day"><span>${dayName(daily.time[i],g)}</span><div class="wv-anim small ${ic}"></div><small>${ds}</small><strong>${Math.round(daily.temperature_2m_max?.[i]||0)}° / ${Math.round(daily.temperature_2m_min?.[i]||0)}°</strong></article>`; }
      document.getElementById('wvWeatherDays').innerHTML=html;
      setInterval(()=>{ const el=document.getElementById('wvWeatherTime'); if(el) el.textContent=time(g); },30000);
      syncHeroColumns();
    }catch(e){ document.getElementById('wvWeatherLoc').textContent='Vrijeme nije dostupno'; document.getElementById('wvWeatherText').textContent='Pokušaj ponovno kasnije.'; }
  }
  document.addEventListener('DOMContentLoaded', () => {
    clearOldCaches(); addResourceHints(); lazyBackgrounds(); installHeroAlignStyles(); initWeather(); watchHero(); setTimeout(registerSW, 1000);
  });
  window.addEventListener('load', syncHeroColumns);
})();