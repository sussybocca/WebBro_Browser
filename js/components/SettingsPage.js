// SettingsPage.js – advanced settings page with live preview, import/export, and validation
export async function initSettingsPage() {
    const themeSelect = document.getElementById('themeSelect');
    const glitchIntensity = document.getElementById('glitchIntensity');
    const bgEffect = document.getElementById('bgEffect');
    const searchEngine = document.getElementById('searchEngine');
    const suggestionsEnabled = document.getElementById('suggestionsEnabled');
    const historyEnabled = document.getElementById('historyEnabled');
    const analyticsEnabled = document.getElementById('analyticsEnabled');
    const maxTabs = document.getElementById('maxTabs');
    const homepage = document.getElementById('homepage');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const clearBookmarksBtn = document.getElementById('clearBookmarksBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFile = document.getElementById('importFile');

    let currentSettings = {};

    // Request current settings from parent
    window.parent.postMessage({ type: 'getSettings' }, '*');

    window.addEventListener('message', function handler(event) {
        if (event.data.type === 'settings') {
            currentSettings = event.data.settings;
            populateForm(currentSettings);
        }
        if (event.data.type === 'exportDataResult') {
            downloadJSON(event.data.data, 'chaos-browser-backup.json');
        }
    });

    function populateForm(settings) {
        themeSelect.value = settings.theme || 'dark';
        glitchIntensity.value = settings.glitchIntensity || 1;
        bgEffect.value = settings.bgEffect || 'perlin';
        searchEngine.value = settings.searchEngine || 'internal';
        suggestionsEnabled.checked = settings.suggestionsEnabled !== false;
        historyEnabled.checked = settings.historyEnabled !== false;
        analyticsEnabled.checked = settings.analyticsEnabled !== false;
        maxTabs.value = settings.maxTabs || 20;
        homepage.value = settings.homepage || 'newtab.html';
    }

    function saveSetting(key, value) {
        currentSettings[key] = value;
        window.parent.postMessage({ type: 'updateSetting', key, value }, '*');
    }

    themeSelect.addEventListener('change', e => saveSetting('theme', e.target.value));
    glitchIntensity.addEventListener('input', e => saveSetting('glitchIntensity', parseFloat(e.target.value)));
    bgEffect.addEventListener('change', e => saveSetting('bgEffect', e.target.value));
    searchEngine.addEventListener('change', e => saveSetting('searchEngine', e.target.value));
    suggestionsEnabled.addEventListener('change', e => saveSetting('suggestionsEnabled', e.target.checked));
    historyEnabled.addEventListener('change', e => saveSetting('historyEnabled', e.target.checked));
    analyticsEnabled.addEventListener('change', e => saveSetting('analyticsEnabled', e.target.checked));
    maxTabs.addEventListener('change', e => saveSetting('maxTabs', parseInt(e.target.value, 10)));
    homepage.addEventListener('change', e => saveSetting('homepage', e.target.value));

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Clear entire history?')) {
            window.parent.postMessage({ type: 'clearHistory' }, '*');
        }
    });

    clearBookmarksBtn.addEventListener('click', () => {
        if (confirm('Delete all bookmarks?')) {
            window.parent.postMessage({ type: 'clearBookmarks' }, '*');
        }
    });

    exportDataBtn.addEventListener('click', () => {
        window.parent.postMessage({ type: 'exportData' }, '*');
    });

    importDataBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                window.parent.postMessage({ type: 'importData', data: e.target.result }, '*');
            };
            reader.readAsText(file);
        }
        importFile.value = ''; // allow re-upload
    });

    function downloadJSON(data, filename) {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    console.log('SettingsPage initialized');
}
