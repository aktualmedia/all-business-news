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
  function installMobileStyles(){
    if(document.getElementById('topEventMobileStyles')) return;
    const style=document.createElement('style');
    style.id='topEventMobileStyles';
    style.textContent=`.top-event-kind{display:inline-flex;margin:0 0 5px;padding:4px 7px;border-radius:999px;background:rgba(200,164,77,.92);color:#111;font-size:.62rem;font-weight:1000;letter-spacing:.05em;text-transform:uppercase}.top-event-more{display:none;width:100%;border:1px solid rgba(200,164,77,.7);border-radius:999px;background:#c8a44d;color:#111;font-weight:1000;text-transform:uppercase;padding:10px 12px;margin:0 18px 18px;cursor:pointer}.top-event-more-wrap{display:none}.top-event-item.top-event-extra{display:block}@media(max-width:760px){.top-event-notice .top-event-list .top-event-extra{display:none}.top-event-notice.events-expanded .top-event-list .top-event-extra{display:block}.top-event-more-wrap{display:block;padding:0 18px 18px}.top-event-more{display:inline-flex;align-items:center;justify-content:center;margin:0;width:100%;font-size:.75rem}.top-event-notice.events-expanded .top-event-more{background:#111;color:#c8a44d}}`;
    document.head.appendChild(style);
  }
  function kindLabel(type, title){
    const txt = `${type||''} ${title||''}`.toLowerCase();
    if(txt.includes('opera')) return 'OPERA';
    if(txt.includes('balet') || txt.includes('ballet')) return 'BALET';
    if(txt.includes('izlož') || txt.includes('izloz') || txt.includes('exhibition') || txt.includes('muzej') || txt.includes('museum') || txt.includes('galer')) return 'IZLOŽBA';
    if(txt.includes('premijer') || txt.includes('kazali') || txt.includes('theatre') || txt.includes('theater') || txt.includes('broadway') || txt.includes('predstava')) return 'PREDSTAVA';
    if(txt.includes('koncert') || txt.includes('concert')) return 'KONCERT';
    return 'DOGAĐAJ';
  }
  function cleanTitle(event){
    const title = String(event.title || 'Događanje').trim();
    const inst = String(event.institution || '').trim();
    if(/^program\s*:/i.test(title) && inst) return inst;
    return title.replace(/^program\s*:\s*/i,'').trim() || title;
  }
  function normalize(e){
    const event = {
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
    event.kind = kindLabel(event.type, event.title);
    event.displayTitle = cleanTitle(event);
    return event;
  }
  function sortEvents(a,b){
    return String(a.country+a.city+a.type+a.institution+a.displayTitle).localeCompare(String(b.country+b.city+b.type+b.institution+b.displayTitle),'hr');
  }
  function pickDayEvents(events){
    const today = zagrebDate(0), tomorrow = zagrebDate(1);
    const arr = events.map(normalize).filter(e => e.date && e.title).sort((a,b)=>String(a.date+a.country+a.city+a.displayTitle).localeCompare(String(b.date+b.country+b.city+b.displayTitle),'hr'));
    const todayEvents = arr.filter(e=>e.date===today).sort(sortEvents);
    if(todayEvents.length) return {date: today, when: 'DANAS', events: todayEvents};
    const tomorrowEvents = arr.filter(e=>e.date===tomorrow).sort(sortEvents);
    if(tomorrowEvents.length) return {date: tomorrow, when: 'SUTRA', events: tomorrowEvents};
    const next = arr.find(e=>e.date>tomorrow);
    if(!next) return null;
    return {date: next.date, when: 'USKORO', events: arr.filter(e=>e.date===next.date).sort(sortEvents)};
  }
  function itemHtml(event, index){
    const place = [event.city, event.country].filter(Boolean).join(', ');
    const meta = [place, event.type].filter(Boolean).join(' · ');
    const titleLine = event.program_link_only ? `Program · ${event.displayTitle}` : event.displayTitle;
    const extraClass = index >= 2 ? ' top-event-extra' : '';
    return `<article class="top-event-item${extraClass}"><div><span class="top-event-kind">${esc(event.kind)}</span><h3>${esc(titleLine)}</h3><p>${esc(meta)}</p>${event.institution ? `<strong>${esc(event.institution)}</strong>` : ''}</div>${event.url ? `<a class="top-event-program" href="${esc(event.url)}" target="_blank" rel="noopener">PROGRAM</a>` : ''}</article>`;
  }
  function bindMore(box, count){
    const btn = box.querySelector('#topEventMore');
    if(!btn) return;
    btn.addEventListener('click', () => {
      const expanded = box.classList.toggle('events-expanded');
      btn.textContent = expanded ? 'SAKRIJ DODATNA DOGAĐANJA' : `PRIKAŽI OSTALA DOGAĐANJA (${Math.max(0,count-2)})`;
    });
  }
  async function init(){
    installMobileStyles();
    const box = document.getElementById('topEventNotice');
    if(!box) return;
    const [autoEvents, manualEvents] = await Promise.all([getJson('data/events_calendar.json'), getJson('data/manual_events.json')]);
    const picked = pickDayEvents([...(Array.isArray(autoEvents)?autoEvents:[]), ...(Array.isArray(manualEvents)?manualEvents:[])]);
    if(!picked || !picked.events.length){ box.hidden = true; return; }
    const count = picked.events.length;
    const more = count > 2 ? `<div class="top-event-more-wrap"><button id="topEventMore" class="top-event-more" type="button">PRIKAŽI OSTALA DOGAĐANJA (${count-2})</button></div>` : '';
    box.hidden = false;
    box.classList.remove('events-expanded');
    box.innerHTML = `<div class="top-event-inner top-event-inner-list"><div class="top-event-heading"><p class="eyebrow">DOGAĐANJA ${esc(picked.when)}</p><h2>${esc(hrDate(picked.date))}</h2><p>${count === 1 ? '1 događaj' : count + ' događanja'} za odabrani dan. Za cjelovit pregled otvori kalendar.</p></div><div class="top-event-actions"><a class="button primary" href="${siteLink('dogadjanja/index.html')}">OTVORI KALENDAR</a></div></div><div class="top-event-list">${picked.events.map(itemHtml).join('')}</div>${more}`;
    bindMore(box, count);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
