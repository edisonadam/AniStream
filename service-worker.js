
const CACHE_NAME = 'anistream-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Cache the main app script
  '/vite.svg', // Cache app icon
  '/manifest.json' // Cache manifest
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Serve from network first, fall back to cache. Cache new responses.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
      return;
  }

  event.respondWith(
      fetch(event.request)
          .then(networkResponse => {
              // If fetch is successful, clone and cache it
              if (networkResponse && networkResponse.ok) {
                  const responseToCache = networkResponse.clone();
                  caches.open(CACHE_NAME).then(cache => {
                      cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
          })
          .catch(() => {
              // If fetch fails (e.g., offline), try to get it from the cache
              return caches.match(event.request).then(cachedResponse => {
                  return cachedResponse || Promise.reject('No cache match');
              });
          })
  );
});