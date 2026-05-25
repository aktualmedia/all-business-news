(() => {
  const ROOT = '/all-business-news/';
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const path = p => ROOT + String(p || '').replace(/^\/+/, '');
  async function data(file) { try { const r = await fetch(path(file) + '?v=' + Date.now(), {cache:'no-store'}); return r.ok ? r.json() : []; } catch(e) { return []; } }
  function url(item, kind) {
    if (kind === 'OBJAVE') return path(item.url || 'objave/index.html');
    if (kind === 'SYMBOL') return path(item.url || 'symbol/index.html');
    if (kind === 'DOGAĐANJA') return item.url || path('dogadjanja/index.html');
    return path('citaj/index.html') + '?u=' + encodeURIComponent(item.url || '') + '&t=' + encodeURIComponent(item.title || '') + '&s=' + encodeURIComponent(item.source || '') + '&c=' + encodeURIComponent(item.category || 'vijesti');
  }
  let ready;
  async function corpus() {
    if (ready) return ready;
    ready = Promise.all([data('data/home_news.json'), data('data/ai_posts.json'), data('data/editions.json'), data('data/home_events.json')]).then(([news, posts, editions, events]) => {
      const all = [];
      (Array.isArray(news) ? news : []).forEach(x => all.push({kind:'VIJESTI', title:x.title, text:[x.title,x.description,x.source,x.category].join(' '), href:url(x,'VIJESTI')}));
      (Array.isArray(posts) ? posts : []).forEach(x => all.push({kind:'OBJAVE', title:x.title, text:[x.title,x.summary,x.body].join(' '), href:url(x,'OBJAVE')}));
      (Array.isArray(editions) ? editions : []).filter(x => x.category === 'symbol').forEach(x => all.push({kind:'SYMBOL', title:x.title, text:[x.title,x.description,x.date,'kultura umjetnost časopis'].join(' '), href:url(x,'SYMBOL')}));
      (Array.isArray(events) ? events : []).forEach(x => all.push({kind:'DOGAĐANJA', title:x.title || x.institution, text:[x.title,x.institution,x.city,x.country,x.type].join(' '), href:url(x,'DOGAĐANJA')}));
      return all;
    });
    return ready;
  }
  async function search(q) {
    const words = norm(q).split(/\s+/).filter(w => w.length > 1);
    const rows = await corpus();
    return rows.map(row => {
      const title = norm(row.title), text = norm(row.text);
      const score = words.reduce((n,w) => n + (title.includes(w) ? 4 : 0) + (text.includes(w) ? 2 : 0), 0);
      return Object.assign({score}, row);
    }).filter(row => row.score).sort((a,b) => b.score - a.score).slice(0,5);
  }
  function init() {
    if (document.getElementById('webAiToggle')) return;
    const toggle = document.createElement('button');
    toggle.id = 'webAiToggle'; toggle.className = 'wv-assistant-toggle'; toggle.type = 'button'; toggle.innerHTML = '<i>AI</i><span>WEB AI</span>'; toggle.setAttribute('aria-label','Otvori WEB AI vodič');
    const panel = document.createElement('aside');
    panel.className = 'wv-assistant-panel';
    panel.innerHTML = '<header class="wv-ai-head"><div><strong>WEB AI VODIČ</strong><span>Pretražite sadržaj portala</span></div><button class="wv-ai-close" type="button" aria-label="Zatvori">×</button></header><div class="wv-ai-messages"><div class="wv-ai-message bot">Upišite temu: financije, kultura, Symbol, tehnologija ili događanja.</div></div><div class="wv-ai-suggest"><button type="button">financije</button><button type="button">kultura</button><button type="button">Symbol</button><button type="button">tehnologija</button><button type="button">događanja</button></div><form class="wv-ai-form"><input type="search" placeholder="Pretražite portal..." aria-label="Pretražite sadržaj"><button type="submit">TRAŽI</button></form><div class="wv-ai-note">WEB AI vodič pretražuje javni sadržaj ovog portala.</div>';
    document.body.append(toggle, panel);
    const openPanel = () => { panel.classList.add('open'); panel.querySelector('input').focus(); };
    const messages = panel.querySelector('.wv-ai-messages'), input = panel.querySelector('input');
    toggle.onclick = () => { panel.classList.contains('open') ? panel.classList.remove('open') : openPanel(); };
    panel.querySelector('.wv-ai-close').onclick = () => panel.classList.remove('open');
    const mobileNav = document.querySelector('.mobile-bottom-nav');
    if (mobileNav && !mobileNav.querySelector('.wv-bottom-ai')) {
      const aiTab = document.createElement('button');
      aiTab.className = 'wv-bottom-ai'; aiTab.type = 'button'; aiTab.innerHTML = '<span>AI</span><b>AI</b>'; aiTab.setAttribute('aria-label','Otvori WEB AI vodič');
      aiTab.onclick = openPanel;
      mobileNav.appendChild(aiTab);
    }
    async function run(value) {
      if (!value.trim()) return;
      messages.insertAdjacentHTML('beforeend', '<div class="wv-ai-message user">' + esc(value) + '</div>');
      const found = await search(value);
      const html = found.length ? 'Pronašao sam povezane sadržaje:<div class="wv-ai-results">' + found.map(x => '<a href="' + esc(x.href) + '"><small>' + esc(x.kind) + '</small><strong>' + esc(x.title) + '</strong></a>').join('') + '</div>' : 'Nema rezultata za taj pojam. Pokušajte s drugom temom.';
      messages.insertAdjacentHTML('beforeend', '<div class="wv-ai-message bot">' + html + '</div>'); messages.scrollTop = messages.scrollHeight;
    }
    panel.querySelector('form').onsubmit = e => { e.preventDefault(); const q=input.value; input.value=''; run(q); };
    panel.querySelector('.wv-ai-suggest').onclick = e => { if (e.target.tagName === 'BUTTON') run(e.target.textContent); };
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
