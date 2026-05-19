(() => {
  const repo = '/all-business-news/';
  const cats = {
    poslovanje:'POSLOVANJE', ekonomija:'EKONOMIJA', financije:'FINANCIJE', trzista:'TRŽIŠTA',
    kultura:'KULTURA', muzeji:'MUZEJI', dizajn:'DIZAJN', tehnologija:'TEHNOLOGIJA', znanost:'ZNANOST',
    lifestyle:'LIFESTYLE', hedonizam:'HEDONIZAM', vina:'VINA', pica:'PIĆA', hrana:'HRANA',
    satovi:'SATOVI', nakit:'NAKIT'
  };
  const order = ['', 'hedonizam', 'kultura', 'muzeji', 'vina', 'hrana', 'pica', 'dizajn', 'lifestyle', 'satovi', 'nakit', 'poslovanje', 'ekonomija', 'financije', 'tehnologija', 'znanost'];
  const esc = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function basePath(){ const p = location.pathname; const i = p.indexOf(repo); return i >= 0 ? p.slice(0, i + repo.length) : '/'; }
  function siteLink(path){ if(!path) return '#'; if(/^https?:|^mailto:|^viber:|^tel:/.test(path)) return path; return basePath() + String(path).replace(/^\/+/, ''); }
  async function getJson(path, fallback){ try{ const r = await fetch(siteLink(path) + '?v=' + Date.now(), {cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }
  function thumb(v){ return v.thumbnail || (v.video_id ? 'https://i.ytimg.com/vi/' + encodeURIComponent(v.video_id) + '/hqdefault.jpg' : ''); }
  function searchUrl(q){ return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q); }
  function fallbackVideos(){
    return [
      {category:'hedonizam', title:'Hedonizam, luksuzni životni stil i premium putovanja', source:'YouTube Search', url:searchUrl('hedonism luxury lifestyle travel documentary'), thumbnail:'https://picsum.photos/seed/wv-video-hedonizam/1200/675', description:'Odabrani YouTube pregled za hedonizam, luksuz, putovanja, hotele, restorane i lifestyle.'},
      {category:'kultura', title:'Kultura, umjetnost i suvremena scena', source:'YouTube Search', url:searchUrl('culture art contemporary scene museum exhibition'), thumbnail:'https://picsum.photos/seed/wv-video-kultura/1200/675', description:'Video pregled kulturnih tema, umjetnosti, kazališta, festivala i suvremene scene.'},
      {category:'muzeji', title:'Muzeji, izložbe i svjetske galerije', source:'YouTube Search', url:searchUrl('museum exhibition gallery art tour'), thumbnail:'https://picsum.photos/seed/wv-video-muzeji/1200/675', description:'Pregled muzejskih izložbi, galerija, kustoskih priča i kulturnih institucija.'},
      {category:'vina', title:'Vina, vinarije i sommelier kultura', source:'YouTube Search', url:searchUrl('wine sommelier vineyard winery documentary'), thumbnail:'https://picsum.photos/seed/wv-video-vina/1200/675', description:'Video pregled vina, vinarija, sommelier kulture i enogastronomije.'},
      {category:'hrana', title:'Hrana, restorani i gastronomija', source:'YouTube Search', url:searchUrl('fine dining restaurants gastronomy food culture'), thumbnail:'https://picsum.photos/seed/wv-video-hrana/1200/675', description:'Gastronomija, restorani, chefovi, kuhinje svijeta i premium food priče.'},
      {category:'pica', title:'Pića, kokteli i premium bar kultura', source:'YouTube Search', url:searchUrl('cocktails spirits bar culture premium drinks'), thumbnail:'https://picsum.photos/seed/wv-video-pica/1200/675', description:'Pića, kokteli, premium bar scena i kultura posluživanja.'},
      {category:'satovi', title:'Satovi, kolekcionarstvo i luksuzni dizajn', source:'YouTube Search', url:searchUrl('luxury watches horology collectors design'), thumbnail:'https://picsum.photos/seed/wv-video-satovi/1200/675', description:'Horologija, luksuzni satovi, kolekcionarstvo i dizajnerski detalji.'},
      {category:'nakit', title:'Nakit, dragulji i visoka izrada', source:'YouTube Search', url:searchUrl('high jewelry gemstones luxury craftsmanship'), thumbnail:'https://picsum.photos/seed/wv-video-nakit/1200/675', description:'Nakit, dragulji, haute joaillerie i majstorstvo izrade.'}
    ];
  }
  function injectStyles(){
    if(document.getElementById('homeVideoPreviewStyle')) return;
    const style = document.createElement('style');
    style.id = 'homeVideoPreviewStyle';
    style.textContent = `
      #videoPreview.home-video-preview-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-bottom:22px}
      .home-video-category-bar{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;margin:-2px 0 4px}.home-video-category-bar button{border:1px solid var(--line,#ded7c8);background:#fff;border-radius:999px;padding:8px 11px;font-size:.68rem;font-weight:1000;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;color:#111}.home-video-category-bar button.active,.home-video-category-bar button:hover{background:#111;color:#fff;border-color:#111}
      .home-video-card{background:#fff;border:1px solid var(--line,#ded7c8);overflow:hidden;box-shadow:0 12px 30px rgba(17,17,17,.05);display:flex;flex-direction:column;min-width:0}
      .home-video-media{position:relative;display:block;width:100%;aspect-ratio:16/9;background:#111;border:0;padding:0;cursor:pointer;overflow:hidden}
      .home-video-media img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s ease,opacity .35s ease}.home-video-card:hover .home-video-media img{transform:scale(1.035);opacity:.88}
      .home-video-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:58px;height:58px;border-radius:999px;background:rgba(0,0,0,.82);border:1px solid rgba(255,255,255,.55);display:grid;place-items:center;color:#fff;font-size:1.15rem;box-shadow:0 12px 35px rgba(0,0,0,.28)}
      .home-video-source{position:absolute;left:12px;right:12px;bottom:10px;display:flex;justify-content:space-between;gap:8px;align-items:center;color:#fff;font-size:.64rem;font-weight:1000;text-transform:uppercase;letter-spacing:.06em;text-shadow:0 1px 6px rgba(0,0,0,.8)}
      .home-video-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:9px;flex:1}.home-video-body h3{font-family:Georgia,'Times New Roman',serif;font-size:1.08rem;line-height:1.18;margin:0}.home-video-body p{margin:0;color:#6b7280;font-size:.86rem;line-height:1.45}.home-video-body .button{align-self:flex-start;margin-top:auto}.home-video-frame{width:100%;aspect-ratio:16/9;border:0;display:block;background:#111}
      .home-video-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 14px;grid-column:1/-1}.home-video-head p{margin:0;color:#6b7280;font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.home-video-head a{color:#111;text-decoration:none;border:1px solid var(--line,#ded7c8);border-radius:999px;padding:8px 12px;font-size:.72rem;font-weight:1000;background:#fff}
      @media(max-width:980px){#videoPreview.home-video-preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){#videoPreview.home-video-preview-grid{grid-template-columns:1fr}.home-video-head{display:block}.home-video-head a{display:inline-flex;margin-top:8px}.home-video-category-bar{overflow:auto;flex-wrap:nowrap;padding-bottom:4px}.home-video-category-bar button{white-space:nowrap}}
    `;
    document.head.appendChild(style);
  }
  function currentCategory(){ const local = sessionStorage.getItem('wvHomeVideoCat') || ''; const sel=document.getElementById('categorySelect'); return local || (sel && sel.value) || window.WV_CATEGORY || document.body.dataset.category || ''; }
  function buildPool(videos){
    const real = Array.isArray(videos) ? videos.slice() : [];
    const fallbacks = fallbackVideos();
    const keys = new Set(real.map(v => String(v.category||'')+'|'+String(v.title||'')));
    fallbacks.forEach(v => { if(!keys.has(String(v.category)+'|'+String(v.title))) real.push(v); });
    return real;
  }
  function availableCats(pool){
    const present = new Set(pool.map(v => v.category).filter(Boolean));
    return order.filter(c => c === '' || present.has(c) || ['hedonizam','kultura','muzeji','vina','hrana','pica'].includes(c));
  }
  function render(videos){
    const box = document.getElementById('videoPreview');
    if(!box) return;
    injectStyles();
    box.classList.add('home-video-preview-grid');
    const pool = buildPool(videos);
    const cat = currentCategory();
    let arr = pool.slice();
    if(cat) arr = arr.filter(v => v.category === cat);
    if(!arr.length) arr = pool.filter(v => ['hedonizam','kultura','muzeji','vina','hrana','pica'].includes(v.category));
    arr = arr.slice(0, 6);
    const buttons = availableCats(pool).map(c => `<button type="button" data-video-cat="${esc(c)}" class="${c===cat?'active':''}">${esc(c ? (cats[c] || c) : 'SVE')}</button>`).join('');
    if(!arr.length){
      box.innerHTML = '<div class="home-video-head"><p>Video preview · najnoviji YouTube sadržaj po kategorijama</p><a href="'+esc(siteLink('video/index.html'))+'">OTVORI SVE VIDEO</a></div><div class="home-video-category-bar">'+buttons+'</div><div class="legal-box"><p>NEMA VIDEO PREVIEWA ZA ODABRANU KATEGORIJU.</p></div>';
      return;
    }
    box.innerHTML = '<div class="home-video-head"><p>Video preview · hedonizam, kultura, muzeji, vina, hrana i ostale kategorije</p><a href="'+esc(siteLink('video/index.html'))+'">OTVORI SVE VIDEO</a></div><div class="home-video-category-bar">'+buttons+'</div>' + arr.map(v => {
      const image = thumb(v);
      const category = cats[v.category] || v.category || 'VIDEO';
      const title = v.title || 'Video';
      const desc = String(v.description || 'Klikom na sliku pokreće se video preview bez napuštanja početne stranice.').slice(0, 160);
      return `<article class="home-video-card"><button class="home-video-media" type="button" data-video="${esc(v.video_id || '')}" data-url="${esc(v.url || '')}" aria-label="Pokreni video: ${esc(title)}"><img loading="lazy" decoding="async" src="${esc(image)}" alt="${esc(title)}"><span class="home-video-play">▶</span><span class="home-video-source"><em>${esc(category)}</em><strong>${esc(v.source || 'YouTube')}</strong></span></button><div class="home-video-body"><h3>${esc(title)}</h3><p>${esc(desc)}</p><a class="button small" href="${esc(v.url || siteLink('video/index.html'))}" target="_blank" rel="noopener">OTVORI NA YOUTUBEU</a></div></article>`;
    }).join('');
  }
  function bind(videos){
    const box=document.getElementById('videoPreview');
    if(!box || box.dataset.homeVideoBound === '1') return;
    box.dataset.homeVideoBound='1';
    box.addEventListener('click', ev => {
      const chip = ev.target.closest('[data-video-cat]');
      if(chip){ sessionStorage.setItem('wvHomeVideoCat', chip.dataset.videoCat || ''); render(videos); return; }
      const btn = ev.target.closest('.home-video-media');
      if(!btn) return;
      const id = btn.dataset.video;
      const url = btn.dataset.url;
      if(id){
        btn.outerHTML = `<iframe class="home-video-frame" loading="lazy" src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      } else if(url){
        window.open(url, '_blank', 'noopener');
      }
    });
    const select=document.getElementById('categorySelect');
    if(select && select.dataset.homeVideoFilterBound !== '1'){
      select.dataset.homeVideoFilterBound='1';
      select.addEventListener('change', () => { sessionStorage.setItem('wvHomeVideoCat', select.value || ''); render(videos); });
    }
    const chips=document.getElementById('quickCategories');
    if(chips && chips.dataset.homeVideoChipBound !== '1'){
      chips.dataset.homeVideoChipBound='1';
      chips.addEventListener('click', () => setTimeout(() => { const sel=document.getElementById('categorySelect'); sessionStorage.setItem('wvHomeVideoCat', (sel && sel.value) || ''); render(videos); }, 80));
    }
  }
  async function init(){
    const box = document.getElementById('videoPreview');
    if(!box) return;
    const videos = await getJson('data/videos.json', []);
    render(videos);
    bind(videos);
    setTimeout(() => render(videos), 900);
  }
  document.addEventListener('DOMContentLoaded', init);
})();