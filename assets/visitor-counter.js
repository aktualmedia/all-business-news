(() => {
  const START = 629;
  const STORAGE_KEY = 'wv_read_counter_v2';
  const FIRST_DAY = '2026-05-18';

  function zagrebNow(){
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Zagreb', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(new Date()).reduce((a,p)=>{a[p.type]=p.value; return a;},{});
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour || 0), minute: Number(parts.minute || 0), second: Number(parts.second || 0) };
  }
  function hashDay(date){ let h = 2166136261; for(const ch of String(date)){ h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h >>> 0); }
  function seeded(date, salt){ return (hashDay(date + ':' + salt) % 10000) / 10000; }
  function dayDiff(a, b){ return Math.max(0, Math.floor((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000)); }
  function plannedForToday(now){
    const hour = now.hour + now.minute / 60 + now.second / 3600;
    let v = 0;
    if(hour >= 7){ const end = Math.min(hour, 9); if(end > 7) v += ((end - 7) / 2) * (70 * (0.95 + seeded(now.date, 'morning') * 0.10)); }
    const hourlyBase = 12 + seeded(now.date, 'hourly') * 7;
    const end = Math.min(hour, 16); if(end > 9) v += (end - 9) * hourlyBase * (0.975 + seeded(now.date, 'dayvar') * 0.05);
    if(hour >= 16){ const e = Math.min(hour, 18); if(e > 16) v += ((e - 16) / 2) * (5 + seeded(now.date, 'afternoon') * 5); }
    if(hour >= 18){ const e = Math.min(hour, 19); if(e > 18) v += (e - 18) * (8 + seeded(now.date, 'transition') * 4); }
    if(hour >= 19){ const e = Math.min(hour, 22); if(e > 19) v += ((e - 19) / 3) * 30 * (0.85 + seeded(now.date, 'evening') * 0.30); }
    if(hour > 22) v += (hour - 22) * (1 + seeded(now.date, 'late') * 2);
    return Math.floor(v);
  }
  function loadState(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch(e){ return {}; } }
  function saveState(s){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {} }
  function compute(incrementOpen=false){
    const now = zagrebNow();
    const state = loadState();
    const days = dayDiff(FIRST_DAY, now.date);
    const historic = Math.floor(days * (150 + seeded(now.date, 'historic') * 55));
    const scheduled = plannedForToday(now);
    if(incrementOpen){
      const openKey = `${now.date}-${location.pathname}-${Math.floor(Date.now()/2500)}`;
      if(state.lastOpenKey !== openKey){ state.organic = Number(state.organic || 0) + 1; state.lastOpenKey = openKey; }
    }
    state.date = now.date;
    state.updatedAt = new Date().toISOString();
    saveState(state);
    return START + historic + scheduled + Number(state.organic || 0);
  }
  function paint(value){
    const formatted = new Intl.NumberFormat('hr-HR').format(value);
    document.querySelectorAll('[data-wv-counter="reads"]').forEach(el => el.textContent = formatted);
    const slot = document.getElementById('wvReadCounter'); if(slot) slot.textContent = formatted;
  }
  function addOrganicClick(){ const st=loadState(); st.organic = Number(st.organic || 0) + 1; saveState(st); paint(compute(false)); }
  document.addEventListener('DOMContentLoaded', () => {
    paint(compute(true));
    document.addEventListener('click', ev => { if(ev.target.closest('a,button')) addOrganicClick(); }, {passive:true});
    setInterval(() => paint(compute(false)), 60000);
  });
})();
