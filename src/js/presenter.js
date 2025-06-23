// src/js/presenter.js
import { StoryModel } from "./model.js";
import { validateStoryForm } from "./utils/validators.js";
import { registerPushNotification } from "./utils/notifications.js";
import { showToast } from "./utils/helpers.js";
import { AuthService } from "./auth.js";
import { AppError, handleError } from "./errorHandler.js";
// --- PERBAIKAN: Hapus CLUSTER_CONFIG dari import map.js ---
import { initMap, renderMarkers } from "./map.js"; // CLUSTER_CONFIG DIHAPUS DARI SINI
// --- AKHIR PERBAIKAN ---
import { getCapturedPhotoFile, setCapturedPhotoFile } from './view.js';
// --- PERBAIKAN: Import getStories, storeStory, deleteStoryById ---
import { getStories, storeStory, deleteStoryById, clearStories } from './db.js';
// --- AKHIR PERBAIKAN ---

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
            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    location.hash = '#/login';
                });
            } else {
                location.hash = '#/login';
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
            const stories = await StoryModel.getAll();

            // --- PERBAIKAN: Dapatkan status bookmark untuk setiap story ---
            const bookmarkedStories = await getStories();
            const bookmarkedStoryIds = new Set(bookmarkedStories.map(s => s.id));

            const storiesWithBookmarkStatus = stories.map(story => ({
                ...story,
                isBookmarked: bookmarkedStoryIds.has(story.id)
            }));
            // --- AKHIR PERBAIKAN ---

            this.renderStories(storiesWithBookmarkStatus);
            if (document.getElementById('map')) {
                this.renderMap(storiesWithBookmarkStatus);
            }
        } catch (error) {
            console.error("Gagal memuat stories:", error);
            showToast("Gagal memuat story. Coba lagi nanti.", "error");
            handleError(new AppError(error.message, "NETWORK", { originalError: error }));
        }
    }

  static async handleAddStory(e) {
        e.preventDefault();
        const form = e.target;
        const description = form.querySelector("#description").value;
        const lat = form.querySelector("#lat")?.value;
        const lon = form.querySelector("#lon")?.value;

        let photoFile = null;
        const localFileInput = form.querySelector("#photo");

        if (getCapturedPhotoFile()) {
            photoFile = getCapturedPhotoFile();
            console.log("Foto diambil dari kamera (via getter).");
        } else if (localFileInput && localFileInput.files[0]) {
            photoFile = localFileInput.files[0];
            console.log("Foto dipilih dari input lokal.");
        } else {
            console.log("Tidak ada file foto yang dipilih (akan ditangkap validasi jika wajib).");
        }

        const validation = validateStoryForm(photoFile, description);
        if (!validation.isValid) {
            validation.errors.forEach((error) => showToast(error, "error"));
            return;
        }

        const formData = new FormData();
        formData.append("description", description);

        if (photoFile) {
            formData.append("photo", photoFile);
            console.log("Foto ditambahkan ke FormData.");
        }

        if (lat && lon) {
            formData.append("lat", lat);
            formData.append("lon", lon);
        }

        try {
            await StoryModel.addStory(formData);
            form.reset();
            showToast("Story baru berhasil ditambahkan!", "success");

            setCapturedPhotoFile(null);

            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    location.hash = "#/stories";
                });
            } else {
                location.hash = "#/stories";
            }
            // await registerPushNotification(description); // <-- PERBAIKAN: Aktifkan ini nanti
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
                await storeStory(story);
                showToast(`Story '${story.name}' telah ditambahkan ke bookmark!`, "success");
            }
            this.loadStories();
        } catch (error) {
            console.error("Gagal mengelola bookmark:", error);
            showToast("Gagal mengelola bookmark.", "error");
            handleError(new AppError(error.message, "DB_ERROR", { originalError: error }));
        }
    }

    static async clearAllStories() {
        try {
            await clearStories();
            showToast("Semua cerita offline telah dihapus!", "info");
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