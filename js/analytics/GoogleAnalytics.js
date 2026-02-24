// GoogleAnalytics.js – wrapper with custom events
export class GoogleAnalytics {
    constructor(measurementId) {
        this.measurementId = measurementId;
        this.enabled = true; // check settings
    }

    init() {
        // Check if user opted out
        const settings = JSON.parse(localStorage.getItem('chaosSettings') || '{}');
        this.enabled = settings.analyticsEnabled !== false;
    }

    pageView(path) {
        if (!this.enabled || typeof gtag === 'undefined') return;
        gtag('config', this.measurementId, { page_path: path });
    }

    event(action, params) {
        if (!this.enabled || typeof gtag === 'undefined') return;
        gtag('event', action, params);
    }
}
