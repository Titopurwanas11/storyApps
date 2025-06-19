import { precacheAndRoute } from 'workbox-precaching';

const CACHE_VERSION = 'v3';
const CORE_CACHE = `core-${CACHE_VERSION}`;
const MAP_CACHE = `map-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-${CACHE_VERSION}`;

// Critical Assets - Sesuaikan dengan output Webpack
const CORE_ASSETS = [
    '/storyApps/',                 // <-- PERBAIKAN
    '/storyApps/index.html',       // <-- PERBAIKAN
    '/storyApps/js/app.bundle.js', // <-- PERBAIKAN
    '/storyApps/offline.html',     // <-- PERBAIKAN
    '/storyApps/manifest.json',    // <-- PERBAIKAN
    // Ikon PWA (pastikan ini ada di src/assets/icons/ dan disalin oleh webpack)
    '/storyApps/assets/icons/android-chrome-192x192.png', // <-- PERBAIKAN
    '/storyApps/assets/icons/android-chrome-512x512.png', // <-- PERBAIKAN
    '/storyApps/assets/icons/apple-touch-icon.png',       // <-- PERBAIKAN
    '/storyApps/assets/icons/favicon-16x16.png',          // <-- PERBAIKAN
    '/storyApps/assets/icons/favicon-32x32.png',          // <-- PERBAIKAN
    '/storyApps/assets/icons/favicon.ico',                // <-- PERBAIKAN
];

// Map Resources - CDN tetap sama, tapi errorTileUrl harus diperbaiki
const MAP_RESOURCES = [
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
  'https://unpkg.com/leaflet.lazyload@1.0.0/Leaflet.LazyLoad.min.js', // Tambahkan ini jika Anda menggunakannya
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  '/storyApps/assets/images/map-error.webp' // <-- PERBAIKAN
];

precacheAndRoute(self.__WB_MANIFEST);

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(self.skipWaiting());
});


// Activate Event - Clean Old Caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (!cache.startsWith('workbox-precache') && cache !== CORE_CACHE && cache !== MAP_CACHE && cache !== ASSET_CACHE) {
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

  if (url.protocol === 'chrome-extension:') {
    return; // Lewati request dari ekstensi browser
  }

  if (request.method !== 'GET') return;

  // Cache Map Resources with Cache First (tetap)
  if (MAP_RESOURCES.some(resource => request.url.includes(resource))) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetchAndCache(request, MAP_CACHE))
    );
    return;
  }

  // Cache API responses with Network First
  if (url.pathname.startsWith('/stories')) { // Ini endpoint API, tetap /stories
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
      icon: '/storyApps/assets/icons/android-chrome-192x192.png', // <-- PERBAIKAN
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
        return self.clients.openWindow('/storyApps/'); // <-- PERBAIKAN
      })
  );
});

// Background Sync (Optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncStories());
  }
});

// Helper Functions (pertahankan)
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
  return caches.match('/storyApps/offline.html'); // <-- PERBAIKAN
}

async function syncStories() {
  const cache = await caches.open(ASSET_CACHE);
  const responses = await Promise.all([
    fetch('/stories?size=10'), // Ini endpoint API, tetap /stories
    fetch('/stories/recent')   // Ini endpoint API, tetap /stories
  ]);

  await Promise.all(
    responses.map(response => {
      if (response.ok) {
        return cache.put(response.url, response);
      }
    })
  );
}