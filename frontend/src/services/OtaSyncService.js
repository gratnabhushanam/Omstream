import axios from 'axios';

class OtaSyncService {
    async syncContent() {
        try {
            // Get last sync cursor from localStorage
            const lastSync = localStorage.getItem('gita_last_sync') || 0;
            
            // Call Delta API
            const response = await axios.get(`/api/content/updates?lastSync=${lastSync}`);
            const data = response.data;
            
            if (data.status === 'success') {
                // Merge Data invisibly into Local Storage
                this.mergeIntoStorage('gita_slokas', data.deltas.slokas);
                this.mergeIntoStorage('gita_stories', data.deltas.stories);
                this.mergeIntoStorage('gita_videos', data.deltas.videos);
                this.mergeIntoStorage('gita_movies', data.deltas.movies);
                this.mergeIntoStorage('gita_songs', data.deltas.songs);
                
                // Update Cursor natively
                localStorage.setItem('gita_last_sync', data.serverTime);
                console.log(`[OTA SYNC] Completed successfully at ${data.serverTime}. Deltas merged.`);
            }
        } catch (error) {
            console.error('[OTA SYNC] Failed to synchronize app content:', error);
            // It fails gracefully in the background without disturbing the user
        } finally {
            await this.seedMissingStorage();
        }
    }

    async seedMissingStorage() {
        const seedTargets = [
            { key: 'gita_songs', endpoint: `/api/songs?_t=${Date.now()}` },
            { key: 'gita_stories', endpoint: `/api/stories?_t=${Date.now()}` },
            { key: 'gita_slokas', endpoint: `/api/slokas?_t=${Date.now()}` },
        ];

        for (const target of seedTargets) {
            if (this.hasValidStorage(target.key)) continue;
            try {
                const { data } = await axios.get(target.endpoint);
                if (Array.isArray(data) && data.length > 0) {
                    localStorage.setItem(target.key, JSON.stringify(data));
                    console.log(`[OTA SYNC] Seeded ${target.key} from ${target.endpoint}`);
                }
            } catch (error) {
                console.warn(`[OTA SYNC] Failed to seed ${target.key}:`, error.message || error);
            }
        }
    }

    hasValidStorage(storageKey) {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) && parsed.length > 0;
        } catch (e) {
            return false;
        }
    }

    mergeIntoStorage(storageKey, newItemsArray) {
        if (!newItemsArray || newItemsArray.length === 0) return;

        let existingData = [];
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) existingData = JSON.parse(raw);
        } catch (e) {
            console.error(`Failed to parse ${storageKey}`, e);
        }

        // Merge array by matching unique _id
        const dataMap = new Map(existingData.map(item => [item._id || item.id, item]));
        
        newItemsArray.forEach(item => {
            dataMap.set(item._id || item.id, item); // Overwrite or add natively
        });

        const mergedArray = Array.from(dataMap.values());
        localStorage.setItem(storageKey, JSON.stringify(mergedArray));
    }
}

export default new OtaSyncService();
