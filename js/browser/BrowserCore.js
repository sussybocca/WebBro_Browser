// BrowserCore.js – orchestrates all components
import { TabManager } from './TabManager.js';
import { NavigationController } from './NavigationController.js';
import { TabBar } from '../ui/TabBar.js';
import { UrlBar } from '../ui/UrlBar.js';
import { ButtonHandlers } from '../ui/ButtonHandlers.js';
import { ContextMenu } from '../ui/ContextMenu.js';
import { SiteDatabase } from '../database/SiteDatabase.js';
import { BookmarkDB } from '../database/BookmarkDB.js';
import { HistoryDB } from '../database/HistoryDB.js';
import { SearchEngine } from '../search/SearchEngine.js';
import { GoogleAnalytics } from '../analytics/GoogleAnalytics.js';
import { IframeSandbox } from '../sandbox/IframeSandbox.js';
import { storage } from '../utils/storage.js';
import { constants } from '../utils/constants.js';

export class BrowserCore {
    constructor() {
        this.tabManager = new TabManager(this);
        this.navController = new NavigationController(this);
        this.siteDB = new SiteDatabase();
        this.bookmarkDB = new BookmarkDB();
        this.historyDB = new HistoryDB();
        this.searchEngine = new SearchEngine(this.siteDB);
        this.ga = new GoogleAnalytics();
        this.sandbox = new IframeSandbox();

        // UI components (will be initialized after DOM ready)
        this.tabBar = null;
        this.urlBar = null;
        this.buttonHandlers = null;
        this.contextMenu = null;

        this.currentTabId = null;
        this.settings = {};
    }

    async init() {
        // Load settings from localStorage
        this.settings = storage.get('chaosSettings', constants.DEFAULT_SETTINGS);

        // Apply theme
        this.applyTheme(this.settings.theme);

        // Initialize databases
        await this.siteDB.init();
        await this.bookmarkDB.init();
        await this.historyDB.init();

        // Build UI
        this.tabBar = new TabBar(this);
        this.urlBar = new UrlBar(this);
        this.buttonHandlers = new ButtonHandlers(this);
        this.contextMenu = new ContextMenu(this);

        // Create initial tab
        await this.tabManager.createTab('newtab.html', true);

        // Set up message listener for iframe communication
        window.addEventListener('message', this.handleMessage.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Track pageview
        this.ga.pageView('/');
    }

    applyTheme(theme) {
        const link = document.getElementById('theme-style');
        link.href = `css/themes/${theme}.css`;
        document.documentElement.style.setProperty('--glitch-intensity', this.settings.glitchIntensity);
    }

    handleMessage(event) {
        // Messages from iframes (built-in pages)
        const { type, ...data } = event.data;
        switch (type) {
            case 'navigate':
                this.navigateToUrl(data.url);
                break;
            case 'search':
                this.performSearch(data.query);
                break;
            case 'getSites':
                event.source.postMessage({ type: 'sitesList', sites: this.siteDB.getAllSites() }, '*');
                break;
            case 'getBookmarks':
                this.bookmarkDB.getAll().then(bookmarks => {
                    event.source.postMessage({ type: 'bookmarksList', bookmarks }, '*');
                });
                break;
            case 'removeBookmark':
                this.bookmarkDB.remove(data.url);
                break;
            case 'settingsChanged':
                this.settings = { ...this.settings, ...data.settings };
                storage.set('chaosSettings', this.settings);
                this.applyTheme(this.settings.theme);
                break;
            case 'clearHistory':
                this.historyDB.clear();
                break;
            case 'clearBookmarks':
                this.bookmarkDB.clear();
                break;
            case 'exportData':
                this.exportData(event.source);
                break;
            case 'importData':
                this.importData(data.data);
                break;
        }
    }

    navigateToUrl(input) {
        const tab = this.tabManager.getActiveTab();
        if (!tab) return;
        tab.navigate(input);
        this.urlBar.setValue(input);
        this.ga.event('navigation', { input });
    }

    performSearch(query) {
        const results = this.searchEngine.search(query);
        // Show results in a special tab or overlay
        const tab = this.tabManager.getActiveTab();
        if (tab) {
            tab.showSearchResults(query, results);
        }
        this.ga.event('search', { query });
    }

    handleKeyDown(e) {
        // Ctrl+T new tab
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            this.tabManager.createTab('newtab.html', true);
        }
        // Ctrl+W close tab
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
            this.tabManager.closeTab(this.currentTabId);
        }
        // Ctrl+Shift+Tab previous tab
        if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
            e.preventDefault();
            this.tabManager.activatePreviousTab();
        }
        // Ctrl+Tab next tab
        if (e.ctrlKey && !e.shiftKey && e.key === 'Tab') {
            e.preventDefault();
            this.tabManager.activateNextTab();
        }
        // Alt+Left back
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            this.navController.back();
        }
        // Alt+Right forward
        if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            this.navController.forward();
        }
        // Ctrl+R reload
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            this.navController.reload();
        }
        // Ctrl+D bookmark
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const tab = this.tabManager.getActiveTab();
            if (tab) {
                this.bookmarkDB.add({ url: tab.currentUrl, title: tab.title });
            }
        }
    }

    exportData(target) {
        Promise.all([
            this.bookmarkDB.getAll(),
            this.historyDB.getAll(),
            storage.get('chaosSettings', {})
        ]).then(([bookmarks, history, settings]) => {
            const data = { bookmarks, history, settings };
            target.postMessage({ type: 'exportDataResult', data: JSON.stringify(data) }, '*');
        });
    }

    importData(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            if (data.bookmarks) this.bookmarkDB.import(data.bookmarks);
            if (data.history) this.historyDB.import(data.history);
            if (data.settings) {
                storage.set('chaosSettings', data.settings);
                this.settings = data.settings;
                this.applyTheme(data.settings.theme);
            }
        } catch (e) {
            console.error('Import failed', e);
        }
    }
}
