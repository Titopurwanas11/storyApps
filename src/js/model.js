// src/js/model.js
import { getStories, storeStory } from './db.js'; // <-- PERBAIKAN: Import IndexedDB functions

const API_BASE = 'https://story-api.dicoding.dev/v1';

export class StoryModel {
    static async getAll() {
        // --- START PERBAIKAN: Implementasi Cache, then Network ---
        const cachedStories = await getStories(); // Coba ambil dari IndexedDB
        if (cachedStories.length > 0) {
            console.log('Serving stories from IndexedDB cache.');
            return cachedStories; // Sajikan dari cache segera
        }

        // Jika tidak ada di cache, baru fetch dari jaringan
        console.log('Fetching stories from network...');
        const response = await fetch(`${API_BASE}/stories`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            // Jika fetch gagal (misal: offline), coba ambil lagi dari IndexedDB (fallback)
            const fallbackStories = await getStories();
            if (fallbackStories.length > 0) {
                console.warn('Network fetch failed, serving from IndexedDB fallback.');
                return fallbackStories;
            }
            throw new Error('Failed to fetch stories and no offline data available.');
        }

        const data = await response.json();
        const fetchedStories = data.listStory;

        // Simpan cerita yang baru diambil ke IndexedDB untuk penggunaan di masa mendatang
        if (fetchedStories.length > 0) {
            for (const story of fetchedStories) {
                await storeStory(story); // Simpan setiap cerita
            }
            console.log('Stories fetched from network and stored in IndexedDB.');
        }
        return fetchedStories;
        // --- AKHIR PERBAIKAN ---
    }

    static async addStory(formData) {
        const response = await fetch(`${API_BASE}/stories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add story');
        }

        const newStoryData = await response.json();
        
        return newStoryData;
    }
}