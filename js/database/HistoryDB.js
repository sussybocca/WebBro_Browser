// HistoryDB.js – IndexedDB wrapper for history
import { openDB } from 'https://unpkg.com/idb?module';

export class HistoryDB {
    async init() {
        this.db = await openDB('ChaosBrowser', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('history')) {
                    const store = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('url', 'url');
                }
            }
        });
    }

    async add(entry) {
        // entry should have { url, title, timestamp? }
        if (!entry.timestamp) entry.timestamp = Date.now();
        await this.db.add('history', entry);
        // Optionally limit history size
        await this.prune(1000); // keep last 1000 entries
    }

    async getAll(limit = 100) {
        const tx = this.db.transaction('history', 'readonly');
        let entries = await tx.store.index('timestamp').getAll();
        // Sort descending (newest first)
        entries.sort((a, b) => b.timestamp - a.timestamp);
        return entries.slice(0, limit);
    }

    async clear() {
        await this.db.clear('history');
    }

    async prune(maxEntries) {
        const tx = this.db.transaction('history', 'readwrite');
        let entries = await tx.store.index('timestamp').getAll();
        if (entries.length > maxEntries) {
            entries.sort((a, b) => a.timestamp - b.timestamp); // oldest first
            const toDelete = entries.slice(0, entries.length - maxEntries);
            for (const entry of toDelete) {
                await tx.store.delete(entry.id);
            }
        }
        await tx.done;
    }

    async import(data) {
        await this.clear();
        const tx = this.db.transaction('history', 'readwrite');
        for (const entry of data) {
            await tx.store.add(entry);
        }
        await tx.done;
    }
}
