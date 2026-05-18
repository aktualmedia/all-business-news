(() => {
  const START = 629;
  const STORAGE_KEY = 'wv_read_counter_v2';
  const FIRST_DAY = '2026-05-18';

  function zagrebNow(){
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(new Date()).reduce((a,p)=>{a[p.type]=p.value; return a;},{});
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      hour: Number(parts.hour || 0),
      minute: Number(parts.minute || 0),
      second: Number(parts.second || 0)
    };
  }

  function hashDay(date){
    let h = 2166136261;
    for(const ch of String(date)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return Math.abs(h >>> 0);
  }

  function seeded(date, salt){
    const h = hashDay(date + ':' + salt);
    return (h % 10000) / 10000;
  }

  function dayDiff(a, b){
    const da = new Date(a + 'T00:00:00Z');
    const db = new Date(b + 'T00:00:00Z');
    return Math.max(0, Math.floor((db - da) / 86400000));
  }

  function plannedForToday(now){
    const hour = now.hour + now.minute / 60 + now.second / 3600;
    let v = 0;

    // 07:00–09:00 oko 70 novih čitanja, uz prirodni ritam.
    if(hour >= 7){
      const end = Math.min(hour, 9);
      if(end > 7) v += ((end - 7) / 2) * (70 * (0.95 + seeded(now.date, 'morning') * 0.10));
    }

    // Prosjek kroz dan 12–19 po satu, s blagom varijacijom, osim posebnih prozora.
    const hourlyBase = 12 + seeded(now.date, 'hourly') * 7;
    const start = 9;
    const end = Math.min(hour, 16);
    if(end > start) v += (end - start) * hourlyBase * (0.975 + seeded(now.date, 'dayvar') * 0.05);

    // 16:00–18:00 ukupno samo 5–10 čitanja.
    if(hour >= 16){
      const endAfternoon = Math.min(hour, 18);
      if(endAfternoon > 16) v += ((endAfternoon - 16) / 2) * (5 + seeded(now.date, 'afternoon') * 5);
    }

    // 18:00–19:00 lagani prijelaz.
    if(hour >= 18){
      const endTransition = Math.min(hour, 19);
      if(endTransition > 18) v += (endTransition - 18) * (8 + seeded(now.date, 'transition') * 4);
    }

    // 19:00–22:00 oko 30 čitanja, uz 10–15% varijacije.
    if(hour >= 19){
      const endEvening = Math.min(hour, 22);
      if(endEvening > 19){
        const varPct = 0.85 + seeded(now.date, 'evening') * 0.30;
        v += ((endEvening - 19) / 3) * 30 * varPct;
      }
    }

    // Nakon 22:00 minimalno organsko kretanje.
    if(hour > 22) v += (hour - 22) * (1 + seeded(now.date, 'late') * 2);

    return Math.floor(v);
  }

  function loadState(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch(e){ return {}; }
  }

  function saveState(s){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {}
  }

  function compute(){
    const now = zagrebNow();
    const state = loadState();
    const days = dayDiff(FIRST_DAY, now.date);
    const historic = Math.floor(days * (150 + seeded(now.date, 'historic') * 55));
    const scheduled = plannedForToday(now);
    const organic = Number(state.organic || 0);
    const lastOpenKey = state.lastOpenKey || '';
    const openKey = `${now.date}-${location.pathname}-${Math.floor(Date.now()/2500)}`;

    // Svako otvaranje/refresha podigne broj, ali s kratkom zaštitom od dvostrukog okidanja.
    if(lastOpenKey !== openKey){
      state.organic = organic + 1;
      state.lastOpenKey = openKey;
    }

    state.date = now.date;
    state.updatedAt = new Date().toISOString();
    saveState(state);

    return START + historic + scheduled + Number(state.organic || 0);
  }

  function paint(value){
    const formatted = new Intl.NumberFormat('hr-HR').format(value);
    document.querySelectorAll('[data-wv-counter="reads"]').forEach(el => el.textContent = formatted);
    const slot = document.getElementById('wvReadCounter');
    if(slot) slot.textContent = formatted;
    document.querySelectorAll('a, button').forEach(el => {
      if(el.dataset.wvClickCounted) return;
      el.dataset.wvClickCounted = '1';
      el.addEventListener('click', () => {
        const st = loadState();
        st.organic = Number(st.organic || 0) + 1;
        saveState(st);
        paint(compute());
      }, {passive:true});
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    paint(compute());
    setInterval(() => paint(compute()), 60000);
  });
})();
