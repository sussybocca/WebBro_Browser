// SearchEngine.js – full-text search with worker
export class SearchEngine {
    constructor(siteDB) {
        this.siteDB = siteDB;
        this.worker = new Worker('/js/search/search.worker.js');
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.callbacks = new Map(); // id -> resolve
        this.requestId = 0;
    }

    async init() {
        const sites = this.siteDB.getAllSites();
        this.worker.postMessage({ type: 'buildIndex', sites });
    }

    search(query) {
        return new Promise((resolve) => {
            const id = this.requestId++;
            this.callbacks.set(id, resolve);
            this.worker.postMessage({ type: 'search', query, id });
        });
    }

    handleWorkerMessage(e) {
        const { id, results } = e.data;
        const resolve = this.callbacks.get(id);
        if (resolve) {
            resolve(results);
            this.callbacks.delete(id);
        }
    }

    renderResults(query, results) {
        if (results.length === 0) {
            return `<html><body style="background:#1a1a2e;color:#0ff;padding:2rem;"><h1>No results for "${query}"</h1></body></html>`;
        }
        const list = results.map(r => `<li><a href="#" onclick="parent.postMessage({type:'navigate',url:'${r.url}'},'*')">${r.title}</a> (score: ${r.score.toFixed(2)})</li>`).join('');
        return `<html><body style="background:#1a1a2e;color:#0ff;padding:2rem;"><h1>Search results for "${query}"</h1><ul>${list}</ul></body></html>`;
    }
}
