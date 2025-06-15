const VAPID_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
const API_BASE = 'https://story-api.dicoding.dev/v1';

export const registerPushNotification = async (description) => {
    try {
        // Cek service worker support
        if (!('serviceWorker' in navigator)) return;

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Subscribe push notification
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
        });

        // Kirim subscription ke server
        await saveSubscription(subscription);
        
        // Tampilkan notifikasi lokal
        showLocalNotification(description);
    } catch (error) {
        console.error('Notification error:', error);
    }
};

// Helper functions
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
    
    if (!response.ok) throw new Error('Failed to save subscription');
}

function showLocalNotification(description) {
    if (Notification.permission === 'granted') {
        new Notification('Story Baru', {
            body: description.slice(0, 50) + (description.length > 50 ? '...' : ''),
            icon: '/assets/icons/icon-192x192.png'
        });
    }
}