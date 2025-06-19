const API_BASE = 'https://story-api.dicoding.dev/v1';

export class StoryModel {
    static async getAll() {
        // --- PERBAIKAN: Hapus seluruh logika IndexedDB caching otomatis ---
        console.log('Fetching all stories from network...');
        const response = await fetch(`${API_BASE}/stories`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            // Jika fetch gagal (misal: offline), lempar error.
            // Presenter akan menanganinya dan menampilkan pesan error.
            throw new Error('Failed to fetch stories from network.');
        }

        const data = await response.json();
        const fetchedStories = data.listStory;
        console.log('Stories fetched from network.');
        // HAPUS: for (const story of fetchedStories) { await storeStory(story); }
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