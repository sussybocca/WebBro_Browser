// TabBar.js – renders tabs and handles interactions
export class TabBar {
    constructor(browserCore) {
        this.browser = browserCore;
        this.container = document.getElementById('tabBar');
        this.container.addEventListener('click', this.handleClick.bind(this));
        this.container.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        // Drag and drop support (simplified)
    }

    render(tabOrder, activeId) {
        this.container.innerHTML = '';
        tabOrder.forEach(id => {
            const tab = this.browser.tabManager.tabs.get(id);
            if (!tab) return;
            const tabEl = document.createElement('div');
            tabEl.className = `tab ${id === activeId ? 'active' : ''}`;
            tabEl.dataset.tabId = id;
            tabEl.innerHTML = `
                <span class="favicon" style="mask-image: url(${tab.favicon || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌀</text></svg>'})"></span>
                <span class="title">${tab.title}</span>
                <button class="close-btn" data-tab-id="${id}">✖</button>
            `;
            this.container.appendChild(tabEl);
        });
        const newBtn = document.createElement('button');
        newBtn.className = 'new-tab-btn';
        newBtn.id = 'newTabBtn';
        newBtn.textContent = '+';
        this.container.appendChild(newBtn);
    }

    handleClick(e) {
        const tabEl = e.target.closest('.tab');
        if (tabEl) {
            const id = tabEl.dataset.tabId;
            this.browser.tabManager.activateTab(id);
        }
        if (e.target.closest('.close-btn')) {
            const btn = e.target.closest('.close-btn');
            const id = btn.dataset.tabId;
            e.stopPropagation();
            this.browser.tabManager.closeTab(id);
        }
        if (e.target.closest('#newTabBtn')) {
            this.browser.tabManager.createTab('newtab.html', true);
        }
    }

    handleDoubleClick(e) {
        // Could be used to edit tab title or something
    }

    updateTab(id, props) {
        // Update title or favicon without re-rendering all
        const tabEl = this.container.querySelector(`.tab[data-tab-id="${id}"]`);
        if (tabEl) {
            if (props.title) {
                tabEl.querySelector('.title').textContent = props.title;
            }
        }
    }
}
