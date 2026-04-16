const CACHE_NAME = 'ams-cache-v1';
const STATIC_ASSETS = [
  '/AMB824_AMS/styles/index.css',
  '/AMB824_AMS/styles/admin.css',
  '/AMB824_AMS/scripts/auth_utils.js',
  '/AMB824_AMS/scripts/admin.js',
  '/AMB824_AMS/scripts/dashboard_core.js',
  '/AMB824_AMS/scripts/employee_dashboard.js',
  '/AMB824_AMS/scripts/index.js',
  '/AMB824_AMS/icons/icon-192.png',
  '/AMB824_AMS/icons/icon-512.png',
  '/AMB824_AMS/manifest.json'
];

// Install: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for API calls, Cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API calls: Network only (always need fresh data)
  if (url.pathname.includes('/apis/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ status: 'error', message: 'Offline - No network available' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static assets: Cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Update cache in background
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const cloned = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return networkResponse;
      });
    })
  );
});

