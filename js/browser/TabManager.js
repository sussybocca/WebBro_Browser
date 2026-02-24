// TabManager.js – manages tabs, persistence, and tab bar updates
import { Tab } from './Tab.js';
import { storage } from '../utils/storage.js';
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

export class TabManager {
    constructor(browserCore) {
        this.browser = browserCore;
        this.tabs = new Map(); // id -> Tab instance
        this.tabOrder = [];    // array of ids in order
        this.activeTabId = null;
    }

    /**
     * Initialize tabs from saved session or create default new tab.
     */
    async init() {
        const saved = storage.get('sessionTabs', []);
        for (const tabData of saved) {
            await this.createTab(tabData.url, false, tabData.id);
        }
        if (this.tabOrder.length === 0) {
            await this.createTab('newtab.html', true);
        } else {
            this.activateTab(this.tabOrder[0]);
        }
    }

    /**
     * Create a new tab. If activate is true, switch to it immediately.
     * @param {string} url - Initial URL to load.
     * @param {boolean} activate - Whether to activate the new tab.
     * @param {string|null} existingId - Optional existing ID for session restore.
     * @returns {Promise<Tab>} The created tab.
     */
    async createTab(url, activate = true, existingId = null) {
        const id = existingId || uuidv4();
        const tab = new Tab(id, this.browser);
        this.tabs.set(id, tab);
        this.tabOrder.push(id);

        const iframe = tab.createIframe();
        const viewport = document.getElementById('viewport');
        if (!viewport) throw new Error('Viewport element not found');
        viewport.appendChild(iframe);

        await tab.init(url);

        if (activate) {
            this.activateTab(id);
        }

        this.browser.tabBar.render(this.tabOrder, this.activeTabId);
        this.saveSession();
        return tab;
    }

    /**
     * Activate a tab by ID.
     * @param {string} id - Tab ID to activate.
     */
    activateTab(id) {
        if (!this.tabs.has(id)) return;

        // Deactivate current tab if any
        if (this.activeTabId) {
            const oldTab = this.tabs.get(this.activeTabId);
            if (oldTab && typeof oldTab.deactivate === 'function') {
                oldTab.deactivate();
            }
        }

        this.activeTabId = id;
        const newTab = this.tabs.get(id);
        newTab.activate();

        // Update navigation buttons based on new tab's history
        this.browser.navController.updateButtons(newTab.canGoBack(), newTab.canGoForward());

        // Update URL bar
        this.browser.urlBar.setValue(newTab.currentUrl || '');

        // Re-render tab bar to reflect active state
        this.browser.tabBar.render(this.tabOrder, this.activeTabId);
    }

    /**
     * Close a tab by ID.
     * @param {string} id - Tab ID to close.
     */
    closeTab(id) {
        if (!this.tabs.has(id)) return;

        // If this is the last tab, create a new one before closing
        if (this.tabs.size === 1) {
            this.createTab('newtab.html', true);
            // The new tab will become active; we still need to remove this one
        }

        const tab = this.tabs.get(id);
        const index = this.tabOrder.indexOf(id);

        // Remove from DOM and maps
        tab.destroy();
        this.tabs.delete(id);
        if (index !== -1) {
            this.tabOrder.splice(index, 1);
        }

        // If the closed tab was active, activate another tab
        if (this.activeTabId === id) {
            if (this.tabOrder.length > 0) {
                // Activate the tab at the same index if possible, otherwise the previous one
                const newIndex = Math.min(index, this.tabOrder.length - 1);
                this.activateTab(this.tabOrder[newIndex]);
            } else {
                // No tabs left (shouldn't happen due to the guard above, but just in case)
                this.activeTabId = null;
            }
        }

        this.browser.tabBar.render(this.tabOrder, this.activeTabId);
        this.saveSession();
    }

    /**
     * Get the currently active tab.
     * @returns {Tab|null}
     */
    getActiveTab() {
        return this.activeTabId ? this.tabs.get(this.activeTabId) : null;
    }

    /**
     * Activate the next tab in order.
     */
    activateNextTab() {
        if (this.tabOrder.length < 2) return;
        const currentIdx = this.tabOrder.indexOf(this.activeTabId);
        const nextIdx = (currentIdx + 1) % this.tabOrder.length;
        this.activateTab(this.tabOrder[nextIdx]);
    }

    /**
     * Activate the previous tab in order.
     */
    activatePreviousTab() {
        if (this.tabOrder.length < 2) return;
        const currentIdx = this.tabOrder.indexOf(this.activeTabId);
        const prevIdx = (currentIdx - 1 + this.tabOrder.length) % this.tabOrder.length;
        this.activateTab(this.tabOrder[prevIdx]);
    }

    /**
     * Save current session (tab order and URLs) to storage.
     */
    saveSession() {
        const session = this.tabOrder.map(id => {
            const tab = this.tabs.get(id);
            return {
                id,
                url: tab ? tab.currentUrl || 'newtab.html' : 'newtab.html'
            };
        });
        storage.set('sessionTabs', session);
    }
}
