(() => {
  const repo = '/all-business-news/';
  const esc = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function basePath(){ const p = location.pathname; const i = p.indexOf(repo); return i >= 0 ? p.slice(0, i + repo.length) : '/'; }
  function siteLink(path){ if(/^https?:/.test(path)) return path; return basePath() + String(path).replace(/^\/+/, ''); }
  async function getJson(path){ try { const r = await fetch(siteLink(path), {cache:'default'}); return r.ok ? await r.json() : []; } catch(e){ return []; } }
  function zagrebDate(offset=0){
    const now = new Date(Date.now() + offset * 86400000);
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Zagreb', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now).reduce((a,p)=>{a[p.type]=p.value; return a;},{});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }
  function hrDate(iso){
    try { return new Date(String(iso).slice(0,10) + 'T12:00:00').toLocaleDateString('hr-HR', {weekday:'long', day:'2-digit', month:'2-digit', year:'numeric'}); }
    catch(e){ return iso || ''; }
  }
  function normalize(e){
    return {
      title: e.title || 'Događanje',
      date: e.date || String(e.datetime || '').slice(0,10),
      datetime: e.datetime || '',
      country: e.country || '',
      city: e.city || '',
      type: e.type || e.category || '',
      institution: e.institution || e.source || e.venue || '',
      url: e.url || ''
    };
  }
  function pick(events){
    const today = zagrebDate(0), tomorrow = zagrebDate(1);
    const arr = events.map(normalize).filter(e => e.date && e.title).sort((a,b)=>String(a.date+a.country+a.city+a.title).localeCompare(String(b.date+b.country+b.city+b.title)));
    return arr.find(e=>e.date===today) || arr.find(e=>e.date===tomorrow) || arr.find(e=>e.date>tomorrow) || null;
  }
  async function init(){
    const box = document.getElementById('topEventNotice');
    if(!box) return;
    const [autoEvents, manualEvents] = await Promise.all([getJson('data/events_calendar.json'), getJson('data/manual_events.json')]);
    const event = pick([...(Array.isArray(autoEvents)?autoEvents:[]), ...(Array.isArray(manualEvents)?manualEvents:[])]);
    if(!event){ box.hidden = true; return; }
    const when = event.date === zagrebDate(0) ? 'DANAS' : (event.date === zagrebDate(1) ? 'SUTRA' : 'USKORO');
    const place = [event.city, event.country].filter(Boolean).join(', ');
    const meta = [when, hrDate(event.date), place, event.type].filter(Boolean).join(' · ');
    box.hidden = false;
    box.innerHTML = `<div class="top-event-inner"><div><p class="eyebrow">PREPORUKA DOGAĐANJA</p><h2>${esc(event.title)}</h2><p>${esc(meta)}</p>${event.institution ? `<strong>${esc(event.institution)}</strong>` : ''}</div><div class="top-event-actions"><a class="button primary" href="${siteLink('dogadjanja/index.html')}">OTVORI KALENDAR</a>${event.url ? `<a class="button" href="${esc(event.url)}" target="_blank" rel="noopener">PROGRAM</a>` : ''}</div></div>`;
  }
  document.addEventListener('DOMContentLoaded', init);
})();
