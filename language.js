(() => {
  const key = 'retro-console.site-language';
  const script = document.currentScript;
  if (!script?.src) return;
  const root = new URL('.', script.src);
  if (root.origin !== location.origin || !location.pathname.startsWith(root.pathname)) return;
  const relative = location.pathname.slice(root.pathname.length);
  const english = relative.startsWith('en/');
  const page = (english ? relative.slice(3) : relative) || 'index.html';
  if (!['index.html', 'server.html', 'install.html', 'privacy.html'].includes(page)) return;
  const read = () => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const remember = language => {
    try { localStorage.setItem(key, language); } catch { /* Static links still work. */ }
  };
  const target = language => {
    const url = new URL((language === 'en' ? 'en/' : '') + page, root);
    url.search = location.search;
    url.searchParams.set('lang', language);
    url.hash = location.hash;
    return url.href;
  };
  const saved = read();
  const hint = new URL(location.href).searchParams.get('lang');
  const preferred = ['zh', 'en'].includes(hint) ? hint : ['zh', 'en'].includes(saved) ? saved
    : ((navigator.languages?.[0] || navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  // An explicit English URL is always English. Chinese URLs also serve as
  // the default entry point and honor the visitor's saved/browser language.
  if (english) remember('en');
  else if (preferred === 'en') {
    location.replace(target('en'));
    return;
  }
  else if (hint === 'zh') remember('zh');
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-language]');
    if (!link || !['zh', 'en'].includes(link.dataset.language)) return;
    // Save before navigation, including when storage is unavailable: the
    // query hint lets a deliberate Chinese link override English
    // browser preferences without relying on localStorage.
    remember(link.dataset.language);
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[data-language]').forEach(link => {
      link.href = target(link.dataset.language);
    });
    // Keep a deliberate Chinese choice while browsing when storage is
    // blocked. English pages already link to explicit /en/ URLs.
    if (!english && read() !== 'zh') {
      document.querySelectorAll('a[href]:not([data-language])').forEach(link => {
        const url = new URL(link.href, location.href);
        const path = url.pathname.slice(root.pathname.length);
        if (url.origin === root.origin && url.pathname.startsWith(root.pathname)
            && ['index.html', 'server.html', 'install.html', 'privacy.html', ''].includes(path)) {
          url.searchParams.set('lang', 'zh');
          link.href = url.href;
        }
      });
    }
  });
})();
