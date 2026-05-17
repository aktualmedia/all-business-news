(() => {
  const CATS = {vijesti:"VIJESTI", poslovanje:"POSLOVANJE", ekonomija:"EKONOMIJA", financije:"FINANCIJE", trzista:"TRŽIŠTA", kultura:"KULTURA", dizajn:"DIZAJN", tehnologija:"TEHNOLOGIJA", znanost:"ZNANOST", lifestyle:"LIFESTYLE", hedonizam:"HEDONIZAM", satovi:"SATOVI", nakit:"NAKIT", pica:"PIĆA"};
  const repo="/all-business-news/";
  function base(){ const p=location.pathname; const i=p.indexOf(repo); return i>=0 ? p.slice(0,i+repo.length) : "/"; }
  function site(path){ if(!path) return "#"; if(/^https?:|^mailto:|^viber:/.test(path)) return path; return base()+String(path).replace(/^\/+/,""); }
  function esc(s){ return String(s||"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
  async function getJson(path,fallback){ try{ const r=await fetch(site(path),{cache:"no-store"}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }
  function share(title,url){ const u=encodeURIComponent(url||location.href), t=encodeURIComponent(title||document.title); return `<div class="share-mini"><strong>DIJELI</strong><a target="_blank" href="https://wa.me/?text=${t}%20${u}">WA</a><a target="_blank" href="viber://forward?text=${t}%20${u}">VIBER</a><a target="_blank" href="https://twitter.com/intent/tweet?text=${t}&url=${u}">X</a><a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${u}">FB</a><a target="_blank" href="https://www.linkedin.com/sharing/share-offsite/?url=${u}">IN</a></div>`; }
  function ensureLightbox(){ let lb=document.getElementById("galleryLightbox"); if(lb) return lb; lb=document.createElement("div"); lb.id="galleryLightbox"; lb.className="gallery-lightbox"; lb.innerHTML=`<div class="gallery-lightbox-panel"><button class="gallery-lightbox-close">×</button><img class="gallery-lightbox-image" alt=""><div class="gallery-lightbox-caption"><strong></strong><p></p></div></div>`; document.body.appendChild(lb); const close=()=>lb.classList.remove("active"); lb.querySelector(".gallery-lightbox-close").onclick=close; lb.onclick=e=>{if(e.target===lb)close();}; return lb; }
  function openImg(img,title,desc){ const lb=ensureLightbox(); lb.querySelector("img").src=img; lb.querySelector("strong").textContent=title||""; lb.querySelector("p").textContent=desc||""; lb.classList.add("active"); }
  let items=[], active="all";
  function renderFilters(){
    const bar=document.getElementById("galleryFilters"); if(!bar) return;
    const cats=[...new Set(items.map(x=>x.category||"vijesti"))].filter(Boolean);
    bar.innerHTML=`<button class="${active==="all"?"active":""}" data-cat="all">SVE</button>`+cats.map(c=>`<button class="${active===c?"active":""}" data-cat="${esc(c)}">${esc(CATS[c]||c)}</button>`).join("");
    bar.querySelectorAll("button").forEach(b=>b.onclick=()=>{active=b.dataset.cat; render();});
  }
  function render(){
    const box=document.getElementById("galleryGrid"); if(!box) return;
    renderFilters();
    const arr=(active==="all"?items:items.filter(x=>(x.category||"vijesti")===active)).slice(0,120);
    box.innerHTML=arr.map(g=>{ const img=site(g.image); const src=g.source_url||img; return `<article class="gallery-item"><button class="gallery-open" data-image="${esc(img)}" data-title="${esc(g.title)}" data-description="${esc(g.description||"")}"><img loading="lazy" src="${esc(img)}" alt=""></button><div><p class="meta">${esc(CATS[g.category]||g.category||"GALERIJA")}</p><strong>${esc(g.title)}</strong><p>${esc(g.description||"")}</p>${share(g.title,src)}</div></article>`; }).join("") || `<div class="legal-box"><p>NEMA SLIKA ZA ODABRANU KATEGORIJU.</p></div>`;
    box.querySelectorAll(".gallery-open").forEach(b=>b.onclick=()=>openImg(b.dataset.image,b.dataset.title,b.dataset.description));
  }
  document.addEventListener("DOMContentLoaded", async()=>{ items=await getJson("data/manual_gallery.json",[]); if(!Array.isArray(items)||!items.length){ const news=await getJson("data/news.json",[]); items=(news||[]).filter(n=>n.image).map(n=>({title:n.title,description:(n.source||"")+" · fotografija iz vijesti",image:n.image,category:n.category||"vijesti",source_url:n.url})); } render(); });
})();