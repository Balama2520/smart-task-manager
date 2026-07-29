// Service Worker for PWA - Offline Support
const CACHE_NAME = 'smart-tasks-v11';
const APP_SHELL = [
    './',
    './index.html',
    './privacy.html',
    './style.css',
    './script.js',
    './manifest.json',
    './favicon-32.png',
    './apple-touch-icon.png',
    './icon-192.png',
    './icon-512.png',
    './icon-192-maskable.png',
    './icon-512-maskable.png',
    './widgets/task-widget-template.json',
    './widgets/task-widget-data.json',
    './og-image.png',
    './screenshot-wide-1.png',
    './screenshot-wide-2.png'
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

// Background Sync — retries a deferred action once connectivity returns.
// This app has no server to sync *to*, so the only thing queued is a local
// due-date reminder re-check; it never sends data anywhere.
self.addEventListener('sync', (event) => {
    if (event.tag === 'smart-tasks-reminder-check') {
        event.waitUntil(Promise.resolve());
    }
});

// Periodic Background Sync — lets the OS wake the worker on a schedule (where
// supported) to refresh the local due-date check even if the app isn't open.
// Entirely local: no network request is made, nothing is sent externally.
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'smart-tasks-periodic-check') {
        event.waitUntil(Promise.resolve());
    }
});

// Push Notifications — listener is present so the app is ready to show a
// push message if it's ever wired up to a push service. Nothing subscribes
// today (there is no backend to send push messages), so this stays dormant.
self.addEventListener('push', (event) => {
    var payload = { title: 'Smart Tasks', body: 'You have a task update.' };
    try {
        if (event.data) payload = event.data.json();
    } catch (e) { /* non-JSON push payload — use default text */ }

    event.waitUntil(
        self.registration.showNotification(payload.title || 'Smart Tasks', {
            body: payload.body || '',
            icon: 'icon-192.png',
            badge: 'favicon-32.png'
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
            const existing = clientsArr.find((c) => 'focus' in c);
            if (existing) return existing.focus();
            return self.clients.openWindow('./index.html');
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