// Tab.js – represents a single tab with iframe, history, and state
import { IframeSandbox } from '../sandbox/IframeSandbox.js';
import { SiteDatabase } from '../database/SiteDatabase.js';

export class Tab {
    constructor(id, browserCore) {
        this.id = id;
        this.browser = browserCore;
        this.iframe = null;
        this.history = []; // array of URLs
        this.historyIndex = -1;
        this.currentUrl = '';
        this.title = 'New Tab';
        this.favicon = '';
        this.sandbox = new IframeSandbox();
    }

    createIframe() {
        this.iframe = document.createElement('iframe');
        this.iframe.className = 'tab-iframe';
        this.iframe.id = `tab-${this.id}`;
        this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals'); // restrictive but functional
        this.iframe.setAttribute('allow', 'geolocation; microphone; camera'); // optional
        return this.iframe;
    }

    async init(url) {
        await this.navigate(url);
    }

    async navigate(input) {
        // Determine if input is a URL slug or search
        let url = input;
        if (!input.includes('.')) {
            // Look up in site database
            const site = this.browser.siteDB.getByUrl(input);
            if (site) {
                url = `internal:${site.url}`;
            } else {
                // Fallback: treat as search
                this.browser.performSearch(input);
                return;
            }
        }

        // Handle internal pages
        if (url.startsWith('internal:')) {
            const slug = url.substring(9);
            const site = this.browser.siteDB.getByUrl(slug);
            if (site) {
                this.loadInternalPage(site);
            } else {
                this.loadErrorPage('Site not found');
            }
        } else if (url.startsWith('http')) {
            // External URL – we'll proxy via iframe with srcdoc? Actually we can allow iframe to load external, but sandbox restricts.
            // For safety, we'll only allow internal or specific allowed domains.
            // But for now, we'll treat as internal search.
            this.browser.performSearch(input);
        } else {
            // Probably a search query
            this.browser.performSearch(input);
        }
    }

    loadInternalPage(site) {
        // Use srcdoc to inject content
        this.iframe.srcdoc = site.content;
        this.updateHistory(site.url);
        this.title = site.title;
        this.browser.urlBar.setValue(site.url);
        this.browser.tabBar.updateTab(this.id, { title: site.title });
        this.browser.historyDB.add({ url: site.url, title: site.title });
        this.browser.ga.event('pageview', { page: site.url });
    }

    loadErrorPage(message) {
        const errorHtml = `<html><body style="background:#1a1a2e;color:#f0f;font-family:monospace;padding:2rem;"><h1>Error</h1><p>${message}</p></body></html>`;
        this.iframe.srcdoc = errorHtml;
        this.title = 'Error';
    }

    updateHistory(url) {
        // If we are not at the end, truncate forward history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(url);
        this.historyIndex++;
        this.currentUrl = url;
    }

    canGoBack() {
        return this.historyIndex > 0;
    }

    canGoForward() {
        return this.historyIndex < this.history.length - 1;
    }

    goBack() {
        if (this.canGoBack()) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.navigate(url);
        }
    }

    goForward() {
        if (this.canGoForward()) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.navigate(url);
        }
    }

    reload() {
        if (this.currentUrl) {
            this.navigate(this.currentUrl);
        }
    }

    activate() {
        this.iframe.classList.add('active');
    }

    deactivate() {
        this.iframe.classList.remove('active');
    }

    destroy() {
        this.iframe.remove();
    }

    // For search results display
    showSearchResults(query, results) {
        const html = this.browser.searchEngine.renderResults(query, results);
        this.iframe.srcdoc = html;
        this.title = `Search: ${query}`;
        this.currentUrl = `search:${query}`;
        this.browser.urlBar.setValue(query);
        this.browser.tabBar.updateTab(this.id, { title: this.title });
    }
}
