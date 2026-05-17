(() => {
  const repo = '/all-business-news/';
  function base(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : '/'; }
  function site(path){ if(!path) return '#'; if(/^https?:|^mailto:|^viber:|^tel:/.test(path)) return path; return base()+String(path).replace(/^\/+/, ''); }
  async function getJson(path, fallback){ try{ const r=await fetch(site(path),{cache:'no-store'}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function css(){
    if(document.getElementById('portalFeaturesCss')) return;
    const s=document.createElement('style'); s.id='portalFeaturesCss';
    s.textContent = `.install-pwa{display:none;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(135deg,#1f3c88,#6d28d9);color:#fff;border-radius:18px;padding:13px 16px;margin:14px max(12px,calc((100vw - 1180px)/2));box-shadow:0 14px 34px rgba(15,23,42,.16)}.install-pwa strong{display:block;text-transform:uppercase}.install-pwa span{color:rgba(255,255,255,.86);font-size:.88rem}.install-pwa button{border:1px solid rgba(255,255,255,.35);background:#fff;color:#1f3c88;border-radius:999px;padding:9px 12px;font-weight:900;cursor:pointer}.focus-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.focus-card{background:#fff;border:1px solid var(--line,#dbe3ef);border-radius:20px;overflow:hidden;box-shadow:0 12px 28px rgba(15,23,42,.05);text-decoration:none;color:#0f172a}.focus-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.focus-card div{padding:13px}.focus-card p{margin:0 0 5px;color:#64748b;font-size:.72rem;font-weight:900;text-transform:uppercase}.focus-card h3{margin:0;font-size:.98rem;line-height:1.25}.source-day{background:#fff;border:1px solid var(--line,#dbe3ef);border-radius:22px;padding:18px;margin:18px 0;box-shadow:0 12px 28px rgba(15,23,42,.05)}.source-day h2{margin:.2rem 0 10px;text-transform:uppercase}.source-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.source-list a{background:#f8fafc;border:1px solid var(--line,#dbe3ef);border-radius:16px;padding:12px;text-decoration:none;color:#0f172a;font-weight:800}.saved-bar{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.save-btn{border:1px solid var(--line,#dbe3ef);background:#fff;border-radius:999px;padding:7px 10px;color:#1f3c88;font-weight:900;cursor:pointer}@media(max-width:800px){.focus-grid{grid-template-columns:1fr 1fr}.source-list{grid-template-columns:1fr}.install-pwa{margin:10px;display:none}.install-pwa{align-items:flex-start}.install-pwa button{width:100%}}`;
    document.head.appendChild(s);
  }

  let deferredPrompt = null;
  function setupPWA(){
    if('serviceWorker' in navigator) navigator.serviceWorker.register(site('service-worker.js')).catch(()=>null);
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt=e; showInstall(); });
    function showInstall(){
      if(document.getElementById('installPwaBox')) return;
      const box=document.createElement('section'); box.id='installPwaBox'; box.className='install-pwa';
      box.innerHTML='<div><strong>Dodaj WEB VIJESTI na početni zaslon</strong><span>Otvori portal kao aplikaciju na mobitelu ili računalu.</span></div><button type="button">DODAJ</button>';
      const header=document.querySelector('.site-header'); if(header) header.insertAdjacentElement('afterend', box); else document.body.prepend(box);
      box.style.display='flex'; box.querySelector('button').onclick=async()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice.catch(()=>null); deferredPrompt=null; box.remove(); };
    }
  }

  function newsLink(n){ const local=String(n.local_url||n.local_path||''); if(local && !/^https?:/.test(local)) return site(local); const external=String(n.url||local||''); return site('citaj/index.html')+'?u='+encodeURIComponent(external)+'&t='+encodeURIComponent(n.title||'Vijest')+'&s='+encodeURIComponent(n.source||'')+'&c='+encodeURIComponent(n.category||'vijesti'); }
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

  async function addFocusAndSource(){
    if(!document.body.dataset || document.body.dataset.page !== 'home') return;
    if(document.getElementById('todayFocus')) return;
    const news=await getJson('data/news.json',[]);
    const items=(news||[]).filter(n=>n.image).slice(0,4);
    const hero=document.querySelector('.hero');
    if(items.length && hero){
      const sec=document.createElement('section'); sec.id='todayFocus';
      sec.innerHTML='<section class="section-head"><h2>DANAS U FOKUSU</h2><p>Četiri najnovije vijesti s fotografijom.</p></section><div class="focus-grid">'+items.map(n=>`<a class="focus-card" href="${esc(newsLink(n))}"><img src="${esc(n.image)}" alt=""><div><p>${esc(n.category||'VIJESTI')} · ${esc(n.source||'')}</p><h3>${esc(n.title)}</h3></div></a>`).join('')+'</div>';
      hero.insertAdjacentElement('afterend', sec);
    }
    const groups={}; (news||[]).forEach(n=>{ const s=n.source||'Izvor'; if(!groups[s]) groups[s]=[]; if(groups[s].length<3) groups[s].push(n); });
    const best=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length)[0];
    if(best && hero){
      const sec=document.createElement('section'); sec.className='source-day';
      sec.innerHTML=`<p class="eyebrow">IZVOR DANA</p><h2>${esc(best[0])}</h2><div class="source-list">${best[1].map(n=>`<a href="${esc(newsLink(n))}">${esc(n.title)}</a>`).join('')}</div>`;
      document.getElementById('todayFocus')?.insertAdjacentElement('afterend', sec);
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{ css(); setupPWA(); addFocusAndSource(); setTimeout(addSaveButtons,1200); });
})();
