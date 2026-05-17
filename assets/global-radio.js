(() => {
  const BAR_ID = 'wvGlobalRadioBar';
  const STATE_KEY = 'wv_radio_state';
  const CMD_KEY = 'wv_radio_command';
  const HIDE_KEY = 'wv_radio_bar_hidden';

  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}');}catch(e){return {};}}
  function setCommand(cmd){localStorage.setItem(CMD_KEY, JSON.stringify({cmd, at: Date.now()}));}
  function radioBase(){ return location.pathname.includes('/radio/') ? '' : 'radio/'; }
  function isMobile(){ return window.matchMedia('(max-width: 760px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
  function openPlayer(){
    const st = getState();
    if(!st.stream){ window.location.href = radioBase() + 'index.html'; return; }
    const portal = radioBase() + 'portal.html?station=' + encodeURIComponent(st.title || '');
    const popup = radioBase() + 'player.html?stream=' + encodeURIComponent(st.stream) + '&title=' + encodeURIComponent(st.title||'Radio') + '&site=' + encodeURIComponent(st.site||'') + '&meta=' + encodeURIComponent(st.meta||'');
    if(isMobile()) window.location.href = portal;
    else window.open(popup, 'wvRadioPlayer', 'width=340,height=260,menubar=no,toolbar=no,location=no,status=no');
  }
  function ensureStyle(){
    if(document.getElementById('wvRadioMiniCss')) return;
    const style = document.createElement('style');
    style.id = 'wvRadioMiniCss';
    style.textContent = `#${BAR_ID}{z-index:9998;display:flex;align-items:center;justify-content:center;gap:8px;background:#1f3c88;color:#fff;border-radius:14px;padding:6px 10px;margin:8px max(12px,calc((100vw - 1180px)/2)) 4px;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;font-size:.72rem;font-weight:900;line-height:1;box-shadow:0 8px 20px rgba(15,23,42,.14);overflow:hidden}#${BAR_ID} .muted{opacity:.82;letter-spacing:.08em;text-transform:uppercase;flex:0 0 auto}#${BAR_ID} .radio-title{max-width:26vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#${BAR_ID} .radio-song{max-width:34vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#dbeafe;font-weight:800}#${BAR_ID} button,#${BAR_ID} a{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.10);color:#fff;border-radius:999px;padding:3px 7px;text-decoration:none;font-weight:900;cursor:pointer;font-size:.6rem;line-height:1;text-transform:uppercase;flex:0 0 auto}#${BAR_ID} .radio-hide{background:rgba(255,255,255,.18);padding:3px 6px}@media(max-width:700px){#${BAR_ID}{margin:6px 10px 3px;padding:5px 7px;border-radius:12px;font-size:.62rem;gap:5px;justify-content:flex-start;overflow-x:auto}#${BAR_ID} .radio-title{max-width:28vw}#${BAR_ID} .radio-song{max-width:36vw}#${BAR_ID} button,#${BAR_ID} a{font-size:.54rem;padding:2px 5px}}`;
    document.head.appendChild(style);
  }
  function placeBar(bar){
    const header = document.querySelector('.site-header');
    if(header) header.insertAdjacentElement('afterend', bar);
    else document.body.prepend(bar);
  }
  function render(){
    ensureStyle();
    let bar = document.getElementById(BAR_ID);
    const st = getState();
    const hidden = sessionStorage.getItem(HIDE_KEY) === '1';
    if(hidden){ if(bar) bar.remove(); return; }
    if(!st || !st.title){ if(bar) bar.remove(); return; }
    if(!bar){ bar = document.createElement('div'); bar.id = BAR_ID; placeBar(bar); }
    const playerLabel = isMobile() ? 'PORTAL' : 'PLAYER';
    const song = st.song && st.song !== '—' ? `<span class="radio-song">PJESMA: ${esc(st.song)}</span>` : `<span class="radio-song">PJESMA: —</span>`;
    bar.innerHTML = `<span class="muted">RADIO</span><span class="radio-title">${esc(st.title)}</span>${song}<button type="button" data-radio-open>${playerLabel}</button><button type="button" data-radio-mute>MUTE</button><button type="button" data-radio-stop>STOP</button><button type="button" class="radio-hide" data-radio-hide>×</button>`;
    bar.querySelector('[data-radio-open]')?.addEventListener('click', openPlayer);
    bar.querySelector('[data-radio-mute]')?.addEventListener('click', () => setCommand('mute-toggle'));
    bar.querySelector('[data-radio-stop]')?.addEventListener('click', () => { setCommand('stop'); localStorage.removeItem(STATE_KEY); render(); });
    bar.querySelector('[data-radio-hide]')?.addEventListener('click', () => { sessionStorage.setItem(HIDE_KEY,'1'); render(); });
  }
  window.addEventListener('storage', e => { if(e.key===STATE_KEY){ sessionStorage.removeItem(HIDE_KEY); render(); } });
  document.addEventListener('DOMContentLoaded', render);
})();