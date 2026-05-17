(() => {
  const repo = '/all-business-news/';
  const CATS = [
    ['poslovanje','POSLOVANJE'],['ekonomija','EKONOMIJA'],['financije','FINANCIJE'],['trzista','TRŽIŠTA'],['kultura','KULTURA'],['dizajn','DIZAJN'],['tehnologija','TEHNOLOGIJA'],['znanost','ZNANOST'],['lifestyle','LIFESTYLE'],['hedonizam','HEDONIZAM'],['satovi','SATOVI'],['nakit','NAKIT'],['pica','PIĆA']
  ];
  function base(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : '/'; }
  function url(p){ return base()+String(p).replace(/^\/+/, ''); }
  async function getJson(p, fallback){ try{ const r=await fetch(url(p), {cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }
  function fmt(d){ if(!d) return 'nije dostupno'; try{ return new Date(d).toLocaleString('hr-HR'); }catch(e){ return d; } }
  function esc(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function newsLink(n){ const local=String(n.local_url||n.local_path||''); if(local && !/^https?:/.test(local)) return url(local); const external=String(n.url||local||''); return url('citaj/index.html')+'?u='+encodeURIComponent(external)+'&t='+encodeURIComponent(n.title||'Vijest')+'&s='+encodeURIComponent(n.source||'')+'&c='+encodeURIComponent(n.category||'vijesti'); }
  function injectCss(){
    if(document.getElementById('dashboardCss')) return;
    const s=document.createElement('style'); s.id='dashboardCss';
    s.textContent = `.category-dashboard,.source-dashboard,.pwa-install,.today-focus,.source-day,.saved-strip{background:#fff;border:1px solid var(--line,#dbe3ef);border-radius:24px;padding:20px;margin:18px 0;box-shadow:0 14px 38px rgba(15,23,42,.06)}.dash-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:14px}.dash-head h2{margin:0;text-transform:uppercase;letter-spacing:.04em}.dash-head p{margin:0;color:#64748b}.category-count-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.category-count-grid a{display:block;background:#f8fafc;border:1px solid var(--line,#dbe3ef);border-radius:18px;padding:14px;text-decoration:none;color:#0f172a;box-shadow:0 8px 22px rgba(15,23,42,.04)}.category-count-grid strong{display:block;text-transform:uppercase;font-size:.82rem}.category-count-grid span{display:block;color:#1f3c88;font-weight:900;margin-top:4px}.source-table{overflow:auto}.source-table table{width:100%;border-collapse:collapse;background:#fff}.source-table th,.source-table td{padding:10px;border-bottom:1px solid var(--line,#dbe3ef);text-align:left;font-size:.9rem}.source-table th{text-transform:uppercase;color:#64748b;font-size:.76rem}.source-table tr:hover td{background:#f8fafc}.pwa-install{display:none;background:linear-gradient(135deg,#1f3c88,#6d28d9);color:#fff}.pwa-install button{background:#fff;color:#1f3c88;border:0;border-radius:999px;padding:10px 14px;font-weight:900}.focus-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.focus-card{background:#fff;border:1px solid var(--line,#dbe3ef);border-radius:20px;overflow:hidden;text-decoration:none;color:#0f172a}.focus-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.focus-card div{padding:12px}.focus-card p{margin:0 0 5px;color:#64748b;font-size:.72rem;font-weight:900;text-transform:uppercase}.focus-card h3{margin:0;font-size:.98rem;line-height:1.25}.source-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.source-list a{background:#f8fafc;border:1px solid var(--line,#dbe3ef);border-radius:16px;padding:12px;text-decoration:none;color:#0f172a;font-weight:800}.save-btn{border:1px solid var(--line,#dbe3ef);background:#fff;border-radius:999px;padding:7px 10px;color:#1f3c88;font-weight:900;cursor:pointer;margin-top:10px}@media(max-width:760px){.dash-head{display:block}.category-count-grid,.focus-grid{grid-template-columns:1fr 1fr}.source-list{grid-template-columns:1fr}.category-dashboard,.source-dashboard,.today-focus,.source-day,.pwa-install{padding:14px}.source-table th,.source-table td{font-size:.78rem;padding:8px}}`;
    document.head.appendChild(s);
  }
  function countFromNews(news){ const c={}; (news||[]).forEach(n=>{ const k=n.category||'vijesti'; c[k]=(c[k]||0)+1; }); return c; }
  function makeCategoryDashboard(counts, updated){
    return `<section class="category-dashboard"><div class="dash-head"><h2>VIJESTI PO KATEGORIJAMA</h2><p>Zadnje ažuriranje: <strong>${fmt(updated)}</strong></p></div><div class="category-count-grid">${CATS.map(([slug,label])=>`<a href="${url(slug+'/index.html')}"><strong>${label}</strong><span>${counts[slug]||0} VIJESTI</span></a>`).join('')}</div></section>`;
  }
  function makeSourceDashboard(stats){
    const rows = stats.feed_results || [];
    const top = rows.slice(0, 80);
    return `<section class="source-dashboard"><div class="dash-head"><h2>IZVORI I POVUČENE OBJAVE</h2><p>Izvora: <strong>${stats.sources||0}</strong> · OK: <strong>${stats.ok_sources||0}</strong> · Greške: <strong>${stats.failed_sources||0}</strong> · Zadnje: <strong>${fmt(stats.updated_at)}</strong></p></div><div class="source-table"><table><thead><tr><th>Izvor</th><th>Kategorija</th><th>Status</th><th>Povučeno</th></tr></thead><tbody>${top.map(r=>`<tr><td>${esc(r.name||'-')}</td><td>${esc(r.category||'-')}</td><td>${esc(r.status||'-')}</td><td>${r.count||0}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  function setupPWA(){
    const link=document.createElement('link'); link.rel='manifest'; link.href=url('manifest.json'); document.head.appendChild(link);
    if('serviceWorker' in navigator) navigator.serviceWorker.register(url('service-worker.js')).catch(()=>null);
    let deferred=null;
    window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferred=e; const box=document.getElementById('pwaInstallBox'); if(box) box.style.display='block'; });
    document.addEventListener('click', async e=>{ if(e.target && e.target.id==='pwaInstallBtn' && deferred){ deferred.prompt(); await deferred.userChoice.catch(()=>null); deferred=null; const box=document.getElementById('pwaInstallBox'); if(box) box.remove(); }});
  }
  async function addFocus(anchor, news){
    if(document.getElementById('todayFocus')) return;
    const items=(news||[]).filter(n=>n.image).slice(0,4);
    if(!items.length) return;
    const sec=document.createElement('section'); sec.id='todayFocus'; sec.className='today-focus';
    sec.innerHTML=`<div class="dash-head"><h2>DANAS U FOKUSU</h2></div><div class="focus-grid">${items.map(n=>`<a class="focus-card" href="${esc(newsLink(n))}"><img src="${esc(n.image)}" alt=""><div><p>${esc(n.category||'VIJESTI')} · ${esc(n.source||'')}</p><h3>${esc(n.title)}</h3></div></a>`).join('')}</div>`;
    anchor.insertAdjacentElement('afterend', sec);
  }
  async function addSourceDay(after, news){
    if(document.getElementById('sourceDay')) return;
    const groups={}; (news||[]).forEach(n=>{ const s=n.source||'Izvor'; if(!groups[s]) groups[s]=[]; if(groups[s].length<3) groups[s].push(n); });
    const best=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length)[0];
    if(!best) return;
    const sec=document.createElement('section'); sec.id='sourceDay'; sec.className='source-day';
    sec.innerHTML=`<p class="eyebrow">IZVOR DANA</p><h2>${esc(best[0])}</h2><div class="source-list">${best[1].map(n=>`<a href="${esc(newsLink(n))}">${esc(n.title)}</a>`).join('')}</div>`;
    after.insertAdjacentElement('afterend', sec);
  }
  function addSaveButtons(){
    document.querySelectorAll('.news-card,.post-card,.video-card,.edition-card').forEach(card=>{
      if(card.querySelector('.save-btn')) return;
      const title=card.querySelector('h3')?.innerText || card.querySelector('strong')?.innerText || document.title;
      const link=card.querySelector('a[href]')?.href || location.href;
      const btn=document.createElement('button'); btn.className='save-btn'; btn.textContent='SPREMI';
      btn.onclick=()=>{ const arr=JSON.parse(localStorage.getItem('wv_saved')||'[]'); if(!arr.some(x=>x.link===link)) arr.unshift({title,link,at:new Date().toISOString()}); localStorage.setItem('wv_saved',JSON.stringify(arr.slice(0,100))); btn.textContent='SPREMLJENO'; };
      (card.querySelector('.card-body')||card).appendChild(btn);
    });
  }
  async function renderHomeDashboard(){
    injectCss(); setupPWA();
    const anchor = document.querySelector('.quick-home-grid') || document.querySelector('.hero');
    if(!anchor || document.getElementById('categoryDashboardInjected')) return;
    const [cat, news, gen, stats] = await Promise.all([getJson('data/category_counts.json', null), getJson('data/news.json', []), getJson('data/generated_at.json', {}), getJson('data/source_stats.json', {})]);
    const counts = (cat && cat.counts) ? cat.counts : countFromNews(news);
    const updated = (cat && cat.updated_at) || gen.generated_at || stats.updated_at;
    const install=document.createElement('section'); install.id='pwaInstallBox'; install.className='pwa-install'; install.innerHTML='<h2>Dodaj WEB VIJESTI na početni zaslon</h2><button id="pwaInstallBtn">DODAJ</button>';
    document.querySelector('.hero')?.insertAdjacentElement('afterend', install);
    const wrap=document.createElement('div'); wrap.id='categoryDashboardInjected'; wrap.innerHTML=makeCategoryDashboard(counts, updated);
    anchor.insertAdjacentElement('afterend', wrap);
    await addFocus(document.querySelector('.hero')||anchor, news);
    const focus=document.getElementById('todayFocus') || anchor; await addSourceDay(focus, news);
    const gallerySpan=[...document.querySelectorAll('.quick-home-grid span')].find(s=>s.textContent.includes('fotografija'));
    if(gallerySpan) gallerySpan.textContent='500 fotografija';
    const statTime=document.getElementById('stat-time'); if(statTime && updated) statTime.textContent=fmt(updated);
    const statSources=document.getElementById('stat-sources'); if(statSources && stats.sources) statSources.textContent=`${stats.ok_sources||'-'} / ${stats.sources}`;
    setTimeout(addSaveButtons, 1000);
  }
  async function renderSourcesPage(){ injectCss(); const box=document.getElementById('sourcesDashboard'); if(!box) return; const stats=await getJson('data/source_stats.json', {}); box.innerHTML=makeSourceDashboard(stats); }
  document.addEventListener('DOMContentLoaded', ()=>{ renderHomeDashboard(); renderSourcesPage(); });
})();