import { precacheAndRoute } from 'workbox-precaching'; // <-- PERBAIKAN: Import precacheAndRoute

const CACHE_VERSION = 'v3'; // Ini bisa dipertahankan, atau biarkan Workbox yang mengatur versi
const CORE_CACHE = `core-${CACHE_VERSION}`; // Ini mungkin tidak lagi dipakai langsung oleh Workbox precaching
const MAP_CACHE = `map-${CACHE_VERSION}`;
const ASSET_CACHE = `asset-${CACHE_VERSION}`;

// Map Resources - Ini tetap sama karena dari CDN
const MAP_RESOURCES = [
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
  'https://unpkg.com/leaflet.lazyload@1.0.0/Leaflet.LazyLoad.min.js', // Tambahkan ini jika Anda menggunakannya
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
];

precacheAndRoute(self.__WB_MANIFEST);
// --- AKHIR PERBAIKAN ---
// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // precacheAndRoute(self.__WB_MANIFEST) sudah menangani caching di fase install
  event.waitUntil(self.skipWaiting()); // Tetap ada untuk mengaktifkan SW baru segera
});


// Activate Event - Clean Old Caches (Pertahankan, tapi sesuaikan nama cache jika CORE_CACHE tidak dipakai lagi)
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Hapus cache lama, kecuali cache yang dikelola Workbox (misal: "google-fonts", dll.)
          // Workbox biasanya menggunakan nama cache seperti 'workbox-precache-XXXX' atau 'google-fonts'
          // Hati-hati dengan nama cache yang dibuat Workbox
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
  if (url.pathname.startsWith('/stories')) {
    event.respondWith(
      networkFirstWithCache(request, ASSET_CACHE)
    );
    return;
  }
  event.respondWith(
    networkFirstWithCache(request, ASSET_CACHE) // Ini akan mencakup aset precached jika belum ada di cache utama
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