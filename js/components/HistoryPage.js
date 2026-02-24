// HistoryPage.js – advanced history viewer with filtering, clearing, and navigation
export async function initHistoryPage() {
    const historyList = document.getElementById('historyList');
    const searchInput = document.getElementById('searchHistory');
    const clearBtn = document.getElementById('clearHistoryBtn');
    let historyEntries = [];

    // Request history from parent
    window.parent.postMessage({ type: 'getHistory' }, '*');

    window.addEventListener('message', function handler(event) {
        if (event.data.type === 'historyList') {
            historyEntries = event.data.entries;
            renderHistory(historyEntries);
        }
    });

    function renderHistory(entries) {
        if (!entries || entries.length === 0) {
            historyList.innerHTML = '<li class="empty">No history yet. Start browsing!</li>';
            return;
        }
        historyList.innerHTML = entries.map(e => `
            <li class="history-item" data-url="${e.url}">
                <div class="history-info">
                    <span class="history-title">${escapeHTML(e.title || 'Untitled')}</span>
                    <span class="history-url">${escapeHTML(e.url)}</span>
                    <span class="history-time">${new Date(e.timestamp).toLocaleString()}</span>
                </div>
            </li>
        `).join('');
    }

    function escapeHTML(str) {
        return String(str).replace(/[&<>"]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        });
    }

    historyList.addEventListener('click', e => {
        const item = e.target.closest('.history-item');
        if (item) {
            const url = item.dataset.url;
            window.parent.postMessage({ type: 'navigate', url }, '*');
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                renderHistory(historyEntries);
                return;
            }
            const filtered = historyEntries.filter(e =>
                (e.title && e.title.toLowerCase().includes(query)) ||
                e.url.toLowerCase().includes(query)
            );
            renderHistory(filtered);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear entire history?')) {
                window.parent.postMessage({ type: 'clearHistory' }, '*');
                historyList.innerHTML = '<li class="empty">No history yet.</li>';
            }
        });
    }

    console.log('HistoryPage initialized');
}
