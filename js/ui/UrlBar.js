// UrlBar.js – handles URL input, autocomplete, and go button
export class UrlBar {
    constructor(browserCore) {
        this.browser = browserCore;
        this.input = document.getElementById('urlInput');
        this.goBtn = document.getElementById('goBtn');
        this.bookmarkBtn = document.getElementById('bookmarkBtn');

        this.input.addEventListener('keypress', this.onKeyPress.bind(this));
        this.goBtn.addEventListener('click', this.onGo.bind(this));
        this.bookmarkBtn.addEventListener('click', this.onBookmark.bind(this));
        this.input.addEventListener('input', this.onInput.bind(this));

        // Autocomplete dropdown
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'autocomplete-suggestions';
        this.input.parentNode.appendChild(this.suggestionsContainer);
    }

    setValue(val) {
        this.input.value = val;
    }

    onKeyPress(e) {
        if (e.key === 'Enter') {
            this.navigate();
        }
    }

    onGo() {
        this.navigate();
    }

    navigate() {
        const val = this.input.value.trim();
        if (val) {
            this.browser.navigateToUrl(val);
        }
    }

    onBookmark() {
        const tab = this.browser.tabManager.getActiveTab();
        if (tab && tab.currentUrl) {
            this.browser.bookmarkDB.add({ url: tab.currentUrl, title: tab.title });
            // Visual feedback
            this.bookmarkBtn.classList.add('active');
            setTimeout(() => this.bookmarkBtn.classList.remove('active'), 500);
        }
    }

    onInput() {
        const query = this.input.value.trim();
        if (query.length < 2) {
            this.suggestionsContainer.style.display = 'none';
            return;
        }
        // Get suggestions from search engine (maybe from worker)
        this.browser.searchEngine.search(query).then(results => {
            if (results.length === 0) {
                this.suggestionsContainer.style.display = 'none';
                return;
            }
            this.suggestionsContainer.innerHTML = results.map(r => 
                `<div class="suggestion-item" data-url="${r.url}">${r.title}</div>`
            ).join('');
            this.suggestionsContainer.style.display = 'block';
        });
    }
}
