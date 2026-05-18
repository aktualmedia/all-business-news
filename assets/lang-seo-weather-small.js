(() => {
  const repo = '/all-business-news/';
  const currentUrl = () => window.location.href.split('#')[0].split('?')[0];
  const base = () => {
    const p = location.pathname;
    const i = p.indexOf(repo);
    return i >= 0 ? p.slice(0, i + repo.length) : '/';
  };
  const translateUrl = (tl) => {
    if (!tl) return currentUrl();
    return 'https://translate.google.com/translate?sl=auto&tl=' + encodeURIComponent(tl) + '&u=' + encodeURIComponent(currentUrl());
  };
  function upsertMeta(selector, attrName, attrValue, content) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }
  function addAltLang(hreflang, href) {
    if (document.head.querySelector('link[rel="alternate"][hreflang="' + hreflang + '"]')) return;
    const el = document.createElement('link');
    el.rel = 'alternate';
    el.hreflang = hreflang;
    el.href = href;
    document.head.appendChild(el);
  }
  function enhanceLanguages() {
    const langs = [
      ['HR',''], ['EN','en'], ['DE','de'], ['IT','it'], ['FR','fr'], ['ES','es'],
      ['AR','ar'], ['中文','zh-CN'], ['RU','ru'], ['TR','tr'], ['SL','sl'], ['HU','hu'],
      ['JA','ja'], ['PT','pt'], ['NL','nl'], ['PL','pl'], ['CS','cs'], ['SV','sv'], ['UK','uk'],
      ['RO','ro'], ['BG','bg'], ['EL','el']
    ];
    document.querySelectorAll('.lang-bar').forEach(bar => {
      bar.innerHTML = '<span>JEZICI</span>' + langs.map(([label, code]) => {
        return '<a href="' + translateUrl(code) + '" target="_self" rel="noopener">' + label + '</a>';
      }).join('');
    });
    document.querySelectorAll('.translate-menu').forEach(menu => {
      menu.innerHTML = langs.map(([label, code]) => {
        return '<a href="' + translateUrl(code) + '" target="_self" rel="noopener">' + label + '</a>';
      }).join('');
    });
    langs.forEach(([label, code]) => addAltLang(code || 'hr', translateUrl(code)));
  }
  function enhanceSeo() {
    const desc = 'WEB VIJESTI / All Business News donosi poslovne, ekonomske, financijske, tehnološke, kulturne i autorske objave, Symbol izdanja, galeriju, radio i događanja. Autor objava: Nermin Sefić.';
    const keywords = 'WEB VIJESTI, All Business News, Aktual Media, Nermin Sefić, Nermin Sefic, ekonomija, financije, poslovanje, tržišta, kapital, investicije, tehnologija, kultura, umjetnost, Symbol, Symbol galerija, hedonizam, satovi, nakit, vina, hrana, događanja';
    upsertMeta('meta[name="description"]', 'name', 'description', desc);
    upsertMeta('meta[name="keywords"]', 'name', 'keywords', keywords);
    upsertMeta('meta[name="author"]', 'name', 'author', 'Nermin Sefić');
    upsertMeta('meta[name="publisher"]', 'name', 'publisher', 'Aktual Media');
    upsertMeta('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc);
    if (!document.head.querySelector('#wv-jsonld-seo')) {
      const jsonld = document.createElement('script');
      jsonld.type = 'application/ld+json';
      jsonld.id = 'wv-jsonld-seo';
      jsonld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'WEB VIJESTI / All Business News',
        url: base(),
        inLanguage: 'hr-HR',
        description: desc,
        publisher: {'@type': 'Organization', name: 'Aktual Media'},
        author: {'@type': 'Person', name: 'Nermin Sefić'}
      });
      document.head.appendChild(jsonld);
    }
  }
  function addWeatherPolishStyles() {
    if (document.getElementById('wv-weather-polish-style')) return;
    const style = document.createElement('style');
    style.id = 'wv-weather-polish-style';
    style.textContent =
      '.wv-weather-card{border-radius:22px!important;padding:16px!important}' +
      '.wv-weather-head{display:flex;gap:12px;align-items:center}' +
      '.wv-weather-icon{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:#fff7df;border:1px solid #ead59c;font-size:1.8rem;flex:0 0 auto}' +
      '.wv-weather-temp{font-size:2rem!important}' +
      '.wv-weather-meta span{border-radius:12px!important;padding:8px 6px!important}' +
      '@media(max-width:760px){.lang-bar{flex-wrap:nowrap;overflow-x:auto}.lang-bar a{min-width:38px;text-align:center}.wv-weather-icon{width:42px;height:42px;font-size:1.45rem}.wv-weather-temp{font-size:1.45rem!important}}';
    document.head.appendChild(style);
  }
  function weatherIconFromText(text) {
    const t = String(text || '').toLowerCase();
    if (t.includes('kiš') || t.includes('pljus')) return '☔';
    if (t.includes('snij')) return '❄';
    if (t.includes('magl')) return '≋';
    if (t.includes('obla')) return '☁';
    if (t.includes('grmlj')) return '⚡';
    return '☀';
  }
  function enhanceWeatherCard() {
    const host = document.getElementById('weatherWidget');
    if (!host || host.querySelector('.wv-weather-icon')) return;
    const main = host.querySelector('.wv-weather-main');
    if (!main || !main.firstElementChild) return;
    const oldLeft = main.firstElementChild;
    const wrap = document.createElement('div');
    wrap.className = 'wv-weather-head';
    wrap.innerHTML = '<div class="wv-weather-icon">' + weatherIconFromText(host.textContent) + '</div>';
    wrap.appendChild(oldLeft.cloneNode(true));
    main.replaceChild(wrap, oldLeft);
  }
  function boot() {
    enhanceLanguages();
    enhanceSeo();
    addWeatherPolishStyles();
    setTimeout(enhanceWeatherCard, 1000);
    setTimeout(enhanceWeatherCard, 2200);
    setInterval(enhanceWeatherCard, 5000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
