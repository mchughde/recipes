const CACHE_NAME = 'recipes-v32';

// Is the request for our app files (local Mac, iPhone via IP, or GitHub Pages)?
const isAppFile = url =>
  url.hostname === 'localhost' ||
  url.hostname === '127.0.0.1' ||
  /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) || // e.g. 192.168.x.x on iPhone
  url.hostname === 'mchughde.github.io';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // App shell files: always network-first so updates are instant on all devices.
  // Cache is only used as an offline fallback.
  if (isAppFile(url)) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // External resources (Unsplash images etc): network-first, cache as fallback.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
