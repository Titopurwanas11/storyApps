const CACHE_VERSION = 'v3';
const CORE_CACHE = `core-${CACHE_VERSION}`;
const MAP_CACHE = `map-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-${CACHE_VERSION}`;

// Critical Assets - Sesuaikan dengan output Webpack
const CORE_ASSETS = [
  '/',
    '/index.html',
    '/js/app.bundle.js',
    '/offline.html',
    '/manifest.json', // <-- Pastikan ini ada karena sudah di-copy
    '/assets/icons/android-chrome-192x192.png',
    '/assets/icons/android-chrome-512x512.png',
    '/assets/icons/apple-touch-icon.png',
    '/assets/icons/favicon-16x16.png',
    '/assets/icons/favicon-32x32.png',
    '/assets/icons/favicon.ico',
];

// Map Resources - Ini tetap sama karena dari CDN
const MAP_RESOURCES = [
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
  'https://unpkg.com/leaflet.lazyload@1.0.0/Leaflet.LazyLoad.min.js', // Tambahkan ini jika Anda menggunakannya
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
];
// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(cache => {
        console.log('Caching core assets:', CORE_ASSETS);
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('Service Worker install failed (addAll error):', error);
        console.error('Failed to cache the following core assets:');

        Promise.allSettled(CORE_ASSETS.map(url =>
            fetch(url, { cache: 'no-store' })
        ))
        .then(results => {
            results.forEach((result, index) => {
                const url = CORE_ASSETS[index];
                if (result.status === 'rejected') {
                    console.error(`- URL: ${url} (Network Error):`, result.reason);
                } else if (result.value && !result.value.ok) {
                    console.error(`- URL: ${url} (HTTP Error):`, result.value.status, result.value.statusText);
                }
            });
        })
        .finally(() => {
            console.warn('Diagnosis fetch aset individual selesai. Periksa error spesifik di atas.');
        });
      })
  );
});

// Activate Event - Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CORE_CACHE && cache !== MAP_CACHE && cache !== ASSET_CACHE) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch Event - Advanced Caching Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Cache Map Resources with Cache First
  if (MAP_RESOURCES.some(resource => request.url.includes(resource))) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetchAndCache(request, MAP_CACHE))
    );
    return;
  }

  // Cache API responses with Network First
  if (url.pathname.startsWith('/stories')) {
    event.respondWith(
      networkFirstWithCache(request, ASSET_CACHE)
    );
    return;
  }

  // For Core Assets: Cache First
  if (CORE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetch(request))
    );
    return;
  }

  // For everything else: Network First with Offline Fallback
  event.respondWith(
    networkFirstWithCache(request, ASSET_CACHE)
      .catch(() => offlineFallback())
  );
});

// Push Notification Event
self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {
    title: 'New Story',
    options: {
      body: 'A new story has been shared',
      icon: '/assets/icons/android-chrome-192x192.png',
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, payload.options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        if (clients.length) {
          return clients[0].focus();
        }
        return self.clients.openWindow('/');
      })
  );
});

// Background Sync (Optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncStories());
  }
});

// Helper Functions
async function fetchAndCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  const response = await fetch(request);
  
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  
  return response;
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || Promise.reject(err);
  }
}

function offlineFallback() {
  return caches.match('/offline.html');
}

async function syncStories() {
  // Implementasi background sync
  const cache = await caches.open(ASSET_CACHE);
  const responses = await Promise.all([
    fetch('/stories?size=10'),
    fetch('/stories/recent')
  ]);
  
  await Promise.all(
    responses.map(response => {
      if (response.ok) {
        return cache.put(response.url, response);
      }
    })
  );
}