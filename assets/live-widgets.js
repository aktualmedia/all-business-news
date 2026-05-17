(() => {
  const repo = '/all-business-news/';
  function base(){ const p = location.pathname; const i = p.indexOf(repo); return i >= 0 ? p.slice(0, i + repo.length) : '/'; }
  function site(path){ if(!path) return '#'; if(/^https?:|^mailto:|^viber:|^tel:/.test(path)) return path; return base() + String(path).replace(/^\/+/, ''); }
  async function getJson(path, fallback){ try{ const r = await fetch(site(path), {cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }
  const esc = s => String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function css(){
    if(document.getElementById('wvLiveWidgetsCss')) return;
    const s=document.createElement('style'); s.id='wvLiveWidgetsCss';
    s.textContent = `.wv-ticker{display:flex;align-items:center;gap:12px;background:#0f172a;color:#fff;border-radius:18px;padding:10px 12px;margin:10px max(12px,calc((100vw - 1180px)/2));box-shadow:0 12px 28px rgba(15,23,42,.18);overflow:hidden}.wv-ticker strong{flex:0 0 auto;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#93c5fd}.wv-ticker-track{display:flex;gap:28px;white-space:nowrap;animation:wvTicker 95s linear infinite}.wv-ticker:hover .wv-ticker-track{animation-play-state:paused}.wv-ticker a{color:#fff;text-decoration:none;font-weight:800}.wv-ticker span{color:#cbd5e1;margin-left:6px;font-size:.82rem}@keyframes wvTicker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.wv-gallery-rotator{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;align-items:stretch;background:#fff;border:1px solid var(--line,#dbe3ef);border-radius:24px;padding:18px;margin:18px 0;box-shadow:0 14px 38px rgba(15,23,42,.06)}.wv-gallery-main{position:relative;min-height:310px;border-radius:20px;overflow:hidden;background:#0f172a}.wv-gallery-main img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .35s}.wv-gallery-caption{position:absolute;left:0;right:0;bottom:0;padding:18px;color:#fff;background:linear-gradient(180deg,transparent,rgba(15,23,42,.86))}.wv-gallery-caption h3{margin:.2rem 0;font-size:1.3rem}.wv-gallery-caption p{margin:0;color:rgba(255,255,255,.86)}.wv-gallery-side{display:grid;gap:10px}.wv-gallery-side h2{margin:0;text-transform:uppercase;letter-spacing:.04em}.wv-gallery-side p{color:#64748b;margin:.2rem 0}.wv-gallery-thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.wv-gallery-thumbs button{border:0;padding:0;border-radius:12px;overflow:hidden;cursor:pointer;background:#e5e7eb}.wv-gallery-thumbs img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover}.wv-gallery-actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:800px){.wv-ticker{margin:8px 10px;border-radius:14px}.wv-ticker strong{font-size:.7rem}.wv-ticker-track{animation-duration:80s}.wv-gallery-rotator{grid-template-columns:1fr}.wv-gallery-main{min-height:250px}.wv-gallery-thumbs{grid-template-columns:repeat(5,1fr)}}`;
    document.head.appendChild(s);
  }
  function newsLink(n){ const local=String(n.local_url||n.local_path||''); if(local && !/^https?:/.test(local)) return site(local); const external=String(n.url||local||''); return site('citaj/index.html')+'?u='+encodeURIComponent(external)+'&t='+encodeURIComponent(n.title||'Vijest')+'&s='+encodeURIComponent(n.source||'')+'&c='+encodeURIComponent(n.category||'vijesti'); }
  async function ticker(){
    const header=document.querySelector('.site-header'); if(!header || document.getElementById('wvLatestTicker')) return;
    const news=(await getJson('data/news.json',[])).filter(n=>n && n.title).slice(0,10);
    if(!news.length) return;
    const items = news.map(n=>`<a href="${esc(newsLink(n))}">${esc(n.title)}<span>${esc(n.source||'')}</span></a>`).join('');
    const bar=document.createElement('div'); bar.id='wvLatestTicker'; bar.className='wv-ticker';
    bar.innerHTML=`<strong>ZADNJIH 10</strong><div class="wv-ticker-track">${items}${items}</div>`;
    header.insertAdjacentElement('afterend', bar);
  }
  async function galleryRotator(){
    const anchor=document.querySelector('.home-objave-panel') || document.querySelector('.quick-home-grid') || document.querySelector('.hero');
    if(!anchor || document.getElementById('wvGalleryRotator')) return;
    let gallery=await getJson('data/manual_gallery.json',[]);
    if(!Array.isArray(gallery) || !gallery.length) return;
    gallery = gallery.filter(g=>g.image).slice(0,80);
    if(!gallery.length) return;
    let idx=Math.floor(Math.random()*gallery.length);
    const box=document.createElement('section'); box.id='wvGalleryRotator'; box.className='wv-gallery-rotator';
    const thumbs = gallery.slice(0,10).map((g,i)=>`<button type="button" data-i="${i}" aria-label="Fotografija ${i+1}"><img src="${esc(site(g.image))}" alt=""></button>`).join('');
    box.innerHTML=`<div class="wv-gallery-main"><img id="wvGalleryMainImg" src="" alt=""><div class="wv-gallery-caption"><h3 id="wvGalleryTitle"></h3><p id="wvGalleryDesc"></p></div></div><div class="wv-gallery-side"><h2>GALERIJA U FOKUSU</h2><div class="wv-gallery-thumbs">${thumbs}</div><div class="wv-gallery-actions"><a class="button small" href="${site('galerija/index.html')}">OTVORI GALERIJU</a><button class="button small" type="button" id="wvNextGallery">SLJEDEĆA SLIKA</button></div></div>`;
    anchor.insertAdjacentElement('afterend', box);
    const img=box.querySelector('#wvGalleryMainImg'), title=box.querySelector('#wvGalleryTitle'), desc=box.querySelector('#wvGalleryDesc');
    function show(i){ idx=(i+gallery.length)%gallery.length; const g=gallery[idx]; img.style.opacity='0'; setTimeout(()=>{ img.src=site(g.image); title.textContent=g.title||'Galerija'; desc.textContent=g.description||g.category||''; img.style.opacity='1'; },150); }
    box.querySelector('#wvNextGallery').addEventListener('click',()=>show(idx+1));
    box.querySelectorAll('[data-i]').forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.i))));
    show(idx);
    setInterval(()=>show(idx+1), 7000);
  }
  document.addEventListener('DOMContentLoaded',()=>{ css(); ticker(); galleryRotator(); });
})();