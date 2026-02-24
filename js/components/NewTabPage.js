// NewTabPage.js – advanced new tab page with search suggestions, quick links, and dynamic theming
export async function initNewTabPage() {
    const searchInput = document.getElementById('searchInput');
    const suggestionsDiv = document.getElementById('suggestions');
    const quickLinks = document.querySelectorAll('.quick-links a');
    let siteDatabase = [];
    let settings = {};

    // Load settings from parent
    window.parent.postMessage({ type: 'getSettings' }, '*');

    // Request site list from parent
    window.parent.postMessage({ type: 'getSites' }, '*');

    window.addEventListener('message', function handler(event) {
        if (event.data.type === 'sitesList') {
            siteDatabase = event.data.sites;
        }
        if (event.data.type === 'settings') {
            settings = event.data.settings;
            applyTheme(settings);
        }
    });

    function applyTheme(settings) {
        // Sync with parent theme
        if (settings.theme === 'light') {
            document.body.style.background = '#f0f0fc';
            document.body.style.color = '#1a1a2e';
        } else {
            document.body.style.background = '#0a0c14';
            document.body.style.color = '#0ff';
        }
    }

    // Debounced search input
    let debounceTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                suggestionsDiv.style.display = 'none';
                return;
            }
            const matches = siteDatabase.filter(site =>
                site.url.toLowerCase().includes(query) ||
                site.title.toLowerCase().includes(query)
            ).slice(0, 8);
            if (matches.length === 0) {
                suggestionsDiv.style.display = 'none';
                return;
            }
            suggestionsDiv.innerHTML = matches.map(site =>
                `<div class="suggestion-item" data-url="${site.url}">${site.title} <span style="opacity:0.6;">(${site.url})</span></div>`
            ).join('');
            suggestionsDiv.style.display = 'block';
        }, 200);
    });

    suggestionsDiv.addEventListener('click', e => {
        const target = e.target.closest('.suggestion-item');
        if (target) {
            const url = target.dataset.url;
            window.parent.postMessage({ type: 'navigate', url }, '*');
            suggestionsDiv.style.display = 'none';
            searchInput.value = '';
        }
    });

    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                if (!query.includes(' ') && !query.includes('.')) {
                    window.parent.postMessage({ type: 'navigate', url: query }, '*');
                } else {
                    window.parent.postMessage({ type: 'search', query }, '*');
                }
                searchInput.value = '';
                suggestionsDiv.style.display = 'none';
            }
        }
    });

    quickLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const url = link.dataset.url;
            window.parent.postMessage({ type: 'navigate', url }, '*');
        });
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });

    // Handle messages from parent for dynamic updates
    window.addEventListener('message', event => {
        if (event.data.type === 'themeChanged') {
            applyTheme({ theme: event.data.theme });
        }
    });

    console.log('NewTabPage initialized');
}
