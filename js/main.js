// main.js – entry point
import { BrowserCore } from './browser/BrowserCore.js';
import { ChaosEffects } from './ui/ChaosEffects.js';
import { GoogleAnalytics } from './analytics/GoogleAnalytics.js';

(async () => {
    // Initialize chaotic background effects
    const chaos = new ChaosEffects();
    chaos.init();

    // Initialize Google Analytics (if enabled in settings)
    const ga = new GoogleAnalytics('G-XXXXXXXXXX');
    ga.init();

    // Start the browser core
    const browser = new BrowserCore();
    await browser.init();

    // Expose for debugging (optional)
    window.chaosBrowser = browser;
})();
