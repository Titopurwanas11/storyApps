import { StoriesPresenter, AuthPresenter } from './presenter.js'; // Import AuthPresenter juga
import { initMap, setupMapClickHandler, locateUser } from './map.js';
import { showToast } from './utils/helpers.js';

export let _capturedPhotoFile = null; // Variabel ini akan menyimpan objek File dari kamera

export function setCapturedPhotoFile(file) {
    _capturedPhotoFile = file;
}

// Fungsi public untuk mendapatkan nilai _capturedPhotoFile
export function getCapturedPhotoFile() {
    return _capturedPhotoFile;
}

export function updateAppHeaderNav(currentPath) {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;

    mainNav.innerHTML = '';
    let buttonsHtml = '';

    const isAuthenticated = !!localStorage.getItem('token');

    // --- DEBUGGING SANGAT SPESIFIK ---
    console.log('--- DEBUG updateAppHeaderNav ---');
    console.log('currentPath (RAW):', currentPath); // Akan menjadi "/stories"
    console.log('currentPath (JSON):', JSON.stringify(currentPath));
    console.log('Target Path for Stories (EXPECTED):', JSON.stringify('/stories')); // Target sekarang adalah "/stories" (tanpa hash)
    console.log('Target Path for Add Story (EXPECTED):', JSON.stringify('/add-story')); // Target "/add-story"
    console.log('Is Authenticated:', isAuthenticated);
    // --- AKHIR DEBUGGING SANGAT SPESIFIK ---

    if (isAuthenticated) {
        // --- PERBAIKAN DI SINI: HAPUS '#' DARI PERBANDINGAN ---
        if (currentPath === '/stories') { // <-- UBAH DARI '#/stories' MENJADI '/stories'
            buttonsHtml += `<button id="addStoryButton">Tambah Story Baru</button>`;
            console.log('Added Tambah Story Baru button HTML.');
        } else if (currentPath === '/add-story') { // <-- UBAH DARI '#/add-story' MENJADI '/add-story'
            buttonsHtml += `<button id="backToStoriesButton" onclick="location.hash='#/stories'">Kembali ke Stories</button>`;
            console.log('Added Kembali ke Stories button HTML.');
        }
        buttonsHtml += `<button id="logoutButton">Logout</button>`;
        console.log('Added Logout button HTML.');
    } else {
        // Tombol untuk user yang belum login
        if (currentPath === '/login') { // <-- UBAH DARI '#/login' MENJADI '/login'
            buttonsHtml += `<button id="registerPageButton" onclick="location.hash='#/register'">Daftar</button>`;
        } else if (currentPath === '/register') { // <-- UBAH DARI '#/register' MENJADI '/register'
            buttonsHtml += `<button id="loginPageButton" onclick="location.hash='#/login'">Login</button>`;
        }
    }

    console.log('Final buttonsHtml:', buttonsHtml);
    mainNav.innerHTML = buttonsHtml; // Set HTML tombol

    // Pasang Event Listeners setelah HTML dimasukkan
    if (document.getElementById('addStoryButton')) {
        document.getElementById('addStoryButton').addEventListener('click', () => {
            location.hash = '#/add-story';
        });
    }
    if (document.getElementById('logoutButton')) {
        document.getElementById('logoutButton').addEventListener('click', () => {
            localStorage.clear(); // Hapus semua data autentikasi
            location.hash = '#/login'; // Redirect ke halaman login
        });
    }
    // Tidak perlu event listener untuk tombol yang pakai onclick=""
}
// --- END: Fungsi Baru untuk Mengelola Navigasi Header ---


// Fungsi untuk menampilkan halaman login
export function showLogin() {
    const appDiv = document.getElementById('app');
    if (appDiv) {
        appDiv.innerHTML = `
            <main id="main">
                <h1>Login</h1>
                <form id="loginForm" class="form-container">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                    <button type="submit">Login</button>
                </form>
                <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
            </main>
        `;
        document.getElementById('loginForm').addEventListener('submit', AuthPresenter.handleLogin);
    } else {
        console.error("Elemen #app tidak ditemukan di showLogin!");
    }
    updateAppHeaderNav('#/login'); // Update nav header saat halaman login ditampilkan
}

// Fungsi untuk menampilkan halaman registrasi
export function showRegister() {
    const appDiv = document.getElementById('app');
    if (appDiv) {
        appDiv.innerHTML = `
            <main id="main">
                <h1>Daftar Akun Baru</h1>
                <form id="registerForm" class="form-container">
                    <label for="name">Nama:</label>
                    <input type="text" id="name" name="name" required>
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required>
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                    <button type="submit">Daftar</button>
                </form>
                <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
            </main>
        `;
        document.getElementById('registerForm').addEventListener('submit', AuthPresenter.handleRegister);
    } else {
        console.error("Elemen #app tidak ditemukan di showRegister!");
    }
    updateAppHeaderNav('#/register'); // Update nav header saat halaman register ditampilkan
}

// Fungsi untuk menampilkan halaman stories
export function showStories() {
    const appDiv = document.getElementById('app');
    if (appDiv) {
        // Hapus tag <nav> yang sebelumnya ada di sini, karena sekarang di index.html
        appDiv.innerHTML = `
            <main id="main">
                <h1>Story Terbaru</h1>
                <div id="map" style="height: 400px; width: 100%;">
                    <div class="map-loader loading-spinner"></div>
                </div>
                <h2>Daftar Story</h2>
                <button id="clearStoriesButton" class="clear-data-button">Hapus Semua Cerita Offline</button>                
                <div class="story-grid" id="storiesList">
                    <p style="text-align: center; color: #666;">Memuat cerita...</p>
                </div>
            </main>
        `;

        
        // --- PERBAIKAN: Pasang event listener untuk tombol Hapus Data ---
        document.getElementById('clearStoriesButton').addEventListener('click', () => {
            StoriesPresenter.clearAllStories(); // Panggil fungsi di Presenter
        });

        StoriesPresenter.loadStories();
    } else {
        console.error("Elemen #app tidak ditemukan di showStories!");
    }
    updateAppHeaderNav('#/stories'); // Update nav header saat halaman stories ditampilkan
}

// Fungsi untuk menampilkan halaman tambah story
export function showAddStory() {
    document.getElementById('app').innerHTML = `
        <main id="main">
            <h1>Tambah Story Baru</h1>
            <form id="addStoryForm" class="form-container">
                <label for="description">Deskripsi:</label>
                <textarea id="description" required></textarea>
                <div class="error-message" id="description-error"></div>
                <label for="photo">Foto:</label>
                <div class="photo-input">
                    <input type="file" id="photo" accept="image/*" capture="environment">
                    <button type="button" id="openCamera">Ambil Foto</button>
                </div>
                <div class="error-message" id="photo-error"></div>
                <div id="map" style="height: 300px;"></div>
                <div id="coordinates">Pilih lokasi di peta (opsional)</div>
                <input type="hidden" id="lat" name="lat">
                <input type="hidden" id="lon" name="lon">

                <button type="submit">Submit Story</button>
            </form>
        </main>
    `;
    
    // --- PERBAIKAN: Reset _capturedPhotoFile saat form Add Story ditampilkan ---
    setCapturedPhotoFile(null);
    // --- AKHIR PERBAIKAN ---

    initCamera();
    initStoryMapForAddStory();
    document.getElementById('addStoryForm').addEventListener('submit', StoriesPresenter.handleAddStory);
    updateAppHeaderNav('#/add-story');
}

// Fungsi untuk menginisialisasi fitur kamera
function initCamera() {
    let videoStream;

    document.getElementById('openCamera').addEventListener('click', async () => {
        try {
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const photoInputDiv = document.querySelector('.photo-input');
            if (!photoInputDiv) {
                console.error("Elemen .photo-input tidak ditemukan.");
                showToast("Elemen input foto tidak ditemukan.", "error");
                return;
            }

            photoInputDiv.innerHTML = `
                <video id="cameraVideo" style="width: 100%; max-width: 300px; display: block; margin: 10px auto;" autoplay playsinline></video>
                <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
                    <button type="button" id="capture">Capture</button>
                    <button type="button" id="cancelCamera">Batal</button>
                </div>
            `;

            const cameraVideoElement = document.getElementById('cameraVideo');
            if (!cameraVideoElement) {
                console.error("Elemen video kamera tidak ditemukan.");
                showToast("Video kamera tidak dapat ditampilkan.", "error");
                return;
            }

            cameraVideoElement.srcObject = videoStream;
            cameraVideoElement.play();

            cameraVideoElement.onplaying = () => {
                document.getElementById('capture').addEventListener('click', () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = cameraVideoElement.videoWidth;
                    canvas.height = cameraVideoElement.videoHeight;
                    canvas.getContext('2d').drawImage(cameraVideoElement, 0, 0);

                    canvas.toBlob(blob => {
                        const file = new File([blob], 'captured_photo.jpg', { type: 'image/jpeg' });
                        setCapturedPhotoFile(file); // <-- PERBAIKAN: Simpan file yang diambil ke variabel global

                        // --- KODE DEBUGGING ---
                        console.log('--- DEBUGGING CAMERA FILE ---');
                        console.log('Captured File Object:', file);
                        console.log('File name:', file.name);
                        console.log('File size:', file.size, 'bytes');
                        console.log('File type:', file.type);
                        console.log('File dimensions (canvas):', canvas.width, 'x', canvas.height);
                        console.log('File disimpan ke _capturedPhotoFile global.');
                        // Tampilkan gambar yang diambil secara sementara untuk verifikasi visual
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const imgPreview = document.createElement('img');
                            imgPreview.src = reader.result;
                            imgPreview.style.maxWidth = '150px'; imgPreview.style.height = 'auto';
                            imgPreview.style.border = '3px solid red'; imgPreview.style.marginTop = '20px';
                            imgPreview.style.marginBottom = '20px'; imgPreview.style.display = 'block';
                            imgPreview.style.margin = '20px auto'; imgPreview.id = 'debug-camera-preview';
                            const mainElement = document.querySelector('main#main');
                            if (mainElement) {
                                const existingPreview = document.getElementById('debug-camera-preview');
                                if (existingPreview) existingPreview.remove();
                                mainElement.appendChild(imgPreview);
                            } else { console.warn('Could not find main#main to append debug image preview.'); }
                            console.log('Gambar kamera preview (DataURL substring):', reader.result.substring(0, 50) + '...');
                            console.log('--- END DEBUGGING CAMERA FILE ---');
                        };
                        reader.readAsDataURL(file);
                        // --- AKHIR KODE DEBUGGING ---

                        // --- PERBAIKAN: Hapus kode yang mencoba mengisi input file asli ---
                        // const photoInputInForm = document.querySelector('#addStoryForm #photo');
                        // if (photoInputInForm) {
                        //     const dataTransfer = new DataTransfer();
                        //     dataTransfer.items.add(file);
                        //     photoInputInForm.files = dataTransfer.files;
                        // }
                        // --- AKHIR PERBAIKAN ---

                        // Hentikan kamera dan kembalikan tampilan input file asli
                        videoStream.getTracks().forEach(track => track.stop());
                        const newPhotoInputDiv = document.createElement('div');
                        newPhotoInputDiv.className = 'photo-input';
                        newPhotoInputDiv.innerHTML = `
                            <input type="file" id="photo" accept="image/*" capture="environment">
                            <button type="button" id="openCamera">Ambil Foto</button>
                            <span style="font-size: 0.9em; color: green; margin-left: 5px;">Foto diambil!</span>
                        `;
                        document.querySelector('.form-container .photo-input').replaceWith(newPhotoInputDiv);
                        initCamera();
                    }, 'image/jpeg', 0.8);
                });

                document.getElementById('cancelCamera')?.addEventListener('click', () => {
                    videoStream.getTracks().forEach(track => track.stop());
                    setCapturedPhotoFile(null); // <-- PERBAIKAN: Gunakan setter untuk menghapus file
                    const newPhotoInputDiv = document.createElement('div');
                    newPhotoInputDiv.className = 'photo-input';
                    newPhotoInputDiv.innerHTML = `
                        <input type="file" id="photo" accept="image/*" capture="environment">
                        <button type="button" id="openCamera">Ambil Foto</button>
                    `;
                    photoInputDiv.replaceWith(newPhotoInputDiv);
                    initCamera();
                });
            };
        } catch (error) {
            showToast('Akses kamera ditolak atau gagal: ' + error.message, 'error');
            console.error('Kesalahan akses kamera:', error);
        }
    });
}

// Fungsi untuk menginisialisasi peta pada halaman tambah story
function initStoryMapForAddStory() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Kontainer peta tidak ditemukan untuk halaman tambah story.');
        return;
    }

    const map = initMap('map', [-2.5489, 118.0149], 4); // Gunakan fungsi initMap dari map.js

    if (map) {
        const latInput = document.getElementById('lat');
        const lonInput = document.getElementById('lon');
        const coordinatesDisplay = document.getElementById('coordinates');

        // Setup click handler untuk memilih lokasi di peta
        setupMapClickHandler(map, (lat, lng) => {
            if (latInput && lonInput && coordinatesDisplay) {
                latInput.value = lat;
                lonInput.value = lng;
                coordinatesDisplay.textContent = `Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`;
            }
        });

        // Coba lokasi pengguna
        locateUser(map)
            .then(({ lat, lng }) => {
                if (latInput && lonInput && coordinatesDisplay) {
                    latInput.value = lat;
                    lonInput.value = lng;
                    coordinatesDisplay.textContent = `Lokasi Anda: Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`;
                }
            })
            .catch(error => {
                showToast(`Tidak dapat menemukan lokasi Anda: ${error}`, 'info');
                console.warn('Geolocation gagal:', error);
            });
    }
}