// search.worker.js – runs indexing and search in background
import { Indexer } from './Indexer.js';

const indexer = new Indexer();
let invertedIndex = null;
let docLengths = null;
let numDocs = 0;
let sites = [];

self.addEventListener('message', e => {
    const { type, sites: siteData, query, id } = e.data;
    if (type === 'buildIndex') {
        sites = siteData;
        const result = indexer.buildIndex(sites);
        invertedIndex = result.index;
        docLengths = result.docLengths;
        numDocs = result.numDocs;
        self.postMessage({ type: 'indexReady' });
    } else if (type === 'search') {
        if (!invertedIndex) return;
        const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
        const scores = new Map(); // docId -> score
        queryTerms.forEach(term => {
            const postings = invertedIndex.get(term);
            if (postings) {
                const idf = Math.log(numDocs / postings.size);
                postings.forEach((count, docId) => {
                    const tf = count / docLengths.get(docId);
                    scores.set(docId, (scores.get(docId) || 0) + tf * idf);
                });
            }
        });
        const results = Array.from(scores.entries())
            .map(([docId, score]) => ({ ...sites[docId], score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);
        self.postMessage({ id, results });
    }
});
