(() => {
  const BAR_ID = 'wvGlobalRadioBar';
  const STATE_KEY = 'wv_radio_state';
  const CMD_KEY = 'wv_radio_command';

  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}');}catch(e){return {};}}
  function setCommand(cmd){localStorage.setItem(CMD_KEY, JSON.stringify({cmd, at: Date.now()}));}
  function openPlayer(){
    const st = getState();
    if(!st.stream){ window.location.href = (location.pathname.includes('/radio/') ? 'index.html' : 'radio/index.html'); return; }
    const prefix = location.pathname.includes('/radio/') ? '' : 'radio/';
    const url = prefix + 'player.html?stream=' + encodeURIComponent(st.stream) + '&title=' + encodeURIComponent(st.title||'Radio') + '&site=' + encodeURIComponent(st.site||'');
    window.open(url, 'wvRadioPlayer', 'width=360,height=260,menubar=no,toolbar=no,location=no,status=no');
  }
  function render(){
    let bar = document.getElementById(BAR_ID);
    if(!bar){
      bar = document.createElement('div');
      bar.id = BAR_ID;
      document.body.prepend(bar);
      const style = document.createElement('style');
      style.textContent = `#${BAR_ID}{position:sticky;top:0;z-index:9999;min-height:26px;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#0f172a,#1f3c88);color:#fff;padding:3px 8px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:.72rem;font-weight:900;box-shadow:0 5px 16px rgba(15,23,42,.16);line-height:1.1}#${BAR_ID} button,#${BAR_ID} a{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.10);color:#fff;border-radius:999px;padding:3px 7px;text-decoration:none;font-weight:900;cursor:pointer;font-size:.62rem;line-height:1.1}#${BAR_ID} .muted{opacity:.78;font-weight:800}#${BAR_ID} .radio-title{max-width:44vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:700px){#${BAR_ID}{min-height:22px;font-size:.62rem;gap:4px;padding:2px 5px;flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto}#${BAR_ID} button,#${BAR_ID} a{font-size:.56rem;padding:2px 5px;flex:0 0 auto}#${BAR_ID} .radio-title{max-width:38vw}}`;
      document.head.appendChild(style);
    }
    const st = getState();
    if(st && st.title){
      bar.innerHTML = `<span class="muted">RADIO:</span><span class="radio-title">${esc(st.title)}</span><button type="button" data-radio-open>PLAYER</button><button type="button" data-radio-mute>MUTE</button><button type="button" data-radio-stop>STOP</button>`;
    } else {
      bar.innerHTML = `<span class="muted">RADIO:</span><span class="radio-title">nije pokrenut</span><a href="${location.pathname.includes('/radio/')?'index.html':'radio/index.html'}">POKRENI</a>`;
    }
    bar.querySelector('[data-radio-open]')?.addEventListener('click', openPlayer);
    bar.querySelector('[data-radio-mute]')?.addEventListener('click', () => setCommand('mute-toggle'));
    bar.querySelector('[data-radio-stop]')?.addEventListener('click', () => { setCommand('stop'); localStorage.removeItem(STATE_KEY); render(); });
  }
  window.addEventListener('storage', e => { if(e.key===STATE_KEY) render(); });
  document.addEventListener('DOMContentLoaded', render);
})();