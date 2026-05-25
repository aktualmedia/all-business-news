document.addEventListener('DOMContentLoaded', function () {
  if (window.WV_INSTALL_READY) return;
  window.WV_INSTALL_READY = true;
  var ROOT = '/all-business-news/';
  var deferredPrompt = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isAndroid = /android/i.test(navigator.userAgent);

  function createFloatingButton() {
    var box = document.getElementById('wvFloatingActions');
    if (!box) {
      box = document.createElement('div');
      box.id = 'wvFloatingActions';
      box.className = 'wv-floating-actions';
      box.innerHTML = '<a class="wv-float-home" href="' + ROOT + 'index.html" aria-label="Povratak na početnu">⌂</a><button class="wv-float-install" type="button" data-install-app aria-label="Instaliraj aplikaciju">INSTALIRAJ APLIKACIJU</button>';
      document.body.appendChild(box);
    }
    return box;
  }
  function createHelp() {
    var modal = document.getElementById('wvInstallHelp');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'wvInstallHelp';
    modal.className = 'wv-install-help';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Upute za instalaciju aplikacije');
    modal.innerHTML = '<section class="wv-install-sheet"><header class="wv-install-sheet-head"><div><strong>Instaliraj WEB VIJESTI</strong><span>Postavi WV ikonu na početni zaslon</span></div><button type="button" class="wv-install-sheet-close" aria-label="Zatvori">×</button></header><ol class="wv-install-steps"></ol><p class="wv-install-sheet-note"></p></section>';
    document.body.appendChild(modal);
    modal.querySelector('.wv-install-sheet-close').onclick = function () { modal.classList.remove('open'); };
    modal.addEventListener('click', function (event) { if (event.target === modal) modal.classList.remove('open'); });
    return modal;
  }
  function setInstalled() {
    document.querySelectorAll('[data-install-app]').forEach(function (button) {
      button.classList.add('is-installed');
      button.textContent = 'APLIKACIJA INSTALIRANA';
      button.disabled = true;
    });
  }
  function showHelp() {
    var modal = createHelp();
    var steps = modal.querySelector('.wv-install-steps');
    var note = modal.querySelector('.wv-install-sheet-note');
    if (standalone) {
      steps.innerHTML = '<li><b>✓</b><span>WEB VIJESTI su već otvorene kao aplikacija na ovom uređaju.</span></li>';
      note.textContent = 'Nova WV ikona prikazuje se nakon ponovne instalacije ako je ranije bila spremljena stara oznaka.';
    } else if (isIOS) {
      steps.innerHTML = '<li><b>1</b><span>Otvorite ovu stranicu u pregledniku <strong>Safari</strong>.</span></li><li><b>2</b><span>Na dnu zaslona dodirnite ikonu <strong>Dijeli</strong> (kvadrat sa strelicom prema gore).</span></li><li><b>3</b><span>Odaberite <strong>Dodaj na početni zaslon</strong>.</span></li><li><b>4</b><span>Potvrdite naziv <strong>WEB VIJESTI</strong>.</span></li>';
      note.textContent = 'Na iPhoneu nema zasebnog gumba Preuzmi; instalacija ide kroz izbornik Dijeli u Safariju.';
    } else if (isAndroid) {
      steps.innerHTML = '<li><b>1</b><span>Otvorite portal u pregledniku <strong>Chrome</strong>.</span></li><li><b>2</b><span>Dodirnite izbornik s tri točkice u gornjem desnom kutu.</span></li><li><b>3</b><span>Odaberite <strong>Instaliraj aplikaciju</strong> ili <strong>Dodaj na početni zaslon</strong>.</span></li><li><b>4</b><span>Potvrdite instalaciju nove WV ikone.</span></li>';
      note.textContent = 'Kada preglednik pripremi izravnu instalaciju, isti gumb na portalu otvorit će potvrdu jednim dodirom.';
    } else {
      steps.innerHTML = '<li><b>1</b><span>U pregledniku otvorite njegov glavni izbornik.</span></li><li><b>2</b><span>Potražite opciju <strong>Instaliraj aplikaciju</strong> ili <strong>Dodaj na početni zaslon</strong>.</span></li>';
      note.textContent = 'Dostupne opcije ovise o pregledniku i uređaju.';
    }
    modal.classList.add('open');
  }
  async function triggerInstall() {
    if (standalone) { showHelp(); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        var choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') setInstalled();
      } catch (error) {}
      deferredPrompt = null;
      return;
    }
    showHelp();
  }
  function wireButtons() {
    document.querySelectorAll('[data-install-app]').forEach(function (button) {
      if (button.dataset.installBound === '1') return;
      button.dataset.installBound = '1';
      button.addEventListener('click', triggerInstall);
    });
    if (standalone) setInstalled();
  }

  createFloatingButton();
  createHelp();
  wireButtons();
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredPrompt = event;
    document.querySelectorAll('[data-install-app]').forEach(function (button) {
      if (!button.classList.contains('is-installed')) button.textContent = 'INSTALIRAJ APLIKACIJU';
    });
  });
  window.addEventListener('appinstalled', function () { standalone = true; setInstalled(); });
});
