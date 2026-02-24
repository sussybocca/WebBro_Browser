// SiteDatabase.js – loads sites.json and provides lookup
export class SiteDatabase {
    constructor() {
        this.sites = [];
        this.urlMap = new Map();
    }

    async init() {
        const response = await fetch('/data/sites.json');
        this.sites = await response.json();
        this.sites.forEach((site, index) => {
            this.urlMap.set(site.url, site);
        });
    }

    getByUrl(url) {
        return this.urlMap.get(url);
    }

    getAllSites() {
        return this.sites;
    }
}
