// Flip 7 PWA Service Worker
// Strategy: network-first for the HTML shell, cache-first for Firebase CDN assets and fonts.

const CACHE_NAME = 'flip7-v1';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://flip7-46611.web.app/assets/index-DIj0IY0c.js',
  'https://flip7-46611.web.app/assets/index-C2YwLGvX.css',
];

// Install: pre-cache the core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean up any old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for CDN assets and fonts, network-first for everything else
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Cache-first: Firebase CDN assets + Google Fonts (they're versioned / immutable)
  if (
    url.includes('flip7-46611.web.app/assets/') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for all other requests (Firebase Analytics, etc.)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
