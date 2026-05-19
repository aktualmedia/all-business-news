(() => {
  const repo = '/all-business-news/';
  const esc = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function basePath(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : '/'; }
  function siteLink(path){ if(/^https?:/.test(path)) return path; return basePath()+String(path).replace(/^\/+/, ''); }
  async function getJson(path){ try{ const r=await fetch(siteLink(path)+'?v='+Date.now(),{cache:'no-store'}); return r.ok ? await r.json() : []; }catch(e){ return []; } }
  function dailyIndex(max){
    const d = new Date().toISOString().slice(0,10);
    let h = 0;
    for(const ch of d){ h = ((h << 5) - h + ch.charCodeAt(0)) | 0; }
    return Math.abs(h) % Math.max(1,max);
  }

  function injectSymbolHomeStyle(){
    if(document.getElementById('symbolHomeShowcaseStyle')) return;
    const st=document.createElement('style');
    st.id='symbolHomeShowcaseStyle';
    st.textContent = `
      #editionsGrid.symbol-home-showcase{display:grid!important;grid-template-columns:minmax(320px,.95fr) minmax(0,1.85fr);gap:26px;align-items:stretch}
      .symbol-feature-main{background:#fff;border:1px solid var(--line,#ded7c8);overflow:hidden;display:flex;flex-direction:column;min-width:0}
      .symbol-feature-cover{position:relative;display:block;min-height:315px;background:#111 center/cover no-repeat;text-decoration:none;color:#fff}
      .symbol-feature-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.82))}
      .symbol-feature-cover span,.symbol-feature-cover strong,.symbol-feature-cover small{position:absolute;z-index:1;left:20px;color:#fff}.symbol-feature-cover span{bottom:94px;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase}.symbol-feature-cover strong{bottom:48px;font-size:clamp(2rem,4vw,3rem);line-height:1}.symbol-feature-cover small{bottom:22px;font-weight:800}.symbol-feature-body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:9px;flex:1}.symbol-feature-body h3{font-family:Georgia,'Times New Roman',serif;margin:0;font-size:1.25rem}.symbol-feature-body p{margin:0;color:#6b7280;line-height:1.45}.symbol-feature-body .button{align-self:flex-start;margin-top:auto}
      .symbol-home-archive{min-width:0;display:flex;flex-direction:column}.symbol-archive-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin:0 0 14px}.symbol-archive-head h3{font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:1.45rem;margin:2px 0 0;line-height:1.1}.symbol-slider-controls{display:flex;gap:8px;align-items:center}.symbol-slider-controls button{width:34px;height:34px;border-radius:999px;border:1px solid var(--line,#ded7c8);background:#fff;color:#111;font-size:1.4rem;line-height:1;cursor:pointer;box-shadow:0 8px 18px rgba(17,17,17,.05)}.symbol-slider-controls button:hover{border-color:#c8a44d;background:#fffaf0}.symbol-mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;flex:1}.symbol-mini-card{background:#fff;border:1px solid var(--line,#ded7c8);overflow:hidden;box-shadow:0 10px 24px rgba(17,17,17,.04);display:flex;flex-direction:column;min-width:0}.symbol-mini-cover{display:block;background:#111;aspect-ratio:16/10;overflow:hidden}.symbol-mini-cover img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease}.symbol-mini-card:hover .symbol-mini-cover img{transform:scale(1.035)}.symbol-mini-body{padding:18px 20px 19px;display:flex;flex-direction:column;gap:9px;flex:1}.symbol-mini-body h3{font-family:Georgia,'Times New Roman',serif;font-weight:600;font-size:1.2rem;margin:0;line-height:1.18}.symbol-mini-body p:not(.meta){margin:0;color:#6b7280;line-height:1.45;min-height:3.9em}.symbol-mini-body .button{align-self:flex-start;margin-top:auto}.symbol-archive-strip{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;border:1px solid var(--line,#ded7c8);background:#fffaf0;padding:12px 14px;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.04em;color:#6b7280}.symbol-archive-strip a{color:#111;text-decoration:none;border-bottom:1px solid #111;white-space:nowrap}
      @media(max-width:980px){#editionsGrid.symbol-home-showcase{grid-template-columns:1fr}.symbol-feature-cover{min-height:280px}.symbol-mini-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.symbol-mini-grid{grid-template-columns:1fr}.symbol-archive-strip{display:block}.symbol-archive-strip a{display:inline-flex;margin-top:8px}.symbol-slider-controls button{width:38px;height:38px}}
    `;
    document.head.appendChild(st);
  }

  async function initRandomBox(){
    const box = document.getElementById('symbolRandomBox');
    if(!box) return;
    const editions = (await getJson('data/editions.json')).filter(e => e.category === 'symbol');
    if(!editions.length){ box.hidden = true; return; }
    const item = editions[dailyIndex(editions.length)];
    box.hidden = false;
    box.innerHTML = `<a class="symbol-random-card" href="${esc(siteLink(item.url || 'symbol/index.html'))}"><img loading="lazy" decoding="async" src="${esc(siteLink(item.cover || ''))}" alt="${esc(item.title)}"><div><span>SYMBOL IZDANJE</span><strong>${esc(item.title)}</strong><small>${esc(item.date || '')} · ${esc(item.pages || '')} str.</small></div></a>`;
  }

  async function enhanceHomeSymbol(){
    const box=document.getElementById('editionsGrid');
    if(!box || box.dataset.symbolEnhanced==='1') return;
    let editions=(await getJson('data/editions.json')).filter(e=>e && e.category==='symbol');
    if(!editions.length) return;
    injectSymbolHomeStyle();
    box.dataset.symbolEnhanced='1';
    box.classList.add('symbol-home-showcase');
    const main=editions[0];
    const archive=editions.slice(1);
    const issueUrl=e=>siteLink(e.url || ('symbol/reader.html?id='+encodeURIComponent(e.id||'')));
    const coverUrl=e=>siteLink(e.cover || '');
    const pages=e=>e.pages ? `${esc(e.pages)} STRANICA` : 'DIGITALNO IZDANJE';
    const teaser=(e,i)=>esc(e.description || (i===0?'Kultura, umjetnost i poduzetništvo u uredničkom magazinskom formatu.':'Arhivsko izdanje časopisa Symbol dostupno za listanje.'));
    box.innerHTML=`
      <article class="symbol-feature-main">
        <a class="symbol-feature-cover" style="background-image:url('${esc(coverUrl(main))}')" href="${esc(issueUrl(main))}"><span>SYMBOL</span><strong>${esc(main.title||'Symbol')}</strong><small>${esc(main.date||'')}</small></a>
        <div class="symbol-feature-body"><p class="meta">${pages(main)}</p><h3>${esc(main.title||'Symbol')}</h3><p>${teaser(main,0)}</p><a class="button small" href="${esc(issueUrl(main))}">OTVORI</a></div>
      </article>
      <aside class="symbol-home-archive" aria-label="Ostala Symbol izdanja">
        <div class="symbol-archive-head"><div><p class="meta">OSTALA IZDANJA</p><h3>Arhiva izdanja</h3></div><div class="symbol-slider-controls"><button type="button" aria-label="Prethodna Symbol izdanja" data-symbol-prev>‹</button><button type="button" aria-label="Sljedeća Symbol izdanja" data-symbol-next>›</button></div></div>
        <div class="symbol-mini-grid" data-symbol-mini-grid></div>
        <div class="symbol-archive-strip"><span>${esc(editions.length)} dostupnih izdanja · PDF listanje kao knjiga</span><a href="${esc(siteLink('symbol/index.html'))}">SVA IZDANJA</a></div>
      </aside>`;
    const miniGrid=box.querySelector('[data-symbol-mini-grid]');
    const prev=box.querySelector('[data-symbol-prev]');
    const next=box.querySelector('[data-symbol-next]');
    let archiveIndex=0;
    function miniCard(e,i){return `<article class="symbol-mini-card"><a class="symbol-mini-cover" href="${esc(issueUrl(e))}"><img loading="lazy" decoding="async" src="${esc(coverUrl(e))}" alt="${esc(e.title||'Symbol')}"></a><div class="symbol-mini-body"><p class="meta">${pages(e)}</p><h3>${esc(e.title||'Symbol')}</h3><p>${teaser(e,i+1)}</p><a class="button small" href="${esc(issueUrl(e))}">OTVORI</a></div></article>`;}
    function renderMini(){ const list=archive.length ? archive : [main]; const shown=[0,1].map(i=>list[(archiveIndex+i)%list.length]).filter(Boolean); miniGrid.innerHTML=shown.map(miniCard).join(''); }
    function rotate(dir){ const list=archive.length ? archive : [main]; archiveIndex=(archiveIndex+dir+list.length)%list.length; renderMini(); }
    if(prev) prev.addEventListener('click',()=>rotate(-1));
    if(next) next.addEventListener('click',()=>rotate(1));
    renderMini();
    if(archive.length>2) setInterval(()=>rotate(1),12000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initRandomBox();
    setTimeout(enhanceHomeSymbol, 700);
    setTimeout(enhanceHomeSymbol, 1700);
  });
})();