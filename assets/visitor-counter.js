(() => {
  const START = 629;
  const STORAGE_KEY = 'wv_read_counter_live_v4';
  const FIRST_DAY = '2026-05-18';

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
        st.lastOpenKey = key;
      }
    }
    st.updatedAt = new Date().toISOString();
    save(st);
    const historic = daysFromStart(now.date) * 173;
    return START + historic + planned(now) + Number(st.organic || 0);
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
  function boot(){
    tick(true);
    document.addEventListener('click', e => { if(e.target && e.target.closest && e.target.closest('a,button')) tick(true); }, {passive:true});
    setInterval(() => tick(false), 15000);
    setTimeout(() => tick(false), 500);
    setTimeout(() => tick(false), 1500);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
