// TabManager.js – manages tabs, persistence, and tab bar updates
import { Tab } from './Tab.js';
import { storage } from '../utils/storage.js';
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'; // or custom uuid

export class TabManager {
    constructor(browserCore) {
        this.browser = browserCore;
        this.tabs = new Map(); // id -> Tab instance
        this.tabOrder = []; // array of ids
        this.activeTabId = null;
    }

    async init() {
        // Restore tabs from session (if any)
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

    async createTab(url, activate = true, existingId = null) {
        const id = existingId || uuidv4();
        const tab = new Tab(id, this.browser);
        this.tabs.set(id, tab);
        this.tabOrder.push(id);

        // Create iframe element
        const iframe = tab.createIframe();
        document.getElementById('viewport').appendChild(iframe);

        await tab.init(url);

        if (activate) {
            this.activateTab(id);
        }

        this.browser.tabBar.render(this.tabOrder, this.activeTabId);
        this.saveSession();
        return tab;
    }

    activateTab(id) {
        if (!this.tabs.has(id)) return;
        if (this.activeTabId) {
            const oldTab = this.tabs.get(this.activeTabId);
            oldTab.deactivate();
        }
        this.activeTabId = id;
        const newTab = this.tabs.get(id);
        newTab.activate();
        this.browser.urlBar.setValue(newTab.currentUrl);
        this.browser.tabBar.render(this.tabOrder, this.activeTabId);
        this.browser.navController.updateButtons(newTab.canGoBack(), newTab.canGoForward());
    }

    closeTab(id) {
        if (this.tabs.size === 1) {
            // Don't close last tab; create new tab instead
            this.createTab('newtab.html', true);
            // then close this one? Actually better to just navigate
            // For simplicity, we'll allow closing last tab but then create new
        }
        const tab = this.tabs.get(id);
        if (tab) {
            tab.destroy();
            this.tabs.delete(id);
            const index = this.tabOrder.indexOf(id);
            if (index !== -1) this.tabOrder.splice(index, 1);
        }
        if (this.activeTabId === id) {
            // Activate next tab or previous
            if (this.tabOrder.length > 0) {
                this.activateTab(this.tabOrder[Math.min(index, this.tabOrder.length-1)]);
            } else {
                // Should not happen, but just in case
                this.createTab('newtab.html', true);
            }
        }
        this.browser.tabBar.render(this.tabOrder, this.activeTabId);
        this.saveSession();
    }

    getActiveTab() {
        return this.tabs.get(this.activeTabId);
    }

    activateNextTab() {
        if (this.tabOrder.length < 2) return;
        const currentIdx = this.tabOrder.indexOf(this.activeTabId);
        const nextIdx = (currentIdx + 1) % this.tabOrder.length;
        this.activateTab(this.tabOrder[nextIdx]);
    }

    activatePreviousTab() {
        if (this.tabOrder.length < 2) return;
        const currentIdx = this.tabOrder.indexOf(this.activeTabId);
        const prevIdx = (currentIdx - 1 + this.tabOrder.length) % this.tabOrder.length;
        this.activateTab(this.tabOrder[prevIdx]);
    }

    saveSession() {
        // Save only URLs and IDs, not full state
        const session = this.tabOrder.map(id => {
            const tab = this.tabs.get(id);
            return { id, url: tab.currentUrl };
        });
        storage.set('sessionTabs', session);
    }
}
