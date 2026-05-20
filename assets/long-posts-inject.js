document.addEventListener('DOMContentLoaded',function(){
  var posts=[
    {title:'Vrijednost se danas gradi kroz kapital, dokumentaciju i povjerenje',summary:'Ozbiljna poslovna vrijednost više se ne dokazuje samo prometom, nego kapitalom, imovinom, dokumentacijom, transparentnošću i povjerenjem.',url:'objave/2026-05-20-vrijednost-kapital-dokumentacija-povjerenje.html'},
    {title:'Digitalni portal, mediji i osobni kredibilitet',summary:'Vlastita digitalna infrastruktura postaje alat za uredno, provjerljivo i mirno objašnjavanje poslovanja, stavova i dokumenata.',url:'objave/2026-05-20-digitalni-portal-mediji-i-osobni-kredibilitet.html'}
  ];
  function prefix(){return location.pathname.indexOf('/objave/')>=0?'../':'';}
  function card(p){return '<article class="post-card long-nermin-post"><div class="card-body"><p class="meta">OBJAVE · Autor: Nermin Sefić · dugi tekst</p><h3><a href="'+prefix()+p.url+'">'+p.title+'</a></h3><p>'+p.summary+'</p><a class="button small" href="'+prefix()+p.url+'">PROČITAJ</a></div></article>';}
  if(location.pathname.indexOf('/objave/')>=0){var grid=document.querySelector('.news-grid');if(grid&&!grid.querySelector('.long-nermin-post'))grid.insertAdjacentHTML('afterbegin',posts.map(card).join(''));}
  if(document.body&&document.body.dataset.page==='home'){var box=document.getElementById('postsGrid');if(box&&!box.dataset.longPostsAdded){box.dataset.longPostsAdded='1';setTimeout(function(){box.insertAdjacentHTML('afterbegin',posts.map(card).join(''));},900);}}
});
