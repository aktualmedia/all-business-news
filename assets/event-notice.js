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
      url: e.url || '',
      program_link_only: !!e.program_link_only
    };
  }
  function sortEvents(a,b){
    return String(a.country+a.city+a.type+a.institution+a.title).localeCompare(String(b.country+b.city+b.type+b.institution+b.title),'hr');
  }
  function pickDayEvents(events){
    const today = zagrebDate(0), tomorrow = zagrebDate(1);
    const arr = events.map(normalize).filter(e => e.date && e.title).sort((a,b)=>String(a.date+a.country+a.city+a.title).localeCompare(String(b.date+b.country+b.city+b.title),'hr'));
    const todayEvents = arr.filter(e=>e.date===today).sort(sortEvents);
    if(todayEvents.length) return {date: today, when: 'DANAS', events: todayEvents};
    const tomorrowEvents = arr.filter(e=>e.date===tomorrow).sort(sortEvents);
    if(tomorrowEvents.length) return {date: tomorrow, when: 'SUTRA', events: tomorrowEvents};
    const next = arr.find(e=>e.date>tomorrow);
    if(!next) return null;
    return {date: next.date, when: 'USKORO', events: arr.filter(e=>e.date===next.date).sort(sortEvents)};
  }
  function itemHtml(event){
    const place = [event.city, event.country].filter(Boolean).join(', ');
    const meta = [place, event.type].filter(Boolean).join(' · ');
    return `<article class="top-event-item"><div><h3>${esc(event.title)}</h3><p>${esc(meta)}</p>${event.institution ? `<strong>${esc(event.institution)}</strong>` : ''}</div>${event.url ? `<a class="top-event-program" href="${esc(event.url)}" target="_blank" rel="noopener">PROGRAM</a>` : ''}</article>`;
  }
  async function init(){
    const box = document.getElementById('topEventNotice');
    if(!box) return;
    const [autoEvents, manualEvents] = await Promise.all([getJson('data/events_calendar.json'), getJson('data/manual_events.json')]);
    const picked = pickDayEvents([...(Array.isArray(autoEvents)?autoEvents:[]), ...(Array.isArray(manualEvents)?manualEvents:[])]);
    if(!picked || !picked.events.length){ box.hidden = true; return; }
    const count = picked.events.length;
    box.hidden = false;
    box.innerHTML = `<div class="top-event-inner top-event-inner-list"><div class="top-event-heading"><p class="eyebrow">DOGAĐANJA ${esc(picked.when)}</p><h2>${esc(hrDate(picked.date))}</h2><p>${count === 1 ? '1 događaj' : count + ' događanja'} za odabrani dan. Za cjelovit pregled otvori kalendar.</p></div><div class="top-event-actions"><a class="button primary" href="${siteLink('dogadjanja/index.html')}">OTVORI KALENDAR</a></div></div><div class="top-event-list">${picked.events.map(itemHtml).join('')}</div>`;
  }
  document.addEventListener('DOMContentLoaded', init);
})();
