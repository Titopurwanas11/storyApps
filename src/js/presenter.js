import { StoryModel } from "./model.js";
import { validateStoryForm } from "./utils/validators.js";
import { registerPushNotification } from "./utils/notifications.js";
import { showToast } from "./utils/helpers.js";
import { AuthService } from "./auth.js";
import { AppError, handleError } from "./errorHandler.js";
import { initMap, renderMarkers } from "./map.js";
import { getCapturedPhotoFile, setCapturedPhotoFile } from './view.js';
import { getStories, storeStory, deleteStoryById } from './db.js';

let mapInstanceForStories = null;

export class AuthPresenter {
  static async handleLogin(e) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      await AuthService.login(email, password);

      if (document.startViewTransition) {
        document.startViewTransition(() => {
          location.hash = "#/stories";
        });
      } else {
        location.hash = "#/stories";
      }
    } catch (error) {
      handleError(
        new AppError(error.message, "AUTH", {
          code: error.code,
          originalError: error,
        })
      );
    }
  }

   static async handleRegister(e) {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            const response = await fetch('https://story-api.dicoding.dev/v1/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new AppError(error.message || 'Gagal mendaftar', 'AUTH', { originalError: error });
            }

            showToast('Registrasi berhasil! Silakan login.', 'success');
            // Jika berhasil, arahkan ke halaman login
            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    location.hash = '#/login';
                });
            } else {
                location.hash = '#/login';
            }
        } catch (error) {
            handleError(
                new AppError(error.message, "AUTH", { // Gunakan tipe AUTH untuk error registrasi
                    code: error.code, // Error code dari API jika ada
                    originalError: error,
                })
            );
        }
    }

  static async checkAuth() {
    try {
      await AuthService.getValidToken();
      return true;
    } catch (error) {
      handleError(
        new AppError("Authentication required", "AUTH", {
          code: "UNAUTHENTICATED",
        })
      );
      return false;
    }
  }
}

export class StoriesPresenter {
    static async loadStories() {
        try {
            const stories = await StoryModel.getAll(); // Sekarang hanya fetch dari jaringan

            // --- PERBAIKAN: Dapatkan status bookmark untuk setiap story ---
            const bookmarkedStories = await getStories(); // Ambil semua story yang di-bookmark
            const bookmarkedStoryIds = new Set(bookmarkedStories.map(s => s.id));

            // Tambahkan properti isBookmarked ke setiap story
            const storiesWithBookmarkStatus = stories.map(story => ({
                ...story,
                isBookmarked: bookmarkedStoryIds.has(story.id)
            }));
            // --- AKHIR PERBAIKAN ---

            this.renderStories(storiesWithBookmarkStatus); // Render dengan status bookmark
            if (document.getElementById('map')) {
                this.renderMap(storiesWithBookmarkStatus);
            }
        } catch (error) {
            console.error("Gagal memuat stories:", error);
            showToast("Gagal memuat story. Coba lagi nanti.", "error");
            handleError(new AppError(error.message, "NETWORK", { originalError: error })); // Tambahkan penanganan error jaringan
        }
    }

  static async handleAddStory(e) {
        e.preventDefault();
        const form = e.target;
        const description = form.querySelector("#description").value;
        const lat = form.querySelector("#lat")?.value;
        const lon = form.querySelector("#lon")?.value;

        // --- START PERBAIKAN: Ambil foto dari _capturedPhotoFile atau input lokal ---
        let photoFile = null;
        const localFileInput = form.querySelector("#photo");

        if (getCapturedPhotoFile()) { // Prioritaskan file dari kamera via getter
            photoFile = getCapturedPhotoFile();
            console.log("Foto diambil dari kamera (via getter).");
        } else if (localFileInput && localFileInput.files[0]) {
            photoFile = localFileInput.files[0];
            console.log("Foto dipilih dari input lokal.");
        } else {
            console.log("Tidak ada file foto yang dipilih (akan ditangkap validasi jika wajib).");
        }
        // --- AKHIR PERBAIKAN ---

        // Validasi Form - ini sekarang akan memeriksa photoFile
        const validation = validateStoryForm(photoFile, description);
        if (!validation.isValid) {
            validation.errors.forEach((error) => showToast(error, "error"));
            return;
        }

        const formData = new FormData();
        formData.append("description", description);

        // --- PERBAIKAN: Hanya tambahkan 'photo' field jika photoFile valid ---
        // Karena validasi sudah membuat foto wajib (jika kita mengikuti API),
        // photoFile seharusnya selalu ada di sini jika validasi lolos.
        if (photoFile) {
            formData.append("photo", photoFile);
            console.log("Foto ditambahkan ke FormData.");
        }
        // --- AKHIR PERBAIKAN ---

        if (lat && lon) {
            formData.append("lat", lat);
            formData.append("lon", lon);
        }

        try {
            await StoryModel.addStory(formData);
            form.reset();
            showToast("Story baru berhasil ditambahkan!", "success");

            // --- PERBAIKAN: Reset _capturedPhotoFile setelah sukses submit ---
              setCapturedPhotoFile(null);            // --- AKHIR PERBAIKAN ---

            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    location.hash = "#/stories";
                });
            } else {
                location.hash = "#/stories";
            }
            // await registerPushNotification(description);
        } catch (error) {
            console.error("Gagal menambahkan story:", error);
            showToast(`Gagal: ${error.message}`, "error");
            handleError(new AppError(error.message, "API_ERROR", { originalError: error }));
        }
        
    }

    static async toggleBookmark(story) {
        try {
            if (story.isBookmarked) {
                await deleteStoryById(story.id);
                showToast(`Story '${story.name}' telah dihapus dari bookmark.`, "info");
            } else {
                await storeStory(story); // Simpan seluruh objek story
                showToast(`Story '${story.name}' telah ditambahkan ke bookmark!`, "success");
            }
            // Muat ulang stories untuk memperbarui tampilan tombol
            this.loadStories();
        } catch (error) {
            console.error("Gagal mengelola bookmark:", error);
            showToast("Gagal mengelola bookmark.", "error");
            handleError(new AppError(error.message, "DB_ERROR", { originalError: error }));
        }
    }
    
  static async clearAllStories() {
        try {
            await clearStories(); // Panggil fungsi dari db.js
            showToast("Semua cerita offline telah dihapus!", "info");
            // Setelah menghapus, muat ulang cerita (akan kosong atau fetch dari jaringan)
            this.loadStories();
        } catch (error) {
            console.error("Gagal menghapus cerita offline:", error);
            showToast("Gagal menghapus cerita offline.", "error");
            handleError(new AppError(error.message, "DB_ERROR", { originalError: error }));
        }
    }
    
  static renderStories(stories) {
        const container = document.getElementById("storiesList");
        if (!container) return;

        container.innerHTML = stories
            .map(
                (story) => `
                    <article class="story-card" aria-labelledby="story-${story.id}">
                        <img
                            src="${story.photoUrl}"
                            alt="${story.description || "Story image"}"
                            loading="lazy"
                        >
                        <div class="story-content">
                            <h3 id="story-${story.id}">${story.name}</h3>
                            <p>${story.description}</p>
                            <time datetime="${story.createdAt}">
                                ${new Date(story.createdAt).toLocaleDateString('id-ID')}
                            </time>
                            ${
                                story.lat && story.lon
                                    ? `
                                    <div class="map-marker" data-lat="${story.lat}" data-lon="${story.lon}">
                                        📍 Lokasi
                                    </div>
                                    `
                                    : ""
                            }
                        </div>
                    </article>
                `
            )
            .join("");
    }

    static renderMap(stories) {
        const mapContainer = document.getElementById("map");
        if (!mapContainer) return;

        const mapLoader = mapContainer.querySelector('.map-loader');
        if (mapLoader) {
            mapLoader.remove();
        }

        if (!mapInstanceForStories) {
            mapInstanceForStories = initMap('map');
        }

        if (mapInstanceForStories) {
            if (mapInstanceForStories._markerCluster) {
                mapInstanceForStories.removeLayer(mapInstanceForStories._markerCluster);
            }
            renderMarkers(mapInstanceForStories, stories);
        }
    }
}