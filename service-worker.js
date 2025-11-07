
const CACHE_NAME = 'anistream-cache-v3'; // Increment cache version
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/vite.svg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        // Pre-cache the main app shell files for instant loading.
        // Other assets (CDNs, images) will be cached on first fetch.
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // API calls - Network only. These should never be cached.
  const apiHosts = ['api.jikan.moe', 'api.consumet.org', 'graphql.anilist.co', 'api.animethemes.moe', 'api.themoviedb.org'];
  if (apiHosts.some(host => url.hostname.includes(host))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For all other GET requests (app shell, CDNs, images), use Stale-While-Revalidate strategy.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If fetch is successful, clone the response and cache it.
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            // Fetch failed, probably offline. The cachedResponse (if exists) is already on its way.
            console.warn('Network request failed, serving from cache if available.', err.message);
        });

        // Return cached response immediately if available, while fetching in the background.
        // If not in cache, return the fetch promise, which will either resolve or reject.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
