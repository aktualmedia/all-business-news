(() => {
  const repo = '/all-business-news/';
  const esc = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function basePath(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : '/'; }
  function siteLink(path){ if(/^https?:/.test(path)) return path; return basePath()+String(path).replace(/^\/+/, ''); }
  async function getJson(path){ try{ const r=await fetch(siteLink(path),{cache:'default'}); return r.ok ? await r.json() : []; }catch(e){ return []; } }
  function dailyIndex(max){
    const d = new Date().toISOString().slice(0,10);
    let h = 0;
    for(const ch of d){ h = ((h << 5) - h + ch.charCodeAt(0)) | 0; }
    return Math.abs(h) % Math.max(1,max);
  }
  async function init(){
    const box = document.getElementById('symbolRandomBox');
    if(!box) return;
    const editions = (await getJson('data/editions.json')).filter(e => e.category === 'symbol');
    if(!editions.length){ box.hidden = true; return; }
    const item = editions[dailyIndex(editions.length)];
    box.hidden = false;
    box.innerHTML = `<a class="symbol-random-card" href="${esc(siteLink(item.url || 'symbol/index.html'))}"><img loading="lazy" decoding="async" src="${esc(siteLink(item.cover || ''))}" alt="${esc(item.title)}"><div><span>SYMBOL IZDANJE</span><strong>${esc(item.title)}</strong><small>${esc(item.date || '')} · ${esc(item.pages || '')} str.</small></div></a>`;
  }
  document.addEventListener('DOMContentLoaded', init);
})();
