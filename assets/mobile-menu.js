document.addEventListener('DOMContentLoaded',function(){
  var header=document.querySelector('.site-header');
  var nav=header&&header.querySelector('.top-nav');
  if(!header||!nav)return;
  var prefix=location.pathname.indexOf('/all-business-news/')>=0&&location.pathname.split('/').length>3?'../':'';
  if(!nav.querySelector('a[href$="status/index.html"]')){
    var status=document.createElement('a');
    status.href=prefix+'status/index.html';
    status.textContent='STATUS';
    nav.appendChild(status);
  }
  if(!nav.querySelector('a[href$="app/index.html"]')){
    var app=document.createElement('a');
    app.href=prefix+'app/index.html';
    app.textContent='APP';
    nav.appendChild(app);
  }
  var button=header.querySelector('.mobile-menu-button');
  if(!button){
    button=document.createElement('button');
    button.className='mobile-menu-button';
    button.type='button';
    button.textContent='☰ IZBORNIK';
    button.setAttribute('aria-label','Otvori izbornik');
    button.setAttribute('aria-expanded','false');
    header.insertBefore(button,nav);
  }
  function closeMenu(){nav.classList.remove('open');button.setAttribute('aria-expanded','false');button.textContent='☰ IZBORNIK';}
  button.addEventListener('click',function(){
    var open=!nav.classList.contains('open');
    nav.classList.toggle('open',open);
    button.setAttribute('aria-expanded',open?'true':'false');
    button.textContent=open?'× ZATVORI':'☰ IZBORNIK';
  });
  nav.addEventListener('click',function(event){if(event.target.closest('a'))closeMenu();});
  document.addEventListener('click',function(event){if(window.innerWidth<=980&&!header.contains(event.target))closeMenu();});
  window.addEventListener('resize',function(){if(window.innerWidth>980)closeMenu();});
});
