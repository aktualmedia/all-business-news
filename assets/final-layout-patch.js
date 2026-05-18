(() => {
  const repo = '/all-business-news/';
  const esc = s => String(s || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const base = () => { const p = location.pathname; const i = p.indexOf(repo); return i >= 0 ? p.slice(0, i + repo.length) : '/'; };
  const link = p => !p ? '#' : (/^https?:|^mailto:|^viber:|^tel:/.test(p) ? p : base() + String(p).replace(/^\/+/, ''));
  async function getJson(path, fallback){ try{ const r = await fetch(link(path) + '?v=' + Date.now(), {cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }

  function styles(){
    if (document.getElementById('wv-final-layout-patch-style')) return;
    const s = document.createElement('style');
    s.id = 'wv-final-layout-patch-style';
    s.textContent = `
      .floating-home{position:fixed;left:16px;bottom:76px;z-index:99990;display:inline-flex;align-items:center;justify-content:center;background:#fff;color:#111!important;border:1px solid var(--gold,#c8a44d);border-radius:999px;padding:11px 15px;text-decoration:none;font-weight:1000;box-shadow:0 14px 34px rgba(17,17,17,.16);letter-spacing:.03em}.floating-home:hover{color:#9b7a24!important;border-color:#c8a44d}
      .top-content-row{align-items:stretch}.top-random-gallery,.latest-rotator-panel{min-height:292px;display:flex;flex-direction:column}.random-gallery-grid{flex:1}.latest-rotator-panel #latestRotatorBox{flex:1;display:flex;flex-direction:column}.latest-rotator-card{display:block!important;height:100%;min-height:238px}.latest-rotator-card img{width:100%!important;height:172px!important;object-fit:cover!important;border-radius:16px!important;margin-bottom:10px}.latest-rotator-card h3{font-size:1.05rem!important;line-height:1.18!important}.latest-rotator-card p{font-size:.84rem!important}.latest-rotator-dots{margin-top:auto!important;padding-top:10px}.home-gallery-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}.home-gallery-card{min-height:200px!important}
      .symbol-gallery-quick{border-color:#c8a44d!important;background:#fffaf0!important}.symbol-home-showcase{display:grid;grid-template-columns:1fr 1fr;gap:16px}.symbol-home-card{background:#fff;border:1px solid var(--line,#ded7c8);border-radius:24px;overflow:hidden;box-shadow:0 14px 34px rgba(17,17,17,.06)}.symbol-home-cover{display:flex;min-height:280px;align-items:flex-end;padding:18px;color:#fff;text-decoration:none;background:#111;background-size:cover;background-position:center;position:relative}.symbol-home-cover:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,17,17,.05),rgba(17,17,17,.82))}.symbol-home-cover span,.symbol-home-cover strong,.symbol-home-cover small{position:relative;z-index:1;display:block}.symbol-home-cover span{font-size:.72rem;font-weight:1000;color:#f7e7b0;letter-spacing:.12em;text-transform:uppercase}.symbol-home-cover strong{font-size:1.75rem;line-height:1;margin-top:6px}.symbol-home-body{padding:16px}.symbol-home-body p{color:#6b7280}.symbol-mini-strip{grid-column:1/-1;display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.symbol-mini-strip a{position:relative;min-height:120px;border-radius:16px;background:#111;background-size:cover;background-position:center;overflow:hidden;text-decoration:none;color:#fff}.symbol-mini-strip span{position:absolute;left:0;right:0;bottom:0;padding:22px 8px 8px;background:linear-gradient(transparent,rgba(0,0,0,.78));font-size:.7rem;font-weight:1000}.symbol-spotlight{background:linear-gradient(180deg,#fff 0%,#fbfaf6 100%)!important;border:1px solid #ddd4c3!important;border-radius:22px!important;padding:16px!important;box-shadow:0 12px 28px rgba(17,17,17,.06)!important}.symbol-spotlight-badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#111;color:#fff;font-size:.72rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}.symbol-spotlight-title{font-size:1.02rem;font-weight:1000;line-height:1.2;color:#111;margin:0 0 6px}.symbol-spotlight-desc{font-size:.85rem;line-height:1.42;color:#333;margin-bottom:10px}.symbol-spotlight-cta{display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:999px;background:#c8a44d;color:#111!important;text-decoration:none;font-weight:1000;font-size:.76rem;letter-spacing:.04em}
      .wv-weather-card{border-radius:20px!important;padding:16px!important}.wv-weather-temp{font-size:2rem!important}.wv-weather-meta span{border-radius:12px!important;padding:8px 6px!important}.read-counter-card,.side-stat.read-counter-card{background:#fff!important;color:#111!important;border:1px solid var(--line,#ded7c8)!important}.read-counter-card *{color:#111!important}.read-counter-card span{color:#6b7280!important}.read-counter-card strong,#wvReadCounter{font-size:1.2rem!important;font-weight:1000!important;color:#111!important}
      .event-card,.event-card *{min-width:0;max-width:100%}.event-card h3{overflow-wrap:anywhere;word-break:normal;hyphens:auto;line-height:1.18}.event-card .meta,.event-card p{overflow-wrap:anywhere;white-space:normal}.events-intro-panel{background:#fff;border:1px solid var(--line,#ded7c8);border-radius:22px;padding:18px;margin:14px 0;box-shadow:0 14px 34px rgba(17,17,17,.055)}.events-intro-panel p{margin:.25rem 0;color:#4b5563}.events-intro-panel strong{color:#111}
      @media(max-width:980px){.latest-rotator-card img{height:220px!important}.home-gallery-grid{grid-template-columns:repeat(2,1fr)!important}.top-random-gallery,.latest-rotator-panel{min-height:auto}.symbol-home-showcase{grid-template-columns:1fr}.symbol-mini-strip{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:620px){.floating-home{left:10px;bottom:68px;padding:10px 12px;font-size:.76rem}.latest-rotator-card img{height:190px!important}.home-gallery-grid{grid-template-columns:1fr!important}.home-gallery-card{min-height:220px!important}.symbol-mini-strip{grid-template-columns:repeat(2,1fr)}.symbol-home-cover{min-height:230px}}
    `;
    document.head.appendChild(s);
  }

  function floatingHome(){
    if (document.querySelector('.floating-home')) return;
    const a = document.createElement('a');
    a.className = 'floating-home';
    a.href = link('index.html');
    a.textContent = 'HOME';
    document.body.appendChild(a);
  }

  function symbolButtons(){
    const nav = document.querySelector('.top-nav');
    if (nav && !nav.querySelector('[data-symbol-gallery]')) {
      const a = document.createElement('a');
      a.href = link('symbol-galerija/index.html');
      a.textContent = 'SYMBOL GALERIJA';
      a.dataset.symbolGallery = '1';
      const sym = [...nav.querySelectorAll('a')].find(x => x.textContent.trim().toUpperCase() === 'SYMBOL');
      if (sym) sym.insertAdjacentElement('afterend', a); else nav.appendChild(a);
    }
    const quick = document.querySelector('.quick-home-grid');
    if (quick && !quick.querySelector('[data-symbol-gallery]')) {
      const a = document.createElement('a');
      a.href = link('symbol-galerija/index.html');
      a.className = 'symbol-gallery-quick';
      a.dataset.symbolGallery = '1';
      a.innerHTML = 'SYMBOL GALERIJA<span>arhiva izdanja</span>';
      quick.appendChild(a);
    }
  }

  function onlyThreePosts(){
    const box = document.getElementById('postsGrid');
    if (!box) return;
    [...box.children].forEach((el, i) => { if (i > 2) el.remove(); });
  }

  async function enhanceSymbolSection(){
    const box = document.getElementById('editionsGrid');
    if (!box) return;
    const editions = (await getJson('data/editions.json', [])).filter(e => e && e.category === 'symbol');
    if (!editions.length) return;
    const start = Math.floor(Date.now() / (15*60*1000)) % editions.length;
    const pick = i => editions[(start + i) % editions.length];
    const card = item => `<article class="symbol-home-card"><a class="symbol-home-cover" style="background-image:linear-gradient(180deg,rgba(15,23,42,.05),rgba(15,23,42,.78)),url('${link(item.cover||'')}')" href="${link(item.url||item.pdf||'symbol/index.html')}"><div><span>SYMBOL IZDANJE</span><strong>${esc(item.title||'SYMBOL')}</strong><small>${esc(item.date||'')} · ${esc(item.pages||'')} str.</small></div></a><div class="symbol-home-body"><p>${esc(item.description||'Digitalno izdanje časopisa SYMBOL.')}</p><a class="button small" href="${link(item.url||item.pdf||'symbol/index.html')}">OTVORI IZDANJE</a></div></article>`;
    const mini = editions.slice(0,6).map((x,i)=>pick(i+2)).map(item=>`<a style="background-image:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.72)),url('${link(item.cover||'')}')" href="${link(item.url||item.pdf||'symbol/index.html')}"><span>${esc(item.title||'SYMBOL')}</span></a>`).join('');
    box.innerHTML = `<div class="symbol-home-showcase">${card(pick(0))}${card(pick(1))}<div class="symbol-mini-strip">${mini}</div></div>`;
  }

  function eventsFix(){
    if (document.body.dataset.page !== 'calendar') return;
    const hero = document.querySelector('.hero.compact');
    if (hero && !document.querySelector('.events-intro-panel')) {
      hero.insertAdjacentHTML('afterend', '<section class="events-intro-panel"><p><strong>Kalendar događanja</strong> prikazuje kazališta, muzeje, galerije, premijere, opere, balete i izložbe. Filteri omogućuju pregled po državi, gradu, vrsti događanja i instituciji.</p></section>');
    }
  }

  function boot(){
    styles();
    floatingHome();
    symbolButtons();
    eventsFix();
    enhanceSymbolSection();
    setTimeout(onlyThreePosts, 800);
    setTimeout(onlyThreePosts, 1800);
    setInterval(onlyThreePosts, 5000);
    setTimeout(symbolButtons, 1200);
    setTimeout(enhanceSymbolSection, 1400);
    setInterval(enhanceSymbolSection, 15*60*1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();