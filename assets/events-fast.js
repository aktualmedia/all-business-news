(() => {
  const repo = '/all-business-news/';
  const state = { events: [], filters: { country:'', city:'', type:'', institution:'', q:'' } };
  const esc = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function basePath(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : '/'; }
  function siteLink(path){ if(/^https?:/.test(path)) return path; return basePath()+String(path).replace(/^\/+/, ''); }
  async function getJson(path){ try{ const r=await fetch(siteLink(path)+'?v='+Date.now(),{cache:'no-store'}); return r.ok ? await r.json() : []; }catch(e){ return []; } }
  function addStyles(){
    if(document.getElementById('eventsFastFixStyles')) return;
    const st=document.createElement('style');
    st.id='eventsFastFixStyles';
    st.textContent=`
      #eventsGrid{align-items:stretch}.event-card{min-width:0;max-width:100%;overflow:hidden}.event-card .card-body{min-width:0;max-width:100%;overflow:hidden}.event-card h3{max-width:100%;overflow-wrap:anywhere;word-break:break-word;hyphens:auto;line-height:1.18;font-size:1rem}.event-card p,.event-card .meta{max-width:100%;overflow-wrap:anywhere;word-break:break-word;white-space:normal}.event-card .hero-actions{min-width:0;max-width:100%;display:flex;flex-wrap:wrap}.event-card .button{white-space:normal;text-align:center}.event-mini-stats{overflow-wrap:anywhere}.event-filter-grid{min-width:0}.event-filter-grid input,.event-filter-grid select{min-width:0;max-width:100%}
      @media(max-width:760px){#eventsGrid.news-grid{grid-template-columns:1fr!important}.event-card h3{font-size:.98rem}.event-card .card-body{padding:14px}.event-card .button{width:100%;justify-content:center}}
    `;
    document.head.appendChild(st);
  }
  function fmt(d){ if(!d) return ''; try { return new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString('hr-HR',{day:'2-digit',month:'2-digit',year:'numeric'}); } catch(e){ return d; } }
  function norm(e){ return { title:e.title||'Događanje', date:e.date||String(e.datetime||'').slice(0,10), datetime:e.datetime||'', country:e.country||'', city:e.city||'', type:e.type||e.category||'događanje', institution:e.institution||e.source||e.venue||'', location:e.location||e.venue||e.city||'', url:e.url||'', program_link_only:!!e.program_link_only }; }
  const uniq = arr => [...new Set(arr.map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hr'));
  function fill(id, vals, label){ const el=document.getElementById(id); if(!el) return; const old=el.value; el.innerHTML=`<option value="">${label}</option>`+vals.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); if(vals.includes(old)) el.value=old; }
  function updateFilters(){ const events=state.events.map(norm); fill('eventCountry', uniq(events.map(e=>e.country)), 'SVE DRŽAVE'); fill('eventCity', uniq(events.map(e=>e.city)), 'SVI GRADOVI'); fill('eventType', uniq(events.map(e=>e.type)), 'SVE VRSTE'); fill('eventInstitution', uniq(events.map(e=>e.institution)), 'SVE INSTITUCIJE'); const count=document.getElementById('eventCount'); if(count) count.textContent = new Intl.NumberFormat('hr-HR').format(events.length); }
  function filtered(){ const f=state.filters; let arr=state.events.map(norm); if(f.country) arr=arr.filter(e=>e.country===f.country); if(f.city) arr=arr.filter(e=>e.city===f.city); if(f.type) arr=arr.filter(e=>e.type===f.type); if(f.institution) arr=arr.filter(e=>e.institution===f.institution); const q=(f.q||'').toLowerCase(); if(q) arr=arr.filter(e=>[e.title,e.country,e.city,e.type,e.institution,e.location].join(' ').toLowerCase().includes(q)); return arr; }
  function render(){
    const box=document.getElementById('eventsGrid'); if(!box) return;
    const arr=filtered().sort((a,b)=>String(a.country+a.city+a.type+a.institution+a.date+a.title).localeCompare(String(b.country+b.city+b.type+b.institution+b.date+b.title)));
    const shown=document.getElementById('eventShown'); if(shown) shown.textContent=new Intl.NumberFormat('hr-HR').format(arr.length);
    box.innerHTML=arr.map(e=>{ const meta=[fmt(e.date), e.country, e.city, e.type].filter(Boolean).join(' · '); const btn=e.url?`<a class="button small" href="${esc(e.url)}" target="_blank" rel="noopener">PROGRAM / ULAZNICE</a>`:''; return `<article class="event-card"><div class="card-body"><p class="meta">${esc(meta)}</p><h3>${esc(e.title)}</h3><p>${esc(e.institution || e.location || '')}</p><div class="hero-actions">${btn}</div></div></article>`; }).join('') || '<div class="legal-box"><p>NEMA DOGAĐANJA ZA ODABRANI FILTER.</p></div>';
  }
  function bind(){ const panel=document.getElementById('eventFilters'); if(!panel) return; const update=()=>{ state.filters={country:document.getElementById('eventCountry')?.value||'', city:document.getElementById('eventCity')?.value||'', type:document.getElementById('eventType')?.value||'', institution:document.getElementById('eventInstitution')?.value||'', q:document.getElementById('eventSearch')?.value||''}; render(); }; panel.addEventListener('input', update); panel.addEventListener('change', update); }
  async function init(){ addStyles(); const [auto, manual] = await Promise.all([getJson('data/events_calendar.json'), getJson('data/manual_events.json')]); state.events=[...(Array.isArray(auto)?auto:[]), ...(Array.isArray(manual)?manual:[])]; updateFilters(); bind(); render(); }
  document.addEventListener('DOMContentLoaded', init);
})();