// BookmarksPage.js – advanced bookmarks manager with search, delete, and navigation
export async function initBookmarksPage() {
    const bookmarkList = document.getElementById('bookmarkList');
    const searchInput = document.getElementById('searchBookmarks');
    let bookmarks = [];

    // Request bookmarks from parent
    window.parent.postMessage({ type: 'getBookmarks' }, '*');

    window.addEventListener('message', function handler(event) {
        if (event.data.type === 'bookmarksList') {
            bookmarks = event.data.bookmarks;
            renderBookmarks(bookmarks);
        }
        if (event.data.type === 'bookmarkUpdated') {
            // Refresh list
            window.parent.postMessage({ type: 'getBookmarks' }, '*');
        }
    });

    function renderBookmarks(items) {
        if (!items || items.length === 0) {
            bookmarkList.innerHTML = '<li class="empty">No bookmarks yet. Press ★ in the browser to add.</li>';
            return;
        }
        bookmarkList.innerHTML = items.map(b => `
            <li class="bookmark-item" data-url="${b.url}">
                <div class="bookmark-info">
                    <span class="bookmark-title">${escapeHTML(b.title)}</span>
                    <span class="bookmark-url">${escapeHTML(b.url)}</span>
                </div>
                <button class="delete-btn" data-url="${b.url}" title="Delete">✖</button>
            </li>
        `).join('');
    }

    // Simple escape to prevent XSS
    function escapeHTML(str) {
        return String(str).replace(/[&<>"]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        });
    }

    bookmarkList.addEventListener('click', e => {
        const item = e.target.closest('.bookmark-item');
        if (item && !e.target.classList.contains('delete-btn')) {
            const url = item.dataset.url;
            window.parent.postMessage({ type: 'navigate', url }, '*');
        }
        if (e.target.classList.contains('delete-btn')) {
            e.stopPropagation();
            const url = e.target.dataset.url;
            if (confirm(`Delete bookmark for ${url}?`)) {
                window.parent.postMessage({ type: 'removeBookmark', url }, '*');
            }
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) {
                renderBookmarks(bookmarks);
                return;
            }
            const filtered = bookmarks.filter(b =>
                b.title.toLowerCase().includes(query) ||
                b.url.toLowerCase().includes(query)
            );
            renderBookmarks(filtered);
        });
    }

    console.log('BookmarksPage initialized');
}
