(() => {
  const START = 1310;
  const FIRST_DAY = '2026-05-18';
  const STORAGE_KEY = 'wv_read_counter_logic_v8_start_1310';

  function parts(){
    try{
      const p = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Zagreb', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false}).formatToParts(new Date()).reduce((a,x)=>{a[x.type]=x.value;return a;},{});
      return {date:`${p.year}-${p.month}-${p.day}`, hour:+p.hour||0, minute:+p.minute||0, second:+p.second||0};
    }catch(e){ const d=new Date(); return {date:d.toISOString().slice(0,10), hour:d.getHours(), minute:d.getMinutes(), second:d.getSeconds()}; }
  }
  function daysFromStart(d){ return Math.max(0, Math.floor((new Date(d+'T00:00:00Z') - new Date(FIRST_DAY+'T00:00:00Z'))/86400000)); }
  function hash(s){ let h=2166136261; for(const c of String(s)){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return Math.abs(h>>>0); }
  function seeded(date,salt){ return (hash(date+':'+salt)%10000)/10000; }
  function planned(now){
    const hour = now.hour + now.minute/60 + now.second/3600;
    let v = 0;
    if(hour >= 7){ const e=Math.min(hour,9); if(e>7) v += ((e-7)/2) * (70 * (0.95 + seeded(now.date,'morning')*0.10)); }
    if(hour > 9){ const e=Math.min(hour,16); if(e>9) v += (e-9) * (12 + seeded(now.date,'day')*7); }
    if(hour >= 16){ const e=Math.min(hour,18); if(e>16) v += ((e-16)/2) * (5 + seeded(now.date,'afternoon')*5); }
    if(hour >= 18){ const e=Math.min(hour,19); if(e>18) v += (e-18) * (8 + seeded(now.date,'transition')*4); }
    if(hour >= 19){ const e=Math.min(hour,22); if(e>19) v += ((e-19)/3) * 30 * (0.85 + seeded(now.date,'evening')*0.30); }
    if(hour > 22) v += (hour-22) * (1 + seeded(now.date,'late')*2);
    return Math.floor(v);
  }
  function load(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};}catch(e){return{};} }
  function save(x){ try{localStorage.setItem(STORAGE_KEY, JSON.stringify(x));}catch(e){} }
  function calc(increment){
    const now = parts();
    const st = load();
    if(st.date !== now.date){ st.date = now.date; st.organic = 0; st.lastKey = ''; }
    if(increment){
      const key = `${now.date}:${location.pathname}:${Math.floor(Date.now()/3000)}`;
      if(st.lastKey !== key){ st.organic = Number(st.organic||0) + 1; st.lastKey = key; }
    }
    st.updatedAt = new Date().toISOString();
    save(st);
    const historic = daysFromStart(now.date) * 173;
    const pulse = Math.floor((now.minute*60 + now.second)/45);
    return START + historic + planned(now) + Number(st.organic||0) + pulse;
  }
  function ensureVisibleCard(){
    let target = document.querySelector('#wvReadCounter,[data-wv-counter="reads"]');
    if(target) return target;
    const status = document.querySelector('.side-stat-list') || document.querySelector('.portal-mini-status');
    if(!status) return null;
    const wrap = document.createElement('div');
    wrap.className = 'side-stat read-counter-card';
    wrap.innerHTML = '<span>Brojač čitanja</span><strong id="wvReadCounter" data-wv-counter="reads">1310</strong>';
    if(status.classList.contains('side-stat-list')) status.prepend(wrap); else status.appendChild(wrap);
    return wrap.querySelector('strong');
  }
  function paint(value){
    const txt = new Intl.NumberFormat('hr-HR').format(Math.max(START, Math.floor(value)));
    let done = false;
    document.querySelectorAll('#wvReadCounter,[data-wv-counter="reads"],.read-counter-card strong').forEach(el=>{ el.textContent = txt; done = true; });
    if(!done){ const el = ensureVisibleCard(); if(el) el.textContent = txt; }
  }
  function injectStyle(){
    if(document.getElementById('wvReadCounterStyle')) return;
    const s = document.createElement('style');
    s.id = 'wvReadCounterStyle';
    s.textContent = '.read-counter-card,.side-stat.read-counter-card{background:#fff!important;color:#111!important;border:1px solid var(--line,#ded7c8)!important}.read-counter-card *,.side-stat.read-counter-card *{color:#111!important}.read-counter-card span{color:#6b7280!important}.read-counter-card strong,#wvReadCounter{font-size:1.22rem!important;font-weight:1000!important;line-height:1.05!important;color:#111!important}';
    document.head.appendChild(s);
  }
  function tick(increment=false){ injectStyle(); ensureVisibleCard(); paint(calc(increment)); }
  function boot(){
    tick(true);
    document.addEventListener('click', e=>{ if(e.target && e.target.closest && e.target.closest('a,button')) tick(true); }, {passive:true});
    setTimeout(()=>tick(false),400);
    setTimeout(()=>tick(false),1400);
    setInterval(()=>tick(false),15000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
