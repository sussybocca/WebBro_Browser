// BookmarkDB.js – IndexedDB wrapper for bookmarks
import { openDB } from 'https://unpkg.com/idb?module';

export class BookmarkDB {
    async init() {
        this.db = await openDB('ChaosBrowser', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('bookmarks')) {
                    const store = db.createObjectStore('bookmarks', { keyPath: 'url' });
                    store.createIndex('added', 'added');
                }
            }
        });
        // Seed initial bookmarks if empty
        const count = await this.db.count('bookmarks');
        if (count === 0) {
            const response = await fetch('/data/bookmarks.json');
            const initial = await response.json();
            const tx = this.db.transaction('bookmarks', 'readwrite');
            await Promise.all(initial.map(b => tx.store.add(b)));
            await tx.done;
        }
    }

    async getAll() {
        return this.db.getAll('bookmarks');
    }

    async add(bookmark) {
        bookmark.added = Date.now();
        await this.db.put('bookmarks', bookmark);
    }

    async remove(url) {
        await this.db.delete('bookmarks', url);
    }

    async clear() {
        await this.db.clear('bookmarks');
    }

    async import(data) {
        const tx = this.db.transaction('bookmarks', 'readwrite');
        await tx.store.clear();
        await Promise.all(data.map(b => tx.store.add(b)));
        await tx.done;
    }
}
