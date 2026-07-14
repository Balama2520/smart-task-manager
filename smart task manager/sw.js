// Service Worker for PWA - Offline Support
const CACHE_NAME = 'smart-tasks-v3';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './favicon-32.png',
    './apple-touch-icon.png',
    './icon-192.png',
    './icon-512.png'
];

// Install event - cache the local app shell.
// Cross-origin resources (Google Fonts) are cached opportunistically on first
// fetch instead of here, so a failed/blocked cross-origin request can never
// abort the whole install (addAll() fails atomically if any request 404s/CORS-fails).
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .catch((err) => console.warn('SW install cache failed:', err))
    );
    self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network, cache new GETs as they arrive.
self.addEventListener('fetch', (event) => {
    // Only cache-handle GET requests — POST/PUT/etc. must always hit the network.
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request).then((response) => {
                // Only cache successful, basic (same-origin) or opaque (cross-origin, e.g. fonts) responses.
                if (!response || (response.status !== 200 && response.type !== 'opaque')) {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                return response;
            }).catch(() => {
                // Offline and not cached — for navigations, fall back to the cached shell.
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
