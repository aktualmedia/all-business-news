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
    window.open(url, 'wvRadioPlayer', 'width=420,height=360,menubar=no,toolbar=no,location=no,status=no');
  }
  function render(){
    let bar = document.getElementById(BAR_ID);
    if(!bar){
      bar = document.createElement('div');
      bar.id = BAR_ID;
      document.body.prepend(bar);
      const style = document.createElement('style');
      style.textContent = `#${BAR_ID}{position:sticky;top:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#0f172a,#1f3c88);color:#fff;padding:9px 12px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:.86rem;font-weight:900;box-shadow:0 8px 26px rgba(15,23,42,.18)}#${BAR_ID} button,#${BAR_ID} a{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.12);color:#fff;border-radius:999px;padding:6px 10px;text-decoration:none;font-weight:900;cursor:pointer;font-size:.72rem}#${BAR_ID} .muted{opacity:.82;font-weight:800}@media(max-width:700px){#${BAR_ID}{font-size:.72rem;gap:6px;flex-wrap:wrap}#${BAR_ID} button,#${BAR_ID} a{font-size:.66rem;padding:5px 8px}}`;
      document.head.appendChild(style);
    }
    const st = getState();
    if(st && st.title){
      bar.innerHTML = `<span class="muted">RADIO SVIRA:</span> <span>${esc(st.title)}</span><button type="button" data-radio-open>PLAYER</button><button type="button" data-radio-mute>STIŠAJ</button><button type="button" data-radio-stop>UGASI</button>`;
    } else {
      bar.innerHTML = `<span class="muted">RADIO:</span> <span>NIJE POKRENUT</span><a href="${location.pathname.includes('/radio/')?'index.html':'radio/index.html'}">POKRENI RADIO</a>`;
    }
    bar.querySelector('[data-radio-open]')?.addEventListener('click', openPlayer);
    bar.querySelector('[data-radio-mute]')?.addEventListener('click', () => setCommand('mute-toggle'));
    bar.querySelector('[data-radio-stop]')?.addEventListener('click', () => { setCommand('stop'); localStorage.removeItem(STATE_KEY); render(); });
  }
  window.addEventListener('storage', e => { if(e.key===STATE_KEY) render(); });
  document.addEventListener('DOMContentLoaded', render);
})();
