// ContextMenu.js – custom right‑click menu
export class ContextMenu {
    constructor(browserCore) {
        this.browser = browserCore;
        this.menu = null;
        document.addEventListener('contextmenu', this.onContextMenu.bind(this));
        document.addEventListener('click', this.hide.bind(this));
    }

    onContextMenu(e) {
        e.preventDefault();
        this.hide();

        const target = e.target;
        let menuItems = [];

        if (target.closest('.tab')) {
            const tabId = target.closest('.tab').dataset.tabId;
            menuItems = [
                { label: 'Reload Tab', action: () => this.browser.tabManager.tabs.get(tabId)?.reload() },
                { label: 'Close Tab', action: () => this.browser.tabManager.closeTab(tabId) },
                { label: 'Duplicate Tab', action: () => this.browser.tabManager.createTab(this.browser.tabManager.tabs.get(tabId).currentUrl, true) },
            ];
        } else if (target.closest('iframe')) {
            menuItems = [
                { label: 'Back', action: () => this.browser.navController.back() },
                { label: 'Forward', action: () => this.browser.navController.forward() },
                { label: 'Reload', action: () => this.browser.navController.reload() },
                { label: 'Bookmark', action: () => document.getElementById('bookmarkBtn').click() },
            ];
        } else {
            menuItems = [
                { label: 'New Tab', action: () => this.browser.tabManager.createTab('newtab.html', true) },
                { label: 'Bookmarks', action: () => this.browser.tabManager.createTab('bookmarks.html', true) },
                { label: 'History', action: () => this.browser.tabManager.createTab('history.html', true) },
                { label: 'Settings', action: () => this.browser.tabManager.createTab('settings.html', true) },
            ];
        }

        this.show(e.pageX, e.pageY, menuItems);
    }

    show(x, y, items) {
        this.menu = document.createElement('div');
        this.menu.className = 'context-menu';
        this.menu.style.left = x + 'px';
        this.menu.style.top = y + 'px';
        this.menu.innerHTML = items.map(item => {
            if (item.divider) return '<div class="context-menu-divider"></div>';
            return `<div class="context-menu-item">${item.label}</div>`;
        }).join('');
        this.menu.addEventListener('click', e => {
            const index = Array.from(this.menu.children).indexOf(e.target);
            if (index >= 0 && items[index] && items[index].action) {
                items[index].action();
            }
            this.hide();
        });
        document.body.appendChild(this.menu);
    }

    hide() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    }
}
