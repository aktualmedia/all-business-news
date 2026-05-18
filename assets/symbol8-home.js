(() => {
  const repo = '/all-business-news/';
  function basePath(){ const p = location.pathname; const i = p.indexOf(repo); return i >= 0 ? p.slice(0, i + repo.length) : '/'; }
  function siteLink(path){ if(/^https?:/.test(String(path || ''))) return path; return basePath() + String(path || '').replace(/^\/+/, ''); }
  async function getJson(path){ try { const r = await fetch(siteLink(path), {cache:'default'}); return r.ok ? await r.json() : []; } catch(e){ return []; } }
  function setText(el, value){ el.textContent = value || ''; }
  async function run(){
    const box = document.getElementById('symbolRandomBox');
    if(!box) return;
    const editions = await getJson('data/editions.json');
    const item = (Array.isArray(editions) ? editions : []).find(e => e && e.id === 'symbol-8');
    if(!item) return;
    const link = document.createElement('a');
    link.className = 'symbol-random-card';
    link.href = siteLink(item.url || 'symbol/index.html');
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = siteLink(item.cover || '');
    img.alt = item.title || 'Symbol #8';
    const info = document.createElement('div');
    const label = document.createElement('span');
    const title = document.createElement('strong');
    const small = document.createElement('small');
    setText(label, 'SYMBOL IZDANJE');
    setText(title, item.title || 'Symbol #8');
    setText(small, (item.date || '') + ' · ' + (item.pages || '') + ' str.');
    info.append(label, title, small);
    link.append(img, info);
    box.replaceChildren(link);
    box.hidden = false;
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(run, 300));
})();