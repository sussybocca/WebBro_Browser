// Indexer.js – builds inverted index (used by worker)
export class Indexer {
    buildIndex(sites) {
        const index = new Map(); // term -> Map(docId -> count)
        const docLengths = new Map(); // docId -> total terms
        sites.forEach((site, docId) => {
            const text = (site.title + ' ' + site.content).toLowerCase();
            const terms = text.split(/\W+/).filter(t => t.length > 2);
            docLengths.set(docId, terms.length);
            const termCounts = new Map();
            terms.forEach(term => {
                termCounts.set(term, (termCounts.get(term) || 0) + 1);
            });
            termCounts.forEach((count, term) => {
                if (!index.has(term)) index.set(term, new Map());
                index.get(term).set(docId, count);
            });
        });
        return { index, docLengths, numDocs: sites.length };
    }
}
