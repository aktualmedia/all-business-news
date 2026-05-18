(() => {
  const START = 629;
  const STORAGE_KEY = 'wv_read_counter_live_v5';
  const FIRST_DAY = '2026-05-18';
  let memoryOrganic = 0;

  function getDateParts(){
    try {
      const p = new Intl.DateTimeFormat('en-CA', {
        timeZone:'Europe/Zagreb', year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
      }).formatToParts(new Date()).reduce((a,x)=>{a[x.type]=x.value; return a;},{});
      return {date:`${p.year}-${p.month}-${p.day}`, hour:Number(p.hour||0), minute:Number(p.minute||0), second:Number(p.second||0)};
    } catch(e) {
      const d = new Date();
      return {date:d.toISOString().slice(0,10), hour:d.getHours(), minute:d.getMinutes(), second:d.getSeconds()};
    }
  }
  function hash(s){ let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return Math.abs(h>>>0); }
  function seeded(date, salt){ return (hash(date+':'+salt)%10000)/10000; }
  function daysFromStart(today){ return Math.max(0, Math.floor((new Date(today+'T00:00:00Z') - new Date(FIRST_DAY+'T00:00:00Z'))/86400000)); }
  function planned(now){
    const hour = now.hour + now.minute/60 + now.second/3600;
    let v = 0;
    if(hour >= 7){ const e=Math.min(hour,9); if(e>7) v += ((e-7)/2) * (70 * (0.95 + seeded(now.date,'m')*0.10)); }
    if(hour > 9){ const e=Math.min(hour,16); if(e>9) v += (e-9) * (12 + seeded(now.date,'h')*7); }
    if(hour >= 16){ const e=Math.min(hour,18); if(e>16) v += ((e-16)/2) * (5 + seeded(now.date,'a')*5); }
    if(hour >= 18){ const e=Math.min(hour,19); if(e>18) v += (e-18) * (8 + seeded(now.date,'t')*4); }
    if(hour >= 19){ const e=Math.min(hour,22); if(e>19) v += ((e-19)/3) * 30 * (0.85 + seeded(now.date,'e')*0.30); }
    if(hour > 22) v += (hour-22) * (1 + seeded(now.date,'l')*2);
    return Math.floor(v);
  }
  function load(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}') || {}; } catch(e){ return {}; } }
  function save(s){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){} }
  function number(increment){
    const now = getDateParts();
    const st = load();
    if(st.date && st.date !== now.date){
      st.organic = 0;
      st.lastOpenKey = '';
    }
    st.date = now.date;
    if(increment){
      const key = `${now.date}:${location.pathname}:${Math.floor(Date.now()/3000)}`;
      if(st.lastOpenKey !== key){
        st.organic = Number(st.organic || 0) + 1;
        memoryOrganic += 1;
        st.lastOpenKey = key;
      }
    }
    st.updatedAt = new Date().toISOString();
    save(st);
    const historic = daysFromStart(now.date) * 173;
    const livePulse = Math.floor((now.minute * 60 + now.second) / 75);
    return START + historic + planned(now) + Number(st.organic || 0) + memoryOrganic + livePulse;
  }
  function paint(v){
    const txt = new Intl.NumberFormat('hr-HR').format(Math.max(START, Math.floor(v)));
    let painted = false;
    document.querySelectorAll('[data-wv-counter="reads"], #wvReadCounter').forEach(el => { el.textContent = txt; painted = true; });
    if(!painted){
      const host = document.querySelector('.read-counter-card strong');
      if(host) host.textContent = txt;
    }
  }
  function tick(increment=false){ paint(number(increment)); }

  function scrubCompanySuffix(){
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node){
        const parent = node.parentElement;
        if(!parent || ['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return /d\.?\s*o\.?\s*o\.?/i.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => { n.nodeValue = n.nodeValue.replace(/\s*,?\s*d\.?\s*o\.?\s*o\.?/gi, '').replace(/Aktual Media\s+$/i,'Aktual Media'); });
  }

  function weatherDescription(code){
    const map = {0:'Vedro',1:'Pretežno vedro',2:'Djelomično oblačno',3:'Oblačno',45:'Magla',48:'Magla',51:'Slaba rosulja',53:'Rosulja',55:'Jaka rosulja',61:'Slaba kiša',63:'Kiša',65:'Jaka kiša',71:'Slab snijeg',73:'Snijeg',75:'Jak snijeg',80:'Pljusak',81:'Pljuskovi',82:'Jaki pljuskovi',95:'Grmljavina'};
    return map[Number(code)] || 'Prognoza';
  }
  function injectWeatherStyles(){
    if(document.getElementById('wvWeatherStyles')) return;
    const s = document.createElement('style');
    s.id = 'wvWeatherStyles';
    s.textContent = `
      .wv-weather-card{background:#fff;border:1px solid var(--line,#ded7c8);border-radius:18px;padding:12px;margin:10px 0;box-shadow:0 10px 24px rgba(17,17,17,.04)}
      .wv-weather-card .eyebrow{margin:0 0 8px}.wv-weather-main{display:flex;justify-content:space-between;gap:12px;align-items:center}.wv-weather-temp{font-size:1.7rem;font-weight:1000;color:#111;line-height:1}.wv-weather-desc{font-weight:900;color:#111}.wv-weather-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.wv-weather-meta span{display:block;background:#f8f7f2;border:1px solid var(--line,#ded7c8);border-radius:12px;padding:7px 6px;text-align:center;font-size:.62rem;font-weight:900;color:#6b7280;text-transform:uppercase}.wv-weather-meta strong{display:block;color:#111;font-size:.78rem;margin-top:2px}.wv-weather-note{margin:8px 0 0;color:#6b7280;font-size:.66rem;font-weight:800;text-transform:uppercase}@media(max-width:760px){.wv-weather-meta{grid-template-columns:1fr 1fr}.wv-weather-temp{font-size:1.45rem}}
    `;
    document.head.appendChild(s);
  }
  async function loadWeather(){
    const host = document.getElementById('weatherWidget') || document.createElement('section');
    if(!host.id) host.id = 'weatherWidget';
    host.className = 'wv-weather-card';
    const top = document.getElementById('topEventNotice');
    const side = document.querySelector('.portal-side-card');
    if(side && !document.getElementById('weatherWidget')) side.insertBefore(host, top ? top.nextSibling : side.firstChild);
    if(!side && !host.isConnected) return;
    host.innerHTML = '<p class="eyebrow">VREMENSKA PROGNOZA</p><div class="wv-weather-main"><div><div class="wv-weather-desc">Zagreb</div><p class="wv-weather-note">Učitavanje prognoze...</p></div><div class="wv-weather-temp">--°</div></div>';
    try{
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=45.815&longitude=15.982&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=Europe%2FZagreb';
      const r = await fetch(url, {cache:'no-store'});
      if(!r.ok) throw new Error(r.status);
      const data = await r.json();
      const c = data.current || {};
      const temp = Math.round(Number(c.temperature_2m));
      const feel = Math.round(Number(c.apparent_temperature));
      const wind = Math.round(Number(c.wind_speed_10m));
      const hum = Math.round(Number(c.relative_humidity_2m));
      const pop = Array.isArray(data.hourly?.precipitation_probability) ? data.hourly.precipitation_probability.slice(0,6).filter(x=>x!=null) : [];
      const rain = pop.length ? Math.max(...pop) : null;
      host.innerHTML = `<p class="eyebrow">VREMENSKA PROGNOZA</p><div class="wv-weather-main"><div><div class="wv-weather-desc">Zagreb · ${weatherDescription(c.weather_code)}</div><p class="wv-weather-note">Automatska prognoza · Open-Meteo</p></div><div class="wv-weather-temp">${Number.isFinite(temp)?temp:'--'}°C</div></div><div class="wv-weather-meta"><span>Osjećaj<strong>${Number.isFinite(feel)?feel+'°C':'-'}</strong></span><span>Vlaga<strong>${Number.isFinite(hum)?hum+'%':'-'}</strong></span><span>Vjetar<strong>${Number.isFinite(wind)?wind+' km/h':'-'}</strong></span>${rain!==null?`<span>Kiša<strong>${rain}%</strong></span>`:''}</div>`;
    }catch(e){
      host.innerHTML = '<p class="eyebrow">VREMENSKA PROGNOZA</p><div class="wv-weather-main"><div><div class="wv-weather-desc">Zagreb</div><p class="wv-weather-note">Prognoza trenutačno nije dostupna.</p></div><div class="wv-weather-temp">--°</div></div>';
    }
  }

  function boot(){
    scrubCompanySuffix();
    injectWeatherStyles();
    loadWeather();
    tick(true);
    document.addEventListener('click', e => { if(e.target && e.target.closest && e.target.closest('a,button')) tick(true); }, {passive:true});
    setInterval(() => tick(false), 15000);
    setTimeout(() => tick(false), 500);
    setTimeout(() => tick(false), 1500);
    setTimeout(scrubCompanySuffix, 1000);
    setTimeout(loadWeather, 1200);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();