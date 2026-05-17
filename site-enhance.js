(() => {
  const $ = s => document.querySelector(s);
  const status = $("#adminStatus");
  function msg(t){ if(status) status.textContent=t; }
  function download(name, data){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }
  async function getJson(path, fallback){ try{ const r=await fetch("../"+path,{cache:"no-store"}); if(!r.ok) throw new Error(r.status); return await r.json(); }catch(e){ return fallback; } }
  let gallery=[], posts=[], radio=[];
  async function init(){
    gallery=JSON.parse(localStorage.getItem("wv_gallery")||"null") || await getJson("data/manual_gallery.json",[]);
    posts=JSON.parse(localStorage.getItem("wv_posts")||"null") || await getJson("data/ai_posts.json",[]);
    radio=JSON.parse(localStorage.getItem("wv_radio")||"null") || await getJson("data/radio.json",[]);
    msg("ADMIN RADI. SPREMA LOKALNO U PREGLEDNIKU I IZVOZI JSON ZA RUČNI UPLOAD U DATA FOLDER.");
  }
  $("#addGallery")?.addEventListener("click",()=>{ const title=$("#gTitle").value.trim(), image=$("#gImage").value.trim(), description=$("#gDesc").value.trim(); if(!title||!image)return msg("Upiši naslov i URL/putanju slike."); gallery.unshift({title,image,description,created_at:new Date().toISOString(),manual:true}); localStorage.setItem("wv_gallery",JSON.stringify(gallery)); msg("Galerija spremljena lokalno.");});
  $("#exportGallery")?.addEventListener("click",()=>download("manual_gallery.json",gallery));
  $("#addPost")?.addEventListener("click",()=>{ const title=$("#pTitle").value.trim(), summary=$("#pSummary").value.trim(); if(!title||!summary)return msg("Upiši naslov i sažetak."); posts.unshift({title,summary,author:"Nermin Sefić",created_at:new Date().toISOString(),category:"komentar"}); localStorage.setItem("wv_posts",JSON.stringify(posts)); msg("Objava spremljena lokalno.");});
  $("#exportPosts")?.addEventListener("click",()=>download("ai_posts.json",posts));
  $("#addRadio")?.addEventListener("click",()=>{ const title=$("#rTitle").value.trim(), stream=$("#rStream").value.trim(), description=$("#rDesc").value.trim(); if(!title||!stream)return msg("Upiši naziv i stream URL."); radio.unshift({title,stream,description,site:"#"}); localStorage.setItem("wv_radio",JSON.stringify(radio)); msg("Radio spremljen lokalno.");});
  $("#exportRadio")?.addEventListener("click",()=>download("radio.json",radio));
  init();
})();