document.addEventListener('DOMContentLoaded',function(){
  if(document.getElementById('wvFloatingActions'))return;
  var box=document.createElement('div');box.id='wvFloatingActions';box.className='wv-floating-actions';
  box.innerHTML='<a class="wv-float-home" href="/all-business-news/index.html" aria-label="Povratak na početnu">⌂</a><button class="wv-float-install" type="button" aria-label="Instaliraj aplikaciju">INSTALIRAJ APP</button>';
  document.body.appendChild(box);
  var promptEvent=null, install=box.querySelector('.wv-float-install');
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();promptEvent=e;install.textContent='INSTALIRAJ APP'});
  install.onclick=async function(){if(promptEvent){promptEvent.prompt();try{await promptEvent.userChoice}catch(e){}promptEvent=null}else{location.href='/all-business-news/app/index.html'}};
});
