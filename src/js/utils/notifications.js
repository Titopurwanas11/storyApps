// src/js/utils/notifications.js

const PUBLIC_VAPID_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk'; // Gunakan nama yang lebih jelas
const API_BASE = 'https://story-api.dicoding.dev/v1';

// --- VARIABEL GLOBAL UNTUK MENYIMPAN SERVICE WORKER REGISTRATION ---
let globalServiceWorkerRegistration = null;

// Helper functions (tetap sama)
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function saveSubscription(subscription) {
    const response = await fetch(`${API_BASE}/notifications/subscribe`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save subscription');
    }
}

function showLocalNotification(description) {
    if (Notification.permission === 'granted') {
        new Notification('Story Baru', {
            body: description.slice(0, 50) + (description.length > 50 ? '...' : ''),
            // --- PERBAIKAN: Pastikan path icon benar ---
            icon: '/storyApps/assets/icons/icon-192x192.png'
        });
    }
}

// --- FUNGSI BARU: Untuk menginisialisasi Service Worker (dipanggil sekali saat app dimuat) ---
export async function initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // PERBAIKAN KRUSIAL: Gunakan await dan tangkap hasilnya
            const registration = await navigator.serviceWorker.register("/storyApps/sw.js", {
                scope: '/storyApps/' // Menetapkan scope dengan eksplisit
            });
            console.log('ServiceWorker registered with scope:', registration.scope);
            globalServiceWorkerRegistration = registration; // Simpan objek registrasi ke variabel global
            return registration;
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
            globalServiceWorkerRegistration = null; // Pastikan null jika gagal
            throw error; // Lempar kembali error agar bisa ditangani di app.js
        }
    } else {
        console.warn('Service Workers are not supported in this browser.');
        throw new Error('Service Workers not supported');
    }
}

// --- FUNGSI YANG DIUPDATE: Untuk register push notification (dipanggil saat add story) ---
export const registerPushNotification = async (description) => {
    // Pastikan Service Worker sudah terdaftar
    if (!globalServiceWorkerRegistration) {
        console.warn('Service Worker not initialized. Attempting to initialize now...');
        try {
            // Coba inisialisasi jika belum ada, atau jika sebelumnya gagal
            await initializeServiceWorker();
            if (!globalServiceWorkerRegistration) {
                throw new Error('Could not get a valid Service Worker registration for push.');
            }
        } catch (error) {
            console.error('Failed to initialize Service Worker for push:', error);
            showLocalNotification('Gagal mengaktifkan notifikasi: SW tidak siap.'); // Notifikasi fallback
            return;
        }
    }

    try {
        // Cek apakah sudah ada subscription yang aktif
        const existingSubscription = await globalServiceWorkerRegistration.pushManager.getSubscription();
        if (existingSubscription) {
            console.log('Existing push subscription found.', existingSubscription);
            // Anda bisa mengirim ulang subscription ini ke server jika diperlukan
            // await saveSubscription(existingSubscription);
        } else {
            // Jika belum ada, buat subscription baru
            const subscription = await globalServiceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });
            console.log('New push subscription created.', subscription);
            await saveSubscription(subscription);
        }

        // Tampilkan notifikasi lokal setelah subscription berhasil atau sudah ada
        showLocalNotification(description);

    } catch (error) {
        console.error('Notification (push) error:', error);
        // Tangani error izin atau masalah subscribe lainnya
        if (Notification.permission === 'denied') {
            alert('Anda telah memblokir notifikasi. Izinkan di pengaturan browser.');
        } else {
            alert('Gagal mengaktifkan notifikasi push. Coba lagi nanti.');
        }
    }
};