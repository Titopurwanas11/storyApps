import { precacheAndRoute } from 'workbox-precaching';

const CACHE_VERSION = 'v3';
const CORE_CACHE = `core-${CACHE_VERSION}`;
const MAP_CACHE = `map-${CACHE_CACHE}`; // Perbaiki typo jika ada, harusnya MAP_CACHE
const ASSET_CACHE = `asset-${CACHE_VERSION}`;

// Critical Assets - Sesuaikan dengan output Webpack
const CORE_ASSETS = [
    '/storyApps/',                 // <-- PERBAIKAN: root URL dengan repository name
    '/storyApps/index.html',       // <-- PERBAIKAN
    '/js/app.bundle.js',           // Ini sudah benar dari webpack.output.filename, karena publicPath sudah diatur
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

// Map Resources - CDN tetap sama, tapi aset lokal harus diperbaiki jalurnya
const MAP_RESOURCES = [
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  '/storyApps/assets/images/map-error.webp' // <-- PERBAIKAN: errorTileUrl aset lokal
];

// --- PERBAIKAN: Implementasi Precaching dengan Workbox ---
// Do precaching with the manifest injected by Workbox
precacheAndRoute(self.__WB_MANIFEST);
// --- AKHIR PERBAIKAN ---

// Install Event - Cache Core Assets (Ini sekarang ditangani oleh precacheAndRoute)
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(self.skipWaiting()); // Tetap ada untuk mengaktifkan SW baru segera
});


// Activate Event - Clean Old Caches (Pertahankan, tapi sesuaikan nama cache jika CORE_CACHE tidak dipakai lagi)
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Hapus cache lama, kecuali cache yang dikelola Workbox (misal: "workbox-precache-XXXX")
          // dan cache yang Anda kelola sendiri (MAP_CACHE, ASSET_CACHE)
          if (!cache.startsWith('workbox-precache') && cache !== MAP_CACHE && cache !== ASSET_CACHE) {
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

  if (request.method !== 'GET') return;

  // Cache Map Resources with Cache First (tetap)
  if (MAP_RESOURCES.some(resource => request.url.includes(resource))) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetchAndCache(request, MAP_CACHE))
    );
    return;
  }

  // Cache API responses with Network First (tetap)
  if (url.pathname.startsWith('/stories')) { // Pastikan ini tetap '/stories' karena ini endpoint API absolute
    event.respondWith(
      networkFirstWithCache(request, ASSET_CACHE)
    );
    return;
  }

  // Untuk aset yang diprecache (CORE_ASSETS oleh Workbox), Workbox otomatis akan melayaninya
  // Untuk sisanya (non-precached, non-map, non-API), gunakan Network First with Offline Fallback
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
      icon: '/storyApps/assets/icons/android-chrome-192x192.png', // <-- PERBAIKAN: Tambahkan /storyApps/
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
        return self.clients.openWindow('/storyApps/'); // <-- PERBAIKAN: Tambahkan /storyApps/
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
  return caches.match('/storyApps/offline.html'); // <-- PERBAIKAN: Tambahkan /storyApps/
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