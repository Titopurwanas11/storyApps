delete L.Icon.Default.prototype._get;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/storyApps/assets/icons/marker-icon-2x.webp', // <-- PERBAIKAN DI SINI
  iconUrl: '/storyApps/assets/icons/marker-icon.webp',         // <-- PERBAIKAN DI SINI
  shadowUrl: '/storyApps/assets/icons/marker-shadow.webp',     // <-- PERBAIKAN DI SINI
});

const appCustomMarkerIcon = L.icon({
  iconUrl: '/storyApps/assets/icons/marker-icon.webp', // <-- PERBAIKAN DI SINI
  iconRetinaUrl: '/storyApps/assets/icons/marker-icon-2x.webp', // <-- PERBAIKAN DI SINI
  iconSize: [32, 41],
  iconAnchor: [16, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/storyApps/assets/icons/marker-shadow.webp', // <-- PERBAIKAN DI SINI
  shadowSize: [41, 41]
});


const MAP_CONFIG = {
  preferCanvas: true,
  fadeAnimation: false,
  zoomSnap: 0.5,
  wheelPxPerZoomLevel: 60,
  inertia: true,
  inertiaDeceleration: 3000
};

// Konfigurasi Tile Layer
const TILE_CONFIG = {
  maxZoom: 19,
  minZoom: 3,
  reuseTiles: true,
  updateWhenIdle: true,
  crossOrigin: true,
  detectRetina: true,
  errorTileUrl: '/storyApps/assets/images/map-error.webp' // <-- PERBAIKAN DI SINI
};

// Konfigurasi Marker Cluster
const CLUSTER_CONFIG = {
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  chunkedLoading: true,
  chunkInterval: 100,
  disableClusteringAtZoom: 17
};

// Inisialisasi Peta
export const initMap = (containerId, center = [-2.5489, 118.0149], zoom = 4) => {
  const container = document.getElementById(containerId);
  if (!container) return null;

  // Hapus instance peta sebelumnya jika ada
  if (container._map) {
    container._map.remove();
  }

  const map = L.map(container, MAP_CONFIG).setView(center, zoom);

  // Tambahkan base layer
  const baseLayer = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    TILE_CONFIG
  ).addTo(map);

  // Handle error tile
  baseLayer.on('tileerror', (e) => {
    console.error('Error loading tile:', e.tile.src);
  });

  // Simpan referensi peta di container
  container._map = map;
  return map;
};

// Render Markers dengan Clustering
export const renderMarkers = (map, stories = []) => {
  if (!map || !stories.length) return;

  // Hapus layer marker sebelumnya jika ada
  if (map._markerCluster) {
    map.removeLayer(map._markerCluster);
  }

  // Buat marker cluster group
  const markerCluster = L.markerClusterGroup(CLUSTER_CONFIG);

  // Tambahkan marker untuk setiap story
  stories.forEach(story => {
    if (!story.lat || !story.lon) return;

    const marker = L.marker([story.lat, story.lon], {
      icon: appCustomMarkerIcon, // <--- GUNAKAN IKON GLOBAL DI SINI!
      riseOnHover: true,
      title: story.name,
      alt: `Lokasi story ${story.name}`,
      keyboard: true
    });

    // Popup content dengan lazy loading image
    const popupContent = `
      <div class="popup-content">
        <h3>${story.name}</h3>
        <img src="/assets/images/placeholder.webp"
             data-src="${story.photoUrl}"
             alt="${story.description || 'Story image'}"
             loading="lazy"
             class="story-image"
             width="200"
             height="150">
        <p>${story.description}</p>
        <small>${new Date(story.createdAt).toLocaleDateString()}</small>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      minWidth: 200,
      autoPan: true
    });

    // Lazy load image saat popup dibuka
    marker.on('popupopen', () => {
      const img = document.querySelector('.popup-content img');
      if (img && img.dataset.src) {
        img.src = img.dataset.src;
      }
    });

    markerCluster.addLayer(marker);
  });

  // Tambahkan cluster ke peta
  map.addLayer(markerCluster);
  map._markerCluster = markerCluster;

  // Fit bounds jika ada marker
  if (stories.some(s => s.lat && s.lon)) {
    const bounds = markerCluster.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }
};

// Fungsi untuk menangani klik peta (ambil koordinat)
export const setupMapClickHandler = (map, callback) => {
  if (!map) return;

  let marker = null;
  const clickHandler = (e) => {
    const { lat, lng } = e.latlng;

    // Hapus marker sebelumnya
    if (marker) {
      map.removeLayer(marker);
    }

  
    // Tambahkan marker baru
    marker = L.marker([lat, lng], {
      icon: appCustomMarkerIcon, // <--- GUNAKAN IKON GLOBAL DI SINI!
      draggable: true,
      title: 'Lokasi dipilih',
      alt: 'Marker lokasi story'
    }).addTo(map);

    // Panggil callback dengan koordinat
    callback(lat, lng);

    // Handle marker drag
    marker.on('dragend', (e) => {
      const newPos = e.target.getLatLng();
      callback(newPos.lat, newPos.lng);
    });
  };

  map.on('click', clickHandler);

  // Fungsi cleanup
  return () => {
    map.off('click', clickHandler);
    if (marker) map.removeLayer(marker);
  };
};

// Fungsi untuk update lokasi user
export const locateUser = (map) => {
  return new Promise((resolve, reject) => {
    if (!map) return reject('Map not initialized');

    map.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
      timeout: 10000
    })
      .on('locationfound', (e) => {
        const { lat, lng } = e.latlng;
        L.marker([lat, lng], {
          icon: appCustomMarkerIcon, // <-- Tambahkan ikon ini juga untuk marker lokasi user
          title: 'Lokasi Anda',
          alt: 'Marker lokasi user'
        }).addTo(map)
          .bindPopup('Anda berada di sini')
          .openPopup();

        resolve({ lat, lng });
      })
      .on('locationerror', (err) => {
        console.error('Geolocation error:', err.message);
        reject(err.message);
      });
  });
};

// Cleanup peta
export const cleanupMap = (containerId) => {
  const container = document.getElementById(containerId);
  if (container && container._map) {
    container._map.remove();
    delete container._map;
  }
};