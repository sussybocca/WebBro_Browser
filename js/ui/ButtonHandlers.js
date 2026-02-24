// ButtonHandlers.js – additional button handlers (settings, etc.)
export class ButtonHandlers {
    constructor(browserCore) {
        this.browser = browserCore;
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsBtn.addEventListener('click', () => {
            this.browser.tabManager.createTab('settings.html', true);
        });
    }
}
