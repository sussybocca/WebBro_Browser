// NavigationController.js – handles back/forward/reload for active tab
export class NavigationController {
    constructor(browserCore) {
        this.browser = browserCore;
        this.backBtn = document.getElementById('backBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.reloadBtn = document.getElementById('reloadBtn');

        this.backBtn.addEventListener('click', () => this.back());
        this.forwardBtn.addEventListener('click', () => this.forward());
        this.reloadBtn.addEventListener('click', () => this.reload());
    }

    back() {
        const tab = this.browser.tabManager.getActiveTab();
        if (tab && tab.canGoBack()) {
            tab.goBack();
            this.updateButtons(tab.canGoBack(), tab.canGoForward());
        }
    }

    forward() {
        const tab = this.browser.tabManager.getActiveTab();
        if (tab && tab.canGoForward()) {
            tab.goForward();
            this.updateButtons(tab.canGoBack(), tab.canGoForward());
        }
    }

    reload() {
        const tab = this.browser.tabManager.getActiveTab();
        if (tab) {
            tab.reload();
        }
    }

    updateButtons(back, forward) {
        this.backBtn.disabled = !back;
        this.forwardBtn.disabled = !forward;
    }
}
