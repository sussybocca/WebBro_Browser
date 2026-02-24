const CACHE_NAME = 'chaos-browser-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/newtab.html',
  '/settings.html',
  '/bookmarks.html',
  '/history.html',
  '/css/chaos.css',
  '/css/glitch.css',
  '/css/themes/dark.css',
  '/css/themes/light.css',
  '/css/components/tabbar.css',
  '/css/components/urlbar.css',
  '/css/components/contextmenu.css',
  '/js/main.js',
  '/js/browser/BrowserCore.js',
  '/js/browser/TabManager.js',
  '/js/browser/Tab.js',
  '/js/browser/NavigationController.js',
  '/js/search/SearchEngine.js',
  '/js/search/Indexer.js',
  '/js/search/search.worker.js',
  '/js/database/SiteDatabase.js',
  '/js/database/BookmarkDB.js',
  '/js/database/HistoryDB.js',
  '/js/ui/TabBar.js',
  '/js/ui/UrlBar.js',
  '/js/ui/ButtonHandlers.js',
  '/js/ui/ContextMenu.js',
  '/js/ui/ChaosEffects.js',
  '/js/analytics/GoogleAnalytics.js',
  '/js/sandbox/IframeSandbox.js',
  '/js/utils/helpers.js',
  '/js/utils/storage.js',
  '/js/utils/constants.js',
  '/js/components/NewTabPage.js',
  '/js/components/SettingsPage.js',
  '/js/components/BookmarksPage.js',
  '/js/components/HistoryPage.js',
  '/data/sites.json',
  '/data/bookmarks.json',
  '/data/themes.json',
  '/assets/icons/favicon.ico',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// Install – cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate – clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch – network‑first for HTML, cache‑first for others, with fallbacks
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross‑origin requests (like Google Analytics)
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    // Network‑first for navigations, fallback to index.html
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache‑first for everything else
  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request))
  );
});
