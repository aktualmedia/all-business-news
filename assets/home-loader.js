(() => {
  const repo = '/all-business-news/';
  const isHome = document.body?.dataset?.page === 'home' || /\/all-business-news\/?(?:index\.html)?$/.test(location.pathname);
  if(!isHome || !window.fetch) return;
  const nativeFetch = window.fetch.bind(window);
  let firstNewsRedirectDone = false;
  window.fetch = (input, init) => {
    try{
      const raw = typeof input === 'string' ? input : input.url;
      const url = new URL(raw, location.href);
      if(!firstNewsRedirectDone && url.pathname.endsWith('/data/news.json')){
        firstNewsRedirectDone = true;
        url.pathname = url.pathname.replace('/data/news.json','/data/home_news.json');
        return nativeFetch(url.toString(), init);
      }
    }catch(e){}
    return nativeFetch(input, init);
  };
})();
