(() => {
  const repo = '/all-business-news/';
  const CATS = [
    ['poslovanje','POSLOVANJE'],['ekonomija','EKONOMIJA'],['financije','FINANCIJE'],['trzista','TRŽIŠTA'],['kultura','KULTURA'],['dizajn','DIZAJN'],['tehnologija','TEHNOLOGIJA'],['znanost','ZNANOST'],['lifestyle','LIFESTYLE'],['hedonizam','HEDONIZAM'],['satovi','SATOVI'],['nakit','NAKIT'],['pica','PIĆA']
  ];
  function base(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : '/'; }
  function url(p){ return base()+String(p).replace(/^\/+/, ''); }
  async function getJson(p, fallback){ try{ const r=await fetch(url(p), {cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }
  function fmt(d){ if(!d) return 'nije dostupno'; try{ return new Date(d).toLocaleString('hr-HR'); }catch(e){ return d; } }
  function countFromNews(news){ const c={}; (news||[]).forEach(n=>{ const k=n.category||'vijesti'; c[k]=(c[k]||0)+1; }); return c; }
  function makeCategoryDashboard(counts, updated){
    const html = `<section class="category-dashboard"><div class="dash-head"><h2>VIJESTI PO KATEGORIJAMA</h2><p>Zadnje ažuriranje: <strong>${fmt(updated)}</strong></p></div><div class="category-count-grid">${CATS.map(([slug,label])=>`<a href="${url(slug+'/index.html')}"><strong>${label}</strong><span>${counts[slug]||0} VIJESTI</span></a>`).join('')}</div></section>`;
    return html;
  }
  function makeSourceDashboard(stats){
    const rows = stats.feed_results || [];
    const top = rows.slice(0, 30);
    return `<section class="source-dashboard"><div class="dash-head"><h2>IZVORI I POVUČENE OBJAVE</h2><p>Izvora: <strong>${stats.sources||0}</strong> · OK: <strong>${stats.ok_sources||0}</strong> · Greške: <strong>${stats.failed_sources||0}</strong> · Zadnje: <strong>${fmt(stats.updated_at)}</strong></p></div><div class="source-table"><table><thead><tr><th>Izvor</th><th>Kategorija</th><th>Status</th><th>Povučeno</th></tr></thead><tbody>${top.map(r=>`<tr><td>${r.name||'-'}</td><td>${r.category||'-'}</td><td>${r.status||'-'}</td><td>${r.count||0}</td></tr>`).join('')}</tbody></table></div></section>`;
  }
  async function renderHomeDashboard(){
    const anchor = document.querySelector('.quick-home-grid') || document.querySelector('.hero');
    if(!anchor || document.getElementById('categoryDashboardInjected')) return;
    const [cat, news, gen, stats] = await Promise.all([getJson('data/category_counts.json', null), getJson('data/news.json', []), getJson('data/generated_at.json', {}), getJson('data/source_stats.json', {})]);
    const counts = (cat && cat.counts) ? cat.counts : countFromNews(news);
    const updated = (cat && cat.updated_at) || gen.generated_at || stats.updated_at;
    const wrap=document.createElement('div'); wrap.id='categoryDashboardInjected'; wrap.innerHTML=makeCategoryDashboard(counts, updated);
    anchor.insertAdjacentElement('afterend', wrap);
    const gallerySpan=[...document.querySelectorAll('.quick-home-grid span')].find(s=>s.textContent.includes('fotografija'));
    if(gallerySpan) gallerySpan.textContent='500 fotografija';
    const statTime=document.getElementById('stat-time'); if(statTime && updated) statTime.textContent=fmt(updated);
  }
  async function renderSourcesPage(){
    const box=document.getElementById('sourcesDashboard'); if(!box) return;
    const stats=await getJson('data/source_stats.json', {});
    box.innerHTML=makeSourceDashboard(stats);
  }
  document.addEventListener('DOMContentLoaded', ()=>{ renderHomeDashboard(); renderSourcesPage(); });
})();
